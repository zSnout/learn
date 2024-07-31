CREATE TABLE IF NOT EXISTS confs (
  id INTEGER PRIMARY KEY NOT NULL,
  autoplay_audio BOOLEAN NOT NULL DEFAULT 1,
  last_edited INTEGER NOT NULL DEFAULT (1000 * strftime('%s', 'now')),
  name TEXT NOT NULL,
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
