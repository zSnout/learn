import type { Result } from "@/lib/result"
import { Show, type Accessor, type JSX } from "solid-js"

export function MatchResult<T>(props: {
  children: (value: Accessor<NonNullable<T>>) => JSX.Element
  fallback: (value: Accessor<string>) => JSX.Element
  result: Result<T>
}) {
  return (
    <Show
      fallback={props.fallback(() =>
        props.result.ok ? "" : props.result.reason,
      )}
      when={props.result.ok ? props.result.value : undefined}
    >
      {(value) => props.children(value)}
    </Show>
  )
}
