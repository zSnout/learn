import { Fa } from "./Fa"
import {
  faRightFromBracket,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons"
import { createResource, JSX, Show } from "solid-js"
import type { MaybePromise } from "valibot"
import { Action } from "./BottomButtons"

export function Loading(props: {
  message: string
  pop: (() => void) | undefined
}) {
  return (
    <div class="flex min-h-full w-full flex-1 flex-col items-center justify-center gap-8">
      <Fa
        class="size-12 animate-[faspinner_1s_linear_infinite]"
        icon={faSpinner}
        title={false}
      />

      <p class="text-z text-center text-xl transition">{props.message}</p>

      <p class="text-z-subtitle -mt-4 w-full max-w-96 text-balance text-center text-sm">
        This page needs some external data in order to work. Please wait a
        moment for the page to load.
        <Show when={props.pop}>
          {" "}
          You may also press "Cancel" to go back to the previous page.
        </Show>
      </p>

      <Show when={props.pop}>
        <div class="mx-auto w-full max-w-72">
          <Action
            icon={faRightFromBracket}
            label="Cancel"
            center
            onClick={props.pop}
          />
        </div>
      </Show>
    </div>
  )
}

export function InlineLoading<T>(props: {
  data: MaybePromise<T>
  children: (data: T) => JSX.Element
  fallback?: JSX.Element
}) {
  const [result] = createResource(
    () => props.data,
    (x) => x,
  )

  return (
    <Show
      when={result()}
      keyed
      fallback={
        props.fallback ?? (
          <div class="bg-z-body-selected flex aspect-video min-h-full w-full flex-1 flex-col items-center justify-center gap-8 rounded-lg">
            <Fa
              class="size-8 animate-[faspinner_1s_linear_infinite]"
              icon={faSpinner}
              title={false}
            />
          </div>
        )
      }
    >
      {props.children}
    </Show>
  )
}
