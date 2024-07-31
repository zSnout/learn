import type { WorkerDB } from ".."

export const latest = 1

// this function cannot access external `db` since that variable isn't set yet
// this handles the main part of upgrading, while `checkVersion` takes the meta
export function upgrade(db: WorkerDB, current: number) {
  // we have no data
  if (current < 1) {
    db.exec(
      `INSERT INTO core (id, version) VALUES (0, ?);
INSERT INTO prefs (id) VALUES (0);
INSERT INTO confs (id, name) VALUES (0, 'Default');
INSERT INTO decks (id, name, is_filtered) VALUES (0, 'Default', 0);`,
      { bind: [latest] },
    )
  }
}
