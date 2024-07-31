import {
  createMemo,
  createSignal,
  JSX,
  type Owner,
  runWithOwner,
  Show,
  untrack,
} from "solid-js"
import { Portal } from "solid-js/web"
import { Checkbox } from "./CheckboxGroup"

export function ModalCancel(props: {
  children: JSX.Element
  onClick?: () => void
  autofocus?: boolean
}) {
  return (
    <button
      class="z-field text-z hover:bg-z-field-selected rounded-md bg-transparent text-sm shadow-none hover:border-transparent"
      onClick={props.onClick}
      autofocus={props.autofocus}
    >
      {props.children}
    </button>
  )
}

export function ModalConfirm(props: {
  children: JSX.Element
  onClick?: () => void
  autofocus?: boolean
}) {
  return (
    <button
      // class="z-field rounded-md border-transparent bg-z-text-heading text-sm text-z-bg-body shadow-none hover:bg-z-text"
      // TODO: the hover style on light mode is too dark
      class="z-field bg-z-body-selected text-z dark:hover:bg-z-field-selected hover:bg-z-text hover:text-z-bg-body dark:hover:text-z rounded-md border-transparent text-sm shadow-none dark:hover:border-transparent"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}

export function ModalButtons(props: { children: JSX.Element }) {
  return <div class="mt-4 flex justify-end gap-2">{props.children}</div>
}

export function ModalTitle(props: { children: JSX.Element }) {
  return <h1 class="text-z-heading text-lg font-semibold">{props.children}</h1>
}

export function ModalDescription(props: { children: JSX.Element }) {
  return <p class="text-z-subtitle mt-2 text-sm">{props.children}</p>
}

export function ModalUl(props: { children: JSX.Element }) {
  return <ul class="text-z-subtitle mt-2 text-sm">{props.children}</ul>
}

export function ModalLi(props: { children: JSX.Element }) {
  return <li class="ml-5 list-disc pl-1">{props.children}</li>
}

export function ModalCode(props: { children: JSX.Element }) {
  return (
    <code class="bg-z-body-selected text-z rounded px-1">{props.children}</code>
  )
}

export function ModalCheckbox(props: {
  children: JSX.Element
  checked: boolean
  onInput(value: boolean): void
}) {
  return (
    <label
      class="mt-2 flex w-full items-center gap-2 [[data-z-modal-checkbox]+&]:mt-0"
      data-z-modal-checkbox
    >
      <Checkbox checked={props.checked} onInput={(v) => props.onInput(v)} />

      <p class="text-z">{props.children}</p>
    </label>
  )
}

export function ModalStrong(props: { children: JSX.Element }) {
  return <strong class="text-z underline">{props.children}</strong>
}

export function ModalField(props: {
  value?: string
  placeholder?: string
  onInput?: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent>
  onChange?: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>
  autofocus?: boolean
}) {
  return (
    <input
      class="z-field mt-3 w-full shadow-none placeholder:opacity-50"
      type="text"
      value={props.value ?? []}
      placeholder={props.placeholder}
      onInput={props.onInput}
      onChange={props.onChange}
      autofocus={props.autofocus}
    />
  )
}

export function ModalSelect(props: {
  children: JSX.Element
  value?: string
  onInput?: JSX.InputEventHandlerUnion<HTMLSelectElement, InputEvent>
  autofocus?: boolean
}) {
  return (
    <select
      class="z-field mt-3 w-full shadow-none placeholder:opacity-50"
      value={props.value ?? ""}
      onInput={props.onInput}
      autofocus={props.autofocus}
    >
      {props.children}
    </select>
  )
}

export function ModalDetails(props: {
  summary: JSX.Element
  children: JSX.Element
}) {
  return (
    <details class="mt-2">
      <summary class="text-z-subtitle text-sm">{props.summary}</summary>
      <div class="h-2 w-full" />
      {props.children}
    </details>
  )
}

export interface ModalRef {
  showModal(): void
  close(value: string): void
  cancel(): void
}

export function Modal(props: {
  children: JSX.Element
  ref?: (ref: ModalRef) => void
  onCancel?: () => void
  onClose?: (value: string) => void
  refPortal?: (ref: HTMLDivElement) => void
}) {
  const [open, setOpen] = createSignal(false)

  return (
    <Portal ref={props.refPortal}>
      <div class="from-z-bg-body to-z-bg-body pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-30 m-0 flex h-screen w-screen bg-transparent transition [&:has(>[open])]:pointer-events-auto [&:has(>[open])]:bg-[--z-bg-modal]">
        <dialog
          class="group pointer-events-none fixed bottom-0 left-0 right-0 top-0 z-30 m-0 flex h-screen w-screen bg-transparent p-4 transition open:pointer-events-auto [&:modal]:max-h-[100vh] [&:modal]:max-w-[100vw] [body:has(>*>*>&[open])]:overflow-hidden"
          ref={(el) => {
            setOpen(el.open)

            props.ref?.({
              showModal() {
                el.showModal()
                setOpen(true)
                const autofocused = el.querySelector("[autofocus]")
                if (
                  autofocused &&
                  (autofocused instanceof HTMLElement ||
                    autofocused instanceof SVGElement)
                ) {
                  autofocused.focus()
                }
              },
              close(value) {
                el.close(value)
                setOpen(false)
              },
              cancel() {
                el.close()
                setOpen(false)
                props.onCancel?.()
                props.onClose?.("")
              },
            })
          }}
          onClose={(event) => {
            event.currentTarget.close()
            setOpen(false)
            props.onClose?.(event.currentTarget.returnValue)
          }}
          onCancel={(event) => {
            event.currentTarget.close()
            setOpen(false)
            props.onCancel?.()
            props.onClose?.("")
          }}
          inert={!open()}
        >
          <div class="bg-z-body m-auto max-h-full w-full max-w-lg scale-95 overflow-y-auto rounded-lg px-6 py-6 opacity-0 shadow-lg transition group-open:scale-100 group-open:opacity-100">
            {props.children}
          </div>
        </dialog>
      </div>
    </Portal>
  )
}

export type CloseFn<T> = (value: T) => void

export function popup<T>(props: {
  owner: Owner | null
  children: (close: CloseFn<T>) => JSX.Element
  onCancel: Exclude<NoInfer<T>, Function> | ((close: CloseFn<T>) => void)
}): Promise<T> {
  return new Promise((resolve) => {
    let modal: ModalRef
    let portal: HTMLDivElement

    runWithOwner(props.owner, () => {
      const inner = createMemo(() => props.children(close as CloseFn<T>))

      // return isn't strictly necessary, but it makes syntax highlighting work,
      // so we keep it
      return (
        <Modal
          ref={(e) => (modal = e)}
          refPortal={(e) => (portal = e)}
          onCancel={() => {
            if (typeof props.onCancel == "function") {
              ;(props.onCancel as (close: (value: T) => void) => void)(close)
            } else {
              close(props.onCancel)
            }
          }}
          onClose={() => {
            portal.ontransitionend = () => portal.remove()
          }}
        >
          {inner()}
        </Modal>
      )
    })

    setTimeout(() => modal!.showModal(), 1)

    function close(value: T) {
      resolve(value)
      modal.close("")
    }
  })
}

export function confirm(props: {
  owner: Owner | null
  title: JSX.Element
  description?: JSX.Element
  cancelText: string
  okText: string
}): Promise<boolean> {
  return popup({
    owner: props.owner,
    children(close) {
      return (
        <>
          <ModalTitle>{props.title}</ModalTitle>
          {props.description}
          <ModalButtons>
            <ModalCancel onClick={() => close(false)}>
              {props.cancelText}
            </ModalCancel>
            <ModalConfirm onClick={() => close(true)}>
              {props.okText}
            </ModalConfirm>
          </ModalButtons>
        </>
      )
    },
    onCancel: false,
  })
}

export function alert(props: {
  owner: Owner | null
  title: JSX.Element
  description?: JSX.Element
  okText?: string
}): Promise<void> {
  return popup<void>({
    owner: props.owner,
    children(close) {
      return (
        <>
          <ModalTitle>{props.title}</ModalTitle>
          {props.description}
          <ModalButtons>
            <ModalConfirm onClick={() => close()}>
              {props.okText || "OK"}
            </ModalConfirm>
          </ModalButtons>
        </>
      )
    },
    onCancel: undefined,
  })
}

export function prompt(props: {
  owner: Owner | null
  title: JSX.Element
  description?: JSX.Element
  cancelText?: string
  okText?: string
  value?: string
}): Promise<string | undefined> {
  return popup({
    owner: props.owner,
    children(close) {
      let value = untrack(() => props.value)

      return (
        <>
          <ModalTitle>{props.title}</ModalTitle>
          {props.description}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              close(value)
            }}
          >
            <ModalField
              value={untrack(() => props.value)}
              onInput={(el) => (value = el.currentTarget.value)}
            />
          </form>
          <ModalButtons>
            <ModalCancel onClick={() => close(undefined)}>
              {props.cancelText || "Cancel"}
            </ModalCancel>
            <ModalConfirm onClick={() => close(value)}>
              {props.okText || "OK"}
            </ModalConfirm>
          </ModalButtons>
        </>
      )
    },
    onCancel: "",
  })
}

export function loading(
  owner: Owner | null,
  message?: () => JSX.Element,
  /** If present, shows a cancel button. */
  onCancel?: () => void,
) {
  let close!: () => void

  popup<void>({
    owner,
    onCancel() {},
    children(c) {
      close = c
      return (
        <>
          <ModalTitle>Loading...</ModalTitle>
          {message?.()}
          <Show when={onCancel}>
            <ModalButtons>
              <ModalCancel
                onClick={() => {
                  c()
                  onCancel!()
                }}
              >
                Cancel
              </ModalCancel>
            </ModalButtons>
          </Show>
        </>
      )
    },
  })

  return close
}

export function load<T>(
  owner: Owner | null,
  value: T,
  message?: () => JSX.Element,
  cancelable?: false,
): Promise<Awaited<T>>

export function load<T>(
  owner: Owner | null,
  value: T,
  message?: () => JSX.Element,
  cancelable?: boolean,
): Promise<Awaited<T> | null>

export function load<T>(
  owner: Owner | null,
  value: T,
  message?: () => JSX.Element,
  cancelable?: boolean,
) {
  return new Promise<Awaited<T> | null>(async (resolve) => {
    const close = loading(
      owner,
      message,
      cancelable ? () => resolve(null) : undefined,
    )
    const v = await value
    close()
    resolve(v)
  })
}
