import { MEDIA_REGEX, UserMedia, writeKey } from "@/lib/media"
import { sql } from ".."
import { text } from "../lib/checks"

const media = new UserMedia()

/** Does not create a transaction. */
export async function media_analyze_missing() {
  const notes = sql`SELECT fields FROM notes;`.getAll([text]).map((x) => x[0])

  const all = new Set<string>()
  let result
  for (const note of notes) {
    while ((result = MEDIA_REGEX.exec(note))) {
      all.add(result[1]!)
    }
  }

  for (const key of await media.keys()) {
    all.delete(writeKey(key))
  }

  return Array.from(all).sort()
}
