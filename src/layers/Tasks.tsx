import { Checkbox } from "@/el/CheckboxGroup"
import { defineStaticLayer } from "@/el/DefineStaticLayer"
import { For, type JSX } from "solid-js"
import tasksRaw from "../docs/TASKS.md?raw"

function getTags() {
  type TagLi = { type: "li"; content: string; marker: string }
  type Tag =
    | { type: "h1"; content: string }
    | { type: "strong"; content: string }
    | TagLi

  let last: TagLi | undefined
  const output: Tag[] = []

  for (const row of tasksRaw.split("\n")) {
    if (row == "") {
      last = undefined
      continue
    }

    if (row.startsWith("# ")) {
      output.push({ type: "h1", content: row.slice(2) })
      last = undefined
      continue
    }

    if (row.startsWith("**")) {
      output.push({ type: "strong", content: row.slice(2, -2) })
      last = undefined
      continue
    }

    if (row.startsWith("-")) {
      const data = row.match(/^- \[([^\]]+)\] (.+)$/)!
      output.push((last = { type: "li", content: data[2]!, marker: data[1]! }))
      continue
    }

    if (last) {
      last.content += " " + row.trim()
    } else {
      throw new Error("Unexpected token. " + row)
    }
  }

  return output
}

type Section = { name: string; lists: List[] }
type List = { name: string; items: Item[] }
type Item = { marker: string; content: string }

function getTree() {
  const sections: Section[] = []
  let section: Section | undefined
  let list: List | undefined

  for (const tag of getTags()) {
    if (tag.type == "h1") {
      sections.push((section = { name: tag.content, lists: [] }))
      list = undefined
      continue
    }

    if (tag.type == "strong") {
      if (!section) {
        throw new Error("#-marked section must be before **-marked list.")
      }

      section.lists.push((list = { name: tag.content, items: [] }))
      continue
    }

    if (!list) {
      throw new Error("**-marked list must be before [ ]-marked item.")
    }

    list.items.push(tag)
  }

  return sections
}

function Heading(props: { children: JSX.Element }) {
  return (
    <h1 class="bg-z-body-selected text-z-heading w-full rounded-lg px-2 py-1 text-center font-bold">
      {props.children}
    </h1>
  )
}

function Sections(props: { sections: Section[] }) {
  return (
    <For each={props.sections}>
      {(section) => (
        <div class="bg-z-body-selected flex w-full flex-col gap-1 rounded-lg px-2 py-1">
          <h2 class="text-z-heading text-center font-bold">{section.name}</h2>
          <For
            each={section.lists}
            fallback={<p class="text-sm italic">No items.</p>}
          >
            {(list) => (
              <>
                <h3 class="text-z-heading -mb-1 mt-3 font-semibold">
                  {list.name}
                </h3>
                <ul>
                  <For each={list.items}>
                    {(item) => (
                      <li class="flex gap-2">
                        <Checkbox checked={item.marker == "x"} disabled />
                        {item.content}
                      </li>
                    )}
                  </For>
                </ul>
              </>
            )}
          </For>
        </div>
      )}
    </For>
  )
}

function filter(sections: Section[], filter: (item: Item) => boolean) {
  const output: Section[] = []
  for (const section of sections) {
    const section2: Section = { name: section.name, lists: [] }
    for (const list of section.lists) {
      const list2: List = { name: list.name, items: list.items.filter(filter) }
      if (list2.items.length) {
        section2.lists.push(list2)
      }
    }
    output.push(section2)
  }
  return output
}

const sections = getTree()

export function Tasks() {
  return (
    <div class="mx-auto flex min-h-full w-full max-w-xl flex-1 flex-col items-start gap-4">
      <Heading>In Progress</Heading>
      <Sections sections={filter(sections, (x) => x.marker != "x")} />
      <Heading>Completed</Heading>
      <Sections sections={filter(sections, (x) => x.marker == "x")} />
    </div>
  )
}

export default defineStaticLayer(Tasks)
