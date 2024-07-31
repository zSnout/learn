import type { Id } from "@/lib/id"
import { readonly, sql } from ".."
import { id as idCheck, text } from "../lib/checks"
import { export_decks_txless, type ExportDecksProps } from "./export_decks"

export async function export_deck(id: Id | string, props: ExportDecksProps) {
  const tx = readonly()
  try {
    const myId =
      typeof id == "string" ?
        sql`SELECT id FROM decks WHERE name = ${id};`.getValue(idCheck)
      : id

    const name =
      typeof id == "string" ? id : (
        sql`SELECT name FROM decks WHERE id = ${id};`.getValue(text)
      )

    const ids = sql`
      SELECT id
      FROM decks
      WHERE name >= ${name + "::"} AND name < ${name + ":;"};
    `
      .getAll([idCheck])
      .map((x) => x[0])

    ids.push(myId)

    return export_decks_txless(ids, props)
  } finally {
    tx.dispose()
  }
}
