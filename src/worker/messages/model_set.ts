import { unwrapOr } from "@/lib/result"
import { Id, ID_ZERO, randomId } from "@/lib/id"
import * as Template from "@/lib/template"
import {
  Model,
  ModelFields,
  ModelTemplates,
  NewCard,
  Note,
  NoteFields,
  TemplateEditStyle,
} from "@/lib/types"
import { createEmptyCard, State } from "ts-fsrs"
import { parse } from "valibot"
import { readwrite, sql } from ".."
import { id, qid, text } from "../lib/checks"
import { stmts } from "../lib/stmts"

function requiresOneWaySync(
  prev: Pick<Model, "sort_field" | "fields">,
  next: Model,
) {
  if (prev.sort_field != next.sort_field) {
    return true
  }

  const pf = Object.keys(prev.fields).sort()
  const nf = Object.keys(next.fields).sort()
  if (pf.length != nf.length) {
    return true
  }

  for (let i = 0; i < pf.length; i++) {
    if (pf[i] != nf[i]) {
      return true
    }
  }

  return false
}

function diffTmpls(prev: ModelTemplates, next: ModelTemplates) {
  const p = Object.values(prev)
  const n = Object.values(next)

  return {
    add: n.filter((n) => !p.some((p) => p.id == n.id)), // things in n but not p
    del: p.filter((p) => !n.some((n) => n.id == p.id)), // things in p but not n
  }
}

function mostPopularId(dids: Id[]) {
  if (dids.length == 0) {
    return null
  }

  const ids = new Map<Id, number>()

  for (const id of dids) {
    ids.set(id, (ids.get(id) ?? 0) + 1)
  }

  let id = ID_ZERO
  let count = 0

  for (const [k, v] of ids) {
    if (v > count) {
      id = k
      count = v
    }
  }

  return id
}

export async function model_set(model: Model, editStyle?: TemplateEditStyle) {
  const tx = readwrite(
    `Update ${editStyle ? "templates" : "fields"} for model ${model.name}`,
  )

  try {
    const now = Date.now()

    if (model.name.trim() == "") {
      throw new Error("Model name is empty.")
    }

    if (editStyle) {
      sql`
        UPDATE prefs
        SET template_edit_style = ${JSON.stringify(editStyle)}
        WHERE id = 0;
      `.run()
    }

    const prevRaw = sql`
      SELECT tmpls, sort_field, fields FROM models WHERE id = ${model.id};
    `.getRow([text, qid, text])

    if (!prevRaw) {
      stmts.models.insert().bindNew(stmts.models.insertArgs(model)).run()
      tx.commit()
      return
    }

    const prev = {
      tmpls: parse(ModelTemplates, JSON.parse(prevRaw[0])),
      sort_field: prevRaw[1],
      fields: parse(ModelFields, JSON.parse(prevRaw[2])),
    }

    const { add, del } = diffTmpls(prev.tmpls, model.tmpls)

    if (requiresOneWaySync(prev, model)) {
      sql`
        UPDATE core
        SET
          last_schema_edit = ${Date.now()},
          last_edited = ${Date.now()}
        WHERE id = 0;
      `.run()
    }

    for (const note of sql`SELECT * FROM notes WHERE mid = ${model.id};`) {
      inner(stmts.notes.interpret(note))
    }

    stmts.models.update().bindNew(stmts.models.updateArgs(model)).run()
    tx.commit()
    return

    async function inner(note: Note) {
      const sort_field = note.fields[model.sort_field ?? 0] ?? ""
      const fields = Object.create(null) as NoteFields
      for (const key in model.fields) {
        fields[key] = note.fields[key] ?? ""
      }
      const last_edited = now
      // FEAT: checksums
      sql`
        UPDATE notes
        SET
          sort_field = ${sort_field},
          fields = ${JSON.stringify(fields)},
          last_edited = ${last_edited}
        WHERE id = ${note.id};
      `.run()

      if (!add.length && !del.length) {
        return
      }

      const cs = sql`
        SELECT tid, odid, did, id FROM cards WHERE nid = ${note.id};
      `
        .getAll([id, qid, id, id])
        .map(([tid, odid, did, id]) => ({ tid, odid, did, id }))

      if (add.length) {
        const fields = Template.fieldRecord(model.fields, note.fields)
        const deckId = mostPopularId(cs.map((x) => x.odid ?? x.did))
        if (deckId != null) {
          for (const tmpl of add) {
            const base = createEmptyCard(now)
            const template = unwrapOr(Template.parse(tmpl.qfmt), [])
            const isFilled = Template.isFilled(template, fields, {
              FrontSide: undefined,
            })
            if (!isFilled) {
              continue
            }
            const card: NewCard = {
              ...base,
              creation: now,
              did: deckId,
              nid: note.id,
              tid: tmpl.id,
              id: randomId(),
              due: base.due.getTime(),
              last_edited: now,
              last_review: null,
              queue: 0,
              state: State.New,
              flags: 0,
              odid: null,
            }
            stmts.cards.insert().bindNew(stmts.cards.insertArgs(card)).run()
          }
        }
      }

      if (del.length) {
        for (const { id } of del) {
          const cid = cs.find((x) => x.tid == id)?.id
          if (cid != null) {
            sql`DELETE FROM cards WHERE id = ${cid};`.run()
          }
        }
      }
    }
  } finally {
    tx.dispose()
  }
}
