import type { CtxCreateMenu } from "@/env"
import { createEventListener } from "@/lib/create-event-listener"
import { randomId } from "@/lib/id"
import { createElementSize, createRemSize, createScreenSize } from "@/lib/size"
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  type JSX,
} from "solid-js"
import { Dynamic, Portal } from "solid-js/web"

export function ContextMenu(props: {
  x: number
  y: number
  active: boolean
  children: JSX.Element
}) {
  const window = createScreenSize()
  let el!: HTMLDivElement
  const menu = createElementSize(() => el)
  const rem = createRemSize()
  const pos = createMemo(() => {
    const padding = rem() / 2
    const shouldBeOnLeftSide = props.x > window.width - (padding + menu.width)
    return {
      left:
        Math.max(
          padding,
          Math.min(
            window.width - padding - menu.width,
            shouldBeOnLeftSide ? props.x - menu.width : props.x,
          ),
        ) + "px",
      top:
        Math.max(
          padding,
          Math.min(window.height - padding - menu.height, props.y),
        ) + "px",
    }
  })

  const id = randomId().toString()
  createEffect(() => {
    if (props.active) {
      document.documentElement.classList.add("z-ctxmenu")
      document.documentElement.dataset.ctxmenu = id
    } else {
      if (document.documentElement.dataset.ctxmenu == id) {
        document.documentElement.classList.remove("z-ctxmenu")
        delete document.documentElement.dataset.ctxmenu
      }
    }
  })

  return (
    <div
      class="border-z bg-z-body fixed z-[60] flex max-h-[calc(100dvh_-_1rem)] w-56 max-w-[calc(100dvw_-_1rem)] select-none flex-col overflow-y-auto rounded-lg border p-1 opacity-0 shadow-lg"
      classList={{
        "opacity-100": props.active,
        transition: !props.active,
        "pointer-events-none": !props.active,
      }}
      style={pos()}
      ref={el!}
      inert={!props.active}
      onMouseDown={(event) => event.stopImmediatePropagation()}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopImmediatePropagation()
      }}
    >
      {props.children}
    </div>
  )
}

export function ContextMenuItem(props: {
  children: JSX.Element
  onClick: () => void
}) {
  return (
    <div
      class="text-z hover:bg-z-body-selected rounded px-2"
      onClick={() => props.onClick?.()}
      onContextMenu={() => props.onClick?.()}
    >
      {props.children}
    </div>
  )
}

export function ContextMenuLine() {
  return <hr class="border-z mx-1 my-1 border-0 border-t" />
}

export function ContextMenuTrigger(props: { children?: JSX.Element }) {
  const [x, setX] = createSignal(50)
  const [y, setY] = createSignal(50)
  const [active, setActive] = createSignal(false)
  const [content, setContent] = createSignal<(() => JSX.Element)[]>([])

  if (typeof document != "undefined") {
    createEventListener(document, "contextmenu", (event) => {
      for (const el of document.querySelectorAll(".ctx")) {
        el.classList.remove("ctx")
      }

      const menus: (() => JSX.Element)[] = []
      const findCtxEvent = new CustomEvent<CtxCreateMenu>("ctx", {
        detail(m) {
          menus.push(m)
        },
        bubbles: true,
      })
      event.target?.dispatchEvent(findCtxEvent)
      if (!menus.length) {
        setActive(false)
        return
      }

      setContent(menus)

      event
        .composedPath()
        .filter((x) => x instanceof Element)
        .map((x) => x.classList.add("ctx"))

      event.preventDefault()
      setX(event.clientX)
      setY(event.clientY)
      setActive(true)
    })

    createEventListener(document, "mousedown", () => {
      for (const el of document.querySelectorAll(".ctx")) {
        el.classList.remove("ctx")
      }

      setActive(false)
    })

    createEventListener(document, "click", () => {
      for (const el of document.querySelectorAll(".ctx")) {
        el.classList.remove("ctx")
      }

      setActive(false)
    })
  }

  return (
    <Portal>
      <ContextMenu x={x()} y={y()} active={active()}>
        <For each={content()}>
          {(items, index) => (
            <>
              <Show when={index() != 0}>
                <ContextMenuLine />
              </Show>
              <Dynamic component={items} />
            </>
          )}
        </For>
        <Show when={props.children}>
          <Show when={content().length}>
            <ContextMenuLine />
          </Show>
          {props.children}
        </Show>
      </ContextMenu>
    </Portal>
  )
}

// TODO: context menus everywhere
