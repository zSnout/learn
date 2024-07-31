import { isSameDaySync } from "@/lib/day"
import { type Id, ID_ZERO } from "@/lib/id"
import { readonly, sql } from ".."
import { id, int, qint } from "../lib/checks"
import { prefs_get } from "./prefs_get"

export function deck_limits_txless(root: Id | null, dayStart: number): Limits {
  const [
    cfid,
    custom_revcard_limit,
    custom_newcard_limit,
    default_revcard_limit,
    default_newcard_limit,
    today,
  ] =
    root == null ?
      [ID_ZERO, null, null, null, null]
    : sql`
        SELECT
          cfid,
          custom_revcard_limit,
          custom_newcard_limit,
          default_revcard_limit,
          default_newcard_limit,
          today
        FROM decks
        WHERE id = ${root};
      `.getRow([id, qint, qint, qint, qint, int])

  const [new_per_day, rev_per_day] = sql`
    SELECT new_per_day, review_per_day FROM confs WHERE id = ${cfid};
  `.getRow([int, qint])

  const isToday =
    (today != null && isSameDaySync(dayStart, Date.now(), today)) || null

  return {
    new: {
      deckToday: isToday && custom_newcard_limit,
      deckDefault: default_newcard_limit,
      confStandard: new_per_day,
      now:
        (isToday && custom_newcard_limit) ??
        default_newcard_limit ??
        new_per_day,
    },
    rev: {
      deckToday: isToday && custom_revcard_limit,
      deckDefault: default_revcard_limit,
      confStandard: rev_per_day,
      now:
        (isToday && custom_revcard_limit) ??
        default_revcard_limit ??
        rev_per_day,
    },
  }
}

export interface Limit<T extends null> {
  deckToday: number | null
  deckDefault: number | null
  confStandard: number | T
  now: number | T
}

export interface Limits {
  new: Limit<never>
  rev: Limit<null>
}

export function deck_limits(main: Id | null): Limits {
  const tx = readonly()
  try {
    return deck_limits_txless(main, prefs_get().day_start)
  } finally {
    tx.dispose()
  }
}
