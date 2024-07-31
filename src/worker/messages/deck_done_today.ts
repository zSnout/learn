import { isSameDaySync } from "@/lib/day"
import type { Id } from "@/lib/id"
import { readonly, sql } from ".."
import { int, text } from "../lib/checks"

export function deck_done_today_txless(decks: Id[], dayStart: number) {
  const stmt = sql`
    SELECT today, new_today, revcards_today FROM decks WHERE id = ?;
  `

  let new_today = 0
  let rev_today = 0

  for (const did of decks) {
    const row = stmt.bindNew([did]).getRowSafe([int, text, text])
    if (row) {
      const isToday = isSameDaySync(dayStart, Date.now(), row[0])

      if (isToday) {
        new_today += (JSON.parse(row[1]) as number[]).length
        rev_today += (JSON.parse(row[2]) as number[]).length
      }
    }
  }

  return { new_today, rev_today }
}

export function deck_done_today(decks: Id[], dayStart: number) {
  const tx = readonly()
  try {
    return deck_done_today_txless(decks, dayStart)
  } finally {
    tx.dispose()
  }
}
