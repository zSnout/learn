// TODO: is the sidebar state actually getting saved?

import type { SidebarState } from "@/el/QuizLayout"

export function serializeSidebar(state: SidebarState) {
  if (state == "auto") return 1
  if (state == "open") return 2
  if (state == "closed") return 3
  throw new Error("Invalid sidebar state.")
}

export function deserializeSidebar(state: number) {
  if (state == 1) return "auto"
  if (state == 2) return "open"
  if (state == 3) return "closed"
  throw new Error("Invalid sidebar state.")
}
