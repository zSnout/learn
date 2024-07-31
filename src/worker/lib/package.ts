import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import JSZip from "jszip"
import { sqlite3 } from ".."
import { filename } from "@/lib/filename"
import type { PackagedDeck } from "@/lib/types"
import schema from "../query/schema_deckpkg.sql?raw"
import schema_confs from "../query/schema_deckpkg_confs.sql?raw"
import schema_rev_log from "../query/schema_deckpkg_rev_log.sql?raw"
import { createSqlFunction, type Stmt } from "./sql"
import { createStmts } from "./createStmts"

function inner<T>(
  meta: { insert(): Stmt; insertArgs(item: T): SqlValue[] },
  items: T[],
) {
  const stmt = meta.insert()
  for (const item of items) {
    stmt.bindNew(meta.insertArgs(item)).run()
  }
}

/**
 * Differences between the packaged format and main database:
 *
 * 1. There are no constraints.
 * 2. There are no foreign keys.
 * 3. There are no indices.
 *
 * This helps ensure that exported database files are as small as possible.
 */

export async function packageDeck(deck: PackagedDeck): Promise<File> {
  const zip = deck.media ?? new JSZip()
  zip.file("meta.json", JSON.stringify(deck.meta))

  // the main data should be in a sqlite file for size purposes
  const db = new sqlite3.oo1.DB()
  try {
    const sql = createSqlFunction(db)
    const stmts = createStmts(sql)

    db.exec(schema)
    inner(stmts.decks, deck.data.decks)
    inner(stmts.models, deck.data.models)
    inner(stmts.notes, deck.data.notes)
    inner(stmts.cards, deck.data.cards)
    if (deck.meta.hasConfs && deck.data.confs) {
      db.exec(schema_confs)
      inner(stmts.confs, deck.data.confs)
    }
    if (deck.meta.hasRevlog && deck.data.rev_log) {
      db.exec(schema_rev_log)
      inner(stmts.rev_log, deck.data.rev_log)
    }
    db.exec("VACUUM;")
    const data = sqlite3.capi.sqlite3_js_db_export(db)
    db.close()
    zip.file("data.sqlite", data)

    const blob = await zip.generateAsync({ type: "blob" })

    return new File([blob], filename(".deck.zip"), { type: "application/zip" })
  } finally {
    db.close()
  }
}
