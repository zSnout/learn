import type { JSX } from "solid-js"
import type { Layerable } from "./Layers"

export function defineStaticLayer<Props>(
  el: (props: Props) => JSX.Element,
): Layerable<Props> {
  return (props) => {
    return {
      el: el(props),
      onForcePop() {
        return false
      },
      onReturn() {},
    }
  }
}
