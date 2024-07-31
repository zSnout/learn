import { randomId } from "@/lib/id"
import { readwrite, sql } from ".."

/** Returns `true` if the operation was successful. */
export function deck_create(name: string) {
  const tx = readwrite(`Create deck ${name}`)
  try {
    const isUsed = sql`SELECT 0 FROM decks WHERE name = ${name};`.exists()
    if (!isUsed) {
      sql`
        INSERT INTO decks (id, name, is_filtered)
        VALUES (${randomId()}, ${name}, 0);
      `.run()
    }
    return isUsed
  } finally {
    tx.dispose()
  }
}
