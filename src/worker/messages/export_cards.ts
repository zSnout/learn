import { writeCsv } from "@/lib/csv"
import { filename } from "@/lib/filename"
import type { Id } from "@/lib/id"
import { export_cards_raw } from "./export_cards_raw"

export function export_cards(cids: Id[], format: "csv" | "json" | "txt") {
  const data = export_cards_raw(cids)

  if (format == "json") {
    return new File(
      [JSON.stringify(data.map(([q, a]) => ({ q, a })))],
      filename(".cards.json"),
      { type: "application/json" },
    )
  }

  if (format == "csv") {
    return new File([writeCsv(data)], filename(".cards.csv"), {
      type: "text/csv",
    })
  }

  if (format == "txt") {
    return new File(
      [data.map((x) => x.join("\t")).join("\n")],
      filename(".cards.txt"),
      { type: "text/plain" },
    )
  }

  throw new Error("Unsupported export type.")
}
