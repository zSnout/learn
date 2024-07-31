import type { BindingSpec, SqlValue } from "@sqlite.org/sqlite-wasm"
import { readonly, sql, state } from ".."

function split(text: string) {
  let current = ""
  let output = []
  let quote: "'" | '"' | "`" | undefined

  const iterator = text[Symbol.iterator]()
  for (const char of iterator) {
    if (char == "'" || char == '"' || char == "`") {
      if (quote == char) {
        quote = undefined
      } else {
        quote = char
      }
    } else if (char == "\\") {
      current += "\\"
      const next = iterator.next()
      if (!next.done) {
        current += next.value
      }
      continue
    } else if (quote == null && char == ";") {
      output.push(current)
      current = ""
      continue
    }

    current += char
  }

  if (current) {
    output.push(current)
  }

  return output.filter((x) => x.trim())
}

export function user_query(
  query: string,
  commit: boolean,
  bindings?: BindingSpec,
): {
  columns: string[]
  values: SqlValue[][]
}[] {
  if (!commit) {
    if (/begin|end|transaction|commit|rollback/i.test(query)) {
      throw new Error(
        "Safe queries are automatically run in ROLLBACKd transactions. For manual control, use SAVEPOINT and RELEASE.",
      )
    }

    const tx = readonly()
    try {
      return split(query).map((q) =>
        sql.of(q).bindNew(bindings).getAllWithColumns(),
      )
    } finally {
      tx.dispose()
    }
  }

  // check that `commit=false` never reaches this branch
  commit satisfies true

  try {
    // TODO: manual undo logic since we don't have transactions
    return split(query).map((query) =>
      sql.of(query).bindNew(bindings).getAllWithColumns(),
    )
  } finally {
    state.mark(`${query} (user query)`, {})
  }
}
