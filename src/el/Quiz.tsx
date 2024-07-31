import type { JSX } from "solid-js"

export type Leaf = DirectTreeCard | Generator

export class PartialCard {
  static of(base: Leaf, id: string | undefined): PartialCard {
    if (base instanceof DirectTreeCard) {
      return base.toPartial()
    } else if (base instanceof Generator) {
      return base.generate(id)
    } else {
      throw new TypeError("Invalid card generator.")
    }
  }

  private declare __brand

  constructor(
    readonly short: string,
    readonly front: JSX.Element,
    readonly back: JSX.Element,
    readonly source: readonly string[],
    readonly id: string,
  ) {}

  toCard(path: readonly string[], lastInterval: number | undefined): Card {
    return { ...this, path: path, answerShown: false, lastInterval }
  }
}

export class DirectTreeCard {
  private declare __brand2

  constructor(
    readonly short: string,
    readonly front: JSX.Element,
    readonly back: JSX.Element,
    readonly source: readonly string[],
    readonly weight: number,
  ) {}

  toPartial(): PartialCard {
    return new PartialCard(this.short, this.front, this.back, this.source, "")
  }
}

export class Generator {
  private declare __brand3
  readonly weight: number

  constructor(
    readonly generate: (id?: string | undefined) => PartialCard,
    readonly cardCount: number,
  ) {
    this.weight = 1
  }
}

export interface Card {
  readonly front: JSX.Element
  readonly back: JSX.Element
  readonly path: readonly string[]
  readonly id: string
  readonly answerShown: boolean
  readonly source: readonly string[]
  readonly short: string
  readonly lastInterval: number | undefined
}

// receives a number in seconds
export function timestampDist(dist: number) {
  dist = Math.round(dist / 5) * 5

  if (dist < 5) {
    return "now"
  }

  if (dist < 60) {
    return dist + "s"
  }

  dist = Math.round(dist / 60)

  if (dist < 60) {
    return dist + "m"
  }

  dist = Math.round(dist / 60)

  if (dist < 24) {
    return dist + "hr"
  }

  dist = Math.round(dist / 24)

  if (dist < 30) {
    return dist + "d"
  }

  dist = Math.round((dist / 30) * 10) / 10

  if (dist < 12) {
    return dist + "mo"
  }

  dist = Math.round(((dist * 30) / 365) * 10) / 10

  return dist + "yr"
}
