import type { BasicTree, BasicTreeOf } from "@/lib/basic-tree"
import {
  faCheck,
  faChevronRight,
  faCircle,
  faMinus,
} from "@fortawesome/free-solid-svg-icons"
import {
  For,
  JSX,
  batch,
  createEffect,
  createSignal,
  onMount,
  untrack,
} from "solid-js"
import { Fa } from "./Fa"

export function Checkbox(props: {
  onInput?(value: boolean): void
  marksGroup?: boolean
  checked?: boolean
  disabled?: boolean
  indeterminate?: boolean
  circular?: boolean
}) {
  return (
    <>
      <input
        class="sr-only"
        classList={{ "z-group-checkbox": props.marksGroup }}
        type="checkbox"
        checked={props.checked}
        onInput={(event) => props.onInput?.(event.currentTarget.checked)}
        ref={(el) => {
          createEffect(() => {
            el.checked = !!props.checked
            el.indeterminate = !!props.indeterminate
            setTimeout(() =>
              el.dispatchEvent(
                new CustomEvent("reevaluate-group-checkboxes", {
                  bubbles: true,
                }),
              ),
            )
          })
        }}
        disabled={props.disabled}
      />

      <div
        class="group-checkbox flex h-6 cursor-pointer select-none items-center justify-center"
        classList={{ "opacity-30": props.disabled }}
        role="button"
      >
        <div
          class="bg-z-body [:focus-visible+*>&]:border-z-focus [:focus-visible+*>&]:ring-z-focus relative flex h-5 w-5 items-center justify-center rounded border border-transparent ring ring-transparent transition-[box-shadow,border-color] [:checked+.group-checkbox_&]:bg-[--z-bg-checkbox-selected] [:indeterminate+.group-checkbox_&]:bg-[--z-bg-checkbox-selected]"
          classList={{ "rounded-full": props.circular }}
        >
          <div
            class="border-z [:focus-visible+*>*>&]:border-z-focus absolute -m-px size-[calc(100%_+_2px)] rounded border [:checked+.group-checkbox_&]:hidden [:indeterminate+.group-checkbox_&]:hidden"
            classList={{ "rounded-full": props.circular }}
          />

          <Fa
            class={
              "icon-[--z-text-checkbox-selected] hidden [:checked:not(:indeterminate)+.group-checkbox_&]:block " +
              (props.circular ? "size-2" : "size-4")
            }
            icon={props.circular ? faCircle : faCheck}
            title="checked"
          />

          <Fa
            class="icon-[--z-text-checkbox-selected] hidden h-4 w-4 [:indeterminate+.group-checkbox_&]:block"
            icon={faMinus}
            title="indeterminate"
          />
        </div>
      </div>
    </>
  )
}

export function CheckboxGroup(props: {
  label: string
  onExpanded?(value: boolean): void
  children?: JSX.Element
  expanded?: boolean
}) {
  const [expanding, setExpanding] = createSignal(false)
  const [checked, setChecked] = createSignal(false)
  const [indeterminate, setIndeterminate] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  let getInputs: () => HTMLCollectionOf<HTMLInputElement>
  let inner: HTMLDivElement | undefined

  let last = untrack(() => props.expanded)
  createEffect(() => {
    if (last == props.expanded) {
      return
    }

    last = props.expanded
    setExpanding(true)

    if (!inner) {
      return
    }

    inner.classList.remove("hidden")
  })
  onMount(() => {
    if (!props.expanded) {
      inner?.classList.add("hidden")
    }
    setExpanding(false)
  })

  return (
    <li class="flex flex-col" classList={{ "z-expanding": expanding() }}>
      <div class="flex w-full gap-2">
        <button
          class="z-expand-checkbox-group"
          classList={{ "z-expanded-now": props.expanded }}
          // @ts-ignore solid is fine with this
          onforceopen={() => props.onExpanded?.(true)}
          // @ts-ignore solid is fine with this
          onforceclose={() => props.onExpanded?.(false)}
          onClick={() => props.onExpanded?.(!props.expanded)}
          onContextMenu={(event) => {
            if (!inner) {
              return
            }

            event.preventDefault()

            const dropdowns = Array.from(
              inner.getElementsByClassName("z-expand-checkbox-group"),
            ).concat(event.currentTarget)

            batch(() => {
              if (
                dropdowns.every((x) => x.classList.contains("z-expanded-now"))
              ) {
                for (const d of dropdowns) {
                  d.dispatchEvent(new CustomEvent("forceclose"))
                  props.onExpanded?.(false)
                }
              } else {
                for (const d of dropdowns) {
                  d.dispatchEvent(new CustomEvent("forceopen"))
                  props.onExpanded?.(true)
                }
              }
            })
          }}
        >
          <Fa
            class={"h-3 w-3 transition" + (props.expanded ? " rotate-90" : "")}
            icon={faChevronRight}
            title="expand section"
          />
        </button>

        <label class="flex w-full gap-2">
          <Checkbox
            checked={checked()}
            indeterminate={indeterminate()}
            disabled={disabled()}
            marksGroup
            onInput={(checked) => {
              const cbs = Array.from(getInputs()).filter(
                (el) =>
                  el.type == "checkbox" &&
                  !el.classList.contains("z-group-checkbox"),
              )

              batch(() => {
                cbs.forEach((x) => {
                  x.checked = checked
                  x.dispatchEvent(new InputEvent("input", { bubbles: true }))
                })
              })
            }}
          />

          <span>{props.label}</span>
        </label>
      </div>

      <div
        class="overflow-clip transition-[max-height]"
        classList={{
          "max-h-[--max-height]": props.expanded,
          "[&:has(.z-expanding)]:max-h-auto": props.expanded,
          "[&:has(.z-expanding)]:transition-none": props.expanded,
          "max-h-0": !props.expanded,
          "[.z-expanding_&]:transition-none": !expanding(),
        }}
        ref={(el) => (inner = el)}
        onTransitionEnd={(event) => {
          if (event.currentTarget != event.target) return
          if (!props.expanded) event.currentTarget.classList.add("hidden")
          setExpanding(false)
        }}
        inert={!props.expanded}
        aria-hidden={!props.expanded}
      >
        <ul
          class="flex flex-col gap-1 pl-6 [&>:first-child]:mt-1"
          ref={(el) => {
            const observer = new ResizeObserver(([entry]) => {
              const { height } = entry!.contentRect || entry!.contentBoxSize
              // if (height == 0) return
              el.parentElement?.style.setProperty("--max-height", height + "px")
            })
            observer.observe(el, { box: "content-box" })

            const checkboxes = el.getElementsByTagName("input")
            function updateSelf() {
              const cbs = Array.from(checkboxes).filter(
                (el) =>
                  el.type == "checkbox" &&
                  !el.classList.contains("z-group-checkbox"),
              )

              const hasUnchecked = cbs.some((x) => !x.checked)
              const hasChecked = cbs.some((x) => x.checked)

              setIndeterminate(hasUnchecked && hasChecked)
              setChecked(!hasUnchecked)
              setDisabled(!hasUnchecked && !hasChecked)
            }

            updateSelf()
            el.addEventListener("input", updateSelf)
            el.addEventListener("reevaluate-group-checkboxes", updateSelf)

            getInputs = () => checkboxes
          }}
        >
          {props.children}
        </ul>
      </div>
    </li>
  )
}

export function CheckboxItem(props: {
  label: string
  onInput?(value: boolean): void
  checked?: boolean
}) {
  return (
    <li class="flex flex-col">
      <label class="flex w-full gap-2 pl-5">
        <Checkbox onInput={props.onInput} checked={props.checked} />

        <span>{props.label}</span>
      </label>
    </li>
  )
}

export function CheckboxNode<T>(props: {
  key: string
  parent: readonly string[]
  isLeaf: (value: BasicTreeOf<T> | T) => value is T
  node: BasicTreeOf<T> | T
  tree: BasicTree<T>
}) {
  if (props.isLeaf(props.node)) {
    return (
      <CheckboxItem
        label={props.key}
        checked={props.tree.isEnabled(props.parent, props.key)}
        onInput={(enabled) =>
          props.tree.toggleEnabled(props.parent, props.key, enabled)
        }
      />
    )
  } else {
    return (
      <CheckboxGroup
        label={props.key}
        expanded={props.tree.isExpanded(props.parent, props.key)}
        onExpanded={(enabled) =>
          props.tree.toggleExpanded(props.parent, props.key, enabled)
        }
      >
        <For each={Object.entries(props.node)}>
          {([key, node]) => (
            <CheckboxNode<T>
              key={key}
              isLeaf={props.isLeaf}
              node={node}
              tree={props.tree}
              parent={props.parent.concat(props.key)}
            />
          )}
        </For>
      </CheckboxGroup>
    )
  }
}

export function CheckboxTree<T>(props: { tree: BasicTree<T> }) {
  return (
    <For each={Object.entries(props.tree.tree)}>
      {([key, node]) => (
        <CheckboxNode<T>
          key={key}
          isLeaf={props.tree.isLeaf}
          node={node}
          tree={props.tree}
          parent={[]}
        />
      )}
    </For>
  )
}
