import type { Id } from "@/lib/id"
import { readonly, sql } from ".."
import { int } from "../lib/checks"

export function deck_left_txless(decks: Id[]) {
  const stmtNew = sql`SELECT COUNT() FROM cards WHERE did = ? AND state = 0;`
  const stmtRev = sql`SELECT COUNT() FROM cards WHERE did = ? AND state != 0;`

  let new_left = 0
  let rev_left = 0

  for (const did of decks) {
    {
      const inc = stmtNew.bindNew([did]).getValueSafe(int)
      if (inc != null) {
        new_left += inc
      }
    }

    {
      const inc = stmtRev.bindNew([did]).getValueSafe(int)
      if (inc != null) {
        rev_left += inc
      }
    }
  }

  return { new_left, rev_left }
}

export function deck_left(decks: Id[]) {
  const tx = readonly()
  try {
    return deck_left_txless(decks)
  } finally {
    tx.dispose()
  }
}
