import { Action, BottomButtons } from "@/el/BottomButtons"
import { ContextMenuItem, ContextMenuTrigger } from "@/el/ContextMenu"
import { defineRootLayer } from "@/el/DefineLayer"
import { MonotypeExpandableTree } from "@/el/Expandable"
import { importDeck } from "@/el/ImportDeck"
import { useLayers } from "@/el/Layers"
import {
  confirm,
  ModalCheckbox,
  ModalDescription,
  ModalStrong,
  prompt,
} from "@/el/Modal"
import { UploadButton } from "@/el/upload"
import { createEventListener } from "@/lib/create-event-listener"
import { download } from "@/lib/download"
import type { Id } from "@/lib/id"
import { shortcutToString } from "@/lib/shortcuts"
import { isDark, toggleIsDark } from "@/lib/theme"
import type { NodeProps } from "@/lib/tree"
import type { Buckets, DeckHomeInfo, DeckHomeTree } from "@/lib/types"
import {
  faChartBar,
  faPlus,
  faShareFromSquare,
  faSliders,
  faSync,
  faTableCellsLarge,
  faUpload,
} from "@fortawesome/free-solid-svg-icons"
import { createSignal, onMount } from "solid-js"
import { Worker } from "../db"
import {
  LAYER_BROWSE,
  LAYER_CREATE_NOTE,
  LAYER_MANAGE_MODELS,
  LAYER_MEDIA,
  LAYER_QUERY,
  LAYER_SETTINGS,
  LAYER_STATS,
  LAYER_STORAGE,
  LAYER_STUDY,
  LAYER_TASKS,
} from "../layers"
import type { ExportDecksProps } from "../worker/messages/export_decks"

function nope(): never {
  throw new Error("this page doesn't exist yet")
}

function SublinkHandler(): undefined {
  const layers = useLayers()

  onMount(() => {
    const el = document.getElementsByClassName("z-sublink")[0]

    if (el && el instanceof HTMLElement) {
      createEventListener(el, "click", (event) => {
        event.preventDefault()
        layers.forcePopAll()
      })
    }
  })
}

export const ROOT_LAYER_HOME = defineRootLayer({
  init(_: Worker) {},
  async load({ props: worker }) {
    const [decks, setDecks] = createSignal(await worker.post("home_list_decks"))
    return [
      decks,
      async () => setDecks(await worker.post("home_list_decks")),
    ] as const
  },
  render({ props: worker, toasts, data: [decks, reloadDecks], owner, push }) {
    // TODO: add decks to icon list and put all of them in the navbar when any
    // layers are active

    return (
      <div class="flex min-h-full flex-1 flex-col gap-4">
        <ContextMenuTrigger>
          <ContextMenuItem onClick={() => toggleIsDark()}>
            Switch to {isDark() ? "light" : "dark"} mode
          </ContextMenuItem>
        </ContextMenuTrigger>
        <SublinkHandler />
        <TopActions />
        <DeckList />
        <BottomActions />
      </div>
    )

    function TopActions() {
      return (
        <div
          class="xs:grid-cols-3 mx-auto grid w-full max-w-xl grid-cols-2 justify-center gap-1 sm:grid-cols-5"
          onCtx={({ detail }) =>
            detail(() => (
              <>
                <ContextMenuItem onClick={() => push(LAYER_MEDIA, worker)}>
                  Show user media
                </ContextMenuItem>
                <ContextMenuItem onClick={() => push(LAYER_STORAGE, worker)}>
                  Storage usage details
                </ContextMenuItem>
                <ContextMenuItem onClick={() => push(LAYER_TASKS, 0)}>
                  Application checklist
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => push(LAYER_MANAGE_MODELS, worker)}
                >
                  Manage models
                </ContextMenuItem>
                <ContextMenuItem onClick={() => push(LAYER_QUERY, { worker })}>
                  Query
                </ContextMenuItem>
              </>
            ))
          }
        >
          <Action
            class="xs:col-span-1 xs:row-span-2 col-span-2 sm:row-span-1"
            center
            icon={faPlus}
            label="Add"
            onClick={() => push(LAYER_CREATE_NOTE, worker)}
          />
          <Action
            center
            icon={faTableCellsLarge}
            label="Browse"
            onClick={() => push(LAYER_BROWSE, worker)}
          />
          <Action
            center
            icon={faChartBar}
            label="Stats"
            onClick={() => push(LAYER_STATS, worker)}
          />
          <Action
            center
            icon={faSliders}
            label="Settings"
            onClick={() => push(LAYER_SETTINGS, worker)}
          />
          <Action center icon={faSync} label="Sync" onClick={nope} />
        </div>
      )
    }

    function DeckList() {
      function compare([a]: [string, unknown], [b]: [string, unknown]) {
        const al = a.toLowerCase()
        const bl = b.toLowerCase()

        if (al < bl) return -1
        if (al > bl) return 1
        if (a < b) return -1
        if (a > b) return 1
        return 0
      }

      return (
        <div class="bg-z-body-selected mx-auto w-full max-w-xl flex-1 rounded-lg px-1 py-1">
          <div class="border-z xs:grid-cols-[auto,3rem,3rem,3rem] mb-1 grid grid-cols-[auto,3rem,3rem] items-baseline border-b pb-1 pl-8 pr-4 sm:grid-cols-[auto,4rem,4rem,4rem]">
            <p>Deck</p>
            <p class="text-z-subtitle text-right text-sm">New</p>
            <p class="text-z-subtitle xs:block hidden text-right text-sm">
              Learn
            </p>
            <p class="text-z-subtitle text-right text-sm">Due</p>
          </div>

          <MonotypeExpandableTree<DeckHomeInfo | undefined, DeckHomeInfo>
            z={10}
            shift
            tree={decks().tree}
            isExpanded={({ data }) => !data?.deck?.collapsed}
            setExpanded={async ({ data, parent, key }, expanded) => {
              await worker.post(
                "deck_set_expanded",
                data?.deck?.id ?? parent.map((x) => x + "::").join("") + key,
                expanded,
              )
            }}
            node={DeckEl}
            noGap
            sort={compare}
          />
        </div>
      )
    }

    function BottomActions() {
      return (
        <BottomButtons class="grid w-full max-w-xl grid-cols-2 gap-1 sm:grid-cols-3">
          <Action
            class="col-span-2 sm:col-auto"
            icon={faPlus}
            label="Create Deck"
            center
            onClick={createDeck}
          />
          <Action
            icon={faShareFromSquare}
            label="Shared"
            center
            onClick={nope}
          />
          <UploadButton
            accept="*/*"
            onUpload={async ([file]) => {
              await importDeck(worker, file, owner)
              reloadDecks()
            }}
          >
            {(trigger) => (
              <Action icon={faUpload} label="Import" center onClick={trigger} />
            )}
          </UploadButton>
        </BottomButtons>
      )
    }

    function DeckEl({
      data,
      subtree,
      key,
      parent,
    }: NodeProps<DeckHomeInfo | undefined, DeckHomeInfo>) {
      let buckets: Buckets = [0, 0, 0]
      if (data) {
        buckets = data.self
        buckets[0] += data.sub[0]
        buckets[1] += data.sub[1]
        buckets[2] += data.sub[2]
      }

      const name = parent.map((x) => x + "::") + key

      return (
        <button
          class={
            "text-z-subtitle xs:grid-cols-[auto,3rem,3rem,3rem] dhover:bg-z-body grid flex-1 grid-cols-[auto,3rem,3rem] items-baseline rounded-lg py-0.5 pl-8 pr-4 text-left sm:grid-cols-[auto,4rem,4rem,4rem]" +
            (subtree ? " -ml-6" : "")
          }
          onClick={() => {
            const root = data?.deck?.id ?? null

            const all: Id[] = []
            if (root != null) all.push(root)
            collectDeckIds(subtree)

            push(LAYER_STUDY, { worker, root, all })

            function collectDeckIds(subtree: DeckHomeTree | undefined) {
              if (subtree == null) return

              for (const value of Object.values(subtree)) {
                if (value.data?.deck) {
                  all.push(value.data.deck.id)
                }

                if (value.subtree) {
                  collectDeckIds(value.subtree)
                }
              }
            }
          }}
          onCtx={({ detail }) =>
            detail(() => (
              <>
                <ContextMenuItem
                  onClick={() => renameDeck(name, data?.deck?.id)}
                >
                  Rename deck
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => exportDeck(name, data?.deck?.id)}
                >
                  Export deck
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={async () => {
                    const cardsDeleted = await worker.post(
                      "deck_delete",
                      data?.deck?.id,
                      name,
                    )
                    toasts.create({
                      title: `Deleted ${cardsDeleted} card${cardsDeleted == 1 ? "" : "s"}`,
                      body: `Press ${shortcutToString({ key: "Z" })} to undo`,
                    })
                    reloadDecks()
                  }}
                >
                  Delete deck
                </ContextMenuItem>
              </>
            ))
          }
        >
          <p class="text-z">{key}</p>
          <p
            class="text-right font-mono text-sm"
            classList={{
              "text-[--z-text-learn-new]": buckets[0] != 0,
              "opacity-30": buckets[0] == 0,
            }}
          >
            {buckets[0]}
          </p>
          <p
            class="xs:hidden block text-right font-mono text-sm"
            classList={{
              "text-[--z-text-learn-review]": buckets[1] + buckets[2] != 0,
              "opacity-30": buckets[1] + buckets[2] == 0,
            }}
          >
            {buckets[1] + buckets[2]}
          </p>
          <p
            class="xs:block hidden text-right font-mono text-sm"
            classList={{
              "text-[--z-text-learn-learning]": buckets[1] != 0,
              "opacity-30": buckets[1] == 0,
            }}
          >
            {buckets[1]}
          </p>
          <p
            class="xs:block hidden text-right font-mono text-sm"
            classList={{
              "text-[--z-text-learn-review]": buckets[2] != 0,
              "opacity-30": buckets[2] == 0,
            }}
          >
            {buckets[2]}
          </p>
        </button>
      )
    }

    async function createDeck() {
      let nextName = (
        await prompt({
          owner,
          title: "Create deck",
          get description() {
            return (
              <ModalDescription>
                What would you like your deck to be called?
              </ModalDescription>
            )
          },
        })
      )?.trim()

      while (true) {
        if (!nextName) {
          return
        }

        if (await worker.post("deck_create", nextName)) {
          break
        }

        nextName = (
          await prompt({
            owner,
            title: "Create deck",
            get description() {
              return (
                <ModalDescription>
                  That name is already in use by an existing deck. Pick a
                  different name, or cancel the action.
                </ModalDescription>
              )
            },
            value: nextName,
          })
        )?.trim()
      }

      reloadDecks()
    }

    async function renameDeck(currentName: string, id?: Id) {
      let nextName = (
        await prompt({
          owner,
          title: "Rename deck",
          get description() {
            return (
              <ModalDescription>
                Type a new name for <ModalStrong>{currentName}</ModalStrong>.
              </ModalDescription>
            )
          },
          value: currentName,
        })
      )?.trim()

      while (true) {
        if (!nextName) {
          return
        }

        if (await worker.post("deck_rename", id ?? currentName, nextName)) {
          break
        }

        nextName = (
          await prompt({
            owner,
            title: "Rename deck",
            get description() {
              return (
                <ModalDescription>
                  That name is already in use by an existing deck. Type a
                  different name for <ModalStrong>{currentName}</ModalStrong>,
                  or cancel the action.
                </ModalDescription>
              )
            },
            value: currentName,
          })
        )?.trim()
      }

      reloadDecks()
    }

    async function exportDeck(currentName: string, id?: Id) {
      const props: ExportDecksProps = {
        includeConfs: false,
        includeMedia: true,
        includeRevLog: false,
        includeScheduling: false,
      }

      const result = await confirm({
        owner,
        title: "Export deck",
        get description() {
          return (
            <>
              <ModalDescription>
                Exporting a deck lets others import it into their own
                collections.
              </ModalDescription>

              <ModalCheckbox
                checked={props.includeConfs}
                onInput={(x) => (props.includeConfs = x)}
                children="Include deck presets?"
              />

              <ModalCheckbox
                checked={props.includeMedia}
                onInput={(x) => (props.includeMedia = x)}
                children="Include user media?"
              />

              <ModalCheckbox
                checked={props.includeRevLog}
                onInput={(x) => (props.includeRevLog = x)}
                children="Include review log?"
              />

              <ModalCheckbox
                checked={props.includeScheduling}
                onInput={(x) => (props.includeScheduling = x)}
                children="Include scheduling info?"
              />
            </>
          )
        },
        cancelText: "Cancel",
        okText: "Export",
      })

      if (!result) {
        return
      }

      const file = await worker.post("export_deck", id ?? currentName, props)
      download(file)
    }
  },
})
