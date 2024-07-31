import { For } from "solid-js"
import { defineLayer } from "@/el/DefineLayer"
import { Table, Td, Th, Tr } from "@/el/Table"
import { displaySize } from "@/lib/fileSize"

export default defineLayer({
  init() {},
  async load() {
    try {
      return await navigator.storage.estimate()
    } catch {
      return {}
    }
  },
  render({ data }) {
    return (
      <div class="mx-auto flex min-h-full w-full max-w-xl flex-col gap-4">
        <div class="bg-z-body-selected rounded-lg px-2 py-1 text-center">
          {data.usage == null ? "???" : displaySize(data.usage)}
          {" of "}
          {data.quota == null ? "???" : displaySize(data.quota)}
          <br />
          {data.usage != null && data.quota != null ?
            " (" +
            Math.round((data.usage / data.quota) * 100_00) / 100 +
            "% of quota)"
          : "(unknown quote usage)"}
        </div>

        <Table class="border-z rounded-lg border">
          <thead>
            <tr>
              <Th>Location</Th>
              <Th>Usage</Th>
            </tr>
          </thead>

          <tbody>
            <For
              each={
                data.usageDetails ?
                  Object.entries(data.usageDetails).sort((a, b) => b[1] - a[1])
                : []
              }
            >
              {([key, value]) => (
                <Tr>
                  <Td>{key in locationMap ? locationMap[key] : key}</Td>
                  <Td>{displaySize(value)}</Td>
                </Tr>
              )}
            </For>
          </tbody>
        </Table>
      </div>
    )
  },
})

const locationMap: Record<string, string> = {
  indexedDB: "User Media",
  fileSystem: "Database",
  serviceWorkerRegistrations: "Service Workers",
  caches: "Offline Support",
}
