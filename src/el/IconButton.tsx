import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import { JSX } from "solid-js"
import { Fa } from "./Fa"

export function Icon(props: {
  icon: IconDefinition
  label: string
  onClick: () => void
}) {
  return (
    <button
      class="bg-z-body-selected flex aspect-square min-w-[4.25rem] max-w-[4.25rem] flex-col items-center justify-center gap-1 rounded-lg px-2 pb-1 pt-2 text-center [.z-icon-grid>&]:max-w-none"
      onClick={props.onClick}
    >
      <Fa class="size-8" icon={props.icon} title={false} />
      <p class="text-z-subtitle text-sm">{props.label}</p>
    </button>
  )
}

export function IconGrid(props: { children: JSX.Element; label: string }) {
  return (
    <div class="flex w-full flex-col gap-1">
      <div class="bg-z-body-selected text-z-subtitle w-full rounded-lg px-2 py-1 text-sm">
        {props.label}
      </div>
      <div class="z-icon-grid grid w-full grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-1">
        {props.children}
      </div>
    </div>
  )
}

export function Icons(props: { children: JSX.Element }) {
  return <div class="flex justify-center gap-2">{props.children}</div>
}
