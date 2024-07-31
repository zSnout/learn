import { JSX } from "solid-js"

export function CheckboxContainer(props: {
  label: string
  children: JSX.Element
}) {
  return (
    <div class="flex flex-col gap-1 rounded-lg bg-z-body-selected px-2 pb-1 pt-1">
      <p class="text-sm text-z-subtitle">{props.label}</p>
      {props.children}
    </div>
  )
}
