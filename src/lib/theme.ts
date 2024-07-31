import { usePrefersDark } from "@solid-primitives/media"
import { untrack } from "solid-js"
import { createStorage } from "./local-storage-store"

const warn = console.warn
console.warn = () => {}
export const isDeviceDark = usePrefersDark()
console.warn = warn

export const [theme, setTheme] = createStorage("theme", "auto")

export const isDark = () =>
  isDeviceDark() ? theme() != "light" : theme() == "dark"

export function toggleIsDark() {
  setTheme(
    untrack(isDeviceDark) ?
      untrack(theme) == "light" ?
        "auto"
      : "light"
    : untrack(theme) == "dark" ? "auto"
    : "dark",
  )
}
