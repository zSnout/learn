import { createSignal, untrack, type Accessor, type Setter } from "solid-js"

export type Json =
  | string
  | number
  | boolean
  | null
  | readonly Json[]
  | JsonObject

export type JsonObject = { readonly [x: string]: Json }

export type BasicTreeOf<T> = { [name: string]: BasicTreeOf<T> | T }

export type DataV1 = {
  version: 1
  enabled: BasicTreeOf<boolean>
  expanded: BasicTreeOf<boolean>
}

export class BasicTree<T> {
  enabled: Accessor<BasicTreeOf<boolean>>
  setEnabled: Setter<BasicTreeOf<boolean>>

  // the "" key is used in these trees to mark whether a group is expanded
  expanded: Accessor<BasicTreeOf<boolean>>
  setExpanded: Setter<BasicTreeOf<boolean>>

  constructor(
    readonly tree: BasicTreeOf<T>,
    readonly isLeaf: (value: BasicTreeOf<T> | T) => value is T,
  ) {
    ;[this.enabled, this.setEnabled] = createSignal(Object.create(null))
    ;[this.expanded, this.setExpanded] = createSignal(Object.create(null))
  }

  count(weight: (leaf: T) => number = () => 1) {
    let leaves = 0
    let groups = 0

    const count = (tree: BasicTreeOf<T>) => {
      for (const key in tree) {
        const value = tree[key]!
        if (this.isLeaf(value)) {
          leaves += weight(value)
        } else {
          groups++
          count(value)
        }
      }
    }

    count(this.tree)

    return { leaves, groups }
  }

  toggleEnabled(parent: readonly string[], key: string, enabled: boolean) {
    const full = structuredClone(this.enabled())
    let obj = full

    for (const k of parent) {
      const next = obj[k]

      if (typeof next == "object") {
        obj = next
      } else {
        obj = obj[k] = {}
      }
    }

    obj[key] = enabled

    this.setEnabled(full)
  }

  toggleExpanded(parent: readonly string[], key: string, expanded: boolean) {
    const full = structuredClone(this.expanded())
    let obj = full

    for (const k of [...parent, key]) {
      const next = obj[k]

      if (typeof next == "object") {
        obj = next
      } else {
        obj = obj[k] = {}
      }
    }

    obj[""] = expanded

    this.setExpanded(full)
  }

  isEnabled(parent: readonly string[], key: string) {
    let obj = this.enabled()

    for (const k of parent) {
      const next = obj[k]

      if (typeof next == "object") {
        obj = next
      } else {
        return false
      }
    }

    const next = obj[key]

    if (typeof next == "boolean") {
      return next
    }

    return false
  }

  isExpanded(parent: readonly string[], key: string) {
    let obj = this.expanded()

    for (const k of parent) {
      const next = obj[k]

      if (typeof next == "object") {
        obj = next
      } else {
        return false
      }
    }

    const next = obj[key]

    if (typeof next == "object") {
      const final = next[""]

      if (typeof final == "boolean") {
        return final
      }
    }

    return false
  }

  importV1(data: object) {
    function checkIsBoolTree(tree: unknown): tree is BasicTreeOf<boolean> {
      if (
        typeof tree != "object" ||
        tree == null ||
        // instanceof satisfies TypeScript, Array.isArray satisfies the browser
        tree instanceof Array ||
        Array.isArray(tree)
      ) {
        return false
      }

      for (const key in tree) {
        const val = (tree as Record<string, unknown>)[key]

        if (
          typeof val == "object" ?
            !checkIsBoolTree(val)
          : typeof val != "boolean"
        ) {
          return false
        }
      }

      return true
    }

    if ("enabled" in data && checkIsBoolTree(data.enabled)) {
      this.setEnabled(data.enabled)
    }

    if ("expanded" in data && checkIsBoolTree(data.expanded)) {
      this.setExpanded(data.expanded)
    }
  }

  importJSON(data: unknown) {
    if (
      typeof data != "object" ||
      data == null ||
      !("version" in data) ||
      typeof data.version != "number"
    ) {
      throw new Error("Expected an object with a `version` property.")
    }

    if (data.version == 1) {
      return this.importV1(data)
    }

    throw new Error(
      "Unknown data storage version. Reload the page and try again.",
    )
  }

  toJSON(): DataV1 & Json {
    return {
      version: 1,
      enabled: this.enabled(),
      expanded: this.expanded(),
    }
  }

  choose(weight: (leaf: T) => number = () => 1) {
    const nodes: [T, number, string[]][] = []

    const getEnabledNodes = (
      tree: BasicTreeOf<T>,
      enabled: BasicTreeOf<boolean>,
      path: string[],
    ) => {
      for (const key in tree) {
        const value = tree[key]!
        const e = enabled[key]

        if (this.isLeaf(value)) {
          if (e === true) {
            nodes.push([value, weight(value), [...path, key]])
          }
        } else {
          getEnabledNodes(value, typeof e == "object" ? e : {}, [...path, key])
        }
      }
    }

    getEnabledNodes(this.tree, untrack(this.enabled), [])

    let total = 0

    for (const [, value] of nodes) {
      total += value
    }

    let index = Math.random() * total

    for (const [node, value, path] of nodes) {
      if (index < value) {
        return { node, path }
      } else {
        index -= value
      }
    }

    return undefined
  }
}
