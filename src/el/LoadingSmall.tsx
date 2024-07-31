import { Fa } from "./Fa"
import { faSpinner } from "@fortawesome/free-solid-svg-icons"
import { JSX, Suspense } from "solid-js"

export function LoadingSmall(props: { children: JSX.Element }) {
  return (
    <Suspense
      fallback={
        <Fa
          class="m-auto size-4 animate-[faspinner_1s_linear_infinite]"
          icon={faSpinner}
          title={false}
        />
      }
    >
      {props.children}
    </Suspense>
  )
}
