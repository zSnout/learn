import { idOf } from "@/lib/id"
import type { ChartCard } from "@/lib/types"
import { readwrite, sql } from ".."
import { qint } from "../lib/checks"
import { stmts } from "../lib/stmts"

export function charts_add(title: string, query: string) {
  const tx = readwrite("Create chart")
  try {
    const max = sql`SELECT max(id) FROM charts;`.getValue(qint)
    const next = typeof max == "number" ? max + 1 : 0

    const card: ChartCard = {
      id: idOf(next),
      last_edited: Date.now(),
      title,
      query,
      chart: {
        mainAxis: {
          min: "0",
          max: "",
          groupSize: "1",
          groupSizeIsPercentage: false,
          label: {
            format: "numeric",
            overflow: "ellipsis",
            frequency: {
              by: "all",
              each: 1,
            },
            display: "separate",
          },
        },
        crossAxis: {
          min: "0",
          max: "",
          label: {
            format: "preserve",
            overflow: "ellipsis",
            frequency: {
              by: "all",
              each: 1,
            },
            display: "hidden",
          },
        },
        showTotal: false,
        stacked: true,
        type: "bar",
        space: false,
        rounded: false,
      },
      style: {
        padded: false,
        bordered: false,
        layered: true,
        roundCard: true,
        width: 1,
        height: 1,
        titleLocation: "floating",
        titleBorder: "none",
        titleAlign: "center",
      },
      options: [],
    }

    stmts.charts.insert().bindNew(stmts.charts.insertArgs(card)).run()
    tx.commit()
  } finally {
    tx.dispose()
  }
}
