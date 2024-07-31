// FEAT: add all template features from anki
// ban `:` `#` `^` `/` `$` `@` `{` `}` `\s` from field names
// {{Tags, Type, Deck, Subdeck, CardFlag, Card, FrontSide}}
// match hint content, css, and css classes to anki
// img
// audio
// video
// latex
// {{type:fieldname}} (these inherit the font of fields)
// ignore card when front is empty
// clozes
// `learn-tts` and `learn-hint` custom elements

import { error, ok, type Result } from "./result"
import { ModelFields, NoteFields } from "./types"

export interface Text {
  type: "text"
  text: string
}

export interface Field {
  type: "field"
  action?: undefined
  field: string
}

export interface Action {
  type: "action"
  action: string
  field: string
}

export interface Tag {
  type: "tag"
  negative: boolean
  field: string
  contents: Compiled
}

export type Item = Tag | Text | Field | Action
export type Compiled = Item[]

export function parse<T extends string>(source: T): Result<Compiled> {
  const output: Compiled = []
  const inner: Compiled[] = []
  let current = output
  let index = 0

  while (index < source.length) {
    const indexOfExpr = source.indexOf("{{", index)

    if (indexOfExpr == -1) {
      current.push({ type: "text", text: source.slice(index) })
      break
    }

    if (indexOfExpr != 0) {
      current.push({ type: "text", text: source.slice(index, indexOfExpr) })
      index = indexOfExpr
    }

    const end = source.indexOf("}}", index)
    if (end == -1) {
      return error("Unmatched opening `{{`.")
    }

    const expr = source.slice(index + 2, end).trim()
    index = end + 2

    if (expr.startsWith("#") || expr.startsWith("^")) {
      const contents: Compiled = []
      const tag: Tag = {
        type: "tag",
        negative: expr.startsWith("^"),
        field: expr.slice(1),
        contents,
      }
      current.push(tag)
      inner.push(current)
      current = contents
      continue
    }

    if (expr.startsWith("^")) {
      const prev = inner.pop()
      if (prev == null) {
        return error("Unmatched closing conditional `{{/name}}`.")
      }

      current = prev
      continue
    }

    const colonIndex = expr.indexOf(":")
    if (colonIndex == -1) {
      current.push({ type: "field", field: expr })
    } else if (colonIndex == 0) {
      const field = expr.slice(1).trim()
      current.push({ type: "field", field })
    } else {
      const action = expr.slice(0, colonIndex).trim()
      const field = expr.slice(colonIndex + 1).trim()
      current.push({ type: "action", action, field })
    }
  }

  if (inner.length != 0) {
    return error("Unmatched opening conditional `{{#name}}` or `{{^name}}`.")
  }

  return ok(current)
}

export function htmlToText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  return doc.documentElement.textContent ?? ""
}

export type RequiredFieldName =
  | "Tags"
  | "Type"
  | "Deck"
  | "Subdeck"
  | "CardFlag"
  | "Card"
  | "FrontSide"

type ActionFn = (fieldValue: string) => string

const actions: Record<string, ActionFn> = {
  tts(value) {
    return `<learn-tts style=display:contents>${value}</learn-tts>`
  },
  text(value) {
    return htmlToText(value)
  },
  hint(value) {
    return `<learn-hint style=display:contents><button style=text-decoration:underline>&lt;reveal hint&gt;</button><div style=display:none>${value}</div></learn-hint>`
  },
  furigana(value) {
    const regex = /([^[\]]+)\[([^[\]]+)\]|([^[\]]+)/g
    let output = `<ruby>`
    let match
    while ((match = regex.exec(value))) {
      if (match[3]) {
        output += match[3]
      } else {
        output += `${match[1]}<rp>(</rp><rt>${match[2]}</rt><rp>)</rp>`
      }
    }
    output += `</ruby>`
    return output
  },
  kanji(value) {
    const regex = /([^[\]]+)\[([^[\]]+)\]|([^[\]]+)/g
    let output = ""
    let match
    while ((match = regex.exec(value))) {
      if (match[3]) {
        output += match[3]
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        output += match[1]!
      }
    }
    return output
  },
  kana(value) {
    const regex = /([^[\]]+)\[([^[\]]+)\]|([^[\]]+)/g
    let output = ""
    let match
    while ((match = regex.exec(value))) {
      if (match[2]) {
        output += match[2]
      }
    }
    return output
  },
}

export interface ExtraFieldsRecord {
  FrontSide: string | undefined
  [x: string]: string | undefined
}

export function generate(
  source: Compiled,
  fields: FieldsRecord,
  extraFields: ExtraFieldsRecord,
): string {
  let output = ""

  for (const item of source) {
    switch (item.type) {
      case "tag": {
        const value = fields[item.field] ?? extraFields[item.field] ?? ""

        const exists = !!value.trim()
        if (exists != item.negative) {
          output += generate(item.contents, fields, extraFields)
        }
        break
      }

      case "text": {
        output += item.text
        break
      }

      case "field": {
        const value = fields[item.field] ?? extraFields[item.field] ?? ""
        output += value
        break
      }

      case "action": {
        const field = fields[item.field] ?? extraFields[item.field] ?? ""
        const action = actions[item.action]
        if (action == null) {
          output += field
        } else {
          output += action(field)
        }
        break
      }
    }
  }

  return output
}

export function isFilled(
  source: Compiled,
  fields: FieldsRecord,
  extraFields: ExtraFieldsRecord,
): boolean {
  for (const item of source) {
    switch (item.type) {
      case "tag": {
        const value = fields[item.field] ?? extraFields[item.field] ?? ""

        const exists = !!value.trim()
        if (exists != item.negative) {
          if (isFilled(item.contents, fields, extraFields)) {
            return true
          }
        }
        break
      }

      case "text": {
        break
      }

      case "field":
      case "action": {
        const value = fields[item.field] ?? extraFields[item.field] ?? ""
        if (value.trim()) {
          return true
        }
        break
      }
    }
  }

  return false
}

export type ValidationIssue =
  | { type: "missing-field"; name: string; cause: Field | Action | Tag }
  | { type: "invalid-action"; action: string; field: string; cause: Action }

function validateInner(
  source: Compiled,
  fields: FieldsRecord,
  extraFields: ExtraFieldsRecord,
  issues: ValidationIssue[],
) {
  for (const item of source) {
    switch (item.type) {
      case "tag": {
        const value = fields[item.field] ?? extraFields[item.field]
        if (value == null) {
          issues.push({ type: "missing-field", name: item.field, cause: item })
        }
        validateInner(item.contents, fields, extraFields, issues)
        break
      }

      case "text": {
        break
      }

      case "field": {
        const value = fields[item.field] ?? extraFields[item.field]
        if (value == null) {
          issues.push({ type: "missing-field", name: item.field, cause: item })
        }
        break
      }

      case "action": {
        const value = fields[item.field] ?? extraFields[item.field]
        if (value == null) {
          issues.push({ type: "missing-field", name: item.field, cause: item })
        }

        const action = actions[item.action]
        if (action == null) {
          issues.push({
            type: "invalid-action",
            action: item.action,
            field: item.field,
            cause: item,
          })
        }

        break
      }
    }
  }
}

export function validate(
  source: Compiled,
  fields: FieldsRecord,
  extraFields: ExtraFieldsRecord,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  validateInner(source, fields, extraFields, issues)
  return issues
}

export function issueToString(issue: ValidationIssue): string {
  switch (issue.type) {
    case "missing-field":
      return `Field {{${issue.name}}} is referenced but does not exist.`

    case "invalid-action":
      return `Action {{${issue.action}:...}} is not supported.`
  }
}

export type FieldsRecord = Record<string, string>

/** Creates a record of fields from a model and array of fields. */
export function fieldRecord(model: ModelFields, note: NoteFields) {
  const record = Object.create(null) as FieldsRecord

  for (const field of Object.values(model)) {
    record[field.name] = note[field.id] ?? ""
  }

  return record
}

/** Converts a template to its source string. */
export function toSource(template: Compiled): string {
  let output = ""

  for (const item of template) {
    switch (item.type) {
      case "tag": {
        output += `{{${item.negative ? "^" : "#"}${item.field}}}`
        output += toSource(item.contents)
        output += `{{/${item.field}`
        break
      }
      case "text": {
        output += item.text
        break
      }
      case "field": {
        output += `{{${item.field}}}`
        break
      }
      case "action": {
        output += `{{${item.action}:${item.field}}}`
        break
      }
    }
  }

  return output
}

/** Renames fields in a template. */
function renameFieldsInner(
  template: Compiled,
  renames: Record<string, string | undefined>,
  output: Compiled,
) {
  for (const item of template) {
    switch (item.type) {
      case "tag": {
        const next = renames[item.field]
        if (next == null) {
          // We now treat this field as empty. If it's negative, that means all
          // cards will have it filled, so fill it. If it's positive, that means
          // no cards have it filled, so we can remove it entirely.
          if (item.negative) {
            renameFieldsInner(item.contents, renames, output)
          }
        } else {
          output.push({
            ...item,
            field: next,
            contents: renameFields(item.contents, renames),
          })
        }
        break
      }

      case "text": {
        output.push(item)
        break
      }

      case "field":
      case "action": {
        const next = renames[item.field]
        // If there isn't a new field (e.g. it was deleted), then replace it
        // with nothing, like a regular template. While actions could
        // technically replace emptiness with something, that mechanic is never
        // used.
        if (next != null) {
          output.push({ ...item, field: next })
        }
        break
      }
    }
  }
}

/** Renames fields in a template. */
export function renameFields(
  template: Compiled,
  renames: Record<string, string | undefined>,
): Compiled {
  const output: Compiled = []
  renameFieldsInner(template, renames, output)
  return output
}
