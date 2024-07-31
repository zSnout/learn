import { createSignal, Show, untrack } from "solid-js"
import type {
  ForcePopHandler,
  Layerable,
  LayerOutput,
  ReturnHandler,
} from "./Layers"
import { Loading } from "./Loading"

export function createDeferredLayer<T>(
  fn: () => PromiseLike<{ default: Layerable<T> }>,
) {
  const [layer, setLayer] = createSignal<Layerable<T>>()

  wrap.preload = () => {
    fn().then(({ default: layer }) => setLayer(() => layer))
  }

  return wrap

  function wrap(props: T, pop: () => void): LayerOutput {
    let onForcePop: ForcePopHandler = () => true
    let onReturn: ReturnHandler = () => {}

    if (!untrack(layer)) {
      fn().then(({ default: layer }) => setLayer(() => layer))
    }

    return {
      el: (
        <Show
          when={layer()}
          fallback={<Loading message="Loading..." pop={pop} />}
        >
          {(layerAccessor) => {
            const layer = untrack(layerAccessor)
            const data = layer(props, pop)
            onForcePop = data.onForcePop
            onReturn = data.onReturn
            return data.el
          }}
        </Show>
      ),
      onForcePop() {
        return onForcePop()
      },
      onReturn() {
        return onReturn()
      },
    }
  }
}
