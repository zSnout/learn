import type { Id } from "@/lib/id"
import { int } from "../lib/checks"
import { readonly, sql } from ".."

export function manage_models_count(mid: Id) {
  const tx = readonly()
  try {
    return {
      nids: sql`SELECT COUNT() FROM notes WHERE mid = ${mid};`.getValue(int),
      cids: sql`
        SELECT COUNT()
        FROM cards
        WHERE (SELECT mid FROM notes WHERE notes.id = cards.nid) = ${mid};
      `.getValue(int),
    }
  } finally {
    tx.dispose()
  }
}
