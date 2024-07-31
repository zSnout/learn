import { createSignal, runWithOwner, Show, type Owner } from "solid-js"
import { Portal } from "solid-js/web"
import { registerSW } from "virtual:pwa-register"

let registered = false

export function register(owner: Owner | null) {
  if (registered) {
    return
  }

  registered = true

  const intervalMS = 60 * 60 * 1000

  registerSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        setInterval(async () => {
          if (r.installing || !navigator) return

          if ("connection" in navigator && !navigator.onLine) return

          const resp = await fetch(swUrl, {
            cache: "no-store",
            headers: {
              cache: "no-store",
              "cache-control": "no-cache",
            },
          })

          if (resp?.status === 200) await r.update()
        }, intervalMS)
      }
    },
    onOfflineReady() {
      const [open, setOpen] = createSignal(true)

      runWithOwner(owner, () => (
        <Show when={open()}>
          <Portal>
            <div class="border-z bg-z-body text-z fixed bottom-2 right-2 flex w-96 max-w-[calc(100vw_-_1rem)] gap-1 rounded-lg border py-2 pl-3 pr-2 shadow-lg">
              <div class="flex flex-1 flex-col">
                <p class="text-z-heading font-semibold">Offline ready</p>
                <p class="text-z-subtitle text-sm">
                  You can now use all features of this application without an
                  internet connection. You'll still get automatic updates.
                </p>
                <button
                  class="z-field text-z bg-z-field-selected hover:bg-z-body hover:border-z ml-auto rounded-md border-transparent bg-transparent px-2 py-1 text-sm shadow-none"
                  onClick={() => setOpen(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </Portal>
        </Show>
      ))
    },
  })
}
