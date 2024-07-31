import { type Shortcut, shortcutToString } from "../lib/shortcuts"

export function Write(props: { shortcut: Shortcut }) {
  return (
    <span class="text-z-subtitle text-right text-sm">
      {shortcutToString(props.shortcut)
        .match(/[⇧⌘⌥⌫↩]/g)
        ?.join("") ?? ""}
      <span class="font-mono">
        {shortcutToString(props.shortcut)
          .match(/[^⇧⌘⌥⌫↩]/g)
          ?.join("") ?? ""}
      </span>
    </span>
  )
}
