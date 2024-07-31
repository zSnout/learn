import { createEventListener } from "@/lib/create-event-listener"
import { isField } from "@/lib/draggable"
import { onCleanup, onMount } from "solid-js"

type Key =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "Escape"
  | "Backspace"
  | "Enter"
  | " "
  | "`"
  | "~"
  | "!"
  | "@"
  | "#"
  | "$"
  | "%"
  | "^"
  | "&"
  | "*"
  | "("
  | ")"
  | "-"
  | "_"
  | "="
  | "+"
  | "["
  | "]"
  | "{"
  | "}"
  | "\\"
  | "|"
  | "/"
  | "?"
  | "<"
  | ">"
  | ","
  | "."

export interface Shortcut {
  readonly alt?: boolean | undefined
  readonly shift?: boolean | undefined
  readonly mod?: "ctrl" | "macctrl" | undefined
  readonly key: Key
}

const SHIFT = "⇧"
const ALT = "⌥"
const COMMAND = "⌘"
const BACKSPACE = "⌫"
const CTRL = "⌃"

const SPECIAL_KEY_STRINGS: { [K in Key]?: string } = {
  " ": "Space",
  Escape: "Esc",
  Backspace: BACKSPACE,
  Enter: "↩",
}

let internalIsMac: boolean | undefined
export function isMac(): boolean {
  return (internalIsMac ??= /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent))
}

export function keyToString(key: Key) {
  return SPECIAL_KEY_STRINGS[key] ?? key
}

export function shortcutToString(shortcut: Shortcut) {
  // order: ctrl alt shift command key

  let output = ""
  let ctrl = false
  let cmd = false

  if (shortcut.mod == "macctrl") {
    if (isMac()) {
      cmd = true
    } else {
      ctrl = true
    }
  } else if (shortcut.mod == "ctrl") {
    ctrl = true
  }

  if (ctrl) output += CTRL
  if (shortcut.alt) output += ALT
  if (shortcut.shift) output += SHIFT
  if (cmd) output += COMMAND
  output += keyToString(shortcut.key)

  return output
}

export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  let ctrl = false
  let cmd = false

  if (shortcut.mod == "macctrl") {
    if (isMac()) {
      cmd = true
    } else {
      ctrl = true
    }
  } else if (shortcut.mod == "ctrl") {
    ctrl = true
  }

  return (
    event.ctrlKey == ctrl &&
    event.metaKey == cmd &&
    event.altKey == !!shortcut.alt &&
    (shortcut.shift == null || event.shiftKey == shortcut.shift) &&
    event.key.toLowerCase() == shortcut.key.toLowerCase()
  )
}

export class ShortcutManager {
  private map = new Map<
    string,
    [Shortcut, () => void, worksInFields: boolean]
  >()

  constructor() {
    if (typeof window != "undefined") {
      createEventListener(
        window,
        "keydown",
        (event) => {
          const field = isField(event)

          for (const [shortcut, action, worksInFields] of this.map.values()) {
            if ((!field || worksInFields) && matchesShortcut(event, shortcut)) {
              event.preventDefault()
              event.stopPropagation()
              action()
              return
            }
          }
        },
        { capture: true },
      )
    }
  }

  private set(shortcut: Shortcut, action: () => void, worksInFields?: boolean) {
    const str = shortcutToString(shortcut)
    this.map.set(str, [shortcut, action, !!worksInFields])
  }

  private unset(shortcut: Shortcut, action: () => void) {
    const str = shortcutToString(shortcut)
    if (this.map.get(str)?.[1] == action) {
      this.map.delete(str)
    }
  }

  scoped(shortcut: Shortcut, action: () => void, worksInFields?: boolean) {
    onMount(() => this.set(shortcut, action, worksInFields))
    onCleanup(() => this.unset(shortcut, action))
  }
}
