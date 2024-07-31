import { unwrap } from "@/lib/result"
import { Id } from "@/lib/id"
import * as Template from "@/lib/template"
import type { ModelFields, ModelTemplates, NoteFields } from "@/lib/types"
import { readonly, sql } from ".."
import { id, text } from "../lib/checks"

export function export_cards_raw(cids: Id[]) {
  const tx = readonly()
  try {
    const mids = sql`
      SELECT notes.mid
      FROM
        cards
        JOIN notes ON notes.id = cards.nid
      WHERE cards.id = ?;
    `
      .each(cids)
      .getValue(id)

    const models = sql`SELECT id, fields, tmpls FROM models WHERE id = ?;`
      .each(mids)
      .getRow([id, text, text])

    const fields = new Map(
      models.map(([id, fields]) => [id, JSON.parse(fields) as ModelFields]),
    )

    const tmpls = new Map(
      models.map(([id, , tmpls]) => [id, JSON.parse(tmpls) as ModelTemplates]),
    )

    const qc: { [x: Id]: { [x: Id]: Template.Compiled } } = Object.create(null)
    const ac: { [x: Id]: { [x: Id]: Template.Compiled } } = Object.create(null)

    const query = sql`
      SELECT
        cards.tid,
        notes.mid,
        notes.fields
      FROM
        cards
        JOIN notes ON notes.id = cards.nid
      WHERE cards.id = ?;
    `

    const output: [q: string, a: string][] = []

    for (const cid of cids) {
      // query database
      const [tid, mid, rawNoteFields] = query
        .bindNew(cid)
        .getRow([id, id, text])

      // compile templates if we didn't already do that
      const qt = ((qc[mid] ??= Object.create(null))[tid] ??= unwrap(
        Template.parse(tmpls.get(mid)![tid]!.qfmt),
      ))
      const at = ((ac[mid] ??= Object.create(null))[tid] ??= unwrap(
        Template.parse(tmpls.get(mid)![tid]!.afmt),
      ))

      // create fields object
      const modelFields = fields.get(mid)!
      const noteFields = JSON.parse(rawNoteFields) as NoteFields
      const f = Template.fieldRecord(modelFields, noteFields)

      // generate cards
      const qfmt = Template.generate(qt, f, { FrontSide: undefined })
      const afmt = Template.generate(at, f, { FrontSide: qfmt })

      // save into output
      output.push([qfmt, afmt])
    }

    return output
  } finally {
    tx.dispose()
  }
}
