import { Fa } from "@/el/Fa"
import { isDark, toggleIsDark } from "@/lib/theme"
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons"
import { Show } from "solid-js"

export function ThemeSwitcher(props?: { theme?: "light" | "dark" }) {
  const isActuallyDark = () =>
    props?.theme == "light" ? false
    : props?.theme == "dark" ? true
    : isDark()

  return (
    <button
      aria-checked={isActuallyDark()}
      class="border-z-theme-switcher bg-z-theme-switcher ring-z-focus focus-visible:border-z-focus dark:focus-visible:border-z-focus group pointer-events-auto relative z-20 flex h-5 w-10 items-center rounded-full border bg-clip-padding transition focus-visible:outline-none focus-visible:ring"
      classList={{ "opacity-30": typeof props?.theme == "string" }}
      disabled={typeof props?.theme == "string"}
      onClick={toggleIsDark}
      role="switch"
    >
      <div
        class="bg-z-theme-switcher outline-z icon-z group-focus-visible:outline-z-focus relative flex h-5 w-5 items-center justify-center rounded-full outline outline-1 transition-all"
        classList={{
          "left-0": !isActuallyDark(),
          "left-[1.125rem]": isActuallyDark(),
        }}
      >
        <Show
          fallback={<Fa class="h-3 w-3" icon={faSun} title="Sun" />}
          when={isActuallyDark()}
        >
          <Fa class="h-3 w-3" icon={faMoon} title="Moon" />
        </Show>
      </div>
    </button>
  )
}
