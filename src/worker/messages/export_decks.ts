import type { Id } from "@/lib/id"
import { MEDIA_REGEX, parseKey, UserMedia, writeKey } from "@/lib/media"
import { unique } from "@/lib/unique"
import JSZip from "jszip"
import { readonly, sql } from ".."
import { eraseScheduling } from "../lib/eraseScheduling"
import { packageDeck } from "../lib/package"
import { stmts } from "../lib/stmts"

export interface ExportDecksProps {
  includeConfs: boolean
  includeRevLog: boolean
  includeScheduling: boolean
  includeMedia: boolean
}

const userMedia = new UserMedia()

export async function export_decks_txless(
  dids: Id[],
  props: ExportDecksProps,
): Promise<File> {
  const decks = sql`SELECT * FROM decks WHERE id = ?;`
    .each(dids)
    .getRow()
    .map(stmts.decks.interpret)

  if (decks.some((x) => x.is_filtered)) {
    throw new Error("Cannot export filtered decks.")
  }

  const cards = sql`SELECT * FROM cards WHERE did = ?;`
    .each(dids)
    .getAll()
    .flat()
    .map(stmts.cards.interpret)

  if (cards.some((x) => x.odid != null)) {
    throw new Error("Cannot export cards in filtered decks.")
  }

  const notes = sql`SELECT * FROM notes WHERE id = ?;`
    .each(cards.map((x) => x.nid).filter(unique))
    .getAll()
    .flat()
    .map(stmts.notes.interpret)

  const models = sql`SELECT * FROM models WHERE id = ?;`
    .each(notes.map((x) => x.mid).filter(unique))
    .getAll()
    .flat()
    .map(stmts.models.interpret)

  const rev_log =
    props.includeRevLog ?
      sql`SELECT * FROM rev_log WHERE cid = ?;`
        .each(cards.map((x) => x.id))
        .getAll()
        .flat()
        .map(stmts.rev_log.interpret)
    : null

  const confs =
    props.includeConfs ?
      sql`SELECT * FROM confs WHERE id = ?;`
        .each(decks.map((x) => x.cfid).filter(unique))
        .getAll()
        .flat()
        .map(stmts.confs.interpret)
    : null

  if (!props.includeScheduling) {
    eraseScheduling(decks, cards, notes)
  }

  let media: JSZip | null = null
  const mediaMap: Record<string, string> = Object.create(null)
  if (props.includeMedia) {
    media = new JSZip()

    const mayHaveMedia = notes
      .flatMap((note) => Object.values(note.fields))
      .concat(
        models.flatMap((model) =>
          [
            model.css,
            Object.values(model.tmpls).map((x) => x.qfmt),
            Object.values(model.tmpls).map((x) => x.afmt),
            Object.values(model.tmpls)
              .map((x) => x.qb)
              .filter((x) => x != null),
            Object.values(model.tmpls)
              .map((x) => x.ab)
              .filter((x) => x != null),
          ].flat(),
        ),
      )

    const keys = new Set<string>()
    let output
    for (const string of mayHaveMedia) {
      while ((output = MEDIA_REGEX.exec(string))) {
        keys.add(output[1]!)
      }
    }
    for (const { key, file } of await userMedia.getEach(
      Array.from(keys)
        .map(parseKey)
        .filter((x) => x != null),
    )) {
      if (file) {
        const str = writeKey(key)
        mediaMap[str] = file.name
        media.file(str, file)
      }
    }
  }

  return packageDeck({
    meta: {
      version: 1,
      media: props.includeMedia ? mediaMap : null,
      hasScheduling: props.includeScheduling,
      hasConfs: props.includeConfs,
      hasRevlog: props.includeRevLog,
    },
    data: {
      cards,
      confs,
      decks,
      models,
      notes,
      rev_log,
    },
    media,
  })
}

export function export_decks(dids: Id[], props: ExportDecksProps) {
  const tx = readonly()
  try {
    return export_decks_txless(dids, props)
  } finally {
    // `tx` is disposed before the promise resolves, but this is okay, since
    // `export_decks_raw_txless` only accesses the database in the initial
    // synchronous tick of its execution
    tx.dispose()
  }
}
