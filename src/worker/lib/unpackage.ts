import { error } from "@/lib/result"
import {
  AnyCard,
  Conf,
  Deck,
  Model,
  Note,
  PackagedDeckMeta,
  Review,
  type PackagedDeck,
} from "@/lib/types"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import JSZip from "jszip"
import {
  parse,
  type BaseIssue,
  type BaseSchema,
  type InferOutput,
} from "valibot"
import { sqlite3 } from ".."
import { createStmts } from "./createStmts"
import { createSqlFunction } from "./sql"

export async function unpackage(file: File): Promise<PackagedDeck> {
  const files = await JSZip.loadAsync(file)
  const metaFile = files.file("meta.json")
  if (!metaFile) {
    throw new Error("Deck package is missing `meta.json`.")
  }
  const dataFile = files.file(/^data.sqlite3?$/)[0]
  if (!dataFile) {
    throw new Error("Deck package is missing `meta.json`.")
  }
  const [metaFileText, dataBuffer] = await Promise.all([
    metaFile.async("string"),
    dataFile.async("uint8array"),
  ])
  const meta = parse(PackagedDeckMeta, JSON.parse(metaFileText))

  // import the db
  const db = new sqlite3.oo1.DB()
  const sql = createSqlFunction(db)
  const stmts = createStmts(sql)
  try {
    const p = sqlite3.wasm.allocFromTypedArray(dataBuffer)
    try {
      const rc = sqlite3.capi.sqlite3_deserialize(
        db.pointer!,
        "main",
        p,
        dataBuffer.byteLength,
        dataBuffer.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE,
      )
      db.checkRc(rc)
      files.remove("meta.json")
      files.remove(dataFile.name)
      return {
        meta,
        data: {
          cards: inner("cards", stmts.cards, AnyCard),
          confs: meta.hasConfs ? inner("confs", stmts.confs, Conf) : null,
          decks: inner("decks", stmts.decks, Deck),
          models: inner("models", stmts.models, Model),
          notes: inner("notes", stmts.notes, Note),
          rev_log:
            meta.hasRevlog ? inner("rev_log", stmts.rev_log, Review) : null,
        },
        media: meta.media ? files : null,
      }
    } finally {
      sqlite3.wasm.dealloc(p)
    }
  } finally {
    db.close()
  }

  function inner<T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
    name: string,
    meta: { interpret(data: SqlValue[]): InferOutput<T> },
    parser: T,
  ) {
    try {
      const stmt = sql.of(`SELECT * FROM ${name};`)
      return stmt
        .getAll()
        .map(meta.interpret)
        .map((x) => parse(parser, x))
    } catch (e) {
      throw new Error("Deck package is malformed. " + error(e).reason, {
        cause: e,
      })
    }
  }
}
