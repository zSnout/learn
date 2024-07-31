import type {
  ChartCard,
  ChartComputedInfo,
  ChartData,
  ChartDataEntry,
  ChartOption,
} from "@/lib/types"
import type { BindingSpec, SqlValue } from "@sqlite.org/sqlite-wasm"
import { user_query } from "./user_query"

function axis(
  label: `${"main" | "cross"} axis ${"minimum" | "maximum" | "group size"}`,
  value: string,
  binding: BindingSpec,
) {
  if (!value.trim()) {
    return null
  }

  const numeric = +value.trim()
  if (Number.isFinite(numeric)) {
    return numeric
  }

  const entries = user_query(value, false, binding)
  const row = entries[entries.length - 1]?.values
  if (!row || !row[0] || row.length != 1 || row[0].length != 1) {
    throw new Error("Query for " + label + " must return exactly one value.")
  }

  const cell = row[0][0]
  if (Number.isFinite(cell)) {
    return cell as number
  } else if (cell == null) {
    return null
  } else {
    throw new Error("Query for " + label + " must return a number or null.")
  }
}

function options(options: ChartOption[]) {
  const result: Record<string, SqlValue> = {}
  for (const { name, value } of options) {
    result[name] = typeof value == "boolean" ? +value : value
  }
  return result
}

function max<A extends string | number, B extends string | number>(
  a: A,
  b: B,
): A | B {
  if (typeof a == "string") {
    if (a < String(b)) return b
    return a
  }
  if (typeof b == "string") {
    if (b < String(a)) return a
    return b
  }
  return Math.max(a as number, b as number) as A | B
}

function min<A extends string | number, B extends string | number>(
  a: A,
  b: B,
): A | B {
  if (typeof a == "string") {
    if (a > String(b)) return b
    return a
  }
  if (typeof b == "string") {
    if (b > String(a)) return a
    return b
  }
  return Math.min(a as number, b as number) as A | B
}

function groupData(
  data: ChartData,
  min: number,
  max: number,
  size: number,
): ChartData {
  if (data.length == 0) {
    return []
  }

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min > max ||
    !Number.isFinite(size) ||
    size <= (max - min) / 200
  ) {
    return data
  }

  const els = data[0]?.[1].length

  if (els == null) {
    return []
  }

  const bucketCount = Math.floor((max - min) / size) + 1

  const bucketOf = (x: number) => {
    if (x == max) {
      return bucketCount - 1
    }
    const index = Math.floor((x - min) / size)
    return index
  }

  const retval: ChartData = Array.from({ length: bucketCount }, (_, index) => [
    min + index * size,
    Array.from({ length: els }, () => 0),
  ])

  for (const [label, values] of data) {
    const idx = bucketOf(+label)
    if (idx < 0 || idx >= bucketCount) {
      continue
    }
    for (let i = 0; i < values.length; i++) {
      retval[idx]![1][i]! += values[i]!
    }
  }

  return retval
}

export function chart_compute(chart: ChartCard): ChartComputedInfo | null {
  const bindings = options(chart.options)

  const entries = user_query(chart.query, false, bindings)
  const raw = entries[entries.length - 1]
  if (!raw) {
    throw new Error("The main query returned no data.")
  }
  if (raw.columns.length < 2) {
    throw new Error("The main query must return at least two columns.")
  }
  let data = raw.values.map<ChartDataEntry>(([label, ...values]) => {
    if (!(typeof label == "string" || typeof label == "number")) {
      throw new Error("All labels must be strings, numbers, or null.")
    }

    if (!values.every((x) => typeof x == "number")) {
      throw new Error("All values must be numbers.")
    }

    return [label, values]
  })

  if (data.length == 0) {
    return null
  }

  if (!data.some(([, values]) => values.some((x) => x != null))) {
    return null
  }

  const autoMainAxisMin = data.map((x) => x[0]).reduce(min)
  const autoMainAxisMax = data.map((x) => x[0]).reduce(max)
  const autoCrossAxisMin = data.flatMap((x) => x[1]).reduce(min)
  const autoCrossAxisMax = data.flatMap((x) => x[1]).reduce(max)

  // bindings["$auto_main_min"] = autoMainAxisMin
  // bindings["$auto_main_max"] = autoMainAxisMax
  // bindings["@autocrossmin"] = autoCrossAxisMin
  // bindings["@autocrossmax"] = autoCrossAxisMax

  const mainMin =
    axis("main axis minimum", chart.chart.mainAxis.min, bindings) ??
    autoMainAxisMin
  const mainMax =
    axis("main axis maximum", chart.chart.mainAxis.max, bindings) ??
    autoMainAxisMax
  // bindings["@mainmin"] = mainMin
  // bindings["@mainmax"] = mainMax

  // group size can only work on purely numeric values
  let groupSize =
    typeof mainMin == "number" && typeof mainMax == "number" ?
      axis("main axis group size", chart.chart.mainAxis.groupSize, bindings)
    : null
  if (groupSize != null && chart.chart.mainAxis.groupSizeIsPercentage) {
    groupSize = ((mainMax as number) - (mainMin as number)) * (groupSize / 100)
  }

  const crossMin =
    axis("cross axis minimum", chart.chart.crossAxis.min, bindings) ??
    autoCrossAxisMin
  const crossMax =
    axis("cross axis minimum", chart.chart.crossAxis.max, bindings) ??
    autoCrossAxisMax

  if (groupSize != null) {
    data = groupData(data, mainMin as number, mainMax as number, groupSize)
  }

  return {
    data,
    crossAxis: { min: crossMin, max: crossMax },
  }
}
