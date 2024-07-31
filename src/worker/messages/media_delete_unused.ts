import { UserMedia } from "@/lib/media"
import { media_analyze_unused } from "./media_analyze_unused"

const media = new UserMedia()

export async function media_delete_unused() {
  const keys = await media_analyze_unused()
  await media.deleteEach(keys)
}
