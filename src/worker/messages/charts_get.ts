import { readonly, sql } from ".."
import { stmts } from "../lib/stmts"

export function charts_get() {
  const tx = readonly()
  try {
    return sql`SELECT * FROM charts ORDER BY id;`
      .getAll()
      .map(stmts.charts.interpret)
  } finally {
    tx.dispose()
  }
}
