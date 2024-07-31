import type { CtxEvent } from "@/env"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { JSX } from "solid-js"
import { Fa } from "./Fa"

export function BottomButtons(props: { class: string; children: JSX.Element }) {
  return (
    <div class="mt-auto flex w-full justify-center">
      <div class={props.class}>{props.children}</div>
    </div>
  )
}

export function TwoBottomButtons(props: {
  children: JSX.Element
  class?: string
}) {
  return (
    <BottomButtons
      class={
        "xs:grid-cols-2 grid w-full max-w-96 gap-1" +
        (props.class ? " " + props.class : "")
      }
    >
      {props.children}
    </BottomButtons>
  )
}

export function Action(props: {
  class?: string
  icon: IconDefinition
  label: string
  onClick?: () => void
  onCtx?: JSX.EventHandlerUnion<HTMLButtonElement, CtxEvent>
  shrinks?: boolean
  center?: boolean
  disabled?: boolean
}) {
  return (
    <button
      class={
        "z-field bg-z-body-selected flex w-full items-center gap-2 border-transparent px-2 py-1 shadow-none" +
        (props.class ? " " + props.class : "")
      }
      classList={{ "justify-center": props.center }}
      onClick={() => !props.disabled && props.onClick?.()}
      onCtx={props.onCtx}
      disabled={props.disabled}
    >
      <div class="flex h-6 items-center justify-center">
        <Fa class="h-4 w-4" icon={props.icon} title={false} />
      </div>
      <div
        classList={{ "max-sm:sr-only": props.shrinks }}
        textContent={props.label}
      />
    </button>
  )
}

export function SingleBottomAction(props: {
  icon: IconDefinition
  label: string
  onClick?: () => void
  shrinks?: boolean
  center?: boolean
}) {
  return (
    <BottomButtons class="grid w-full max-w-72 gap-1">
      {Action(props)}
    </BottomButtons>
  )
}
