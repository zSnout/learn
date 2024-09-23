import type { Id } from "@/lib/id"
import { readwrite, sql } from ".."

export function browse_move_cards(cids: Id[], did: Id, dname: string) {
  const tx = readwrite(`Move cards to ${dname}`)
  try {
    const stmt = sql`UPDATE cards SET did = ? WHERE id = ?;`
    for (const cid of cids) {
      stmt.bindNew([did, cid]).run()
    }
    tx.commit()
  } finally {
    tx.dispose()
  }
}
