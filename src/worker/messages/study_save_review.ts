import type { AnyCard, Review } from "@/lib/types"
import { Rating } from "ts-fsrs"
import { int, text } from "../lib/checks"
import { stmts } from "../lib/stmts"
import { readwrite, sql } from ".."

export function study_save_review(
  card: AnyCard,
  log: Review,
  isNew: boolean,
  timeElapsedMs: number,
) {
  const tx = readwrite(`Review card as ${Rating[log.rating]}`)
  tx.meta.currentCard = card.id
  try {
    sql`
      UPDATE cards
      SET
        due = ${card.due},
        last_review = ${card.last_review},
        reps = ${card.reps},
        state = ${card.state},
        elapsed_days = ${card.elapsed_days},
        scheduled_days = ${card.scheduled_days},
        stability = ${card.stability},
        difficulty = ${card.difficulty},
        lapses = ${card.lapses}
      WHERE id = ${card.id};
    `.run()

    stmts.rev_log
      .insert()
      .bindNew(stmts.rev_log.insertArgs({ ...log, time: timeElapsedMs }))
      .run()

    const [new_today, revcards_today, revlogs_today] = sql`
      SELECT new_today, revcards_today, revlogs_today
      FROM decks
      WHERE id = ${card.did};
    `.getRow([text, text, int])

    const revcardsToday = JSON.parse(revcards_today) as number[]
    if (!revcardsToday.includes(card.id)) {
      revcardsToday.push(card.id)
    }

    if (isNew) {
      const newToday = JSON.parse(new_today) as number[]
      if (!newToday.includes(card.id)) {
        newToday.push(card.id)
      }

      sql`
        UPDATE decks
        SET
          new_today = ${JSON.stringify(newToday)},
          revcards_today = ${JSON.stringify(revcardsToday)},
          revlogs_today = ${revlogs_today + 1}
        WHERE id = ${card.did};
      `.run()
    } else {
      sql`
        UPDATE decks
        SET
          revcards_today = ${JSON.stringify(revcardsToday)},
          revlogs_today = ${revlogs_today + 1}
        WHERE id = ${card.did};
      `.run()
    }
    tx.commit()
  } finally {
    tx.dispose()
  }
}
