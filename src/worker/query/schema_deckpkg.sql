CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
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
  creation INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY NOT NULL,
  css TEXT NOT NULL DEFAULT '',
  fields TEXT NOT NULL DEFAULT '{}', -- json
  latex TEXT, -- json; can be null
  name TEXT NOT NULL,
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
  marks INTEGER NOT NULL DEFAULT 0
);

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
  state INTEGER NOT NULL DEFAULT 0
);
