import type { Id } from "@/lib/id"
import { readwrite, sql } from ".."
import { int, text } from "../lib/checks"

export function deck_delete(currentId: Id | undefined, name: string) {
  const tx = readwrite(`Delete deck ${name}`)
  try {
    const cardsBefore = sql`SELECT COUNT() FROM cards;`.getValue(int)

    const currentName =
      typeof currentId == "number" ?
        sql`SELECT name FROM decks WHERE id = ${currentId};`.getValue(text)
      : name

    sql`
      DELETE FROM decks
      WHERE
        (name >= ${currentName + "::"} AND name < ${currentName + ":;"})
        OR name = ${currentName};
    `.run()

    sql`
      DELETE FROM notes
      WHERE (SELECT COUNT() FROM cards WHERE cards.nid = notes.id) = 0;
    `.run()

    const cardsAfter = sql`SELECT COUNT() FROM cards;`.getValue(int)

    tx.commit()

    return cardsBefore - cardsAfter
  } finally {
    tx.dispose()
  }
}
