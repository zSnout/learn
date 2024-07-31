import type { UndoType } from "@/shared"
import { state } from ".."
import type { UndoMeta } from "../lib/undo"

export function undo(type: UndoType, meta: UndoMeta) {
  return state.dispatch(type, meta)
}
