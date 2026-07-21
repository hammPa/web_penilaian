const BaseRepository = require('./BaseRepository');

class SettingRepository extends BaseRepository {
  constructor() {
    super('settings.json', {
      sqlTable: 'settings',
      columns: ['id', 'value'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      value: entity.value,
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      value: row.value,
    };
  }
}

module.exports = new SettingRepository();