import type { AnyCard, Deck, Note } from "@/lib/types"
import { State } from "ts-fsrs"

export function eraseScheduling(
  decks: Deck[],
  cards: AnyCard[],
  notes: Note[],
) {
  for (const card of cards) {
    card.difficulty = 0
    card.due = 0
    card.elapsed_days = 0
    card.lapses = 0
    card.last_review = 0
    card.reps = 0
    card.scheduled_days = 0
    card.stability = 0
    card.state = State.New
    card.queue = 0
  }

  for (const deck of decks) {
    deck.collapsed = false
    deck.custom_newcard_limit = null
    deck.custom_revcard_limit = null
    deck.default_newcard_limit = null
    deck.default_revcard_limit = null
    deck.new_today = []
    deck.revcards_today = []
    deck.revlogs_today = 0
    deck.today = 0
  }

  for (const note of notes) {
    note.marks = 0
  }
}
