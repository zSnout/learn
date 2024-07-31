import { UserMedia, writeKey } from "@/lib/media"
import { readonly, sql } from ".."
import { text } from "../lib/checks"

const media = new UserMedia()

export async function media_analyze_unused() {
  const tx = readonly()
  try {
    const texts = sql`SELECT fields FROM notes;`
      .getAll([text])
      .map((x) => x[0])
      .concat(
        sql`SELECT css, tmpls FROM models;`
          .getAll([text, text])
          .map((x) => [x[0], x[1]])
          .flat(),
      )
    const keys = await media.keys()

    const unusedKeys: ArrayBuffer[] = []
    for (const key of keys) {
      const str = `/learn/media/${writeKey(key)}`
      if (!texts.some((x) => x.includes(str))) {
        unusedKeys.push(key)
      }
    }

    return unusedKeys
  } finally {
    tx.dispose()
  }
}
