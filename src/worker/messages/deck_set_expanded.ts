import { Id, randomId } from "@/lib/id"
import { readwrite, sql } from ".."

export function deck_set_expanded(idOrName: Id | string, expanded: boolean) {
  const tx = readwrite("Toggle whether deck is collapsed")

  try {
    if (typeof idOrName == "number") {
      sql`
        UPDATE decks SET collapsed = ${+!expanded} WHERE id = ${idOrName};
      `.run()
    } else {
      sql`
        INSERT INTO decks (id, name, collapsed, is_filtered)
        VALUES (${randomId()}, ${idOrName}, ${+!expanded}, 0)
        ON CONFLICT (name) DO UPDATE SET is_filtered = excluded.is_filtered;
      `.run()
    }

    tx.commit()
  } finally {
    tx.dispose()
  }
}
