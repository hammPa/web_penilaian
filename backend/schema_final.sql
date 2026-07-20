-- Skema relasional FINAL untuk DB_MODE=mariadb -- sudah termasuk pemecahan
-- assessments (selections/photos/results) jadi tabel anak, jadi cocok buat
-- instalasi BARU yang mau langsung lompat ke struktur final tanpa lewat
-- tahap 002/003 terpisah.
--
-- Kalau kamu migrasi dari instalasi mariadb LAMA yang masih ada kolom
-- selections_json/photos_json/results_json, JANGAN pakai file ini --
-- pakai migrations/002_add_assessment_child_tables.sql -> backfill ->
-- migrations/003_drop_assessment_old_columns.sql seperti sebelumnya.

SET FOREIGN_KEY_CHECKS = 0;

-- ========== TEAMS ==========
CREATE TABLE IF NOT EXISTS teams (
  id    VARCHAR(36) PRIMARY KEY,
  name  VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ========== USERS ==========
CREATE TABLE IF NOT EXISTS users (
  id                 VARCHAR(36) PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  username           VARCHAR(100) NOT NULL UNIQUE,
  password           VARCHAR(255) NOT NULL,
  role               VARCHAR(50)  NOT NULL,
  team_id            VARCHAR(36)  NULL,
  active_token       TEXT         NULL,
  password_reset_at  DATETIME     NULL,
  password_reset_by  VARCHAR(36)  NULL,
  CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== GROUPS ==========
CREATE TABLE IF NOT EXISTS `groups` (
  id       VARCHAR(36) PRIMARY KEY,
  name     VARCHAR(255) NOT NULL,
  gugus    VARCHAR(255) NOT NULL,
  team_id  VARCHAR(36) NULL,
  CONSTRAINT fk_groups_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========== SESSIONS ==========
CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== TABLES (tabel penilaian, bukan tabel sql) ==========
CREATE TABLE IF NOT EXISTS assessment_tables (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  session_id  VARCHAR(36) NOT NULL,
  CONSTRAINT fk_tables_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== CRITERIA ==========
CREATE TABLE IF NOT EXISTS criteria (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL,
  table_id    VARCHAR(36) NOT NULL,
  CONSTRAINT fk_criteria_table FOREIGN KEY (table_id) REFERENCES assessment_tables(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== VARIABLES ==========
-- levels_json tetap JSON: array deskripsi per level skor, panjang variatif,
-- selalu dibaca/ditulis utuh -- bukan sesuatu yang perlu di-join per baris.
CREATE TABLE IF NOT EXISTS variables (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  criteria_id VARCHAR(36) NOT NULL,
  weight      DOUBLE NOT NULL DEFAULT 1,
  formula     VARCHAR(255) NOT NULL,
  levels_json JSON NOT NULL,
  CONSTRAINT fk_variables_criteria FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== ASSESSMENTS (baris utama, scalar only) ==========
CREATE TABLE IF NOT EXISTS assessments (
  id              VARCHAR(36) PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL,
  group_id        VARCHAR(36) NOT NULL,
  session_id      VARCHAR(36) NOT NULL,
  recommendation  TEXT NULL,
  total           DOUBLE NOT NULL DEFAULT 0,
  percentage      DOUBLE NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NULL,
  CONSTRAINT fk_assessments_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_assessments_group   FOREIGN KEY (group_id)   REFERENCES `groups`(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessments_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_group_session (user_id, group_id, session_id)
) ENGINE=InnoDB;

-- ========== ASSESSMENT_SELECTIONS (pilihan level per variabel) ==========
CREATE TABLE IF NOT EXISTS assessment_selections (
  id             VARCHAR(36) PRIMARY KEY,
  assessment_id  VARCHAR(36) NOT NULL,
  variable_id    VARCHAR(36) NOT NULL,
  selected_level INT NOT NULL,
  CONSTRAINT fk_sel_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_sel_variable   FOREIGN KEY (variable_id)   REFERENCES variables(id)   ON DELETE CASCADE,
  UNIQUE KEY uniq_assessment_variable (assessment_id, variable_id)
) ENGINE=InnoDB;

-- ========== ASSESSMENT_PHOTOS ==========
CREATE TABLE IF NOT EXISTS assessment_photos (
  id             VARCHAR(36) PRIMARY KEY,
  assessment_id  VARCHAR(36) NOT NULL,
  url            VARCHAR(500) NOT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_photo_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========== ASSESSMENT_VARIABLE_SCORES (gabungan results.details + results.variableScores) ==========
CREATE TABLE IF NOT EXISTS assessment_variable_scores (
  id             VARCHAR(36) PRIMARY KEY,
  assessment_id  VARCHAR(36) NOT NULL,
  variable_id    VARCHAR(36) NOT NULL,
  level          INT NOT NULL,
  score          DOUBLE NOT NULL,
  CONSTRAINT fk_vs_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_vs_variable   FOREIGN KEY (variable_id)   REFERENCES variables(id)   ON DELETE CASCADE,
  UNIQUE KEY uniq_assessment_variable_score (assessment_id, variable_id)
) ENGINE=InnoDB;

-- ========== ASSESSMENT_CRITERIA_SUBTOTALS (results.subtotals) ==========
CREATE TABLE IF NOT EXISTS assessment_criteria_subtotals (
  id             VARCHAR(36) PRIMARY KEY,
  assessment_id  VARCHAR(36) NOT NULL,
  criteria_id    VARCHAR(36) NOT NULL,
  subtotal       DOUBLE NOT NULL,
  CONSTRAINT fk_sub_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_criteria   FOREIGN KEY (criteria_id)   REFERENCES criteria(id)    ON DELETE CASCADE,
  UNIQUE KEY uniq_assessment_criteria (assessment_id, criteria_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
