import { notNull } from "@/lib/pray"
import { ID_ZERO, idOf, type Id } from "@/lib/id"
import { UserMedia } from "@/lib/media"
import { type PackagedDeck } from "@/lib/types"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import { readwrite, sql } from ".."
import { id, int } from "../lib/checks"
import { eraseScheduling } from "../lib/eraseScheduling"
import type { Stmt } from "../lib/sql"
import { stmts } from "../lib/stmts"
import { unpackage } from "../lib/unpackage"

const userMedia = new UserMedia()

export interface ImportPackagedDeckProps {
  importMedia: boolean
  importScheduling: boolean
  importRevlog: boolean
  importConfs: boolean
}

/** The packaged deck passed to this function _will_ be severely mutated. */
export async function import_packaged_deck(
  { data, media, meta }: PackagedDeck,
  props: ImportPackagedDeckProps,
) {
  // 0. User media (if it exists)
  if (props.importMedia && meta.media && media) {
    await userMedia.import(meta.media, media)
  }

  if (!props.importScheduling) {
    eraseScheduling(data.decks, data.cards, data.notes)
  }

  const tx = readwrite("Import deck package")
  try {
    function inner<T extends { id: Id; last_edited: number }>(
      items: T[],
      name: string,
      /** Returns the `last_edited` timestamp of an exact match. */
      exact: (item: T) => number | null,
      /**
       * Resolves non-id-related conflicts on an item. If this function returns
       * an `Id`, it is assumed that this item is somehow in the collection
       * under that id. The item and map will then be updated with that id.
       * Otherwise, the item will be inserted.
       */
      tame: (item: T) => Id | null | void,
      stmt: {
        insert(): Stmt
        update(): Stmt
        insertArgs(value: T): SqlValue[]
        updateArgs(value: T): SqlValue[]
      },
    ): Record<Id, Id> {
      const map: Record<Id, Id> = Object.create(null)

      const conflict = sql.of(`SELECT 1 FROM ${name} WHERE id = ?;`)
      const insert = stmt.insert()
      const update = stmt.update()

      for (const item of items) {
        const ogId = item.id

        const lastEditedOfExactMatch = exact(item)

        if (lastEditedOfExactMatch != null) {
          if (lastEditedOfExactMatch < item.last_edited) {
            update.bindNew(stmt.updateArgs(item)).run()
          }
          map[item.id] = item.id
          continue
        }

        while (conflict.bindNew(item.id).exists()) {
          item.id++
          if (item.id >= Number.MAX_SAFE_INTEGER) {
            item.id = idOf(1)
          }
        }

        const result = tame(item)
        if (typeof result == "number") {
          map[ogId] = result
          item.id = ogId
          continue
        } else {
          map[ogId] = item.id
        }
        insert.bindNew(stmt.insertArgs(item)).run()
      }

      conflict.dispose()
      insert.dispose()
      update.dispose()

      return map
    }

    // 1. Models
    let midMap: Record<Id, Id>
    {
      const exactMatch = sql`
        SELECT last_edited
        FROM models
        WHERE
          id = ?
          AND fields = ?
          AND tmpls = ?
          AND css = ?
          AND sort_field = ?;
      ` // name can be different

      const conflict = sql`SELECT 1 FROM models WHERE name = ?;`

      midMap = inner(
        data.models,
        "models",
        (item) =>
          exactMatch
            .bindNew([
              item.id,
              JSON.stringify(item.fields),
              JSON.stringify(item.tmpls),
              item.css,
              item.sort_field,
            ])
            .getValueSafe(int),
        (item) => {
          while (conflict.bindNew(item.name).exists()) {
            item.name += "+"
          }
        },
        stmts.models,
      )

      exactMatch.dispose()
      conflict.dispose()
    }

    // 2. Deck confs (if they exist)
    let cfidMap: Record<Id, Id> | null = null
    if (props.importConfs && meta.hasConfs && data.confs) {
      const exact = sql`
        SELECT last_edited
        FROM confs
        WHERE id = ? AND name = ?;
      `

      const conflict = sql`SELECT 1 FROM confs WHERE name = ?;`

      cfidMap = inner(
        data.confs,
        "confs",
        (item) => exact.bindNew([item.id, item.name]).getValueSafe(int),
        (item) => {
          while (conflict.bindNew(item.name).exists()) {
            item.name += "+"
          }
        },
        stmts.confs,
      )

      exact.dispose()
      conflict.dispose()
    }

    // 3. Notes
    let nidMap: Record<Id, Id>
    {
      for (const note of data.notes) {
        note.mid = notNull(
          midMap[note.mid],
          "A note in the imported deck does not have an associated model.",
        )
      }

      const exact = sql`SELECT last_edited FROM notes WHERE id = ? AND mid = ?;`

      nidMap = inner(
        data.notes,
        "notes",
        ({ id, mid }) => exact.bindNew([id, mid]).getValueSafe(int),
        () => {},
        stmts.notes,
      )

      exact.dispose()
    }

    // 4. Decks
    let didMap: Record<Id, Id>
    {
      for (const deck of data.decks) {
        deck.cfid = cfidMap?.[deck.cfid] ?? ID_ZERO
      }

      const exact = sql`
        SELECT last_edited FROM decks WHERE id = ? AND name = ?;
      `
      const conflict = sql`SELECT 1 FROM decks WHERE name = ?;`

      didMap = inner(
        data.decks,
        "decks",
        (item) => exact.bindNew([item.id, item.name]).getValueSafe(int),
        (item) => {
          while (conflict.bindNew(item.name).exists()) {
            item.name += "+"
          }
        },
        stmts.decks,
      )

      exact.dispose()
      conflict.dispose()
    }

    let cidMap: Record<Id, Id>
    // 5. Cards
    {
      for (const card of data.cards) {
        card.did = notNull(
          didMap[card.did],
          "An imported card was not exported with its associated deck.",
        )
        card.nid = notNull(
          nidMap[card.nid],
          "An imported card was not exported with its associated note.",
        )
      }

      const exact = sql`
        SELECT last_edited FROM cards WHERE id = ? AND nid = ? AND tid = ?;
      `

      const conflict = sql`SELECT id FROM cards WHERE nid = ? AND tid = ?;`

      cidMap = inner(
        data.cards,
        "cards",
        ({ id, nid, tid }) => exact.bindNew([id, nid, tid]).getValueSafe(int),
        ({ nid, tid }) => {
          return conflict.bindNew([nid, tid]).getValueSafe(id)
        },
        stmts.cards,
      )

      exact.dispose()
      conflict.dispose()
    }

    // 6. Review log
    if (props.importRevlog && meta.hasRevlog && data.rev_log) {
      for (const review of data.rev_log) {
        review.cid = notNull(
          cidMap[review.cid],
          "An entry in the review log was not associated with a card which exists.",
        )
      }

      const exists = sql`SELECT 1 FROM rev_log WHERE id = ?;`
      const insert = stmts.rev_log.insert()

      for (const review of data.rev_log) {
        if (!exists.bindNew(review.id).exists()) {
          insert.bindNew(stmts.rev_log.insertArgs(review)).run()
        }
      }

      exists.dispose()
      insert.dispose()
    }

    tx.commit()
  } finally {
    tx.dispose()
  }
}

export async function import_deck(file: File, props: ImportPackagedDeckProps) {
  const data = await unpackage(file)
  return import_packaged_deck(data, props)
}
