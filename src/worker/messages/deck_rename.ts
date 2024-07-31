import type { Id } from "@/lib/id"
import { readwrite, sql } from ".."
import { text } from "../lib/checks"

export function deck_rename(currentId: Id | string, name: string) {
  const tx = readwrite(`Rename deck to ${name}`)
  try {
    const currentName =
      typeof currentId == "number" ?
        sql`SELECT name FROM decks WHERE id = ${currentId};`.getValue(text)
      : currentId

    sql`
      UPDATE decks
      SET name = ${name} || substr(name, ${currentName.length + 1})
      WHERE
        (name >= ${currentName + "::"} AND name < ${currentName + ":;"})
        OR name = ${currentName};
    `.run()

    tx.commit()

    return true
  } catch (err) {
    if (String(err).includes("UNIQUE constraint")) {
      tx.rollback()
      return false
    } else {
      throw err
    }
  } finally {
    tx.dispose()
  }
}
