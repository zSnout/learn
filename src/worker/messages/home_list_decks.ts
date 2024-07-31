import { Tree } from "@/lib/tree-structure"
import { startOfDaySync } from "@/lib/day"
import type { AnyCard, Buckets, CardBucket, DeckHomeInfo } from "@/lib/types"
import { readonly, sql } from ".."
import { bool, id, int, text } from "../lib/checks"

function bucketOfArray(
  today: number,
  card: readonly [
    queue: AnyCard["queue"],
    state: AnyCard["state"],
    last_edited: number,
    scheduled_days: number,
    due: number,
    ...unknown[],
  ],
  dayStart: number,
): CardBucket {
  if (
    (card[0] == 1 && startOfDaySync(dayStart, card[2]) == today) ||
    card[0] == 2
  ) {
    return null
  }

  if (card[1] == 0) {
    return 0
  } else if ((card[1] == 1 || card[1] == 2) && card[3] == 0) {
    return 1
  } else if (startOfDaySync(dayStart, card[4]) <= today) {
    return 2
  } else {
    return null
  }
}

export function home_list_decks() {
  const tx = readonly()

  try {
    const dayStart = sql`SELECT day_start FROM prefs WHERE id = 0;`.getValue(
      int,
    )

    const today = startOfDaySync(dayStart, Date.now())

    const decks = sql`SELECT id, collapsed, name FROM decks;`.getAll([
      id,
      bool,
      text,
    ])

    const idToName = Object.fromEntries(decks.map((x) => [x[0], x]))
    const nameToDeck = Object.fromEntries(decks.map((x) => [x[2], x]))

    const cards = sql`
      SELECT queue, state, last_edited, scheduled_days, due, did FROM cards;
    `.getAll([
      (x) => x == 0 || x == 1 || x == 2,
      (x) => x == 0 || x == 1 || x == 2 || x == 3,
      int,
      int,
      int,
      id,
    ])

    const self = new Map<string, Buckets>()

    for (const card of cards) {
      const bucket = bucketOfArray(today, card, dayStart)
      if (bucket == null) continue

      const deckName = idToName[card[5]]?.[2]
      if (deckName == null) continue // FIXME: this should never be null

      let count = self.get(deckName)
      if (count == null) {
        count = [0, 0, 0]
        self.set(deckName, count)
      }

      count[bucket]++
    }

    const sub = new Map<string, Buckets>()

    for (const [name, buckets] of self) {
      const segments = name.split("::")
      for (let index = 0; index < segments.length; index++) {
        const deckName = segments.slice(0, index).join("::")
        let count = sub.get(deckName)
        if (count == null) {
          count = [0, 0, 0]
          sub.set(deckName, count)
        }
        count[0] += buckets[0]
        count[1] += buckets[1]
        count[2] += buckets[2]
      }
    }

    const tree = new Tree<DeckHomeInfo | undefined, DeckHomeInfo>()

    for (const name of Array.from(self.keys())
      .concat(Array.from(sub.keys()))
      .concat(decks.map((x) => x[2]))
      .filter((x, i, a) => a.indexOf(x) == i)) {
      const deck = nameToDeck[name]

      const info: DeckHomeInfo = {
        deck: deck ? { id: deck[0], collapsed: !!deck[1], name } : undefined,
        self: self.get(name) || [0, 0, 0],
        sub: sub.get(name) || [0, 0, 0],
      }

      tree.set(
        name.split("::"),
        info,
        (x) => x,
        () => undefined,
        () => info,
        () => info,
      )
    }

    delete tree.tree[""]

    return { tree: tree.tree, global: sub.get("") ?? [0, 0, 0] }
  } finally {
    tx.dispose()
  }
}
