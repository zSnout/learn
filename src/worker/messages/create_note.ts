import { randomId } from "@/lib/id"
import { unwrapOr } from "@/lib/result"
import * as Template from "@/lib/template"
import {
  ModelFields,
  type Deck,
  type Model,
  type NewCard,
  type Note,
  type NoteFields,
} from "@/lib/types"
import { createEmptyCard, State } from "ts-fsrs"
import { parse } from "valibot"
import { readwrite, sql } from ".."
import { int, text } from "../lib/checks"
import { stmts } from "../lib/stmts"

export function create_note(
  tags: string[],
  fields: NoteFields,
  model: Pick<Model, "tmpls" | "id" | "fields" | "sort_field">,
  deck: Deck,
) {
  const now = Date.now()
  const sortField = fields[model.sort_field ?? 0] ?? ""
  const nid = randomId()
  const note: Note = {
    creation: now,
    fields: fields,
    mid: model.id,
    csum: 0, // FEAT: checksums
    id: nid,
    last_edited: now,
    sort_field: sortField,
    tags,
    marks: 0,
  }

  const fieldRecord = Template.fieldRecord(model.fields, fields)
  const cards: NewCard[] = []

  let due = sql`
    SELECT coalesce(max(due), 0) FROM cards WHERE state = 0;
  `.getValue(int)

  for (const tmpl of Object.values(model.tmpls)) {
    const base = createEmptyCard(now)
    const template = unwrapOr(Template.parse(tmpl.qfmt), [])
    const isFilled = Template.isFilled(template, fieldRecord, {
      FrontSide: undefined,
    })
    if (!isFilled) {
      continue
    }
    const card: NewCard = {
      ...base,
      creation: now,
      did: deck.id,
      nid,
      tid: tmpl.id,
      id: randomId(),
      due: ++due,
      last_edited: now,
      last_review: null,
      queue: 0,
      state: State.New,
      flags: 0,
      odid: null,
    }
    cards.push(card)
  }

  if (cards.length == 0) {
    throw new Error("Note generated no cards.")
  }

  const tx = readwrite(`Create note in ${deck.name}`)
  try {
    stmts.notes.insert().bindNew(stmts.notes.insertArgs(note)).run()

    // insert cards using a prepared statement
    const stmt = stmts.cards.insert()
    for (const card of cards) {
      stmt.bindNew(stmts.cards.insertArgs(card)).run()
    }

    // verify that the fields object we're adding doesn't kill integrity
    const result = sql`
      SELECT
        fields
      FROM models
      WHERE id = ${model.id};
    `.getValue(text)

    const prevFields = Object.keys(parse(ModelFields, JSON.parse(result)))
    const nextFields = Object.keys(model.fields)
    if (
      (model.sort_field == null ||
        prevFields.includes("" + model.sort_field)) &&
      prevFields.length == nextFields.length &&
      prevFields.every((x, i) => x == nextFields[i])
    ) {
      sql`
        UPDATE models
        SET
          sort_field = ${model.sort_field},
          fields = ${JSON.stringify(model.fields)}
        WHERE id = ${model.id};
      `.run()
    } else {
      console.warn(
        "The model was not able to be updated.",
        model.sort_field,
        prevFields,
        nextFields,
      )
    }
    tx.commit()
  } finally {
    tx.dispose()
  }
}
