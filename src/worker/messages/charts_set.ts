import type { ChartCard } from "@/lib/types"
import { readwrite, sql } from ".."
import { stmts } from "../lib/stmts"

export function charts_set(data: ChartCard[]) {
  const tx = readwrite("Set charts")
  try {
    sql`DELETE FROM charts;`.run()
    const stmt = stmts.charts.insert()
    for (const stat of data) {
      stmt.bindNew(stmts.charts.insertArgs(stat))
      stmt.run()
    }
    tx.commit()
  } finally {
    tx.dispose()
  }
}
