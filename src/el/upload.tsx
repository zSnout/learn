import type { JSX } from "solid-js"

export function UploadButton(props: {
  accept: string
  multiple?: boolean
  onUpload: (item: [File, ...File[]]) => void
  children: (trigger: () => void) => JSX.Element
}) {
  let el!: HTMLInputElement

  return (
    <>
      <input
        class="hidden"
        ref={el!}
        type="file"
        accept={props.accept}
        multiple={props.multiple}
        onChange={() => {
          if (!el.files?.length) return

          const files = Array.from(el.files)
          el.value = ""
          props.onUpload(files as [File, ...File[]])
        }}
      />

      {props.children(() => el.click())}
    </>
  )
}
