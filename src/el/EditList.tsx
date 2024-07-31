import { compareWithName } from "@/lib/compare"
import type { Id } from "@/lib/id"
import { notNull } from "@/lib/pray"
import {
  faCancel,
  faCheck,
  faPencil,
  faPlus,
  faTrash,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import {
  batch,
  createMemo,
  createSignal,
  getOwner,
  JSX,
  type Setter,
  Show,
  untrack,
} from "solid-js"
import {
  createStore,
  type SetStoreFunction,
  type Store,
  unwrap,
} from "solid-js/store"
import type { Worker } from "../db"
import { Action, TwoBottomButtons } from "./BottomButtons"
import { defineLayer, type Layer, type LayerRenderInfo } from "./DefineLayer"
import { alert, confirm, ModalDescription, prompt } from "./Modal"
import { PlainFieldList, SortableFieldList } from "./Sortable"

export interface DefineListEditorProps<Props, State, AsyncData, Entry> {
  tags(info: LayerRenderInfo<Props, State, AsyncData>): {
    title: string
    subtitle: string
  }
  getEntries(info: LayerRenderInfo<Props, State, AsyncData>): Entry[]
  save(
    info: LayerRenderInfo<Props, State, AsyncData>,
    state: Awaited<AsyncData>,
    entries: Entry[],
  ): void
  sortId?(info: LayerRenderInfo<Props, State, AsyncData>): Id | null
  create(
    info: LayerRenderInfo<Props, State, AsyncData>,
    name: string,
    selected: Entry,
  ): Entry
  options: (info: {
    info: LayerRenderInfo<Props, State, AsyncData>
    get: Store<Awaited<AsyncData>>
    set: SetStoreFunction<Awaited<AsyncData>>
    selected: Entry
    setSelected: Setter<Entry>
  }) => JSX.Element
  internalProps: {
    add: string
    addIcon?: IconDefinition
    delete: string
    rename: string
    needAtLeastOne: string
    newFieldName: string
    initialMessage?: string
    full?: boolean
    noSort?: boolean | "by-name"
    thisActionWillDeleteACard?: string
    undeletable?: (entry: Entry) => boolean
  }
}

export function defineListEditor<
  Props,
  State extends { selected?: string | number },
  AsyncData extends object | PromiseLike<object>,
  Entry extends { id: Id; name: string },
>(
  list: DefineListEditorProps<Props, State, AsyncData, Entry>,
): Layer<Props, State, AsyncData>["render"] {
  const { internalProps, sortId, create, options: Options } = list
  return (info) => {
    const { pop } = info
    const { title, subtitle } = list.tags(info)
    const owner = getOwner()
    const [entries, setEntries] = createSignal(list.getEntries(info))
    const [state, setState] = createStore(info.data)
    const [selectedId, setSelectedId] = createSignal(
      notNull(
        info.state.selected ?? entries()[0]?.id,
        internalProps.needAtLeastOne as never,
      ),
    )
    const selectedIndex = createMemo(() => {
      const e = entries()
      const sid = selectedId()
      return notNull(
        e.findIndex((x) => x.id == sid),
        "Selected id must exist.",
      )
    })
    const selected = createMemo(() =>
      notNull(
        entries()[selectedIndex()],
        "`selectedIndex` should return a valid index.",
      ),
    )
    const setSelected = ((data: Entry | ((x: Entry) => Entry)) => {
      const d = typeof data == "function" ? data(untrack(selected)) : data
      setEntries((entries) => entries.slice().splice(selectedIndex(), 1, d))
      return d
    }) as Setter<Entry>

    return (
      <div class="flex min-h-full w-full flex-col gap-8">
        <div class="bg-z-body-selected w-full rounded-lg px-2 py-1 text-center">
          {title} <span class="text-z-subtitle">— {subtitle}</span>
        </div>

        <div
          class="grid w-full gap-6 sm:grid-cols-[auto,16rem]"
          classList={{ "flex-1": internalProps.full }}
        >
          <Show
            when={internalProps.noSort}
            fallback={
              <SortableFieldList
                get={entries()}
                set={setEntries}
                selectedId={selectedId()}
                setSelectedId={(x) => {
                  setSelectedId(x)
                  info.state.selected = x
                }}
                sortId={sortId?.(info) ?? undefined}
                fullHeight={!!internalProps.full}
              />
            }
          >
            <PlainFieldList
              get={
                internalProps.noSort == "by-name" ?
                  entries().slice().sort(compareWithName)
                : entries()
              }
              selectedId={selectedId()}
              setSelectedId={setSelectedId}
              sortId={sortId?.(info) ?? undefined}
              fullHeight={!!internalProps.full}
            />
          </Show>

          <SideActions />
        </div>

        <Options
          info={info}
          get={state}
          set={setState}
          selected={selected()}
          setSelected={setSelected}
        />

        <SaveChanges />
      </div>
    )

    async function confirmOneWaySync(description?: string) {
      return await confirm({
        owner,
        title: "Are you sure you want to do this?",
        get description() {
          return (
            <>
              <Show when={description}>
                {(el) => <ModalDescription>{el()}</ModalDescription>}
              </Show>

              <ModalDescription>
                This action will require a full upload of the database when you
                next synchronize your collection. If you have reviews or other
                changes waiting on another device that haven't been synchronized
                here yet, <u class="text-z font-semibold">they will be lost</u>.
                Continue?
              </ModalDescription>
            </>
          )
        },
        cancelText: "No, cancel",
        okText: "Yes, continue",
      })
    }

    async function pickName(title: string, cancelName?: string | undefined) {
      let first = true

      while (true) {
        const name = (
          await prompt({
            owner,
            title,
            description:
              first ? undefined : (
                <ModalDescription>
                  That name is already used. Please pick a different name, or
                  cancel the action.
                </ModalDescription>
              ),
          })
        )?.trim()

        if (name == null || name == cancelName) {
          return
        }

        if (!entries().some((x) => x.name.trim() == name)) {
          return name
        }

        first = false
      }
    }

    function SaveChanges() {
      return (
        <TwoBottomButtons>
          <Action icon={faCancel} label="Cancel" center onClick={() => pop()} />
          <Action
            icon={faCheck}
            label="Save changes"
            center
            onClick={() => {
              // TODO: saving is a possibly async operation
              list.save(info, structuredClone(unwrap(state)), entries())

              pop()
            }}
          />
        </TwoBottomButtons>
      )
    }

    function SideActions() {
      return (
        <div class="flex flex-col gap-1">
          <Action
            icon={internalProps.addIcon ?? faPlus}
            label={internalProps.add}
            onClick={async () => {
              if (!(await confirmOneWaySync())) {
                return
              }

              const name = await pickName(internalProps.newFieldName)

              if (!name) {
                return
              }

              const next = create(info, name, untrack(selected))

              batch(() => {
                setEntries((fields) => fields.concat(next))
                setSelectedId(next.id)
              })
            }}
          />

          <Action
            icon={faTrash}
            label={internalProps.delete}
            onClick={async () => {
              if (entries().length <= 1) {
                await alert({
                  owner,
                  title: "Unable to delete",
                  get description() {
                    return (
                      <ModalDescription>
                        {internalProps.needAtLeastOne}
                      </ModalDescription>
                    )
                  },
                })
                return
              }

              if (
                !(await confirmOneWaySync(
                  internalProps.thisActionWillDeleteACard,
                ))
              ) {
                return
              }

              batch(() => {
                const sid = selectedId()

                const fields = setEntries((x) => {
                  const idx = x.findIndex((x) => x.id == sid)
                  if (idx == -1) return x
                  if (x.length <= 1)
                    throw new Error(internalProps.needAtLeastOne)
                  x.splice(idx, 1)
                  return [...x]
                })

                setSelectedId(
                  notNull(fields[0]?.id, internalProps.needAtLeastOne as never),
                )
              })
            }}
            disabled={internalProps.undeletable?.(selected())}
          />

          <Action
            icon={faPencil}
            label={internalProps.rename}
            onClick={async () => {
              const name = await pickName(
                internalProps.newFieldName,
                selected().name,
              )

              if (!name) {
                return
              }

              setSelected((field) => ({ ...field, name: name }))
            }}
          />
        </div>
      )
    }
  }
}

export function defineListEditorLayer<
  Props extends Worker | { worker: Worker },
  State extends { selected?: string | number },
  AsyncData extends object | PromiseLike<object>,
  Entry extends { id: Id; name: string },
>(
  layer: Omit<Layer<Props, State, AsyncData>, "render">,
  list: DefineListEditorProps<Props, State, AsyncData, Entry>,
) {
  return defineLayer({ ...layer, render: defineListEditor(list) })
}
