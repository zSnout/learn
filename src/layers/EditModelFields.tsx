import { AutocompleteFontFamily } from "@/el/AutocompleteFonts"
import { CheckboxContainer } from "@/el/CheckboxContainer"
import { Checkbox } from "@/el/CheckboxGroup"
import { defineListEditorLayer } from "@/el/EditList"
import { IntegratedField } from "@/el/IntegratedField"
import { createField } from "@/lib/defaults"
import { idOf, type Id } from "@/lib/id"
import { arrayToRecord } from "@/lib/record"
import type { Worker } from "../db"

export default defineListEditorLayer(
  {
    init(_: { worker: Worker; mid: Id }): {
      sort_field: Id | null
      selected?: Id
    } {
      return { sort_field: null }
    },
    async load(info) {
      const {
        props: { worker, mid },
      } = info
      const model = await worker.post("model_get", mid)
      info.state.sort_field = model.sort_field
      return model
    },
  },
  {
    create(_, name) {
      return createField(name)
    },
    getEntries(info) {
      return Object.values(info.data.fields)
    },
    tags(info) {
      return { title: info.data.name, subtitle: "editing fields" }
    },
    save(info, _, entries) {
      info.props.worker.post("model_set", {
        ...info.data,
        sort_field:
          entries.some((x) => x.id == info.state.sort_field) ?
            info.state.sort_field
          : null,
        fields: arrayToRecord(entries),
      })
    },
    sortId(info) {
      return info.data.sort_field
    },
    internalProps: {
      add: "Add",
      delete: "Delete",
      rename: "Rename",
      needAtLeastOne: "Models need at least one field.",
      newFieldName: "New field name",
    },
    options(props) {
      const { setSelected } = props

      return (
        <div class="flex flex-col gap-1">
          <IntegratedField
            label="Description"
            rtl={props.selected.rtl}
            font={props.selected.font ?? undefined}
            sizePx={props.selected.size ?? undefined}
            value={props.selected.desc}
            onInput={(y) => {
              setSelected((x) => ({ ...x, desc: y }))
            }}
            type="text"
            placeholder="Placeholder to show when no value is typed in"
          />

          <div class="grid grid-cols-[1fr,8rem] gap-1">
            <AutocompleteFontFamily
              label="Editing Font"
              placeholder="(optional)"
              value={props.selected.font ?? undefined}
              onChange={(font) => {
                setSelected((field) => ({ ...field, font }))
              }}
            />

            <IntegratedField
              label="Size"
              rtl={false}
              type="number"
              placeholder="(optional)"
              value={props.selected.size?.toString() ?? ""}
              onInput={(value) =>
                setSelected((field) => {
                  if (value == "") {
                    return { ...field, size: null }
                  }

                  const size = Math.floor(+value)
                  if (Number.isFinite(size)) {
                    return { ...field, size: Math.max(4, Math.min(256, size)) }
                  } else {
                    return field
                  }
                })
              }
            />
          </div>

          <CheckboxContainer label="Other options">
            <label class="flex w-full gap-2">
              <Checkbox
                circular
                checked={props.get.sort_field == props.selected.id}
                onInput={() => props.set("sort_field", idOf(props.selected.id))}
              />

              <p>Sort by this field in the browser</p>
            </label>

            <label class="flex w-full gap-2">
              <Checkbox
                checked={props.selected.rtl}
                onInput={(rtl) => setSelected((x) => ({ ...x, rtl }))}
              />

              <p>Edit as right-to-left text</p>
            </label>

            <label class="flex w-full gap-2">
              <Checkbox
                checked={props.selected.html}
                onInput={(html) => setSelected((x) => ({ ...x, html }))}
              />

              <p>Default to editing raw HTML</p>
            </label>

            <label class="flex w-full gap-2">
              <Checkbox
                checked={props.selected.collapsed}
                onInput={(collapsed) =>
                  setSelected((x) => ({ ...x, collapsed }))
                }
              />

              <p>Collapse field in card creator</p>
            </label>

            <label class="flex w-full gap-2">
              <Checkbox
                checked={props.selected.excludeFromSearch}
                onInput={(excludeFromSearch) =>
                  setSelected((x) => ({ ...x, excludeFromSearch }))
                }
              />

              <p>Exclude from unqualified searches</p>
            </label>
          </CheckboxContainer>
        </div>
      )
    },
  },
)
