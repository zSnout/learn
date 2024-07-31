import { Fa } from "./Fa"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"

// TODO: may no longer be needed

export function NeedsJavascript() {
  return (
    <div
      class="flex min-h-full w-full flex-1 flex-col items-center justify-center gap-8"
      id="needsjavascript"
    >
      <Fa class="size-12" icon={faExclamationTriangle} title={false} />

      <p class="text-z text-center text-xl transition">JavaScript Needed</p>

      <p class="text-z-subtitle -mt-4 w-full max-w-96 text-sm">
        This page needs JavaScript in order to work. Please make sure JavaScript
        is enabled in your browser settings.
      </p>

      <p class="text-z-subtitle -mt-4 w-full max-w-96 text-sm">
        If you have JavaScript enabled, but are on a slow network connection,
        this page may take a while to load. Please be patient.
      </p>

      <p class="text-z-subtitle -mt-4 w-full max-w-96 text-sm">
        If you have JavaScript enabled and have a stable internet connection and
        this page <em>still</em> doesn't work, make sure you're using the latest
        version of your browser. This website uses lots of new technology, and
        is only designed to work on the latest versions of Chrome, Safari,
        Firefox, and other Chromium-based browsers (such as Edge, Arc, Opera,
        Brave, and Vivaldi, among others).
      </p>
    </div>
  )
}
