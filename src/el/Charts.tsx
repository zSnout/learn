import { timestampDist } from "@/el/Quiz"
import { isDark } from "@/lib/theme"
import type {
  Chart,
  ChartCard,
  ChartColors,
  ChartComputedInfo,
  ChartLabelFormat,
  ChartOption,
  ChartStyle,
} from "@/lib/types"
import { For, Match, Show, Switch } from "solid-js"
import { Checkbox } from "./CheckboxGroup"

// export interface ChartBar extends ChartBase<"bar"> {
//   /** Whether to space bars. */ space: boolean
//   rounded: boolean
// }

// export interface ChartLine extends ChartBase<"line"> {
//   /** @deprecated Fill type. */ fill: "none" | "solid" | "gradient"
//   /** @deprecated Sharpness of the line. */ mode: "sharp" | "curve" | "step"
//   /** @deprecated Whether to show dots. */ dots: true | false | "hole"
// }

// export interface ChartPie extends ChartBase<"pie"> {
//   /** @deprecated What to show in the center. */
//   center:
//     | { title: number | string; subtitle: number | string | null }
//     | "hole"
//     | "filled"
// }

function display(value: string | number, format: ChartLabelFormat) {
  if (format == "preserve") {
    return value
  }

  if (format == "numeric") {
    const str = (+value).toString()
    if ((str.match(/\d/g)?.length ?? 0) > 3) {
      return (+value).toPrecision(3)
    } else {
      return str
    }
  }

  if (format == "date" || format == "time") {
    const locale = new Intl.DateTimeFormat(
      undefined,
      format == "date" ?
        {
          day: "2-digit",
          month: "numeric",
        }
      : { hour: "2-digit", minute: "2-digit" },
    )
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
      return "???"
    } else {
      return locale.format(d)
    }
  }

  if (format == "dt-offset") {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
      return "???"
    } else {
      const delta = (d.getTime() - Date.now()) / 1000
      if (delta > 0) {
        return timestampDist(delta)
      } else {
        return "-" + timestampDist(-delta)
      }
    }
  }

  throw new Error("Unsupported display format.")
}

export function DrawChartBar(
  chart: Chart,
  style: ChartStyle,
  info: ChartComputedInfo | null,
  colors: ChartColors,
) {
  const {
    data,
    crossAxis: { min, max },
  } = info ?? { data: [], crossAxis: { min: 0, max: 1 } }

  const color = (index: number) => colors[index % colors.length]?.[+isDark()]

  return (
    <div
      class="relative flex flex-1 transform"
      classList={{ "gap-2": chart.space }}
    >
      <Bars />
      <GridY />
    </div>
  )

  function Bars() {
    return (
      <For each={data}>
        {([label, values], labelIndex) => (
          <div class="relative flex h-full flex-1 transform flex-col">
            {DrawValues(values, labelIndex)}
            {DrawLabel(label)}
          </div>
        )}
      </For>
    )
  }

  function GridY() {
    const d = (max - min) / 6
    const exp = 10 ** Math.floor(Math.log10(d))
    const q = Math.ceil(d / exp) * exp
    const A = Math.floor(min / q) * q

    return (
      <div
        class="border-z-grid-line fixed left-0 right-0 top-0 transform"
        classList={{
          "bottom-6": chart.mainAxis.label.display == "separate",
          "bottom-0": chart.mainAxis.label.display != "separate",
          "border-b": chart.mainAxis.label.display == "separate",
        }}
      >
        <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
          {(x) => <Label value={A + x * q} />}
        </For>
      </div>
    )

    function Label(props: { value: number }) {
      const height = (1 - (props.value - min) / (max - min)) * 100

      if (height >= 100 || height <= 0) {
        return <></>
      }

      return (
        <div
          class="xs:even:block fixed left-2 w-full -translate-y-1/2 transform items-center gap-2 whitespace-nowrap even:hidden"
          style={{ top: height + "%" }}
        >
          <div class="text-z-grid-label text-sm">{props.value}</div>
          <div class="border-z-grid-line fixed -left-2 top-1/2 h-px w-full border-b" />
        </div>
      )
    }
  }

  function DrawValues(values: number[], labelIndex: () => number) {
    return (
      <div class="flex flex-1 gap-1 overflow-hidden">
        <For each={values}>
          {(value, index) => {
            const prev = () => {
              if (index() == 0) {
                const arr = data[labelIndex() - 1]?.[1]
                return arr?.[arr.length - 1]
              } else {
                return values[index() - 1]
              }
            }

            const next = () =>
              index() == values.length - 1 ?
                data[labelIndex() + 1]?.[1][0]
              : values[index() + 1]!

            return (
              <div class="flex flex-1 flex-col">
                <div
                  class="relative mt-auto transform transition"
                  classList={{
                    "rounded-bl-lg":
                      chart.rounded &&
                      (chart.space ||
                        (labelIndex() == 0 && index() == 0) ||
                        prev() == 0),
                    "rounded-br-lg":
                      chart.rounded &&
                      (chart.space ||
                        (labelIndex() == data.length - 1 &&
                          index() == values.length - 1) ||
                        next() == 0),
                    "rounded-tl-lg":
                      chart.rounded &&
                      (chart.space || prev() == null || prev()! < value),
                    "rounded-tr-lg":
                      chart.rounded &&
                      (chart.space || next() == null || next()! < value),
                  }}
                  style={{
                    height: `${(value / (max - min)) * 100}%`,
                    background: color(index()),
                  }}
                >
                  <Show
                    when={
                      chart.rounded &&
                      !chart.space &&
                      value != 0 &&
                      next() != null &&
                      next()! > value
                    }
                  >
                    <div
                      class="fixed -top-2 right-0 size-2 transition"
                      style={{ background: color(index()) }}
                    />

                    <div
                      class="fixed -top-2 right-0 size-2 rounded-br-lg transition"
                      classList={{
                        "bg-z-body": !style.layered,
                        "bg-z-body-selected": style.layered,
                      }}
                    />
                  </Show>

                  <Show
                    when={
                      chart.rounded &&
                      !chart.space &&
                      value != 0 &&
                      prev() != null &&
                      prev()! > value
                    }
                  >
                    <div
                      class="fixed -top-2 left-0 size-2 transition"
                      style={{ background: color(index()) }}
                    />

                    <div
                      class="fixed -top-2 left-0 size-2 rounded-bl-lg transition"
                      classList={{
                        "bg-z-body": !style.layered,
                        "bg-z-body-selected": style.layered,
                      }}
                    />
                  </Show>
                </div>
              </div>
            )
          }}
        </For>
      </div>
    )
  }

  function DrawLabel(label: string | number) {
    return (
      <div
        class="text-z-grid-label bottom-0 w-full max-w-full transform overflow-hidden py-0.5 text-center text-sm"
        classList={{
          hidden: chart.mainAxis.label.display == "hidden",
          relative: chart.mainAxis.label.display != "inline",
          fixed: chart.mainAxis.label.display == "inline",
        }}
      >
        &nbsp;
        <div class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
          {display(label, chart.mainAxis.label.format)}
        </div>
      </div>
    )
  }
}

export function DrawChartOption(props: { option: ChartOption }) {
  return (
    <Switch>
      <Match when={props.option.type == "checkbox" ? props.option : undefined}>
        {(x) => (
          <div>
            <label class="flex w-full gap-2">
              <Checkbox
                checked={x().value}
                // onInput={() => props.set("sort_field", idOf(props.selected.id))}
              />

              <p>{props.option.label}</p>
            </label>
          </div>
        )}
      </Match>
    </Switch>
  )
}

export function DrawStatCard(
  card: Omit<ChartCard, "query">,
  data: ChartComputedInfo | null,
  colors: ChartColors,
) {
  const floating = () => card.style.titleLocation.startsWith("floating")
  const border = () => card.style.titleBorder == "normal"
  const padded = () => card.style.padded
  return (
    <div
      class="border-z relative flex aspect-[16/10] transform flex-col overflow-hidden transition"
      classList={{
        "bg-z-body-selected": card.style.layered,
        "p-2": padded(),
        "pb-0": card.chart.mainAxis.label.display != "inline",
        "rounded-2xl": card.style.roundCard,
        border: card.style.bordered,
      }}
    >
      <ChartTitle />
      <Show when={card.options.length}>
        <div class="border-z-grid-line -mb-px mt-8 flex w-full flex-col gap-1 border-b px-2 pb-1">
          <For each={card.options}>
            {(option) => <DrawChartOption option={option} />}
          </For>
        </div>
      </Show>
      {DrawChartBar(card.chart, card.style, data, colors)}
    </div>
  )

  function ChartTitle() {
    return (
      <div
        class="border-z fixed z-10 max-w-[calc(100%_-_2rem)] overflow-hidden whitespace-nowrap"
        classList={{
          "bg-z-body": floating() && card.style.layered,
          "bg-z-body-selected": floating() && !card.style.layered,
          "px-2": floating(),

          hidden: card.style.titleLocation == "hidden",
          fixed: floating(),
          border: border() && floating(),
          "border-b": border(),
          "pb-0.5": !floating(),
          "mb-1": !border() && !floating(),
          "mb-2": border() && !floating(),
          "-mt-1": !floating(),
          "rounded-t-md": card.style.titleLocation == "floating",
          "rounded-b-md": floating(),
          "top-1": !padded() && card.style.titleLocation == "floating",
          "top-2": padded() && card.style.titleLocation == "floating",
          "top-0": card.style.titleLocation == "floating-anchored",
          "text-2xl": card.style.titleLocation == "inline-big",

          "text-left": card.style.titleAlign == "left",
          "text-center": card.style.titleAlign == "center",
          "text-right": card.style.titleAlign == "right",
          "left-2":
            padded() &&
            card.style.titleLocation == "floating" &&
            card.style.titleAlign == "left",
          "right-2":
            padded() &&
            card.style.titleLocation == "floating" &&
            card.style.titleAlign == "right",
          "left-1":
            !padded() &&
            card.style.titleLocation == "floating" &&
            card.style.titleAlign == "left",
          "right-1":
            !padded() &&
            card.style.titleLocation == "floating" &&
            card.style.titleAlign == "right",
          "left-0":
            card.style.titleLocation == "floating-anchored" &&
            card.style.titleAlign == "left",
          "pl-2":
            card.style.titleLocation == "floating-anchored" &&
            card.style.titleAlign == "left",
          "right-0":
            card.style.titleLocation == "floating-anchored" &&
            card.style.titleAlign == "right",
          "pr-2":
            card.style.titleLocation == "floating-anchored" &&
            card.style.titleAlign == "right",
          "left-1/2": floating() && card.style.titleAlign == "center",
          "-translate-x-1/2": floating() && card.style.titleAlign == "center",
          "rounded-tr-xl":
            card.style.titleLocation == "floating" &&
            !padded() &&
            card.style.roundCard &&
            card.style.titleAlign == "right",
          "rounded-tl-xl":
            card.style.titleLocation == "floating" &&
            !padded() &&
            card.style.roundCard &&
            card.style.titleAlign == "left",
          "rounded-tr-lg":
            card.style.titleLocation == "floating" &&
            padded() &&
            card.style.roundCard &&
            card.style.titleAlign == "right",
          "rounded-tl-lg":
            card.style.titleLocation == "floating" &&
            padded() &&
            card.style.roundCard &&
            card.style.titleAlign == "left",
          "rounded-tr-md":
            card.style.titleLocation == "floating-anchored" &&
            !padded() &&
            card.style.titleAlign == "right",
          "rounded-tl-md":
            card.style.titleLocation == "floating-anchored" &&
            !padded() &&
            card.style.titleAlign == "left",
          "rounded-br-none":
            card.style.titleLocation == "floating-anchored" &&
            !padded() &&
            card.style.titleAlign == "right",
          "rounded-bl-none":
            card.style.titleLocation == "floating-anchored" &&
            !padded() &&
            card.style.titleAlign == "left",
        }}
      >
        {card.title}
      </div>
    )
  }
}
