import { createEventListener } from "@/lib/create-event-listener"
import { batch, createMemo, createSignal, For, type JSX } from "solid-js"
import { createStore, unwrap } from "solid-js/store"
import { Tr } from "./Table"

export type Selectable = ReturnType<typeof createSelectable>

export function createSelectable() {
  const [selected, setSelected] = createStore<Record<string, boolean>>({})
  const [anchor, setAnchor] = createSignal<string>()
  const [focus, setFocus] = createSignal<string>()
  const [selectDragged, setSelectDragged] = createSignal(true)

  return {
    selected,
    setSelected,
    anchor,
    setAnchor,
    focus,
    setFocus,
    selectDragged,
    setSelectDragged,
  }
}

export interface TbodyRef {
  savePreviousSelection(): void
  getSelected(): string[]
  el: HTMLTableSectionElement
}

/** Creates a `<tbody>` element with children `<tr>` elements. */
export function TbodySelectable<T>(props: {
  getId(item: T): string
  items: T[]
  data: Selectable
  children(item: T, selected: () => boolean): JSX.Element
  ref?(data: TbodyRef): void
}) {
  const {
    getId,
    data: {
      selected,
      setSelected,
      anchor,
      setAnchor,
      focus,
      setFocus,
      selectDragged,
      setSelectDragged,
    },
    children,
  } = props

  const [mousedown, setMousedown] = createSignal(false)

  const ids = createMemo(() => props.items.map(getId))
  const focusIndex = createMemo(() => {
    const sf = focus()
    if (sf == null) {
      return NaN
    } else {
      return ids().indexOf(sf)
    }
  })
  const anchorIndex = createMemo(() => {
    const sa = anchor()
    if (sa == null) {
      return NaN
    } else {
      return ids().indexOf(sa)
    }
  })

  createEventListener(window, "mouseup", () => setMousedown(false))

  return (
    <tbody
      ref={(el) => props.ref?.({ savePreviousSelection, getSelected, el })}
    >
      <For each={props.items}>
        {(item, index) => {
          const id = createMemo(() => getId(item))
          const isSelected = createMemo(() => {
            const sa = anchorIndex()
            const sf = focusIndex()
            const i = index()
            const inDragZone = sf < sa ? sf <= i && i <= sa : sf >= i && i >= sa
            return inDragZone ? selectDragged() : !!selected[id()]
          })
          return (
            <Tr
              selected={isSelected()}
              onMouseDown={(event) => {
                const isCtx =
                  event.button == 2 || (event.button == 0 && event.ctrlKey)
                if (isCtx) {
                  if (!isSelected()) {
                    setSelected((x) => {
                      return {
                        ...Object.fromEntries(
                          Object.keys(x).map((x) => [x, false]),
                        ),
                        [id()]: true,
                      }
                    })
                    setSelectDragged(true)
                    setFocus(id())
                    setAnchor(id())
                  }
                  return
                }
                if (event.shiftKey) {
                  if (anchor() == null) {
                    setAnchor(id())
                  }
                  setSelectDragged(true)
                } else {
                  if (event.ctrlKey || event.metaKey) {
                    savePreviousSelection()
                    setSelected(id().toString(), (x) => setSelectDragged(!x))
                  } else {
                    setSelected((x) => {
                      return {
                        ...Object.fromEntries(
                          Object.keys(x).map((x) => [x, false]),
                        ),
                        [id()]: true,
                      }
                    })
                    setSelectDragged(true)
                  }
                  setAnchor(id())
                }
                setMousedown(true)
                setFocus(id())
              }}
              onMouseOver={() => {
                if (mousedown()) {
                  setFocus(id())
                }
              }}
            >
              {children(item, isSelected)}
            </Tr>
          )
        }}
      </For>
    </tbody>
  )

  function savePreviousSelection() {
    batch(() => {
      let siLow = anchorIndex()
      let siHigh = focusIndex()
      if (siLow > siHigh) {
        ;[siLow, siHigh] = [siHigh, siLow]
      }
      setAnchor()
      setFocus()
      const value = selectDragged()
      setSelectDragged(false)
      if (isFinite(siLow) && isFinite(siHigh)) {
        const allIds = ids()
        const diff: Record<string, boolean> = {}
        for (let index = siLow; index <= siHigh; index++) {
          diff[allIds[index]!] = value
        }
        setSelected(diff)
      }
    })
  }

  function getSelected() {
    const output = structuredClone(unwrap(selected))

    let siLow = anchorIndex()
    let siHigh = focusIndex()
    if (siLow > siHigh) {
      ;[siLow, siHigh] = [siHigh, siLow]
    }
    const value = selectDragged()
    if (isFinite(siLow) && isFinite(siHigh)) {
      const allIds = ids()
      for (let index = siLow; index <= siHigh; index++) {
        output[allIds[index]!] = value
      }
    }

    return Object.entries(output)
      .filter((x) => x[1])
      .map((x) => x[0])
  }
}
