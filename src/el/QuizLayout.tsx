import {
  shortcutToString,
  type Shortcut,
  type ShortcutManager,
} from "@/lib/shortcuts"
import {
  faClose,
  faDownload,
  faExclamationTriangle,
  faNavicon,
  faUpload,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import {
  For,
  Show,
  createMemo,
  createSignal,
  onMount,
  type JSX,
} from "solid-js"
import { Fa } from "./Fa"

export function ContentAction(props: { icon: IconDefinition; title: string }) {
  return (
    <span class="z-field -my-4 inline-flex overflow-clip p-1 align-middle">
      <span class="flex h-5 w-5 items-center justify-center">
        <Fa class="h-4 w-4" icon={props.icon} title={props.title} />
      </span>
    </span>
  )
}

export function ContentGuide(props: {
  title: JSX.Element
  children: JSX.Element
}) {
  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center gap-4">
      <h1 class="text-z-heading text-2xl font-semibold">{props.title}</h1>
      <div class="flex w-full max-w-[30rem] flex-col gap-4">
        {props.children}
      </div>
    </div>
  )
}

export function ContentIcon(props: {
  children: JSX.Element
  icon: IconDefinition
  title: string
}) {
  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center gap-4">
      <Fa class="size-12" icon={props.icon} title={props.title} />
      <p class="text-center">{props.children}</p>
    </div>
  )
}

export function ContentError(props: { children: JSX.Element }) {
  return (
    <ContentIcon icon={faExclamationTriangle} title="error">
      {props.children}
    </ContentIcon>
  )
}

export function ContentNoScript() {
  return (
    <ContentError>
      JavaScript is disabled.
      <br />
      Please enable it to continue.
    </ContentError>
  )
}

export function ContentNoCards() {
  return (
    <ContentError>
      You have no decks selected.
      <br />
      Select some from the sidebar to continue.
    </ContentError>
  )
}

export function ContentNoneLeft() {
  return (
    <ContentError>
      You have no cards left to pick.
      <br />
      Select more decks from the sidebar to continue.
      <br />
      Alternatively, wait until your reviews are ready.
    </ContentError>
  )
}

export function ContentCard(props: {
  source: readonly string[] | false
  front: JSX.Element
  back?: JSX.Element
  fullFront?: boolean
}) {
  return (
    <div class="@container flex w-full max-w-full flex-1 flex-col gap-4">
      <Show when={props.source !== false}>
        <div class="text-z-subtitle font-mono text-sm/[1] lowercase">
          <For each={props.source}>
            {(item, index) => (
              <Show fallback={item} when={index() != 0}>
                {" "}
                / {item}
              </Show>
            )}
          </For>
        </div>
      </Show>

      <div
        class="text-z-heading @sm:text-7xl @md:text-8xl @lg:text-9xl max-w-full flex-col hyphens-auto text-center text-6xl font-semibold"
        classList={{ "flex-1": props.fullFront, flex: props.fullFront }}
      >
        {props.front}
      </div>

      <Show when={props.back}>
        <hr class="border-z" />

        <div class="@sm:text-4xl @md:text-5xl @lg:text-6xl max-w-full hyphens-auto text-center text-3xl">
          {props.back}
        </div>
      </Show>
    </div>
  )
}

export function ResponsesSingleLink(props: {
  children: JSX.Element
  href: string
}) {
  return (
    <a
      class="bg-z-body-selected flex h-12 w-full items-center justify-center rounded py-2"
      href={props.href}
    >
      {props.children}
    </a>
  )
}

export function ResponseGray(props: {
  children: JSX.Element
  onClick?: () => void
  onMouseDown?: () => void
}) {
  return (
    <button
      class="hover:border-z hover:focus:border-z-focus hover:bg-z-body bg-z-body-selected z-field relative h-12 w-full rounded border-transparent px-0 py-1 shadow-none"
      onClick={() => {
        props.onClick?.()
      }}
      ontouchstart={() => {}}
      ontouchend={() => {}}
      ontouchcancel={() => {}}
      ontouchmove={() => {}}
    >
      {props.children}
    </button>
  )
}

export function Response(props: {
  class: string
  children: JSX.Element
  onClick?: () => void
}) {
  return (
    <button
      class={"relative rounded py-1 " + props.class}
      onClick={() => props.onClick?.()}
    >
      {props.children}
    </button>
  )
}

export function ResponsesGrid(props: {
  class: `grid-cols-${1 | 2 | 3 | 4 | 5 | 6}`
  children: JSX.Element
}) {
  return (
    <div class={"grid gap-1 text-base/[1.25] md:gap-2 " + props.class}>
      {props.children}
    </div>
  )
}

export function ActionGeneric(props: {
  onClick?: (
    event: MouseEvent & {
      currentTarget: HTMLButtonElement
      target: Element
    },
  ) => void
  icon: IconDefinition
  title: string
}) {
  return (
    <>
      <button
        class="z-field overflow-clip p-1 active:translate-y-0 md:translate-x-[min(0px,-50vw_+_512px+1rem)]"
        onClick={(event) => props.onClick?.(event)}
      >
        <div class="flex h-6 w-6 items-center justify-center">
          <Fa class="h-5 w-5" icon={props.icon} title={props.title} />
        </div>
      </button>
    </>
  )
}

export function ActionExport(props: { file: () => File; title?: string }) {
  return (
    <button
      class="z-field overflow-clip p-1 active:translate-y-0 md:translate-x-[min(0px,-50vw_+_512px+1rem)]"
      onClick={() => {
        const file = props.file()
        const url = URL.createObjectURL(file)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
      }}
      title={props.title || "download application data"}
    >
      <div class="flex h-6 w-6 items-center justify-center">
        <Fa
          class="h-5 w-5"
          icon={faDownload}
          title={props.title || "download application data"}
        />
      </div>
    </button>
  )
}

export function ActionImport(props: {
  receive: (file: File) => void
  title?: string
}) {
  return (
    <>
      <input
        class="sr-only"
        type="file"
        accept="application/json"
        onInput={(event) => {
          const f = event.currentTarget.files?.[0]
          if (!f) {
            return
          }
          event.currentTarget.value = ""
          props.receive(f)
        }}
      />

      <button
        class="z-field overflow-clip p-1 active:translate-y-0 md:translate-x-[min(0px,-50vw_+_512px+1rem)]"
        onClick={(event) => {
          const i = event.currentTarget.previousElementSibling
          if (!(i instanceof HTMLInputElement)) {
            return
          }
          i.value = ""
          i.click()
        }}
        title={props.title || "upload application data"}
      >
        <div class="flex h-6 w-6 items-center justify-center">
          <Fa
            class="h-5 w-5"
            icon={faUpload}
            title={props.title || "upload application data"}
          />
        </div>
      </button>
    </>
  )
}

export function SidebarStickyLabelAction(props: {
  icon: IconDefinition
  onClick?: () => void
  title: string
}) {
  return (
    <button
      class="ml-2 inline-flex h-4 w-4 items-center justify-center rounded bg-red-500"
      onClick={() => props.onClick?.()}
    >
      <Fa class="icon-white h-3 w-3" icon={props.icon} title={props.title} />
    </button>
  )
}

export function SidebarStickyLabel(props: { children: JSX.Element }) {
  return (
    <div class="bg-z-body absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center whitespace-nowrap px-2 text-sm/[1]">
      {props.children}
    </div>
  )
}

export function SidebarSticky(props: { children: JSX.Element }) {
  return (
    <div class="sticky -bottom-8 -mb-8 max-h-[min(24rem,50%)] w-full text-sm">
      <div class="to-z-bg-body h-4 w-full bg-gradient-to-b from-transparent" />

      <div class="bg-z-body h-2 w-full" />

      <div class="border-z bg-z-body relative border-t pt-[0.546875rem] sm:pb-0">
        {props.children}
      </div>
    </div>
  )
}

export function ShortcutLabel(props: {
  key: Shortcut
  shortcuts: ShortcutManager
}) {
  const key = createMemo(() => {
    const k = props.key
    if (typeof k == "string") {
      return k
    } else {
      return shortcutToString(k)
    }
  })

  let el: HTMLElement

  props.shortcuts.scoped(props.key, () => el?.click())

  return (
    <kbd
      class="xs:block absolute bottom-0 right-1 hidden text-sm"
      title={`Shortcut: key ${key()}`}
      ref={el!}
    >
      {key()}
    </kbd>
  )
}

export type SidebarState = "auto" | "open" | "closed"

export function Full(props: {
  /** The main content, such as a quiz question. */
  content: JSX.Element

  /** The responses given by a user. */
  responses: JSX.Element

  /** The content of the sidebar. */
  sidebar: JSX.Element

  /** Quick actions such as saving data available in the sidebar. */
  actions?: JSX.Element

  /** Whether the element is in a layer. */
  layer?: boolean

  /** Initial value of sidebar state. */
  sidebarState?: SidebarState

  /** Called whenever the sidebar state is changed. */
  onSidebarState?: (state: SidebarState) => void
}) {
  const width = (() => {
    const [width, setWidth] = createSignal(1024)
    onMount(() => {
      addEventListener("resize", () => {
        setWidth(innerWidth)
      })
      setWidth(innerWidth)
    })
    return width
  })()

  const [sidebarState, rawSetSidebarState] = createSignal(
    props.sidebarState ?? "auto",
  )

  const setSidebarState = function (this: any) {
    const retval = rawSetSidebarState.apply(this, arguments as never)
    props.onSidebarState?.(retval)
    return retval
  } as typeof rawSetSidebarState

  const sidebarOpen = createMemo(() => {
    if (width() < 640) {
      return sidebarState() == "open"
    } else {
      return sidebarState() != "closed"
    }
  })

  function toggleSidebar() {
    const open = sidebarOpen()
    const small = width() < 640

    if (small) {
      if (open) {
        setSidebarState("auto")
      } else {
        setSidebarState("open")
      }
    } else {
      if (open) {
        setSidebarState("closed")
      } else {
        setSidebarState("auto")
      }
    }
  }

  function hideSidebar() {
    const small = width() < 640

    if (small) {
      setSidebarState("auto")
    } else {
      setSidebarState("closed")
    }
  }

  return (
    <>
      <div
        class={
          props.layer ?
            sidebarOpen() && width() >= 640 ?
              // TODO: this defn doesnt work on mobile
              "grid flex-1 grid-cols-[auto,19.5rem] transition-[grid-template-columns]"
            : "grid flex-1 grid-cols-[auto,0] transition-[grid-template-columns]"

          : "flex flex-1 items-start"
        }
      >
        <div class="flex h-full w-full flex-1 flex-col items-start">
          {props.content}

          <div
            class="sticky bottom-0 flex w-full flex-col"
            classList={{
              "-mb-8": !props.layer,
              "pb-8": !props.layer,
            }}
          >
            <div class="to-z-bg-body h-4 w-full bg-gradient-to-b from-transparent" />

            <div class="bg-z-body -mb-8 w-full pb-8 text-center">
              {props.responses}
            </div>
          </div>
        </div>

        <div
          class="fixed right-4 z-10 flex flex-col gap-2"
          classList={{
            "top-16": !props.layer,
            "top-4": props.layer,
          }}
        >
          <button
            class="z-field overflow-clip p-1 active:translate-y-0 md:translate-x-[min(0px,-50vw_+_512px+1rem)]"
            onClick={toggleSidebar}
          >
            <div class="relative h-6 w-6">
              <div
                class="absolute left-0 top-0 transition"
                classList={{
                  "translate-x-[125%]": !sidebarOpen(),
                  "translate-x-0": sidebarOpen(),
                }}
              >
                <Fa class="h-6 w-6" icon={faClose} title="close sidebar" />
              </div>

              <div
                class="absolute left-0 top-0 transition"
                classList={{
                  "translate-x-0": !sidebarOpen(),
                  "-translate-x-[125%]": sidebarOpen(),
                }}
              >
                <Fa class="h-6 w-6" icon={faNavicon} title="open sidebar" />
              </div>
            </div>
          </button>

          <div
            class="flex flex-col gap-2 transition"
            classList={{
              "translate-x-14": !sidebarOpen(),
              "opacity-0": !sidebarOpen(),
            }}
            aria-hidden={!sidebarOpen()}
            inert={!sidebarOpen()}
          >
            {props.actions}
          </div>
        </div>

        <div
          class="fixed left-0 top-0 h-full w-full translate-x-0 overflow-clip transition-[transform,width,backdrop-filter,background-color] sm:pointer-events-auto sm:sticky sm:top-20 sm:-mb-16 sm:flex sm:h-[calc(100%_+_4rem)] sm:max-h-[calc(100dvh_-_3rem)] sm:w-[19.5rem] sm:-translate-y-8 sm:translate-x-6 sm:bg-transparent sm:backdrop-filter-none"
          classList={{
            "backdrop-blur-sm": sidebarOpen(),
            "backdrop-blur-0": !sidebarOpen(),
            "bg-z-body-partial": sidebarOpen(),
            "pointer-events-none": !sidebarOpen(),
            "sm:!w-0": !sidebarOpen(),
            "sm:!translate-x-[21rem]": !sidebarOpen(),
          }}
          onClick={(event) => {
            if (event.currentTarget == event.target && event.offsetY > 48) {
              hideSidebar()
            }
          }}
          aria-hidden={!sidebarOpen()}
          inert={!sidebarOpen()}
        >
          <div
            class="border-z fixed bottom-8 right-0 flex w-[19.5rem] flex-col overflow-y-auto border-l px-4 py-10 sm:translate-x-0"
            classList={{
              "translate-x-0": sidebarOpen(),
              "translate-x-full": !sidebarOpen(),
              "top-8": !props.layer,
              "top-0": props.layer,
              "sm:top-8": props.layer,
            }}
          />

          <div
            class="bg-z-body xs:w-[19.5rem] xs:border-z fixed bottom-0 right-0 flex w-full flex-col items-start overflow-y-auto border-l border-transparent px-4 py-8 transition sm:top-0 sm:w-[19.5rem] sm:translate-x-0 sm:border-transparent sm:bg-transparent sm:transition-none"
            classList={{
              "translate-x-0": sidebarOpen(),
              "translate-x-full": !sidebarOpen(),
              "top-12": !props.layer,
              "top-0": props.layer,
            }}
          >
            {props.sidebar}
          </div>
        </div>
      </div>
    </>
  )
}
