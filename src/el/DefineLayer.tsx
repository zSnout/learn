import {
  createResource,
  createSignal,
  getOwner,
  Show,
  untrack,
  type JSX,
  type Owner,
} from "solid-js"
import { Worker } from "../db"
import { ShortcutManager } from "@/lib/shortcuts"
import {
  ZID_BEFORE_UNDO,
  ZID_UNDO_HAPPENED,
  type MainThreadToItselfNotification,
  type WorkerNotification,
} from "../shared"
import {
  useLayers,
  type Awaitable,
  type Layerable,
  type RootLayerable,
} from "./Layers"
import { Loading } from "./Loading"
import { useToasts, type Toasts } from "./Toast"

/** Data passed to the `load()` function on a layer. */
export interface LayerLoadInfo<Props, State> {
  /** The props passed to this layer. */
  props: Props

  /** The state created by `init`. Possibly reactive, depending on config. */
  state: State

  /** Whether this is reloading. */
  readonly reloading: boolean

  /** Sets the message shown in the loading screen. */
  setMessage(message: string): void

  /** Pops the current layer. If `force` is called, ignores `onPop` handlers. */
  pop(force?: boolean): Promise<void>
}

/** A value which can be returned from an `onPop` handler. */
export type LayerOnPopRetVal = "stop" | undefined

/** A value which can be returned from an `onReturn` handler. */
export type LayerOnReturnRetVal = "preserve-data" | undefined

/** A value which can be returned from an `onUndo` handler. */
export type LayerOnUndoRetVal = "preserve-data" | undefined

export interface LayerCallbackInfo<Props, State, AsyncData> {
  /** The props passed to the layer. */
  readonly props: Props

  /** Possibly reactive getter and setter (depending on `info.state`). */
  state: State

  /** The async data of this layer. */
  readonly data: Awaited<AsyncData> | undefined

  /** The owner of this reactive tree. */
  readonly owner: Owner | null
}

/** Called when a layer is popped. */
export type LayerOnPop<Props, State, AsyncData> = (
  info: LayerCallbackInfo<Props, State, AsyncData>,
) => Awaitable<LayerOnPopRetVal>

/** Called when a layer is returned to. */
export type LayerOnReturn<Props, State, AsyncData> = (
  info: LayerCallbackInfo<Props, State, AsyncData>,
) => Awaitable<LayerOnReturnRetVal>

/** Called when the database performs an undo or redo. */
export type LayerOnUndo<Props, State, AsyncData> = (
  info: LayerCallbackInfo<Props, State, AsyncData>,
  notif: WorkerNotification & { zid: typeof ZID_UNDO_HAPPENED },
) => Awaitable<LayerOnUndoRetVal>

/** Called before the database performs an undo or redo. */
export type LayerOnBeforeUndo<Props, State, AsyncData> = (
  info: LayerCallbackInfo<Props, State, AsyncData>,
  notif: MainThreadToItselfNotification & { zid: typeof ZID_BEFORE_UNDO },
) => undefined

/** Data passed to the `render()` function on a layer. */
export interface LayerRenderInfo<Props, State, AsyncData> {
  /** The props passed to this layer. Passed as-is, so likely reactive. */
  readonly props: Props

  /** The state created by `init`. Possibly reactive, depending on config. */
  state: State

  /** The async data. Reactive getter. */
  readonly data: Awaited<AsyncData>

  /** An accessor into the toasts container. */
  readonly toasts: Toasts

  /**
   * Sets a function to be called when this layer is returned to, replacing past
   * `onReturn` calls. If the function returns `"preserve-data"` or a promise
   * resolving to `"preserve-data"`, the async data is not reloaded.
   */
  onReturn(fn: LayerOnReturn<Props, State, AsyncData>): void

  /**
   * Sets a function to be called when exiting this layer, replacing past
   * `onPop` calls. If the function returns `"stop"`, the pop is cancelled. If a
   * promise is returned, the pop is delayed until the promise resolves.
   */
  onPop(fn: LayerOnPop<Props, State, AsyncData>): void

  /**
   * Sets a function to be called when the database performs an undo or redo
   * operation, replacing past `onUndo` calls. If the function returns
   * `"preserve-data"` or a promise resolving to `"preserve-data"`, the async
   * data is not reloaded.
   */
  onUndo(fn: LayerOnUndo<Props, State, AsyncData>): void

  /**
   * Sets a function to be called before the database performs an undo or redo
   * operation, replacing past `onBeforeUndo` calls. The callback may modify the
   * metadata associated with the current application state, which will be put
   * back if the undo/redo mechanism goes back to this state.
   */
  onBeforeUndo(fn: LayerOnBeforeUndo<Props, State, AsyncData>): void

  /** Pops the current layer. If `force` is called, ignores `onPop` handlers. */
  pop(force?: boolean): Promise<void>

  /** Forces a reload of the layer's data. */
  refetchData(): void

  /**
   * Forcefully mutates the layer's data. Will put the application into a
   * loading state if a promise is passed.
   */
  mutateData(data: AsyncData): void

  /** Pushes a layer. */
  push<T>(layer: Layerable<T>, props: T): void

  /** The `Owner` of the reactive tree. */
  readonly owner: Owner | null

  /** A `ShortcutsManager` specific to this render instance. */
  readonly shortcuts: ShortcutManager
}

// TODO: remove mentions of undefined from `init` and `load`'s history
/** A complete layer definition. */
export interface Layer<Props, State, AsyncData> {
  /**
   * Initializes this layer's state. Only ever called once. If this method is
   * not defined, the layer's state will be `undefined` unless set elsewhere.
   */
  init(props: Props): State

  /**
   * Loads asynchronous information required to render this layer. Called when
   * the layer is first shown and when it is returned to.
   */
  load(info: LayerLoadInfo<Props, State>): AsyncData

  /**
   * Renders this layer, and can register hooks which are called when exiting
   * the layer. Common utilities like `push` and `owner` are also available.
   * Called whenever the layer is re-rendered.
   */
  render(info: LayerRenderInfo<Props, State, AsyncData>): JSX.Element

  /** What reactivity system to use for `state`, if any. */
  state?: "signal" | undefined

  /**
   * Sets the default `onReturn` callback, described below.
   *
   * Sets a function to be called when this layer is returned to, replacing past
   * `onReturn` calls. If the function returns `"preserve-data"` or a promise
   * resolving to `"preserve-data"`, the async data is not reloaded.
   */
  onReturn?: LayerOnReturn<Props, State, AsyncData> | undefined

  /**
   * Sets the default `onPop` callback, described below.
   *
   * Sets a function to be called when exiting this layer, replacing past
   * `onPop` calls. If the function returns `"stop"`, the pop is cancelled. If a
   * promise is returned, the pop is delayed until the promise resolves.
   */
  onPop?: LayerOnPop<Props, State, AsyncData> | undefined

  /**
   * Sets the default `onUndo` callback, described below.
   *
   * Sets a function to be called when the database performs an undo or redo
   * operation, replacing past `onUndo` calls. If the function returns
   * `"preserve-data"` or a promise resolving to `"preserve-data"`, the async
   * data is not reloaded.
   */
  onUndo?: LayerOnUndo<Props, State, AsyncData> | undefined

  /**
   * Sets the default `onBeforeUndo` callback, described below.
   *
   * Sets a function to be called before the database performs an undo or redo
   * operation, replacing past `onBeforeUndo` calls. The callback may modify the
   * metadata associated with the current application state, which will be put
   * back if the undo/redo mechanism goes back to this state.
   */
  onBeforeUndo?: LayerOnBeforeUndo<Props, State, AsyncData> | undefined
}

function createStatic<T>(value: T) {
  return [
    () => value,
    (x: T) => {
      value = x
    },
  ] as const
}

/**
 * **TL;DR: A layer has preserved state, volatile async data, and goes over
 * other parts of the page. Put configuration in props, stuff you need to
 * preserve in `state`, stuff from the database in `load` (which returns async
 * data), and store state which changes across undo/redo actions in the
 * `onBeforeUndo` handler.**
 *
 * A layer is like a page on a website. But instead of using regular pages, the
 * learn page uses a "fake pages" system which support good transitions, loading
 * views, keyboard shortcuts, and other good things. Layers can be pushed,
 * popped, or forcefully popped via the "Learn" link in the navigation bar `Esc`
 * key on a standard keyboard. Layers also provide a solid backdrop in case this
 * application ever starts using multiple windows.
 *
 * Regarding data, a typical layer has:
 *
 * - **Props**, which are passed by the element creating the layer.
 * - **State**, which is preserved when the layer is exited and returned to
 * - **Async data**, which is initially fetched in a `load` function, and which is
 *   automatically refetched whenever the layer is returned to (because it could
 *   have potentially changed), unless this behavior is explicitly disabled.
 *
 * If there is configuration required for your layer to work, it should likely
 * be part of the layer's props.
 *
 * If you would like to preserve some state (for instance, the Browse layer
 * should keep the proper cards selected even after an upper layer is removed),
 * it must go in the `state` utility.
 *
 * If you would like to fetch something from the database, it must go in the
 * `load` utility.
 *
 * ### Lifetime of a layer
 *
 * As a layer is created, it goes through these steps:
 *
 * 1. State is created. If `layer.state == "signal"`, it is transformed into a
 *    signal.
 * 2. The async data is fetched.
 * 3. The layer is shown.
 *
 * When a layer above this one is removed, this layer goes through these steps:
 *
 * 1. The current layer is unloaded.
 * 2. The async data is refetched.
 * 3. The layer is re-rendered.
 */
export function defineLayer<
  Props extends Worker | { worker: Worker },
  State,
  AsyncData,
>(layer: Layer<Props, State, AsyncData>): Layerable<Props> {
  return (props, popRaw) => {
    const worker = props instanceof Worker ? props : props.worker
    let { onReturn, onPop, onUndo, onBeforeUndo } = layer

    worker.onMain(ZID_BEFORE_UNDO, async (data) => {
      onBeforeUndo?.(layerCallbackInfo, data)
    })

    worker.on(ZID_UNDO_HAPPENED, async (data) => {
      if (
        !onUndo ||
        (await onUndo(layerCallbackInfo, data)) !== "preserve-data"
      ) {
        mutate(undefined)
        refetch()
      }
    })

    const layers = useLayers()
    const owner = getOwner()
    const initialState = layer.init?.(props) as State
    const [state, setState] =
      layer.state == "signal" ?
        createSignal(initialState)
      : createStatic(initialState)
    const [message, setMessage] = createSignal("Loading...")

    const layerLoadInfo: LayerLoadInfo<Props, State> = {
      props,
      get state() {
        return state()
      },
      set state(v) {
        setState(v)
      },
      get reloading() {
        // try-catch because of TDZ
        try {
          data()
          return true
        } catch {
          return false
        }
      },
      setMessage(message) {
        setMessage(message)
      },
      pop,
    }

    const [data, { mutate, refetch }] = createResource(
      () =>
        // Solid's typings only allow for T and Promise<T>, but the code allows
        // for any thenable. That's not compatiable with our types, so we have
        // to cast here.
        layer.load?.(layerLoadInfo) as Awaited<AsyncData>,
    )

    const shortcuts = new ShortcutManager()

    const toasts = useToasts()
    const layerRenderInfo: LayerRenderInfo<Props, State, AsyncData> = {
      props,
      get state() {
        return state()
      },
      set state(v) {
        setState(v)
      },
      toasts,
      get data() {
        const d = data()!
        if (d == null) {
          throw new Error("Cannot access application data while loading.")
        }
        return d
      },
      onReturn(fn) {
        onReturn = fn
      },
      onPop(fn) {
        onPop = fn
      },
      onUndo(fn) {
        onUndo = fn
      },
      onBeforeUndo(fn) {
        onBeforeUndo = fn
      },
      refetchData() {
        mutate(undefined)
        refetch()
      },
      mutateData(data) {
        if (typeof data == "object" && data && "then" in data) {
          mutate(undefined)
          ;(data as PromiseLike<AsyncData>).then((data) => {
            mutate(() => data as Awaited<AsyncData>)
          })
        } else {
          mutate(() => data as Awaited<AsyncData>)
        }
      },
      pop,
      push(layer, props) {
        layers.push(layer, props)
      },
      owner,
      shortcuts,
    }

    const layerCallbackInfo: LayerCallbackInfo<Props, State, AsyncData> = {
      props,
      get state() {
        return state()
      },
      set state(v) {
        setState(v)
      },
      get data() {
        return data()
      },
      owner,
    }

    return {
      el: <El />,
      async onForcePop() {
        if (!onPop) {
          return true
        }

        return (await onPop(layerCallbackInfo)) !== "stop"
      },
      async onReturn() {
        if (
          !onReturn ||
          (await onReturn(layerCallbackInfo)) !== "preserve-data"
        ) {
          mutate(undefined)
          refetch()
        }
      },
    }

    function El() {
      return (
        <Show
          fallback={<Loading message={message()} pop={() => pop(false)} />}
          when={data.state == "ready"}
        >
          {/**
           * The `untrack` call is automatically placed around JSX elements, but we can't
           * use proper JSX elements here, so we add it manually instead.
           */}
          {untrack(() => layer.render(layerRenderInfo))}
        </Show>
      )
    }

    async function pop(force: boolean) {
      if (force || !onPop || (await onPop(layerCallbackInfo)) !== "stop") {
        popRaw()
      }
    }
  }
}

export function defineRootLayer<
  Props extends Worker | { worker: Worker },
  State,
  AsyncData,
>(layer: Layer<Props, State, AsyncData>): RootLayerable<Props> {
  const layerable = defineLayer(layer)
  return (props) => layerable(props, () => {})
}
