/* @refresh reload */
import { render } from "solid-js/web"

import { Fa } from "@/el/Fa"
import { isDark } from "@/lib/theme"
import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { createEffect, getOwner } from "solid-js"
import { Main } from "./Main"
import { register } from "./register-sw"
import { ThemeSwitcher } from "./ThemeSwitcher"

const root = document.getElementById("root")

render(() => <Index />, root!)

function Index() {
  register(getOwner())

  return (
    <>
      <div class="bg-z-body pointer-events-none fixed -top-20 left-0 z-30 h-20 w-full print:hidden"></div>

      {/* This is intentionally not a <nav /> element. */}
      {/* That is used in prose and other documents with internal nav links. */}
      <header class="bg-z-body-partial border-b-z pointer-events-none fixed top-0 z-30 flex h-12 w-full touch-none select-none items-center justify-center border-b px-6 py-1.5 backdrop-blur-sm transition print:hidden">
        <div class="relative flex h-full w-full max-w-5xl flex-1 items-center">
          <div class="text-z-heading pointer-events-auto relative left-[calc(-0.5rem_-_1px)] z-20 mr-auto flex items-baseline text-2xl font-extralight">
            <a
              class="ring-z-focus focus-visible:border-z-focus rounded-lg border border-transparent px-2 py-0.5 underline decoration-transparent decoration-1 underline-offset-2 transition hover:decoration-current focus-visible:outline-none focus-visible:ring"
              href="https://v8.zsnout.com/"
            >
              zSnout
            </a>

            <Fa class="h-4 w-4" icon={faChevronRight} title="sublink" />
            <a
              class="z-sublink ring-z-focus focus-visible:border-z-focus rounded-lg border border-transparent px-2 py-0.5 underline decoration-transparent decoration-1 underline-offset-2 transition hover:decoration-current focus-visible:outline-none focus-visible:ring"
              href="/"
            >
              Learn
            </a>
          </div>

          <ThemeSwitcher />
        </div>
      </header>

      <div class="text-z mx-6 flex flex-1 flex-col pb-8 pt-20 transition print:mx-0 print:my-0">
        <div class="text-z mx-auto flex w-[64rem] max-w-full flex-1 flex-col transition">
          <Main />
        </div>
      </div>
    </>
  )
}

if (typeof document != "undefined") {
  const list = document.documentElement.classList
  const theme = document.querySelector<HTMLMetaElement>(
    "meta[name=theme-color]",
  )

  if (import.meta.env.DEV) {
    const warn = console.warn
    console.warn = () => {}
    createEffect(() => {
      list.toggle("dark", isDark())
      if (theme) {
        theme.content = isDark() ? "#0f172a" : "#ffffff"
      }
    })
    console.warn = warn
  } else {
    createEffect(() => {
      list.toggle("dark", isDark())
      if (theme) {
        theme.content = isDark() ? "#0f172a" : "#ffffff"
      }
    })
  }
}
