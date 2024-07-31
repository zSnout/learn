import * as v from "valibot"

export function randomId(): Id {
  return (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1) as Id
}

export function timestampId(now: number | Date): Id {
  return now.valueOf() satisfies number as Id
}

export function idOf(id: string | number | bigint | Date): Id {
  id = Number(id)

  if (Number.isSafeInteger(id)) {
    return id as Id
  } else {
    throw new Error("Invalid id '" + id + "'")
  }
}

export const ID_ZERO = idOf(0)

export const IdKey = v.string()

export const Id = v.pipe(
  v.number(),
  v.check((x) => Number.isSafeInteger(x)),
  v.brand("id"),
)

export type Id = v.InferOutput<typeof Id>
