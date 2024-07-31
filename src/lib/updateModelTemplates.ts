import { arrayToRecord } from "./record"
import * as Template from "./template"
import { ModelFields, ModelTemplates } from "./types"

export function renameFieldAccessesInTemplates(
  prev: ModelFields,
  next: ModelFields,
  tmpls: ModelTemplates,
): ModelTemplates {
  const renames = Object.create(null) as Record<string, string>

  for (const { id, name } of Object.values(prev)) {
    const newField = next[id]
    if (newField) {
      renames[name] = newField.name
    }
  }

  return arrayToRecord(
    Object.values(tmpls).map((tmpl) => {
      const qc = Template.parse(tmpl.qfmt)
      let qfmt
      if (qc.ok) {
        qfmt = Template.toSource(Template.renameFields(qc.value, renames))
      } else {
        qfmt = tmpl.qfmt
      }

      const ac = Template.parse(tmpl.afmt)
      let afmt
      if (ac.ok) {
        afmt = Template.toSource(Template.renameFields(ac.value, renames))
      } else {
        afmt = tmpl.afmt
      }

      const qbc = tmpl.qb ? Template.parse(tmpl.qb) : null
      let qb
      if (qbc?.ok) {
        qb = Template.toSource(Template.renameFields(qbc.value, renames))
      } else {
        qb = tmpl.qb
      }

      const abc = tmpl.ab ? Template.parse(tmpl.ab) : null
      let ab
      if (abc?.ok) {
        ab = Template.toSource(Template.renameFields(abc.value, renames))
      } else {
        ab = tmpl.ab
      }

      return { id: tmpl.id, name: tmpl.name, qfmt, afmt, qb, ab }
    }),
  )
}
