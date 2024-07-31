import type { Id } from "@/lib/id"
import { sql } from ".."
import { stmts } from "../lib/stmts"

/** Does not create a transaction. */
export function conf_get_by_deck(id: Id | null) {
  const query =
    id == null ?
      sql`SELECT * FROM confs WHERE id = 0;`
    : sql`
        SELECT *
        FROM confs
        WHERE id = (SELECT cfid FROM decks WHERE id = ${id});
      `

  return stmts.confs.interpret(query.getRow())
}
