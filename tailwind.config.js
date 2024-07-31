// @ts-check

import containerQueries from "@tailwindcss/container-queries"
import typography from "@tailwindcss/typography"
import { zSnoutTheme } from "@zsnout/tailwind"

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      rotate: { 60: "60deg" },
      spacing: { 4.5: "1.125rem" },
      fontFamily: {
        sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", var(--font-sp)',
        "sans-noto":
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", var(--font-sp)',
        serif:
          'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif, var(--font-sp)',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace, var(--font-sp)',
        mathnum: "Symbola, Times New Roman, serif, var(--font-sp)",
        mathvar: "Times New Roman, Symbols, serif, var(--font-sp)",
        "sp-sans":
          'var(--font-sp), ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      },
      colors: {
        "z-border-grid-line": "var(--z-border-grid-line)",
        "z-text-grid-label": "var(--z-text-grid-label)",
      },
      textColor: {
        "z-grid-label": "var(--z-text-grid-label)",
      },
      borderColor: {
        "z-grid-line": "var(--z-border-grid-line)",
      },
    },
  },
  plugins: [
    typography(),
    containerQueries,
    zSnoutTheme(),

    /** @type {import("tailwindcss/types/config").PluginCreator} */
    ({ addVariant, matchUtilities, matchVariant, theme }) => {
      addVariant("xs", "@media (min-width: 400px)")

      addVariant("scrollbar", "&::-webkit-scrollbar")

      addVariant("dhover", [
        "&:hover",
        "&.ctx",
        ".z-expand-checkbox-group:hover + &",
        ".z-expand-checkbox-group.ctx + &",
      ])
      addVariant("hover", ["&:hover", "&.ctx"])
      addVariant("focus", ["&:focus", "&.ctx"])
      addVariant("active", ["&:active", "&.ctx"])

      addVariant(
        "prose-details",
        '& :is(:where(details):not(:where([class~="not-prose"] *)))',
      )

      addVariant(
        "prose-summary",
        '& :is(:where(summary):not(:where([class~="not-prose"] *)))',
      )

      matchVariant("child", (value) => `&:nth-child(${value})`)

      matchUtilities({
        "z-quiz"(value) {
          const [color, index] = value.split(",")

          return {
            [`&:nth-child(${index})`]: {
              "border-bottom-color": theme(`colors.${color}.700`),
              "background-color": theme(`colors.${color}.500`),
            },
          }
        },
      })
    },
  ],
}
