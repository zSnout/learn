import { clientsClaim } from "workbox-core"
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import type { Awaitable } from "./el/Layers"
import { MEDIA_PREFIX, parseKey, UserMedia } from "./lib/media"

self.addEventListener(
  "fetch" as any,
  (event: {
    respondWith(data: Awaitable<Response>): void
    request: Request
  }) => {
    const path = new URL(event.request.url).pathname
    if (path.startsWith(MEDIA_PREFIX)) {
      const key = parseKey(path.slice(MEDIA_PREFIX.length))
      if (!key) return
      event.respondWith((media ??= new UserMedia()).response(key))
    }
  },
)

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

self.skipWaiting()
clientsClaim()

let media: UserMedia | undefined

declare global {
  function skipWaiting(): void
  var __WB_MANIFEST: any
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting()
})
