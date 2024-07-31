import type { Collection } from "@/lib/types"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import { readonly, sql } from ".."
import { stmts } from "../lib/stmts"

function inner<T>(name: string, meta: { interpret(data: SqlValue[]): T }) {
  const stmt = sql.of(`SELECT * FROM ${name};`)
  return stmt.getAll().map(meta.interpret)
}

function once<T>(name: string, meta: { interpret(data: SqlValue[]): T }) {
  const stmt = sql.of(`SELECT * FROM ${name} WHERE id = 0;`)
  return meta.interpret(stmt.getRow())
}

export function export_json_raw(): Collection {
  const tx = readonly()
  try {
    return {
      version: 6,
      core: once("core", stmts.core),
      graves: inner("graves", stmts.graves),
      confs: inner("confs", stmts.confs),
      decks: inner("decks", stmts.decks),
      models: inner("models", stmts.models),
      notes: inner("notes", stmts.notes),
      cards: inner("cards", stmts.cards),
      rev_log: inner("rev_log", stmts.rev_log),
      prefs: once("prefs", stmts.prefs),
      charts: inner("charts", stmts.charts),
    }
  } finally {
    tx.dispose()
  }
}
