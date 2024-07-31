type Reason<R extends string> =
  R extends "" ? never
  : string extends R ? never
  : R

export function pray<R extends string>(
  x: boolean,
  reason: Reason<R>,
): asserts x {
  if (!x) {
    throw new Error(reason, { cause: "prayer failed" })
  }
}

export function prayTruthy<R extends string>(
  x: unknown,
  reason: Reason<R>,
): asserts x {
  if (!x) {
    throw new Error(reason, { cause: "prayer failed" })
  }
}

export function notNull<T, R extends string>(
  value: T,
  reason: Reason<R>,
): T & {} {
  if (value == null) {
    throw new Error(reason, { cause: "prayer failed" })
  }

  return value
}
