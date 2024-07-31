import { type Accessor, createSignal } from "solid-js"

export function createExpr<T>(
  getValue: (last?: T) => T,
): [get: Accessor<T>, reload: () => void] {
  const [i, setI] = createSignal(0)
  return [() => (i(), getValue()), () => void setI((i) => i + 1)]
}
