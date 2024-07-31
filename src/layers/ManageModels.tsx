import { defineListEditorLayer } from "@/el/EditList"
import { LoadingSmall } from "@/el/LoadingSmall"
import { Id, randomId } from "@/lib/id"
import { BUILTIN_IDS } from "@/lib/models"
import type { AddedModel, Model, RemovedModel } from "@/lib/types"
import { faClone } from "@fortawesome/free-solid-svg-icons"
import { createEffect, createResource } from "solid-js"
import type { Worker } from "../db"

export type Item =
  | { type: "keep"; id: Id; name: string; model: Model }
  | { type: "create"; id: Id; name: string; model: Model }

export default defineListEditorLayer<
  Worker,
  { selected?: string | number },
  Promise<{ models: Model[]; initial: RemovedModel[] }>,
  Item
>(
  {
    init() {
      return {}
    },
    async load({ props: worker }) {
      const models = await worker.post("manage_models_get")
      return {
        models,
        initial: models.map<RemovedModel>((x) => [x.id, x.name]),
      }
    },
  },
  {
    create(_, name, selected) {
      return { type: "create", id: randomId(), name, model: selected.model }
    },
    getEntries(info) {
      return info.data.models.map((x) => ({
        type: "keep",
        id: x.id,
        name: x.name,
        model: x,
      }))
    },
    async save(info, _, entries) {
      const added: AddedModel[] = []
      const removed: RemovedModel[] = []
      const renamed: Record<Id, string> = Object.create(null)

      for (const m of entries) {
        if (m.type == "create") {
          added.push({ id: m.id, name: m.name, cloned: m.model })
        } else {
          renamed[m.id] = m.name
        }
      }

      for (const i of info.data.initial) {
        if (!entries.some((x) => x.id == i[0])) {
          removed.push(i)
        }
      }

      await info.props.post("manage_models_save", added, removed, renamed)
    },
    tags() {
      return { title: "Models", subtitle: "managing all" }
    },
    internalProps: {
      add: "Clone",
      addIcon: faClone,
      delete: "Delete",
      rename: "Rename",
      needAtLeastOne: "A collection needs at least one model.",
      newFieldName: "New model name",
      full: true,
      noSort: "by-name",
      thisActionWillDeleteACard:
        "Deleting this model will delete all its corresponding cards and notes.",
      undeletable(item) {
        return BUILTIN_IDS.includes(item.id)
      },
    },
    options(props) {
      const [data, { mutate }] = createResource(
        () => props.selected.id,
        (mid) => props.info.props.post("manage_models_count", mid),
      )

      createEffect(() => {
        props.selected.id
        mutate()
      })

      return (
        <div class="bg-z-body-selected grid rounded-lg px-4 py-3">
          <LoadingSmall>
            <div>
              Used in <span>{data()?.nids ?? "<unknown>"}</span> note
              {data()?.nids == 1 ? "" : "s"}.
            </div>
            <div>
              Used in <span>{data()?.cids ?? "<unknown>"}</span> card
              {data()?.cids == 1 ? "" : "s"}.
            </div>
          </LoadingSmall>
        </div>
      )
    },
  },
)
