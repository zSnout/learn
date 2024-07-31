PRAGMA foreign_keys = 1;

CREATE TABLE IF NOT EXISTS core (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 0),
  version INTEGER NOT NULL,
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  last_schema_edit INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  last_sync INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  tags TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS graves (
  oid INTEGER NOT NULL,
  type INTEGER NOT NULL,
  UNIQUE (type, oid)
);

CREATE TABLE IF NOT EXISTS confs (
  id INTEGER PRIMARY KEY NOT NULL,
  autoplay_audio BOOLEAN NOT NULL DEFAULT 1,
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  new_bury_related BOOLEAN NOT NULL DEFAULT 0,
  new_pick_at_random BOOLEAN NOT NULL DEFAULT 0,
  new_per_day INTEGER NOT NULL DEFAULT 20,
  new_learning_steps TEXT NOT NULL DEFAULT '[60,600]', -- json array
  replay_question_audio BOOLEAN NOT NULL DEFAULT 0,
  review_bury_related BOOLEAN NOT NULL DEFAULT 0,
  review_enable_fuzz BOOLEAN NOT NULL DEFAULT 0,
  review_max_review_interval INTEGER NOT NULL DEFAULT 36500,
  review_per_day INTEGER, -- can be null
  review_relearning_steps TEXT NOT NULL DEFAULT '[600]', -- json array
  review_requested_retention REAL NOT NULL DEFAULT 0.9,
  review_w TEXT, -- json array; can be null
  show_global_timer BOOLEAN NOT NULL DEFAULT 0,
  timer_per_card INTEGER -- can be null
);

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  collapsed BOOLEAN NOT NULL DEFAULT 0,
  is_filtered BOOLEAN NOT NULL,
  custom_revcard_limit INTEGER, -- can be null
  custom_newcard_limit INTEGER, -- can be null
  default_revcard_limit INTEGER, -- can be null
  default_newcard_limit INTEGER, -- can be null
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  new_today TEXT NOT NULL DEFAULT '[]', -- json array
  revcards_today TEXT NOT NULL DEFAULT '[]', -- json array
  revlogs_today INTEGER NOT NULL DEFAULT 0,
  today INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  `desc` TEXT NOT NULL DEFAULT '',
  cfid INTEGER NOT NULL DEFAULT 0,
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  FOREIGN KEY (cfid) REFERENCES confs (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS decks_name ON decks (name);

CREATE INDEX IF NOT EXISTS decks_cfid ON decks (cfid);

CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY NOT NULL,
  css TEXT NOT NULL DEFAULT '',
  fields TEXT NOT NULL DEFAULT '{}', -- json
  latex TEXT, -- json; can be null
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  sort_field INTEGER, -- can be null
  tmpls TEXT NOT NULL DEFAULT '{}', -- json
  tags TEXT NOT NULL DEFAULT '', -- space-separated tags
  type INTEGER NOT NULL, -- 0=standard, 1=cloze
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY NOT NULL,
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  mid INTEGER NOT NULL,
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  tags TEXT NOT NULL DEFAULT '', -- space-separated tags
  fields TEXT NOT NULL, -- json fields data
  sort_field TEXT, -- can be null
  csum INTEGER NOT NULL DEFAULT 0, -- FEAT: implement this
  marks INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (mid) REFERENCES models (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS notes_mid ON notes (mid);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY NOT NULL,
  nid INTEGER NOT NULL,
  tid INTEGER NOT NULL,
  did INTEGER NOT NULL,
  odid INTEGER,
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  queue INTEGER NOT NULL DEFAULT 0,
  due INTEGER NOT NULL,
  last_review INTEGER, -- can be null
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  flags INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (nid) REFERENCES notes (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (did) REFERENCES decks (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY (odid) REFERENCES decks (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS cards_nid ON cards (nid);

-- this used to exist but is now replaced with cards_schedule
DROP INDEX IF EXISTS cards_did;

-- this used to exist but is now replaced with cards_schedule
DROP INDEX IF EXISTS cards_due;

CREATE INDEX IF NOT EXISTS cards_schedule ON cards (did, `queue`, due);

CREATE UNIQUE INDEX IF NOT EXISTS cards_tid_nid ON cards (tid, nid);

CREATE TABLE IF NOT EXISTS rev_log (
  id INTEGER PRIMARY KEY NOT NULL,
  cid INTEGER NOT NULL,
  time INTEGER NOT NULL,
  type INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  state INTEGER NOT NULL,
  due INTEGER NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days INTEGER NOT NULL,
  last_elapsed_days INTEGER NOT NULL,
  scheduled_days INTEGER NOT NULL,
  review INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS rev_log_cid ON rev_log (cid);

CREATE TABLE IF NOT EXISTS prefs (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 0),
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  current_deck INTEGER, -- can be null
  last_model_used INTEGER, -- can be null
  new_spread INTEGER NOT NULL DEFAULT 0,
  collapse_time INTEGER NOT NULL DEFAULT (60 * 20),
  notify_after_time INTEGER NOT NULL DEFAULT 0,
  show_review_time_above_buttons BOOLEAN NOT NULL DEFAULT 1,
  show_remaining_due_counts BOOLEAN NOT NULL DEFAULT 1,
  show_deck_name BOOLEAN NOT NULL DEFAULT 1,
  next_new_card_position INTEGER NOT NULL DEFAULT 0,
  last_unburied INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  day_start INTEGER NOT NULL DEFAULT (1000 * 60 * 60 * 4),
  debug BOOLEAN NOT NULL DEFAULT 0,
  sidebar_state INTEGER NOT NULL DEFAULT 1, -- auto=1, open=2, closed=3
  template_edit_style TEXT NOT NULL DEFAULT '{"row":"inline","template":{"front":true,"back":true,"styling":true},"theme":{"light":true,"dark":true}}', -- json data
  show_flags_in_sidebar BOOLEAN NOT NULL DEFAULT 1,
  show_marks_in_sidebar BOOLEAN NOT NULL DEFAULT 1,
  browser TEXT NOT NULL DEFAULT '{"active_cols":["Sort Field","Due","Card","Tags","Deck"],"sort_field":"Sort Field","sort_backwards":false}', -- json data
  FOREIGN KEY (current_deck) REFERENCES decks (id)
    ON UPDATE SET NULL
    ON DELETE SET NULL,
  FOREIGN KEY (last_model_used) REFERENCES models (id)
    ON UPDATE SET NULL
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS charts (
  id INTEGER PRIMARY KEY NOT NULL,
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  title TEXT NOT NULL,
  `query` TEXT NOT NULL,
  chart TEXT NOT NULL,
  style TEXT NOT NULL,
  options TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS check_card_tmpl_on_insert
BEFORE INSERT ON cards
BEGIN
  SELECT
    CASE
      WHEN (
        SELECT
          tmpls -> CAST(new.tid AS TEXT)
        FROM models
        WHERE models.id = (SELECT mid FROM notes WHERE notes.id = new.nid)
      ) IS NULL THEN RAISE(ABORT, 'Card does not link to a valid template ID.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS check_card_tmpl_on_update
BEFORE UPDATE ON cards
BEGIN
  SELECT
    CASE
      WHEN (
        SELECT
          tmpls -> CAST(new.tid AS TEXT)
        FROM models
        WHERE models.id = (SELECT mid FROM notes WHERE notes.id = new.nid)
      ) IS NULL THEN RAISE(ABORT, 'Card does not link to a valid template ID.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS delete_cards_on_template_deletion
BEFORE UPDATE ON models
BEGIN
  DELETE FROM cards
  WHERE
    (
      SELECT
        mid
      FROM notes
      WHERE notes.id = cards.nid
    ) = new.id
    AND new.tmpls -> CAST(cards.tid AS TEXT) IS NULL;
END;

CREATE TRIGGER IF NOT EXISTS graves_from_cards
AFTER DELETE ON cards
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 0);
END;

CREATE TRIGGER IF NOT EXISTS graves_from_notes
AFTER DELETE ON notes
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 1);
END;

CREATE TRIGGER IF NOT EXISTS graves_from_decks
AFTER DELETE ON decks
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 2);
END;

CREATE TRIGGER IF NOT EXISTS graves_from_models
AFTER DELETE ON models
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 3);
END;

CREATE TRIGGER IF NOT EXISTS graves_from_prefs
AFTER DELETE ON prefs
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 4);
END;

CREATE TRIGGER IF NOT EXISTS graves_from_charts
AFTER DELETE ON charts
BEGIN
  INSERT OR IGNORE INTO graves
    (oid, type)
  VALUES
    (old.id, 4);
END;

CREATE TRIGGER IF NOT EXISTS conf_zero_must_stay_zero
BEFORE UPDATE ON confs
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(
        ABORT,
        'Cannot change the ID of the default deck configuration.'
      )
    END;
END;

CREATE TRIGGER IF NOT EXISTS conf_zero_is_undeletable
BEFORE DELETE ON confs
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(
        ABORT,
        'Cannot delete the default deck configuration.'
      )
    END;
END;

CREATE TRIGGER IF NOT EXISTS core_must_stay_zero
BEFORE UPDATE ON core
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(
        ABORT,
        'Cannot change the ID of the collection core.'
      )
    END;
END;

CREATE TRIGGER IF NOT EXISTS core_is_undeletable
BEFORE DELETE ON core
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(ABORT, 'Cannot delete the collection core.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS prefs_must_stay_zero
BEFORE UPDATE ON prefs
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(
        ABORT,
        'Cannot change the ID of the collection''s global preferences.'
      )
    END;
END;

CREATE TRIGGER IF NOT EXISTS prefs_is_undeletable
BEFORE DELETE ON prefs
BEGIN
  SELECT
    CASE
      WHEN old.id = 0 THEN RAISE(
        ABORT,
        'Cannot delete the collection''s global preferences.'
      )
    END;
END;

CREATE TRIGGER IF NOT EXISTS there_must_be_at_least_one_deck
AFTER DELETE ON decks
BEGIN
  INSERT INTO decks (id, name, is_filtered)
  SELECT 0, 'Default', 0
  WHERE NOT (EXISTS (SELECT 0 FROM decks));
END;
