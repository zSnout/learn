import { Fa } from "./Fa"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"

export function Error(props: { message: string; onClose(): void }) {
  return (
    <div class="pointer-events-none fixed bottom-4 left-6 right-6 z-30 flex">
      <div class="fixed bottom-0 left-0 right-0 top-0 animate-[fatalerror-backdrop_1.5s] bg-black opacity-0" />

      <div
        class="border-z-bg-body pointer-events-auto relative mx-auto animate-[fatalerror-message_150ms] cursor-pointer select-none rounded-[calc(0.75rem_+_1px)] border bg-red-500 px-3 text-white shadow-lg"
        role="alert"
        onClick={() => props.onClose()}
      >
        <Fa
          class="relative -top-[0.125rem] mr-2 inline-block h-4 w-4 fill-white"
          icon={faExclamationTriangle}
          title="Error!"
        />
        {props.message}
      </div>
    </div>
  )
}
