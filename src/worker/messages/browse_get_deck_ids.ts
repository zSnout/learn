import { readonly, sql } from ".."
import { text, id } from "../lib/checks"

export function browse_get_deck_ids() {
  const tx = readonly()
  try {
    return sql`SELECT id, name FROM decks;`.getAll([id, text])
  } finally {
    tx.dispose()
  }
}
