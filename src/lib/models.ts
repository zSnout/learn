import { createField, createModelTemplate } from "./defaults"
import { Id, idOf } from "./id"
import { arrayToRecord } from "./record"
import { Model, ModelField, ModelTemplate } from "./types"

function createModel(
  id: Id,
  name: string,
  tmpls: ModelTemplate[],
  css: string,
  fields: ModelField[],
  now: number,
): Model {
  return {
    id,
    creation: now,
    css,
    fields: arrayToRecord(fields),
    tmpls: arrayToRecord(tmpls),
    name,
    tags: [],
    type: 0,
    sort_field: fields[0]?.id ?? null,
    last_edited: now,
    latex: null,
  }
}

export function cloneModel(id: Id, name: string, model: Model): Model {
  return {
    ...structuredClone(model),
    id,
    name,
    last_edited: Date.now(),
  }
}

function createBasicModel(now: number): Model {
  return createModel(
    idOf(3166958980394845),
    "Basic",
    [
      createModelTemplate(
        "{{Front}}",
        `{{FrontSide}}

<hr id="answer" />

{{Back}}`,
        "Front --> Back",
        idOf(5579263327527826),
      ),
    ],
    `.card {
  font-size: 1.5rem;
  text-align: center;
}

hr {
  border-width: 0;
  border-top-width: 1px;
  border-top-color: var(--z-border);
  border-style: solid;
}`,
    [
      createField("Front", idOf(2363625942040156)),
      createField("Back", idOf(4176355055304650)),
    ],
    now,
  )
}

function createBasicAndReversedModel(now: number): Model {
  return createModel(
    idOf(3323968114672263),
    "Basic and reversed",
    [
      createModelTemplate(
        "{{Front}}",
        `{{FrontSide}}

<hr id="answer" />

{{Back}}`,
        "Front --> Back",
        idOf(2514636513529782),
      ),
      createModelTemplate(
        "{{Back}}",
        `{{FrontSide}}

<hr id="answer" />

{{Front}}`,
        "Back --> Front",
        idOf(8831569598485816),
      ),
    ],
    `.card {
  font-size: 1.5rem;
  text-align: center;
}

hr {
  border-width: 0;
  border-top-width: 1px;
  border-top-color: var(--z-border);
  border-style: solid;
}`,
    [
      createField("Front", idOf(8721063081413018)),
      createField("Back", idOf(6867200239311358)),
    ],
    now,
  )
}

export function createBuiltinV3(now: number) {
  return [createBasicModel(now), createBasicAndReversedModel(now)]
}

export function createBuiltin(now: number) {
  return createBuiltinV3(now)
}

export const BUILTIN_IDS = Object.freeze([
  3166958980394845, 3323968114672263,
]) as readonly Id[]
