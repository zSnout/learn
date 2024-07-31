import { CheckboxContainer } from "@/el/CheckboxContainer"
import { Checkbox } from "@/el/CheckboxGroup"
import { defineListEditorLayer } from "@/el/EditList"
import { IntegratedField } from "@/el/IntegratedField"
import { MatchResult } from "@/el/MatchResult"
import { createModelTemplate } from "@/lib/defaults"
import type { Id } from "@/lib/id"
import { arrayToRecord } from "@/lib/record"
import { Render } from "@/lib/render"
import { error, ok, type Result } from "@/lib/result"
import * as Template from "@/lib/template"
import { Model, ModelTemplate, TemplateEditStyle } from "@/lib/types"
import { faClone } from "@fortawesome/free-solid-svg-icons"
import { createMemo, For, Show, untrack } from "solid-js"
import { unwrap } from "solid-js/store"
import type { Worker } from "../db"

interface Data {
  editStyle: TemplateEditStyle
  fields: Template.FieldsRecord
  html: Record<string, boolean>
  model: Model
}

export default defineListEditorLayer<
  { worker: Worker; mid: Id; fields: Template.FieldsRecord },
  { selected?: Id },
  Promise<Data>,
  ModelTemplate
>(
  {
    init() {
      return {}
    },
    async load({ props: { worker, mid, fields } }) {
      const { model, editStyle } = await worker.post(
        "model_get_with_edit_style",
        mid,
      )
      return {
        editStyle,
        fields,
        model,
        html: Object.create(null),
      }
    },
  },
  {
    create(_, name, selected) {
      return createModelTemplate(selected.qfmt, selected.afmt, name)
    },
    getEntries(info) {
      return Object.values(info.data.model.tmpls)
    },
    tags(info) {
      return {
        title: info.data.model.name,
        subtitle: "editing templates",
      }
    },
    async save(info, _, entries) {
      await info.props.worker.post(
        "model_set",
        { ...info.data.model, tmpls: arrayToRecord(entries) },
        info.data.editStyle,
      )
    },
    internalProps: {
      add: "Clone",
      addIcon: faClone,
      delete: "Delete",
      rename: "Rename",
      needAtLeastOne: "A model needs at least one template.",
      newFieldName: "New template name",
      thisActionWillDeleteACard:
        "This action will delete all the template's associated cards.",
    },
    options(props) {
      const layout = createMemo(() => {
        const es = props.get.editStyle
        const triple = es.theme.light && es.theme.dark

        if (es.row == "all-separate") {
          return "all-separate"
        } else if (es.row == "separate") {
          if (triple) {
            return "separate"
          } else {
            return "all-separate"
          }
        } else if (triple) {
          return "triple"
        } else {
          return "dual"
        }
      })

      return (
        <>
          <EditingOptions />
          <Templates />
          <EditFields />
        </>
      )

      function Preview(local: {
        theme: "light" | "dark" | "auto"
        html: Result<string>
        css: string
      }) {
        return (
          <MatchResult
            result={local.html}
            fallback={(err) => (
              <div
                class={
                  "bg-z-body-selected text-z min-h-48 rounded-lg px-3 py-2 " +
                  local.theme
                }
              >
                <For each={err().split("\n")}>{(el) => <p>{el}</p>}</For>
              </div>
            )}
          >
            {(value) => (
              <Render
                class={
                  "bg-z-body-selected min-h-48 rounded-lg px-3 py-2 " +
                  local.theme
                }
                html={value()}
                css={local.css}
                theme={local.theme}
              />
            )}
          </MatchResult>
        )
      }

      function Templates() {
        const qhtml = createMemo(() => {
          const result = Template.parse(props.selected["qfmt"])
          if (!result.ok) {
            return result
          }
          const { value } = result
          const issues = Template.validate(value, unwrap(props.get.fields), {
            FrontSide: undefined,
          })
          if (issues.length) {
            return error(issues.map(Template.issueToString).join("\n"))
          }
          return ok(
            Template.generate(value, props.get.fields, {
              FrontSide: undefined,
            }),
          )
        })

        const ahtml = createMemo(() => {
          const result = Template.parse(props.selected["afmt"])
          if (!result.ok) {
            return result
          }
          const { value } = result
          const q = qhtml()
          const qh = q.ok ? q.value : "error while rendering FrontSide"
          const issues = Template.validate(value, props.get.fields, {
            FrontSide: qh,
          })
          if (issues.length) {
            return error(issues.map(Template.issueToString).join("\n"))
          }
          return ok(
            Template.generate(value, props.get.fields, { FrontSide: qh }),
          )
        })

        return (
          <div
            class="flex flex-col gap-4"
            classList={{ "md:gap-1": props.get.editStyle.row == "inline" }}
          >
            <Show when={props.get.editStyle.template.front}>
              {SingleTemplate("qfmt", qhtml)}
            </Show>
            <Show when={props.get.editStyle.template.back}>
              {SingleTemplate("afmt", ahtml)}
            </Show>
            <Show when={props.get.editStyle.template.styling}>{Styling()}</Show>
            <Show
              when={
                !(
                  props.get.editStyle.template.front ||
                  props.get.editStyle.template.back ||
                  props.get.editStyle.template.styling
                )
              }
            >
              <div class="bg-z-body-selected rounded-lg px-2 py-1 text-center italic">
                Select "Front", "Back", or "Styling" to start editing.
              </div>
            </Show>
          </div>
        )
      }

      function Styling() {
        return (
          <IntegratedField
            label="Styling (affects all templates)"
            onInput={(css) =>
              props.set("model", (model) => ({ ...model, css }))
            }
            type="css-only"
            value={props.get.model.css}
            minHeight
          />
        )
      }

      function EditingOptions() {
        return (
          <div class="bg-z-body-selected grid grid-cols-1 gap-1 rounded-lg sm:grid-cols-3">
            <CheckboxContainer label="Templates shown">
              <label class="flex w-full gap-2">
                <Checkbox
                  checked={props.get.editStyle.template.front}
                  onInput={(v) =>
                    props.set("editStyle", "template", "front", v)
                  }
                />

                <p>Front</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  checked={props.get.editStyle.template.back}
                  onInput={(v) => props.set("editStyle", "template", "back", v)}
                />

                <p>Back</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  checked={props.get.editStyle.template.styling}
                  onInput={(v) =>
                    props.set("editStyle", "template", "styling", v)
                  }
                />

                <p>Styling</p>
              </label>
            </CheckboxContainer>

            <CheckboxContainer label="Themes shown">
              <label class="flex w-full gap-2">
                <Checkbox
                  checked={props.get.editStyle.theme.light}
                  onInput={(v) => props.set("editStyle", "theme", "light", v)}
                />

                <p>Light</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  checked={props.get.editStyle.theme.dark}
                  onInput={(v) => props.set("editStyle", "theme", "dark", v)}
                />

                <p>Dark</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  circular
                  checked={
                    !(
                      props.get.editStyle.theme.light ||
                      props.get.editStyle.theme.dark
                    )
                  }
                  onInput={() =>
                    props.set("editStyle", "theme", ["light", "dark"], false)
                  }
                />

                <p>Auto</p>
              </label>
            </CheckboxContainer>

            <CheckboxContainer label="Grouping">
              <label class="flex w-full gap-2">
                <Checkbox
                  circular
                  checked={props.get.editStyle.row == "inline"}
                  onInput={() => props.set("editStyle", "row", "inline")}
                />

                <p>Inline (desktop only)</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  circular
                  checked={props.get.editStyle.row == "separate"}
                  onInput={() => props.set("editStyle", "row", "separate")}
                />

                <p>Separate</p>
              </label>

              <label class="flex w-full gap-2">
                <Checkbox
                  circular
                  checked={props.get.editStyle.row == "all-separate"}
                  onInput={() => props.set("editStyle", "row", "all-separate")}
                  disabled={
                    !(
                      props.get.editStyle.theme.light &&
                      props.get.editStyle.theme.dark
                    )
                  }
                />

                <p
                  classList={{
                    "opacity-30": !(
                      props.get.editStyle.theme.light &&
                      props.get.editStyle.theme.dark
                    ),
                  }}
                >
                  All separate
                </p>
              </label>
            </CheckboxContainer>
          </div>
        )
      }

      function SingleTemplate(
        type: "qfmt" | "afmt",
        html: () => Result<string>,
      ) {
        return (
          <div
            class="grid gap-1"
            classList={{
              "grid-cols-2": layout() == "triple",
              "md:grid-cols-3": layout() == "triple",
              "md:grid-cols-2": layout() == "dual" || layout() == "separate",
            }}
          >
            <div
              classList={{
                "col-span-2": layout() == "triple" || layout() == "separate",
                "md:col-span-1": layout() == "triple" || layout() == "dual",
              }}
            >
              <IntegratedField
                label={type == "afmt" ? "Back Template" : "Front Template"}
                onInput={(value) =>
                  props.setSelected((tmpl) => ({ ...tmpl, [type]: value }))
                }
                type="html-only"
                value={props.selected[type]}
                minHeight
              />
            </div>

            <Show when={props.get.editStyle.theme.light}>
              <Preview theme="light" html={html()} css={props.get.model.css} />
            </Show>
            <Show when={props.get.editStyle.theme.dark}>
              <Preview theme="dark" html={html()} css={props.get.model.css} />
            </Show>
            <Show
              when={
                !(
                  props.get.editStyle.theme.light ||
                  props.get.editStyle.theme.dark
                )
              }
            >
              <Preview theme="auto" html={html()} css={props.get.model.css} />
            </Show>
          </div>
        )
      }

      function EditFields() {
        return (
          <div class="flex flex-col gap-1">
            <For each={Object.values(untrack(() => props.get.model.fields))}>
              {(field) => (
                <IntegratedField
                  label={field.name}
                  rtl={field.rtl}
                  font={field.font ?? undefined}
                  sizePx={field.size ?? undefined}
                  type="html"
                  placeholder={field.desc}
                  value={props.get.fields[field.name]}
                  onInput={(value) => props.set("fields", field.name, value)}
                  showHtml={props.get.html[field.name] ?? false}
                  onShowHtml={(show) =>
                    props.set("html", field.name + "", show)
                  }
                />
              )}
            </For>
          </div>
        )
      }
    },
  },
)
