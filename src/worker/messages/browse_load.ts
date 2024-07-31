import { timestampDist } from "@/el/Quiz"
import { compare } from "@/lib/compare"
import type { Id } from "@/lib/id"
import { notNull } from "@/lib/pray"
import { arrayToRecord } from "@/lib/record"
import {
  type AnyCard,
  type Deck,
  type Model,
  type Note,
  type Prefs,
  BrowserColumn,
} from "@/lib/types"
import { State } from "ts-fsrs"
import { readonly, sql } from ".."
import { stmts } from "../lib/stmts"
import { prefs_get } from "./prefs_get"

export interface BrowseData {
  cardsArray: AnyCard[]
  cardsByCid: Record<Id, AnyCard>
  cardsByNid: Partial<Record<Id, AnyCard[]>>
  notes: Record<Id, Note>
  models: Record<Id, Model>
  decks: Record<Id, Deck>
  prefs: Prefs
}

export type ColumnValue = string | number | undefined

export type ColumnGetter = (
  card: AnyCard | undefined,
  note: Note,
  data: BrowseData,
) => ColumnValue

function date(ts: number | undefined) {
  if (ts == null) {
    return
  }

  const d = new Date(ts)
  return (
    d.getFullYear().toString().padStart(4, "0") +
    "-" +
    (d.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    d.getDate().toString().padStart(2, "0")
  )
}

const columns: Record<BrowserColumn, ColumnGetter> = {
  "Sort Field"(_, note) {
    return note.sort_field
  },
  Answer(card) {
    if (!card) return
    return "TODO:"
  },
  Card(card, note, { models, cardsByNid }) {
    if (!card) {
      return cardsByNid[note.id]?.length
    }

    const model = models[note.mid]
    if (!model) return
    return Object.keys(model.tmpls).indexOf(card.tid.toString())
  },
  Created(card, note) {
    return date((card ?? note).creation)
  },
  Deck(card, note, data) {
    if (card) {
      return data.decks[card.did]?.name
    } else {
      const decks = data.cardsByNid[note.id]
        ?.map((x) => x.did)
        .filter((x, i, a) => a.indexOf(x) == i)
        .map((x) => data.decks[x]?.name)
        .filter((x) => x != null)

      if (!decks) return

      if (decks.length == 0) {
        return
      } else {
        return decks.sort(compare).join(", ")
      }
    }
  },
  Due(card) {
    return date(card?.due)
  },
  Difficulty(card) {
    return card?.difficulty
  },
  Edited(card, note) {
    return date((card ?? note).last_edited)
  },
  Interval(card) {
    if (card?.last_review == null) {
      return "(new)"
    } else {
      return timestampDist((card.due - card.last_review) / 1000)
    }
  },
  Lapses(card) {
    return card?.lapses
  },
  Model(_, note, { models }) {
    return models[note.mid]?.name
  },
  Question(card) {
    if (!card) return
    return "TODO:"
  },
  Reviews(card) {
    return card?.reps
  },
  Stability(card) {
    return card?.stability
  },
  State(card) {
    if (!card) return
    return `${card.state}(${State[card.state]})`
  },
  Tags(_, note) {
    return note.tags.sort(compare).join(", ")
  },
}

export type ColumnData = Record<BrowserColumn, ColumnValue>

export function makeColumns(
  card: AnyCard | undefined,
  note: Note,
  data: BrowseData,
): ColumnData {
  const output: ColumnData = {} as any
  for (const key of BrowserColumn.options) {
    output[key] = columns[key](card, note, data)
  }
  return output
}

export function browse_load() {
  const tx = readonly()

  try {
    const decks = sql`SELECT * FROM decks;`.getAll().map(stmts.decks.interpret)

    const models = sql`SELECT * FROM models;`
      .getAll()
      .map(stmts.models.interpret)

    const notes = sql`SELECT * FROM notes;`.getAll().map(stmts.notes.interpret)

    const cards = sql`SELECT * FROM cards ORDER BY creation;`
      .getAll()
      .map(stmts.cards.interpret)

    const prefs = prefs_get()

    const notesByNid = arrayToRecord(notes)

    function groupByNid() {
      const output: Record<Id, AnyCard[]> = Object.create(null)
      for (const card of cards) {
        ;(output[card.nid] ??= []).push(card)
      }
      return output
    }

    const data: BrowseData = {
      cardsArray: cards,
      cardsByCid: arrayToRecord(cards),
      cardsByNid: groupByNid(),
      notes: notesByNid,
      models: arrayToRecord(models),
      decks: arrayToRecord(decks),
      prefs,
    }

    const result = {
      ...data,
      cards: cards.map((card) => {
        const note = notNull(
          notesByNid[card.nid],
          "Card must be associated with a valid note.",
        )
        return { card, note, columns: makeColumns(card, note, data) }
      }),
      noteColumns: notes.map((note) => {
        return {
          card: undefined,
          note,
          columns: makeColumns(undefined, note, data),
        }
      }),
    }
    return result
  } finally {
    tx.dispose()
  }
}
