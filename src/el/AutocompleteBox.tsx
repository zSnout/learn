import { Fa } from "./Fa"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  Show,
} from "solid-js"

export function AutocompleteBox<T extends string>(
  props:
    | {
        options: readonly T[]
        value?: string
        onInput?: (value: string) => void
        onChange?: (value: T) => void
        fontFamily?: (option: string) => string
        allowArbitrary?: false
        label?: string
        placeholder?: string
      }
    | {
        options: readonly T[]
        value?: string
        onInput?: (value: string) => void
        onChange?: (value: string) => void
        fontFamily?: (option: string) => string | undefined
        allowArbitrary: true
        label?: string
        placeholder?: string
      },
): JSX.Element {
  const [field, setField] = createSignal(
    !!props.allowArbitrary || props.options.includes(props.value as T) ?
      (props.value ?? "")
    : "",
  )

  const matchingRaw = createMemo(() => {
    const og = field()
    const f = og.toLowerCase()

    const result = props.options
      .map((option) => {
        const index = option.toLowerCase().indexOf(f)
        return [option, index == -1 ? 1 / 0 : index] as const
      })
      .sort(([, a], [, b]) => a - b)
    if (props.allowArbitrary) {
      if (!result.some((x) => x[0] == og)) {
        result.unshift([og as T, 0])
      }
    }
    const infinity = result.findIndex(([, v]) => v == 1 / 0)

    return { result, infinity }
  })

  const matching = () => matchingRaw().result
  const infIndex = () => matchingRaw().infinity
  const [selected, setSelected] = createSignal(0)
  const [attemptedBlur, setAttemptedBlur] = createSignal<1>()

  return (
    <div
      classList={{
        "h-[calc(3.25rem_+_2px)]": !!props.label,
        "h-[calc(2rem_+_2px)]": !props.label,
      }}
    >
      <div class="z-field border-z-bg-body-selected bg-z-body-selected focus-within:bg-z-body relative z-10 overflow-clip p-0 shadow-none transition focus-within:z-20">
        <Show when={props.label}>
          <div
            class="text-z-subtitle line-clamp-1 w-full select-none px-2 pt-1 text-sm"
            aria-hidden="true"
            onMouseDown={(event) => {
              const el = event.currentTarget
                .nextElementSibling as HTMLInputElement
              el.focus()
              event.preventDefault()
            }}
          >
            {props.label}
          </div>
        </Show>

        <input
          class="text-z placeholder:text-z-subtitle peer w-full bg-transparent px-2 py-1 placeholder:opacity-30 focus:outline-none"
          aria-label={props.label}
          classList={{ "-mt-1": !!props.label }}
          type="text"
          onKeyDown={(event) => {
            if (event.metaKey || event.ctrlKey || event.altKey) {
              return
            }

            if (event.key == "ArrowUp" || event.key == "ArrowDown") {
              const dir = event.key == "ArrowUp" ? -1 : 1
              setSelected((x) => {
                const matches = matching().length
                return (x + dir + matches) % matches
              })
              event.preventDefault()
              return
            }

            if (event.key == "Enter") {
              const choice = matching()[selected()]
              if (choice) {
                setField(() => choice[0])
                setAttemptedBlur()
                props.onInput?.(choice[0])
                props.onChange?.(choice[0])
                setSelected(0)
              }
              event.preventDefault()
              event.currentTarget.blur()
              return
            }
          }}
          onInput={(event) => {
            if (event.currentTarget.textContent?.includes("\n")) {
              event.currentTarget.textContent =
                event.currentTarget.textContent.replace(/\n/g, "")
            }

            setField(event.currentTarget.value)
            setAttemptedBlur()
            props.onInput?.(event.currentTarget.value)
            setSelected(0)
          }}
          onBlur={(event) => {
            const choice = matching()[selected()]
            if (choice) {
              setField(() => choice[0])
              setAttemptedBlur()
              props.onInput?.(choice[0])
              props.onChange?.(choice[0])
              setSelected(0)
              return
            }

            if (props.options.includes(field() as T)) {
              props.onChange?.(field() as T)
              return
            }

            setAttemptedBlur(1)
            event.currentTarget.focus()
          }}
          value={field()}
          style={{ "font-family": props.fontFamily?.(field()) }}
          placeholder={props.placeholder}
        />

        <div class="pointer-events-none absolute right-0 top-0 flex h-8 w-8 items-center justify-center">
          <Fa class="h-4 w-4" icon={faChevronDown} title="show dropdown" />
        </div>

        <div class="border-z bg-z-body hidden max-h-48 select-none flex-col overflow-y-auto rounded-b-lg border-t transition-all peer-focus:flex">
          <For
            each={matching()}
            fallback={
              <div class="px-2 py-0.5 italic">
                That option does not exist.
                <Show when={attemptedBlur()}>
                  <br />
                  Select an option to continue.
                </Show>
              </div>
            }
          >
            {([match, pos], index) => (
              <button
                class="border-z hover:bg-z-body-selected border-dashed px-2 py-0.5 text-left"
                classList={{
                  "bg-z-body-selected": index() == selected(),
                  "border-t": index() != 0 && infIndex() == index(),
                  "-mt-px": index() != 0 && infIndex() == index(),
                  "text-sm": match.trim() == "",
                }}
                ref={(el) => {
                  createEffect(() => {
                    if (index() == selected()) {
                      el.scrollIntoView({ block: "nearest", inline: "nearest" })
                    }
                  })
                }}
                onMouseDown={() => {
                  setField(() => match)
                  setAttemptedBlur()
                  props.onInput?.(match)
                  props.onChange?.(match)
                  setSelected(0)
                }}
                onPointerDown={() => {
                  setField(() => match)
                  setAttemptedBlur()
                  props.onInput?.(match)
                  props.onChange?.(match)
                  setSelected(0)
                }}
                tabIndex={-1}
                style={{ "font-family": props.fontFamily?.(match) }}
              >
                <Show when={match.trim() == ""}>
                  <em class="text-z-subtitle">{"<empty>"}</em>
                </Show>
                <span>{match.slice(0, pos)}</span>
                <span class="text-z-heading font-semibold">
                  {match.slice(pos, pos + field().length)}
                </span>
                <span>{match.slice(pos + field().length)}</span>
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
