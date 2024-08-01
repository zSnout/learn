import { Action, TwoBottomButtons } from "@/el/BottomButtons"
import { defineLayer } from "@/el/DefineLayer"
import {
  DROPPING_INSERTS_USER_MEDIA,
  IntegratedCodeField,
} from "@/el/IntegratedField"
import { ModalCode, ModalDescription, ModalStrong, prompt } from "@/el/Modal"
import { Unmain } from "@/lib/Prose"
import { sql, SQLite } from "@codemirror/lang-sql"
import {
  faCheck,
  faRightFromBracket,
  faShieldHalved,
  faSkullCrossbones,
} from "@fortawesome/free-solid-svg-icons"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import { createSignal, For, Show } from "solid-js"
import type { Worker } from "../db"

const MODIFYING_QUERY =
  /insert|update|delete|alter|drop|truncate|create|merge/gi
const TRANSACTIONAL_QUERY = /begin|transaction|commit|rollback/gi

function format(els: string[]) {
  if (els.length == 0) {
    return ""
  }

  if (els.length == 1) {
    return els[0]!
  }

  if (els.length == 2) {
    return `${els[0]!} and ${els[1]!}`
  }

  return els.slice(0, -1).join(", ") + ", and " + els[els.length - 1]!
}

export default defineLayer({
  state: "signal",
  init(props: { worker: Worker; initial?: string }) {
    return props.initial ?? ""
  },
  load() {},
  render(info) {
    const {
      owner,
      shortcuts,
      pop,
      props: { worker },
    } = info
    shortcuts.scoped({ key: "Enter", mod: "macctrl" }, run, true)

    const [result, setResult] = createSignal<
      | {
          columns: string[]
          values: SqlValue[][]
        }[]
      | string
    >("")
    if (info.state) {
      runSafely(info.state)
    }
    const [safe, setSafe] = createSignal(true)

    return (
      <div class="flex min-h-[calc(100dvh_-_7rem)] w-full flex-1 flex-col gap-4">
        <Field />
        <Notes />
        <Data />
        <Actions />
      </div>
    )

    function Field() {
      return (
        <div class="bg-z-body-selected flex h-56 flex-col overflow-y-auto rounded-lg">
          <div class="border-z bg-z-body-selected text-z-subtitle sticky top-0 z-10 -mb-px flex w-full select-none gap-2 border-b px-2 pb-1 pt-1 text-sm">
            SQLite Query
          </div>

          <FieldInner />
        </div>
      )
    }

    function FieldInner() {
      return IntegratedCodeField(
        {
          value: info.state,
          onInput(v) {
            info.state = v
          },
        },
        {
          alone: true,
          lang: sql({ dialect: SQLite, upperCaseKeywords: true }),
          exts: DROPPING_INSERTS_USER_MEDIA,
        },
      )
    }

    function NotesSafeMode() {
      return (
        <>
          <Show when={info.state.match(MODIFYING_QUERY)}>
            {(matches) => (
              <div class="rounded-lg bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                The {format(matches().map((x) => x.toUpperCase()))} command
                {matches().length == 1 ? "" : "s"} normally modif
                {matches().length == 1 ? "ies" : "y"} the database, but will
                have no effect in safe mode.
              </div>
            )}
          </Show>

          <Show when={info.state.match(TRANSACTIONAL_QUERY)}>
            {(matches) => (
              <div class="rounded-lg bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                The {format(matches().map((x) => x.toUpperCase()))} command
                {matches().length == 1 ? "" : "s"} normally work
                {matches().length == 1 ? "s" : ""} with transactions, but will
                have no effect in safe mode.
              </div>
            )}
          </Show>
        </>
      )
    }

    function NotesUnsafeMode() {
      return (
        <Show when={info.state.match(MODIFYING_QUERY)}>
          {(matches) => (
            <div class="rounded-lg bg-yellow-100 px-2 py-1 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              The {format(matches().map((x) => x.toUpperCase()))} command
              {matches().length == 1 ? "" : "s"} will modify the database
              permanently unless you create a ROLLBACKed transaction.
            </div>
          )}
        </Show>
      )
    }

    function Notes() {
      return (
        <Show fallback={<NotesUnsafeMode />} when={safe()}>
          <NotesSafeMode />
        </Show>
      )
    }

    function Data() {
      return (
        <Show
          fallback={
            <Show
              fallback={
                <div class="rounded-lg bg-purple-100 px-2 py-1 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  No results were returned from the latest query. Try typing
                  something, then click "Run".
                  <br />
                  You can also press Ctrl+Enter (or Cmd+Enter on Mac) to execute
                  your query.
                </div>
              }
              when={result().toString()}
            >
              {(x) => (
                <pre class="rounded-lg bg-red-100 px-2 py-1 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
                  {x()}
                </pre>
              )}
            </Show>
          }
          when={(() => {
            const val = result()
            return typeof val != "string" && (val.length == 0 ? undefined : val)
          })()}
        >
          {(result) => (
            <div class="flex-1">
              <Unmain>
                <div class="flex w-dvw flex-col gap-4">
                  <For each={result()}>
                    {(result) => (
                      <div class="mx-auto min-w-[min(67rem,100dvw)] max-w-[100dvw] overflow-x-auto px-6">
                        <table class="border-z w-full border text-sm">
                          <thead>
                            <tr>
                              <For each={result.columns}>
                                {(column) => (
                                  <th class="border-z bg-z-body border-x px-1 first:border-l-0 last:border-r-0">
                                    {column}
                                  </th>
                                )}
                              </For>
                            </tr>
                          </thead>
                          <tbody>
                            <For each={result.values}>
                              {(row) => (
                                <tr class="odd:bg-[--z-table-row-alt]">
                                  <For each={row}>
                                    {(el) => (
                                      <td class="border-z whitespace-nowrap border-x px-1 first:border-l-0 last:border-r-0">
                                        {(
                                          el instanceof Uint8Array ||
                                          el instanceof ArrayBuffer ||
                                          el instanceof Int8Array
                                        ) ?
                                          Array.from(new Uint8Array(el))
                                            .map((x) =>
                                              x.toString(16).padStart(2, "0"),
                                            )
                                            .join(" ")
                                        : typeof el == "bigint" ?
                                          el.toString()
                                        : el == null ?
                                          "NULL"
                                        : (el as Exclude<typeof el, BigInt>)}
                                      </td>
                                    )}
                                  </For>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </For>
                </div>
              </Unmain>
            </div>
          )}
        </Show>
      )
    }

    function Actions() {
      return (
        <div class="xs:gap-1 mt-auto flex w-full flex-col gap-4">
          <TwoBottomButtons>
            <Action
              icon={faRightFromBracket}
              label="Exit"
              center
              onClick={pop}
            />
            <Action icon={faCheck} label="Run" center onClick={run} />
          </TwoBottomButtons>

          <Action
            class="mx-auto w-full max-w-96"
            icon={safe() ? faSkullCrossbones : faShieldHalved}
            label={safe() ? "Enable Unsafe Mode" : "Back to Safety"}
            center
            onClick={async () => {
              if (!safe()) {
                setSafe(true)
                return
              }

              const code = Math.random().toString(10).slice(-6)

              const result = await prompt({
                owner,
                title: "Enable unsafe mode? (DANGEROUS)",
                get description() {
                  return (
                    <>
                      <ModalDescription>
                        Unsafe mode lets you use arbitrary SQLite commands.
                        <ModalStrong>
                          If you don't know SQLite, you should not use unsafe
                          mode.
                        </ModalStrong>
                      </ModalDescription>

                      <ModalDescription>
                        Anything you do in unsafe mode can affect the database{" "}
                        <ModalStrong>permanently and irreversibly</ModalStrong>.
                        This could destroy years of reviews, make the
                        application inaccessible, or any other number of
                        terrible things. We highly recommend exporting your
                        current data before you use unsafe mode, just in case.
                      </ModalDescription>

                      <ModalDescription>
                        Enter <ModalCode>{code}</ModalCode> below to confirm you
                        want to enter unsafe mode.
                      </ModalDescription>
                    </>
                  )
                },
                cancelText: "Nope, stay safe",
                okText: "Yes, let me query",
              })

              if (result !== code) {
                return
              }

              setSafe(false)
            }}
          />
        </div>
      )
    }

    async function run() {
      try {
        setResult(await worker.post("user_query", info.state, !safe()))
      } catch (err) {
        console.error(err)
        setResult(String(err))
      }
    }

    async function runSafely(q = info.state) {
      try {
        setResult(await worker.post("user_query", q, false))
      } catch (err) {
        console.error(err)
        setResult(String(err))
      }
    }
  },
})
