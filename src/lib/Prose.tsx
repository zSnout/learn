// TODO: check which functions here are unused
// do the same in v8

export function Unprose(props: { children?: any; class?: string }) {
  return (
    <div
      class={
        "relative left-[calc(-50vw_+_min(50vw_-_1.5rem,32.5ch))] w-[100vw]" +
        (props.class ? " " + props.class : "")
      }
    >
      {props.children}
    </div>
  )
}

export function Unmain(props: { children?: any; class?: string }) {
  return (
    <div
      class={
        "relative left-[calc(-50vw_+_min(50vw_-_1.5rem,32rem))] w-[100vw]" +
        (props.class ? " " + props.class : "")
      }
    >
      {props.children}
    </div>
  )
}

export function Reprose(props: { children?: any; class?: string }) {
  return (
    <div class="mx-6 flex flex-col print:mx-0">
      <div class="text-z flex w-full gap-12 transition">
        <div
          class={
            "mx-auto w-full max-w-prose" +
            (props.class ? " " + props.class : "")
          }
        >
          {props.children}
        </div>
      </div>
    </div>
  )
}
