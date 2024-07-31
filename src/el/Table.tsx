import type { JSX } from "solid-js"

export function Th(
  props: {
    class?: string
    children: JSX.Element
  } & JSX.ThHTMLAttributes<HTMLTableCellElement>,
) {
  return (
    <th
      {...props}
      class={
        "sticky top-0 cursor-pointer select-none border-x border-z bg-z-body px-1 first:border-l-0 last:border-r-0" +
        (props.class ? " " + props.class : "")
      }
    >
      {props.children}
    </th>
  )
}

export function Td(
  props: {
    class?: string
    selected?: boolean
    children: JSX.Element
  } & JSX.TdHTMLAttributes<HTMLTableCellElement>,
) {
  return (
    <td
      {...props}
      class={
        "truncate whitespace-nowrap border-x px-1 first:border-l-0 last:border-r-0" +
        (props.class ? " " + props.class : "") +
        (props.class?.includes("max-width") ? "" : " max-w-48")
      }
      classList={{
        "border-z": !props.selected,
        "border-[--z-table-row-selected-border]": props.selected,
        "text-[--z-table-row-selected-text]": props.selected,
      }}
    >
      {props.children}
    </td>
  )
}

export function Tr(
  props: {
    class?: string
    selected?: boolean
    children: JSX.Element
  } & JSX.HTMLAttributes<HTMLTableRowElement>,
) {
  return (
    <tr
      {...props}
      class={
        "select-none border-z last:border-b odd:bg-[--z-table-row-alt]" +
        (props.class ? " " + props.class : "")
      }
      classList={{
        "odd:bg-[--z-table-row-alt]": !props.selected,
        "bg-[--z-table-row-selected]": props.selected,
        "odd:bg-[--z-table-row-selected-alt]": props.selected,
        "z-tr-selected": props.selected,
      }}
    >
      {props.children}
    </tr>
  )
}

export function Table(
  props: {
    class?: string
    children: JSX.Element
  } & JSX.HTMLAttributes<HTMLTableElement>,
) {
  return (
    <div
      class={
        "flex flex-1 flex-col items-start overflow-auto pb-8 text-sm" +
        (props.class ? " " + props.class : "")
      }
    >
      <table {...props} class="min-w-full">
        {props.children}
      </table>
    </div>
  )
}
