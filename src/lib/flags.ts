import * as regular from "@fortawesome/free-regular-svg-icons"
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons"
import * as solid from "@fortawesome/free-solid-svg-icons"

export interface FlagInfo {
  valueOf(): number
  readonly bg: `bg-${string} dark:bg-${string}`
  readonly text: `text-${string}`
  readonly color: string
}

export const ALL_FLAGS: readonly FlagInfo[] = [
  {
    valueOf: () => 0,
    color: "red",
    bg: "bg-red-200 dark:bg-red-800",
    text: "text-red-500",
  },
  {
    valueOf: () => 1,
    color: "orange",
    bg: "bg-orange-200 dark:bg-orange-800",
    text: "text-orange-500",
  },
  {
    valueOf: () => 2,
    color: "green",
    bg: "bg-green-200 dark:bg-green-800",
    text: "text-green-500",
  },
  {
    valueOf: () => 3,
    color: "blue",
    bg: "bg-blue-200 dark:bg-blue-800",
    text: "text-blue-500",
  },
  {
    valueOf: () => 4,
    color: "pink",
    bg: "bg-pink-200 dark:bg-pink-800",
    text: "text-pink-500",
  },
  {
    valueOf: () => 5,
    color: "teal",
    bg: "bg-teal-200 dark:bg-teal-800",
    text: "text-teal-500",
  },
  {
    valueOf: () => 6,
    color: "purple",
    bg: "bg-purple-200 dark:bg-purple-800",
    text: "text-purple-500",
  },
]

export interface MarkInfo {
  valueOf(): number
  readonly fill: IconDefinition
  readonly outline: IconDefinition
  readonly shape: string
}

export const ALL_MARKS: readonly MarkInfo[] = [
  {
    valueOf: () => 0,
    fill: solid.faSquare,
    outline: regular.faSquare,
    shape: "square",
  },
  {
    valueOf: () => 1,
    fill: solid.faCircle,
    outline: regular.faCircle,
    shape: "circle",
  },
  {
    valueOf: () => 2,
    fill: solid.faHeart,
    outline: regular.faHeart,
    shape: "heart",
  },
  {
    valueOf: () => 3,
    fill: solid.faStar,
    outline: regular.faStar,
    shape: "star",
  },
  {
    valueOf: () => 4,
    fill: solid.faComment,
    outline: regular.faComment,
    shape: "comment",
  },
  {
    valueOf: () => 5,
    fill: solid.faFile,
    outline: regular.faFile,
    shape: "file",
  },
  {
    valueOf: () => 6,
    fill: solid.faBookmark,
    outline: regular.faBookmark,
    shape: "bookmark",
  },
]

export function add(last: number, flag: { valueOf(): number }) {
  return last | (1 << flag.valueOf())
}

export function toggle(last: number, flag: { valueOf(): number }) {
  return last ^ (1 << flag.valueOf())
}

export function remove(last: number, flag: { valueOf(): number }) {
  return last & ~(1 << flag.valueOf())
}

export function has(flags: number, flag: { valueOf(): number }) {
  return !!(flags & (1 << flag.valueOf()))
}
