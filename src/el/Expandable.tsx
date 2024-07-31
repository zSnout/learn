import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import {
  For,
  JSX,
  batch,
  createEffect,
  createSignal,
  onMount,
  untrack,
} from "solid-js"
import type { NodeOf, NodeProps, TreeOf } from "../lib/tree"
import { Fa } from "./Fa"

export type SubtreeProps<T, U> = {
  data: T
  parent: string[]
  key: string
  subtree: TreeOf<T, U>
}

export type LeafProps<_T, U> = {
  data: U
  parent: string[]
  key: string
  subtree: undefined
}

// TODO: handle dropdowns with no dropdown children better

export function Expandable(props: {
  children?: JSX.Element
  label: JSX.Element
  expanded?: boolean
  setExpanded?(value: boolean): void
  z?: number
  shift?: boolean
  noGap?: boolean
}) {
  const [expanding, setExpanding] = createSignal(false)
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
      <div class="flex w-full">
        <button
          class="z-expand-checkbox-group"
          classList={{
            "z-expanded-now": props.expanded,
            relative: props.z != null,
            "pr-3": !props.shift,
            "pl-[0.625rem]": props.shift,
            "pr-[0.125rem]": props.shift,
          }}
          style={{ "z-index": props.z }}
          // @ts-ignore solid is fine with this
          onforceopen={() => props.setExpanded?.(true)}
          // @ts-ignore solid is fine with this
          onforceclose={() => props.setExpanded?.(false)}
          onClick={() => props.setExpanded?.(!props.expanded)}
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
                  props.setExpanded?.(false)
                }
              } else {
                for (const d of dropdowns) {
                  d.dispatchEvent(new CustomEvent("forceopen"))
                  props.setExpanded?.(true)
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

        {props.label}
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
          class="flex flex-col pl-6"
          classList={{ "gap-1": !props.noGap }}
          ref={(el) => {
            const observer = new ResizeObserver(([entry]) => {
              const { height } = entry!.contentRect || entry!.contentBoxSize
              // if (height == 0) return
              el.parentElement?.style.setProperty("--max-height", height + "px")
            })
            observer.observe(el, { box: "content-box" })
          }}
        >
          {/* this element provides appropriate spacing */}
          <div class="first:last:hidden" />
          {props.children}
        </ul>
      </div>
    </li>
  )
}

export function ExpandableTree<T, U>(props: {
  /** Main tree */
  tree: TreeOf<T, U>

  /** Whether to shift dropdowns */
  shift?: boolean

  /** Render subtree label */
  subtree: (props: SubtreeProps<T, U>) => JSX.Element

  /** Render leaf label */
  leaf: (props: LeafProps<T, U>) => JSX.Element

  /** Is expanded */
  isExpanded: (props: SubtreeProps<T, U>) => boolean

  /** Set expanded */
  setExpanded: (props: SubtreeProps<T, U>, expanded: boolean) => void

  /** Sort */
  sort?: (a: [string, NodeOf<T, U>], b: [string, NodeOf<T, U>]) => number

  /** Z-index of dropdowns */
  z?: number

  /** If `true`, forces no gaps to be included */
  noGap?: boolean
}) {
  const {
    subtree,
    leaf,
    isExpanded,
    setExpanded: rootSetExpanded,
    sort: __coreUnsafeSort,
    z,
    shift,
    noGap,
  } = props

  const sort =
    __coreUnsafeSort ?
      (entries: [string, NodeOf<T, U>][]): [string, NodeOf<T, U>][] =>
        entries.sort(__coreUnsafeSort)
    : (entries: [string, NodeOf<T, U>][]) => entries

  function SubtreeInner(props: {
    subtree: TreeOf<T, U>
    parent: string[]
  }): JSX.Element {
    return (
      <For each={sort(Object.entries(props.subtree))}>
        {([key, value]) => (
          <Node
            parent={props.parent}
            key={key}
            data={value.data as any}
            subtree={value.subtree as any}
          />
        )}
      </For>
    )
  }

  function Subtree(props: {
    subtree: TreeOf<T, U>
    data: T
    parent: string[]
    key: string
  }): JSX.Element {
    const [expanded, setExpanded] = createSignal(isExpanded(props))
    return (
      <Expandable
        label={subtree(props)}
        expanded={expanded()}
        setExpanded={(value) => {
          rootSetExpanded(props, value)
          setExpanded(value)
        }}
        z={z}
        shift={shift}
        noGap={noGap}
      >
        <SubtreeInner
          subtree={props.subtree}
          parent={props.parent.concat(props.key)}
        />
      </Expandable>
    )
  }

  function Leaf(props: {
    subtree: undefined
    data: U
    parent: string[]
    key: string
  }): JSX.Element {
    return leaf(props)
  }

  function Node(
    props:
      | { parent: string[]; key: string; subtree: TreeOf<T, U>; data: T }
      | { parent: string[]; key: string; subtree: undefined; data: U },
  ): JSX.Element {
    if (props.subtree) {
      return Subtree(props)
    } else {
      return Leaf(props)
    }
  }

  return (
    <ul class="flex flex-col" classList={{ "gap-1": !noGap }}>
      <SubtreeInner subtree={props.tree} parent={[]} />
    </ul>
  )
}

export function MonotypeExpandableTree<T, U>(props: {
  /** Main tree */
  tree: TreeOf<T, U>

  /** Whether to shift dropdown arrows */
  shift?: boolean

  /** Render node label */
  node: (props: NodeProps<T, U>) => JSX.Element

  /** Is expanded */
  isExpanded: (props: SubtreeProps<T, U>) => boolean

  /** Set expanded */
  setExpanded: (props: SubtreeProps<T, U>, expanded: boolean) => void

  /** Sort */
  sort?: (a: [string, NodeOf<T, U>], b: [string, NodeOf<T, U>]) => number

  /** Z-index of dropdowns */
  z?: number

  /** If `true`, forces no gaps to be included */
  noGap?: boolean
}) {
  return (
    <ExpandableTree
      isExpanded={props.isExpanded}
      leaf={props.node}
      setExpanded={props.setExpanded}
      tree={props.tree}
      subtree={props.node}
      sort={props.sort}
      z={props.z}
      shift={props.shift}
      noGap={props.noGap}
    />
  )
}
