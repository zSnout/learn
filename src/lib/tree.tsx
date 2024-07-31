import { For, JSX } from "solid-js"
import { Tree, type TreeOf } from "./tree-structure"

export * from "./tree-structure"

export interface SubtreeProps<T, U> {
  data: T
  key: string
  children: JSX.Element
  parent: readonly string[]
  subtree: TreeOf<T, U>
}

export interface LeafProps<U> {
  data: U
  key: string
  children?: undefined
  parent: readonly string[]
  subtree?: undefined
}

export interface NodeProps<T, U = T> {
  data: T | U
  key: string
  children?: JSX.Element | undefined
  parent: readonly string[]
  subtree?: TreeOf<T, U>
}

function RenderTreeInner<T, U>(props: {
  tree: TreeOf<T, U>
  subtree: (props: SubtreeProps<T, U>) => JSX.Element
  leaf: (props: LeafProps<U>) => JSX.Element
  path: readonly string[]
}) {
  return (
    <For each={Object.entries(props.tree)}>
      {([key, value]) => {
        if (value.subtree) {
          return props.subtree({
            children: (
              <RenderTreeInner
                tree={value.subtree}
                subtree={props.subtree}
                leaf={props.leaf}
                path={props.path.concat(key)}
              />
            ),
            data: value.data,
            key,
            parent: props.path,
            subtree: value.subtree,
          })
        } else {
          return props.leaf({
            data: value.data,
            key,
            parent: props.path,
          })
        }
      }}
    </For>
  )
}

export function RenderTree<T, U>(props: {
  tree: TreeOf<T, U> | Tree<T, U>
  subtree: (props: SubtreeProps<T, U>) => JSX.Element
  leaf: (props: LeafProps<U>) => JSX.Element
}) {
  return (
    <RenderTreeInner
      tree={props.tree instanceof Tree ? props.tree.tree : props.tree}
      leaf={props.leaf}
      subtree={props.subtree}
      path={[]}
    />
  )
}

export function RenderUniformTree<T, U>(props: {
  tree: TreeOf<T, U> | Tree<T, U>
  children: (props: NodeProps<T, U>) => JSX.Element
}) {
  return (
    <RenderTreeInner
      tree={props.tree instanceof Tree ? props.tree.tree : props.tree}
      leaf={props.children}
      subtree={props.children}
      path={[]}
    />
  )
}
