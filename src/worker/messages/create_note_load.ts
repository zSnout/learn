import { ID_ZERO, type Id } from "@/lib/id"
import { notNull } from "@/lib/pray"
import { nameToRecord } from "@/lib/record"
import { readonly, sql } from ".."
import { stmts } from "../lib/stmts"
import { prefs_get } from "./prefs_get"

export function create_note_load(state: { did?: Id; mid?: Id }) {
  const tx = readonly()

  try {
    const prefs = prefs_get()

    const allDecks = sql`SELECT * FROM decks;`
      .getAll()
      .map(stmts.decks.interpret)

    const currentDeck = stmts.decks.interpret(
      sql`
        SELECT *
        FROM decks
        WHERE
          id = ${state.did ?? prefs.current_deck ?? allDecks[0]?.id ?? ID_ZERO};
      `.getRow(),
    )

    const allModels = sql`SELECT * FROM models;`
      .getAll()
      .map(stmts.models.interpret)

    const currentModel = stmts.models.interpret(
      sql`
        SELECT *
        FROM models
        WHERE
          id = ${state.mid ??
          prefs.last_model_used ??
          allModels[0]?.id ??
          ID_ZERO};
      `.getRow(),
    )

    const value = {
      deckCurrent: notNull(
        currentDeck ?? allDecks[0],
        "A collection must have at least one deck.",
      ),
      modelCurrent: notNull(
        currentModel ?? allModels[0],
        "A collection must have at least one model.",
      ),
      decksByName: nameToRecord(allDecks),
      modelsByName: nameToRecord(allModels),
    }
    return value
  } finally {
    tx.dispose()
  }
}
