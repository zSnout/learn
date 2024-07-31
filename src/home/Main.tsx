import { Error } from "@/el/Error"
import { Layers, useLayers } from "@/el/Layers"
import { Toasts, useToasts } from "@/el/Toast"
import { createEventListener } from "@/lib/create-event-listener"
import type { Reason } from "@/lib/reason"
import { error, type Result } from "@/lib/result"
import { ShortcutManager } from "@/lib/shortcuts"
import { createSignal, JSX, onMount, Show, untrack } from "solid-js"
import { Worker } from "../db"
import { ZID_BEFORE_UNDO, type UndoType } from "../shared"
import type { UndoMeta } from "../worker/lib/undo"
import { ROOT_LAYER_HOME } from "./Home"

function ErrorHandler(props: { children: JSX.Element }) {
  const [reason, setError] = createSignal<unknown>()

  createEventListener(window, "unhandledrejection", (event) => {
    setError(event.reason)
  })

  createEventListener(window, "error", (event) => {
    setError(event.error)
  })

  return (
    <>
      {props.children}

      <Show when={reason() != null}>
        <Error message={error(reason()).reason} onClose={() => setError()} />
      </Show>
    </>
  )
}

function CoreApplicationShortcuts(worker: Worker) {
  const toasts = useToasts()
  const layers = useLayers()
  const shortcuts = new ShortcutManager()

  shortcuts.scoped({ key: "Escape" }, escapeFn, true)

  shortcuts.scoped({ key: "Z", shift: false }, undoFn("undo"))
  shortcuts.scoped({ key: "Z", mod: "macctrl", shift: false }, undoFn("undo"))
  shortcuts.scoped({ key: "Z", shift: true }, undoFn("redo"))
  shortcuts.scoped({ key: "Z", mod: "macctrl", shift: true }, undoFn("redo"))
  shortcuts.scoped({ key: "Y" }, undoFn("redo"))
  shortcuts.scoped({ key: "Y", mod: "macctrl" }, undoFn("redo"))

  return ROOT_LAYER_HOME(worker)

  function escapeFn() {
    let dialog
    if (
      (document.activeElement instanceof HTMLElement ||
        document.activeElement instanceof SVGElement) &&
      document.activeElement != document.body
    ) {
      document.activeElement.blur()
    } else if (
      (dialog = document.querySelector<HTMLDialogElement>("dialog[open]"))
    ) {
      dialog.dispatchEvent(new Event("cancel"))
    } else if (document.activeElement == document.body) {
      layers.popLatest()
    }
  }

  function undoFn(type: UndoType) {
    return async () => {
      const meta: UndoMeta = {}
      worker.triggerMain({ zid: ZID_BEFORE_UNDO, meta })
      const [state, setState] = createSignal<Result<Reason | null>>()
      toasts.create({
        // TODO: custom toast when nothing is left in undo stack
        get title() {
          const s = state()
          return (
            s ?
              s.ok ?
                `${type == "undo" ? "Undid" : "Redid"} action`
              : `Failed ${type}`
            : `${type == "undo" ? "Undoing" : "Redoing"} action...`
          )
        },
        get body() {
          const s = state()
          return (
            s ?
              s.ok ?
                (s.value ?? "Action unknown")
              : s.reason
            : "Loading..."
          )
        },
      })
      setState(await worker.post("undo", type, meta))
    }
  }
}

export function Main() {
  onMount(() => {
    document.getElementById("needsjavascript")?.remove()
  })

  const worker = new Worker()

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(
      import.meta.env.MODE === "production" ?
        "/service-worker.js"
      : "/dev-sw.js?dev-sw",
      { type: "module" },
    )
  }

  return (
    <ErrorHandler>
      <Toasts.Root>
        {untrack(() => Layers.Root(CoreApplicationShortcuts, worker))}
      </Toasts.Root>
    </ErrorHandler>
  )
}
