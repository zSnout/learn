// FEAT: add all template features from anki
// ban `:` `#` `^` `/` `$` `@` `{` `}` `\s` from field names
// {{Tags, Type, Deck, Subdeck, CardFlag, Card, FrontSide}}
// match hint content, css, and css classes to anki
// img
// audio
// video
// latex
// {{type:fieldname}} (these inherit the font of fields)
// ignore card when front is empty
// clozes
// `learn-tts` and `learn-hint` custom elements

import { isDark } from "@/lib/theme"
import { createEffect } from "solid-js"
import { sanitize } from "./sanitize"

const CSS_BASE = `
:where(.card){font-weight:normal;font-size:1rem;color:var(--z-text)}
:where(h1,h2,h3,h4,h5,h6,strong){font-weight:bold;color:var(--z-heading)}
`

/** Renders sanitized html. */
export function Render(props: {
  class?: string
  html: string
  css: string
  theme: "light" | "dark" | "auto"
}) {
  return (
    <div
      class={props.class}
      ref={(el) => {
        const root = el.attachShadow({ mode: "open" })

        const html = document.createElement("div")
        html.classList.add("card")

        createEffect(() => {
          const dark =
            props.theme == "light" ? false
            : props.theme == "dark" ? true
            : isDark()

          html.classList.toggle("light", !dark)
          html.classList.toggle("dark", dark)
        })

        const cssBase = document.createElement("style")
        cssBase.textContent = CSS_BASE

        const css = document.createElement("style")

        root.appendChild(html)
        root.appendChild(cssBase)
        root.appendChild(css)

        createEffect(() => (html.innerHTML = sanitize(props.html)))
        createEffect(() => (css.textContent = props.css))
      }}
    />
  )
}
