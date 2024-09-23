import { Checkbox } from "@/el/CheckboxGroup"
import { ContextMenuItem } from "@/el/ContextMenu"
import { defineLayer } from "@/el/DefineLayer"
import {
  ModalButtons,
  ModalCancel,
  ModalConfirm,
  ModalDescription,
  ModalSelect,
  ModalTitle,
  popup,
} from "@/el/Modal"
import { Table, Td, Th } from "@/el/Table"
import {
  createSelectable,
  TbodySelectable,
  type TbodyRef,
} from "@/el/TbodySelectable"
import { download } from "@/lib/download"
import { createExpr } from "@/lib/expr"
import { Id, idOf } from "@/lib/id"
import { createPrefsStore } from "@/lib/prefs"
import { Unmain } from "@/lib/Prose"
import { BrowserColumn } from "@/lib/types"
import { For, untrack, type JSX } from "solid-js"
import { Worker } from "../db"

// TODO: warn on non-unique sort fields

export default defineLayer({
  init(_: Worker) {
    return createSelectable()
  },
  async load({ props: worker }) {
    const data = await worker.post("browse_load")
    const [prefs, setPrefs, ready] = createPrefsStore(worker)
    await ready
    const [sorted, reloadSorted] = createExpr(() => data.cards)
    return [data, { prefs, setPrefs, sorted, reloadSorted }] as const
  },
  render({
    owner,
    props: worker,
    data: [, { prefs, setPrefs, sorted, reloadSorted }],
    state: data,
  }) {
    let tbody!: TbodyRef

    return (
      <div class="-my-8">
        <Unmain class="flex h-[calc(100dvh_-_3rem)]">
          <div class="flex h-[calc(100dvh_-_3rem)] w-full">
            <Sidebar />
            <Table onCtx={({ detail }) => detail(GridContextMenu)}>
              <Thead />
              <TbodySelectable
                getId={(item) => item.card.id.toString()}
                data={data}
                items={sorted()}
                ref={(el) => (tbody = el)}
              >
                {(data, selected) => (
                  <For each={prefs.browser.active_cols}>
                    {(x) => <Td selected={selected()}>{data.columns[x]}</Td>}
                  </For>
                )}
              </TbodySelectable>
            </Table>
          </div>
        </Unmain>
      </div>
    )

    function Sidebar() {
      return (
        <div class="flex h-full w-56 flex-col gap-1 overflow-auto border-r border-z p-2">
          <For each={BrowserColumn.options}>
            {(name) => (
              <label class="flex w-full gap-2">
                <Checkbox
                  checked={prefs.browser.active_cols.includes(name)}
                  onInput={(v) => {
                    const cols = prefs.browser.active_cols

                    if (v) {
                      if (cols.includes(name)) return
                      setPrefs(`Toggle ${name} column visibility in browser`)(
                        "browser",
                        "active_cols",
                        (x: BrowserColumn[]) => x.concat(name),
                      )
                    } else {
                      const idx = cols.indexOf(name)
                      if (idx == -1) return
                      setPrefs(`Toggle ${name} column visibility in browser`)(
                        "browser",
                        "active_cols",
                        (x: BrowserColumn[]) => x.slice().splice(idx, 1),
                      )
                    }
                  }}
                />

                <p>{name}</p>
              </label>
            )}
          </For>
        </div>
      )
    }
    function GridContextMenu(): JSX.Element {
      return (
        <>
          <ContextMenuItem
            onClick={() => {
              const cids = tbody.getSelected()
              worker.post("browse_due_date_set", cids.map(idOf), Date.now())
            }}
          >
            Make due now
          </ContextMenuItem>
          <ContextMenuItem onClick={exportSelected}>
            Export selected cards
          </ContextMenuItem>
          <ContextMenuItem onClick={moveSelected}>
            Move selected cards
          </ContextMenuItem>
        </>
      )
    }

    function Thead() {
      return (
        <thead>
          <tr>
            <For each={prefs.browser.active_cols}>
              {(x) => (
                <Th
                  onClick={() => {
                    tbody.savePreviousSelection()
                    untrack(sorted).sort((ad, bd) => {
                      const a = ad.columns[x]
                      const b = bd.columns[x]

                      // nulls first
                      if (a == null && b == null) return 0
                      if (a == null) return -1
                      if (b == null) return 1

                      // then numbers
                      if (typeof a == "number" && typeof b == "number") {
                        return a - b
                      }
                      if (typeof a == "number") return -1
                      if (typeof b == "number") return 1

                      // then text
                      const al = a.toLowerCase()
                      const bl = b.toLowerCase()
                      if (al < bl) return -1
                      if (al > bl) return 1
                      if (a < b) return -1
                      if (a > b) return 1

                      // then give up
                      return 0
                    })
                    reloadSorted()
                  }}
                >
                  {x}
                </Th>
              )}
            </For>
          </tr>
        </thead>
      )
    }

    async function exportSelected() {
      const cids = tbody.getSelected().map(idOf)
      let format: "csv" | "json" | "txt" = "csv"
      const willContinue = await popup<boolean>({
        owner,
        onCancel: false,
        children(close) {
          return (
            <>
              <ModalTitle>Export selected cards</ModalTitle>
              <ModalDescription>
                How do you want to export the cards?
              </ModalDescription>
              <ModalSelect
                autofocus
                value={format}
                onInput={(x) => (format = x.currentTarget.value as any)}
              >
                <option value="csv">CSV (for Excel or Sheets)</option>
                <option value="json">JSON (for programmers)</option>
                <option value="text">Plain Text</option>
              </ModalSelect>
              <ModalButtons>
                <ModalCancel onClick={() => close(false)}>Cancel</ModalCancel>
                <ModalConfirm onClick={() => close(true)}>Export</ModalConfirm>
              </ModalButtons>
            </>
          )
        },
      })
      if (!willContinue) {
        return
      }
      const file = await worker.post("export_cards", cids, format)
      download(file)
    }

    async function moveSelected() {
      const cids = tbody.getSelected().map(idOf)
      const decks = await worker.post("browse_get_deck_ids")
      const did = await popup<Id | null>({
        owner,
        onCancel(close) {
          close(null)
        },
        children(close) {
          let did = decks
            .slice(1)
            .reduce((a, [b]) => (a < b ? a : b), decks[0]![0])

          return (
            <>
              <ModalTitle>Move selected cards</ModalTitle>
              <ModalDescription>
                Where do you want to move the cards?
              </ModalDescription>
              <ModalSelect
                autofocus
                value={"" + did}
                onInput={(x) => (did = +x.currentTarget.value as Id)}
              >
                <For each={decks}>
                  {([id, name]) => <option value={id}>{name}</option>}
                </For>
              </ModalSelect>
              <ModalButtons>
                <ModalCancel onClick={() => close(null)}>Cancel</ModalCancel>
                <ModalConfirm onClick={() => close(did)}>Move</ModalConfirm>
              </ModalButtons>
            </>
          )
        },
      })
      if (did == null) {
        return
      }
      const deck = decks.find((x) => x[0] === did)
      if (!deck) {
        return
      }
      await worker.post("browse_move_cards", cids, did, deck[1])
    }
  },
})
