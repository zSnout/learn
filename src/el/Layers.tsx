import {
  createContext,
  createSignal,
  getOwner,
  JSX,
  type Owner,
  runWithOwner,
  Show,
  useContext,
} from "solid-js"

const LayerContext = createContext<Layers>()

export function useLayers() {
  const context = useContext(LayerContext)
  if (context == null) {
    throw new Error("`useLayers` can only be used in a `Layers.Root` scope")
  }
  return context
}

export type LayerInfo = [
  /** The element containing the actual layer. */
  layer: HTMLDivElement,

  /** The previously focused element. */
  previouslyFocused: Element | null,

  /** A function to call if this layer is forcibly removed. */
  onForcePop: ForcePopHandler,

  /** A function to call if the layer immediately above this one is removed. */
  onReturn: ReturnHandler,

  /** A function which unmounts the inner component. */
  unmount: () => void,
]

export class Layers {
  static Root<T>(root: RootLayerable<T>, props: T) {
    const layers = new Layers(getOwner())

    function Inner() {
      const { el, onReturn } = root(props)
      layers.onRootReturn = onReturn
      return el
    }

    return (
      <LayerContext.Provider value={layers}>
        <div class="relative flex min-h-full w-full">
          <div
            class="z-layer-root flex min-h-full w-full transform flex-col opacity-100 transition"
            ref={(el) => (layers.root = el)}
          >
            <Inner />
          </div>
        </div>
      </LayerContext.Provider>
    )
  }

  constructor(private owner: Owner | null) {}

  private root!: HTMLDivElement
  private onRootReturn!: ReturnHandler
  private layers: LayerInfo[] = []

  push<T>(fn: Layerable<T>, props: T) {
    const prev = this.layers[this.layers.length - 1]?.[0] ?? this.root
    const idx = this.layers.length
    const pop = () => {
      this.pop(idx)
    }

    const previouslyFocused = document.activeElement

    let onForcePop!: ForcePopHandler
    let onReturn!: ReturnHandler
    function Inner() {
      const output = fn(props, pop)
      const fp = output.onForcePop
      onForcePop = async () => {
        const retval = await fp()
        return retval
      }
      onReturn = output.onReturn
      return output.el
    }

    const next = runWithOwner(this.owner, () => {
      const [shown, setShown] = createSignal(true)

      const el = (
        <LayerContext.Provider value={this}>
          <Show when={shown()}>
            <Inner />
          </Show>
        </LayerContext.Provider>
      )

      const next = (
        <div
          class="bg-z-body-partial fixed bottom-0 left-0 right-0 top-12 flex translate-x-16 transform flex-col overflow-y-auto px-6 py-8 opacity-0 transition [.z-ctxmenu_&]:overflow-hidden"
          ref={(el) => {
            this.layers.push([
              el,
              previouslyFocused,
              onForcePop,
              onReturn,
              () => {
                setShown(false)
              },
            ])
            setTimeout(() => animateIn(prev, el))
          }}
        >
          <div class="mx-auto w-full max-w-5xl flex-1">{el}</div>
        </div>
      ) as HTMLDivElement

      return next
    })!

    prev.inert = true
    prev.after(next)
  }

  private pop(idx: number): boolean {
    const prev = this.layers[idx - 1]?.[0] ?? this.root
    const onReturn = this.layers[idx - 1]?.[3] ?? this.onRootReturn
    const current = this.layers[idx]
    if (!current) {
      return false
    }
    const [next, previouslyFocused] = current
    for (const [el] of this.layers.splice(idx + 1, Infinity)) {
      el.remove()
    }
    this.layers.splice(idx, 1)
    animateOut(prev, next, current[4])
    onReturn()
    if (
      previouslyFocused instanceof HTMLElement ||
      previouslyFocused instanceof SVGElement
    ) {
      previouslyFocused.focus()
    }
    return true
  }

  popLatest() {
    if (this.layers.length) {
      this.pop(this.layers.length - 1)
    }
  }

  async forcePopAll() {
    for (let index = this.layers.length - 1; index >= 0; index--) {
      const data = this.layers[index]
      if (!data) {
        return
      }

      const [, , onForcePop] = data

      if (!(await onForcePop())) {
        return
      }

      this.pop(index)
    }
  }
}

function animateIn(prev: HTMLDivElement, next: HTMLDivElement) {
  prev.classList.add("blur-lg")
  prev.classList.remove("opacity-100")
  prev.classList.add("opacity-0")
  prev.classList.remove("translate-x-0")
  prev.classList.remove("translate-x-16")
  prev.classList.add("-translate-x-16")
  prev.classList.add("overflow-clip")
  if (prev.classList.contains("z-layer-root")) {
    document.body.classList.add("overflow-clip")
  } else {
    prev.classList.remove("z-layer-active")
  }
  prev.inert = true

  next.classList.remove("opacity-0")
  next.classList.add("opacity-100")
  next.classList.remove("translate-x-16")
  next.classList.remove("-translate-x-16")
  next.classList.add("translate-x-0")
  next.classList.remove("translate-y-8")
  next.classList.remove("-translate-y-8")
  next.classList.add("translate-y-0")
  next.classList.add("z-layer-active")
  next.inert = false
}

function animateOut(
  prev: HTMLDivElement,
  next: HTMLDivElement,
  unmountNext: () => void,
) {
  prev.classList.add("opacity-100")
  prev.classList.remove("opacity-0")
  prev.classList.remove("blur-lg")
  prev.classList.add("translate-x-0")
  prev.classList.remove("-translate-x-16")
  prev.classList.remove("-translate-x-16")
  prev.classList.remove("overflow-clip")
  if (prev.classList.contains("z-layer-root")) {
    document.body.classList.remove("overflow-clip")
  } else {
    prev.classList.add("z-layer-active")
  }
  prev.inert = false

  next.classList.add("opacity-0")
  next.classList.remove("opacity-100")
  next.classList.remove("-translate-x-16")
  next.classList.remove("translate-x-16")
  next.classList.remove("translate-x-0")
  next.classList.remove("-translate-y-8")
  next.classList.remove("translate-y-8")
  next.classList.remove("translate-y-0")
  next.classList.add("translate-x-16")
  next.classList.add("overflow-clip")
  next.classList.remove("z-layer-active")
  next.inert = true
  next.addEventListener("transitionend", () => {
    try {
      unmountNext()
    } catch (err) {
      // solid has some issues demounting some layer components
      // so we'll just pretend the problem doesn't exist
      if (!(err instanceof DOMException && err.name == "NotFoundError")) {
        throw err
      }
    }
    next.remove()
  })
}

// FEAT: properly unmount new layers once they're removed

export interface LayerOutput {
  el: JSX.Element
  onForcePop: ForcePopHandler
  onReturn: ReturnHandler
}

export interface RootLayerOutput {
  el: JSX.Element
  onReturn: ReturnHandler
}

/** Return `false` to stop this layer from being removed. */
export type ForcePopHandler = () => boolean | PromiseLike<boolean>

/** This callback should reload all data on the page. */
export type ReturnHandler = () => void

/**
 * A thing which can be a layer. These are often easier to create using the
 * `defineLayer` utility, due to its built-in support for keyboard shortcuts,
 * loading async data, automatic reloading, and other useful features.
 */
export type Layerable<T> = (props: T, pop: () => void) => LayerOutput

/** A thing which can be a root layer. */
export type RootLayerable<T> = (props: T) => RootLayerOutput

/** A type which might be a promise-like resolving to the given value. */
export type Awaitable<T> = T | PromiseLike<T>
