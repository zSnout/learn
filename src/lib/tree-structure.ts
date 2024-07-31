import { pray } from "./pray"

export type SubtreeOf<T, U> = { subtree: TreeOf<T, U>; data: T }
export type LeafOf<U> = { subtree?: undefined; data: U }
export type NodeOf<T, U> = SubtreeOf<T, U> | LeafOf<U>
export type TreeOf<T, U> = { [name: PropertyKey]: NodeOf<T, U> }

export class Tree<T, U> {
  constructor(readonly tree: TreeOf<T, U> = Object.create(null)) {}

  set(
    path: readonly PropertyKey[],
    leaf: U,
    leafToSubtree: (leaf: U) => T,
    newSubtree: (path: PropertyKey[]) => T,
    mergeFromLeaf: (current: U, next: U) => U,
    mergeFromSubtree: (current: T, next: U) => T,
  ) {
    let tree = this.tree

    const last = path[path.length - 1]
    pray(last != null, "the path must have at least one segment")

    for (let index = 0; index < path.length - 1; index++) {
      const part = path[index]!
      const next = tree[part]

      if (next == null) {
        const subtree = Object.create(null)
        tree[part] = { subtree, data: newSubtree(path.slice(0, index + 1)) }
        tree = subtree
      } else if (!next.subtree) {
        const subtree = Object.create(null)
        tree[part] = { subtree, data: leafToSubtree(next.data) }
        tree = subtree
      } else {
        tree = next.subtree
      }
    }

    const next = tree[last]

    if (next == null) {
      tree[last] = { data: leaf }
    } else if (!next.subtree) {
      next.data = mergeFromLeaf(next.data, leaf)
    } else {
      next.data = mergeFromSubtree(next.data, leaf)
    }
  }
}
