import { createSignal, onMount, untrack, type Signal } from "solid-js"

export function createStorage(
  key: string,
  defaultValue: string,
  delay?: boolean | "directmount",
): Signal<string> {
  const realKey = `z8:${key}`

  const [get, set] = createSignal(
    !delay && typeof localStorage != "undefined" ?
      (localStorage.getItem(realKey) ?? defaultValue)
    : defaultValue,
  )

  if (delay == "directmount") {
    onMount(() => {
      set(localStorage.getItem(realKey) ?? defaultValue)
    })
  } else if (delay) {
    onMount(() => {
      setTimeout(() => {
        set(localStorage.getItem(realKey) ?? defaultValue)
      })
    })
  }

  if (typeof localStorage != "undefined" && typeof window != "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.storageArea == localStorage && event.key == realKey) {
        set(event.newValue ?? defaultValue)
      }
    })
  }

  return [
    get,
    (value: string | ((x: string) => string)) => {
      if (typeof value == "function") {
        const next = value(untrack(get))
        localStorage.setItem(realKey, next)
        set(next)
        return next as any
      } else {
        localStorage.setItem(realKey, value)
        set(value)
        return value as any
      }
    },
  ]
}

export function createStorageBoolean(
  key: string,
  defaultValue: boolean,
  delay?: boolean,
): Signal<boolean> {
  const [get, set] = createStorage(key, "" + defaultValue, delay)

  return [
    () => get() == "true",
    (value) => {
      if (typeof value == "function") {
        return set((x) => "" + value(x == "true"))
      } else {
        return set("" + value)
      }
    },
  ]
}
