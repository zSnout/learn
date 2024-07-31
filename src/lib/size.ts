import { createEventListener } from "./create-event-listener"
import { createSignal, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"

export function createScreenSize() {
  if (typeof window == "undefined") {
    return { width: 0, height: 0 }
  }

  const [size, setSize] = createStore({
    width: innerWidth,
    height: innerHeight,
  })

  createEventListener(window, "resize", () => {
    setSize("width", innerWidth)
    setSize("height", innerHeight)
  })

  return size
}

export function createElementSize(el: () => HTMLElement) {
  const [size, setSize] = createStore({ width: 0, height: 0 })

  const observer = new ResizeObserver(() => {
    setSize("width", el().offsetWidth)
    setSize("height", el().offsetHeight)
  })

  onMount(() => observer.observe(el()))
  onCleanup(() => observer.disconnect())

  return size
}

export function createRemSize() {
  if (typeof document == "undefined") {
    return () => 16
  }

  const [size, setSize] = createSignal(
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  )

  const observer = new MutationObserver(([mutation]) => {
    if (
      mutation!.type === "attributes" &&
      mutation!.attributeName === "style"
    ) {
      setSize(parseFloat(getComputedStyle(document.documentElement).fontSize))
    }
  })

  onMount(() =>
    observer.observe(document.documentElement, { attributeFilter: ["style"] }),
  )
  onCleanup(() => observer.disconnect())

  return () => {
    const s = size()
    if (isNaN(s)) return 16
    return s
  }
}
