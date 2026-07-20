const { v4: uuidv4 } = require('uuid');
const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');
const { toMysqlDatetime, fromMysqlDatetime } = require('../utils/dateHelper');

const MODE = (DB_MODE || 'json').toLowerCase();

/**
 * Mode mariadb: selections, photos, dan results (variableScores/subtotals/
 * details) TIDAK lagi disimpan sebagai kolom JSON -- dipecah jadi 4 tabel:
 *   - assessment_selections         (pilihan level per variabel)
 *   - assessment_photos             (url foto, urut)
 *   - assessment_variable_scores    (skor per variabel -- gabungan detail+variableScores)
 *   - assessment_criteria_subtotals (subtotal per kriteria)
 * total & percentage jadi kolom scalar biasa di tabel assessments.
 *
 * Mode json/sqlite TIDAK BERUBAH sama sekali -- tetap simpan entity utuh
 * sebagai satu blob, seperti sebelumnya. Semua method public tetap
 * menerima/mengembalikan bentuk objek JS yang SAMA seperti sebelumnya
 * ({ selections: [...], photos: [...], results: {...} }), jadi
 * AssessmentService.js tidak perlu diubah sama sekali.
 */
class AssessmentRepository extends BaseRepository {
  constructor() {
    super('assessments.json', {
      sqlTable: 'assessments',
      columns: [
        'id', 'user_id', 'group_id', 'session_id',
        'recommendation', 'total', 'percentage',
        'created_at', 'updated_at',
      ],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      user_id: entity.userId,
      group_id: entity.groupId,
      session_id: entity.sessionId,
      recommendation: entity.recommendation || '',
      total: entity.results?.total ?? 0,
      percentage: entity.results?.percentage ?? 0,
      created_at: MODE === 'mariadb' ? toMysqlDatetime(entity.createdAt) : entity.createdAt,
      updated_at: MODE === 'mariadb' ? toMysqlDatetime(entity.updatedAt) : (entity.updatedAt || null),
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      userId: row.user_id,
      groupId: row.group_id,
      sessionId: row.session_id,
      recommendation: row.recommendation,
      total: row.total,
      percentage: row.percentage,
      createdAt: MODE === 'mariadb' ? fromMysqlDatetime(row.created_at) : row.created_at,
      updatedAt: MODE === 'mariadb' ? fromMysqlDatetime(row.updated_at) : row.updated_at,
    };
  }

  // ---------- helper khusus mariadb: tulis ulang 4 tabel anak sekaligus ----------
  async _replaceChildRows(conn, assessmentId, selections, photos, results) {
    await conn.query('DELETE FROM assessment_selections WHERE assessment_id = ?', [assessmentId]);
    await conn.query('DELETE FROM assessment_photos WHERE assessment_id = ?', [assessmentId]);
    await conn.query('DELETE FROM assessment_variable_scores WHERE assessment_id = ?', [assessmentId]);
    await conn.query('DELETE FROM assessment_criteria_subtotals WHERE assessment_id = ?', [assessmentId]);

    if (selections.length) {
      const placeholders = selections.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      selections.forEach(s => values.push(uuidv4(), assessmentId, s.variableId, s.selectedLevel));
      await conn.query(
        `INSERT INTO assessment_selections (id, assessment_id, variable_id, selected_level) VALUES ${placeholders}`,
        values
      );
    }

    if (photos.length) {
      const placeholders = photos.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      photos.forEach((url, idx) => values.push(uuidv4(), assessmentId, url, idx));
      await conn.query(
        `INSERT INTO assessment_photos (id, assessment_id, url, sort_order) VALUES ${placeholders}`,
        values
      );
    }

    const details = results?.details || [];
    if (details.length) {
      const placeholders = details.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values = [];
      details.forEach(d => values.push(uuidv4(), assessmentId, d.variableId, d.level, d.score));
      await conn.query(
        `INSERT INTO assessment_variable_scores (id, assessment_id, variable_id, level, score) VALUES ${placeholders}`,
        values
      );
    }

    const subtotalEntries = Object.entries(results?.subtotals || {});
    if (subtotalEntries.length) {
      const placeholders = subtotalEntries.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      subtotalEntries.forEach(([criteriaId, subtotal]) => values.push(uuidv4(), assessmentId, criteriaId, subtotal));
      await conn.query(
        `INSERT INTO assessment_criteria_subtotals (id, assessment_id, criteria_id, subtotal) VALUES ${placeholders}`,
        values
      );
    }
  }

  // ---------- helper khusus mariadb: gabungkan baris utama + 4 tabel anak jadi 1 entity ----------
  async _hydrateMany(rows) {
    if (!rows.length) return [];
    const ids = rows.map(r => r.id);
    const placeholders = ids.map(() => '?').join(', ');

    const [selRows] = await this.pool.query(
      `SELECT * FROM assessment_selections WHERE assessment_id IN (${placeholders})`, ids
    );
    const [photoRows] = await this.pool.query(
      `SELECT * FROM assessment_photos WHERE assessment_id IN (${placeholders}) ORDER BY sort_order`, ids
    );
    const [scoreRows] = await this.pool.query(
      `SELECT * FROM assessment_variable_scores WHERE assessment_id IN (${placeholders})`, ids
    );
    const [subRows] = await this.pool.query(
      `SELECT * FROM assessment_criteria_subtotals WHERE assessment_id IN (${placeholders})`, ids
    );

    const bucket = (list) => {
      const map = {};
      list.forEach(r => {
        if (!map[r.assessment_id]) map[r.assessment_id] = [];
        map[r.assessment_id].push(r);
      });
      return map;
    };
    const selMap = bucket(selRows);
    const photoMap = bucket(photoRows);
    const scoreMap = bucket(scoreRows);
    const subMap = bucket(subRows);

    return rows.map(row => {
      const entity = this.fromRow(row);
      const id = entity.id;

      entity.selections = (selMap[id] || []).map(r => ({
        variableId: r.variable_id,
        selectedLevel: r.selected_level,
      }));
      entity.photos = (photoMap[id] || []).map(r => r.url);

      const variableScores = {};
      (scoreMap[id] || []).forEach(r => { variableScores[r.variable_id] = r.score; });
      const subtotals = {};
      (subMap[id] || []).forEach(r => { subtotals[r.criteria_id] = r.subtotal; });

      entity.results = {
        variableScores,
        subtotals,
        total: entity.total,
        percentage: entity.percentage,
        details: (scoreMap[id] || []).map(r => ({
          variableId: r.variable_id,
          level: r.level,
          score: r.score,
        })),
      };
      delete entity.total;
      delete entity.percentage;

      return entity;
    });
  }

  // ---------- PUBLIC API ----------
  async create(entity) {
    if (MODE !== 'mariadb') return super.create(entity);

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = this.toRow(entity);
      const colList = this.columns.map(c => `\`${c}\``).join(', ');
      const placeholders = this.columns.map(() => '?').join(', ');
      await conn.query(
        `INSERT INTO \`${this.sqlTable}\` (${colList}) VALUES (${placeholders})`,
        this.columns.map(c => row[c] ?? null)
      );
      await this._replaceChildRows(conn, entity.id, entity.selections || [], entity.photos || [], entity.results || {});
      await conn.commit();
      return entity;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async update(id, updatedData) {
    if (MODE !== 'mariadb') return super.update(id, updatedData);

    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updatedData, id };

    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const row = this.toRow(merged);
      const updatableCols = this.columns.filter(c => c !== 'id');
      const setClause = updatableCols.map(c => `\`${c}\` = ?`).join(', ');
      const values = updatableCols.map(c => row[c] ?? null);
      await conn.query(
        `UPDATE \`${this.sqlTable}\` SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      await this._replaceChildRows(conn, id, merged.selections || [], merged.photos || [], merged.results || {});
      await conn.commit();
      return merged;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async findById(id) {
    if (MODE !== 'mariadb') return super.findById(id);
    const [rows] = await this.pool.query(
      `SELECT * FROM \`${this.sqlTable}\` WHERE id = ? LIMIT 1`, [id]
    );
    if (!rows[0]) return null;
    const [hydrated] = await this._hydrateMany(rows);
    return hydrated;
  }

  async findAll() {
    if (MODE !== 'mariadb') return super.findAll();
    const [rows] = await this.pool.query(`SELECT * FROM \`${this.sqlTable}\``);
    return this._hydrateMany(rows);
  }

  async findByUserId(userId) {
    if (MODE !== 'mariadb') {
      const assessments = await this.findAll();
      return assessments.filter(a => a.userId === userId);
    }
    const [rows] = await this.pool.query(
      `SELECT * FROM \`${this.sqlTable}\` WHERE user_id = ?`, [userId]
    );
    return this._hydrateMany(rows);
  }

  // delete() TIDAK perlu di-override: FK ON DELETE CASCADE di ke-4 tabel
  // anak otomatis ikut menghapus baris terkait saat baris assessments dihapus.
}

module.exports = new AssessmentRepository();