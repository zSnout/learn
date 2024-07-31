import { notNull } from "@/lib/pray"
import {
  type BindingSpec,
  PreparedStatement,
  type SqlValue,
} from "@sqlite.org/sqlite-wasm"
import {
  type Check,
  type CheckResult,
  type CheckResults,
  type CheckResultsWithColumns,
  type UncheckedWithColumns,
} from "./checks"

/**
 * An abstraction over the normal `Stmt` class which doesn't allow fine-grained
 * stepping, but which automatically resets and disposes statements.
 */
export class Stmt {
  private autoDisposes = true
  private used = false

  constructor(private readonly stmt: PreparedStatement) {
    // `Promise.resolve().then` instead of `queueMicrotask` is used because it
    // provides more useful error traces in Chrome.
    Promise.resolve().then(() => {
      if (this.autoDisposes) {
        this.dispose()
      }
    })
  }

  /** Clears the old bindings and sets them to `bindings`. */
  bindNew(bindings: BindingSpec | undefined) {
    if (this.stmt.parameterCount == 0) {
      return this
    }
    this.stmt.clearBindings()
    if (bindings) {
      this.stmt.bind(bindings)
    }
    return this
  }

  /** Disposes the statement. */
  dispose() {
    if (!this.used) {
      console.warn("Statement was prepared but never used.")
    }

    try {
      this.stmt.finalize()
    } catch {}
  }

  /** Runs the query and counts how many rows were returned. */
  count(): number {
    try {
      this.used = true
      let count = 0
      while (this.stmt.step()) {
        count++
      }
      return count
    } finally {
      this.stmt.reset()
    }
  }

  /**
   * Returns a helper with is useful for calling the same statement on many
   * values.
   */
  each(data: BindingSpec[]) {
    return new StmtEach(this, data)
  }

  /** Runs the query. If a row is returned, returns `true`. */
  exists(): boolean {
    try {
      this.used = true
      return this.stmt.step()
    } finally {
      this.stmt.reset()
    }
  }

  /** Gets all rows returned by the query, with an optional check. */
  getAll<const T extends readonly Check[]>(checks: T): CheckResults<T>[]
  getAll(checks?: undefined): SqlValue[][]
  getAll(checks?: Check[]): SqlValue[][] {
    try {
      this.used = true
      const data: SqlValue[][] = []
      while (this.stmt.step()) {
        data.push(this.stmt.get([]))
      }
      if (checks) {
        const row = data[0]!
        if (row) {
          if (checks.length != row.length) {
            throw new Error(
              `Expected ${checks.length} column(s); received ${row.length}.`,
            )
          }
          for (let index = 0; index < checks.length; index++) {
            if (!checks[index]!(row[index]!)) {
              throw new Error(`Check failed: ${checks[index]}.`)
            }
          }
        }
      }
      return data
    } finally {
      this.stmt.reset()
    }
  }

  /**
   * Gets all rows returned by the query, with an optional check. Also returns
   * the column names of the query.
   */
  getAllWithColumns<const T extends readonly Check[]>(
    checks: T,
  ): CheckResultsWithColumns<T>
  getAllWithColumns(checks?: Check[]): UncheckedWithColumns
  getAllWithColumns(checks?: Check[]): UncheckedWithColumns {
    try {
      this.used = true
      const values: SqlValue[][] = []
      while (this.stmt.step()) {
        values.push(this.stmt.get([]))
      }
      if (checks) {
        const row = values[0]!
        if (row) {
          if (checks.length != row.length) {
            throw new Error(
              `Expected ${checks.length} column(s); received ${row.length}.`,
            )
          }
          for (let index = 0; index < checks.length; index++) {
            if (!checks[index]!(row[index]!)) {
              throw new Error(`Check failed: ${checks[index]}.`)
            }
          }
        }
      }
      return {
        columns: this.stmt.columnCount ? this.stmt.getColumnNames() : [],
        values,
      }
    } finally {
      this.stmt.reset()
    }
  }

  /**
   * Gets the first row returned by the query. Throws if no rows are returned.
   * Optionally performs a type check on the data.
   */
  getRow<const T extends readonly Check[]>(checks: T): CheckResults<T>
  getRow(checks?: undefined): SqlValue[]
  getRow(checks?: Check[]): SqlValue[] {
    return notNull(this.getRowSafe(checks), "At least one row should exist.")
  }

  /**
   * Gets the first row returned by the query, or `null` if no rows are
   * returned. Optionally performs a type check on the data.
   */
  getRowSafe<const T extends readonly Check[]>(
    checks: T,
  ): CheckResults<T> | null
  getRowSafe(checks?: Check[]): SqlValue[] | null
  getRowSafe(checks?: Check[]): SqlValue[] | null {
    try {
      this.used = true
      let row
      if (this.stmt.step()) {
        row = this.stmt.get([])
      } else {
        return null
      }
      if (checks) {
        if (checks.length != row.length) {
          throw new Error(
            `Expected ${checks.length} column(s); received ${row.length}.`,
          )
        }
        for (let index = 0; index < checks.length; index++) {
          if (!checks[index]!(row[index]!)) {
            throw new Error(`Check failed: ${checks[index]}.`)
          }
        }
      }
      return row
    } finally {
      this.stmt.reset()
    }
  }

  /**
   * Gets the first value returned by the query. Throws if no rows are returned,
   * or if there is a row but it has no columns. Optionally performs a type
   * check on the data.
   */
  getValue<const T extends Check>(check: T): CheckResult<T>
  getValue(check?: Check): SqlValue
  getValue(check?: Check): SqlValue {
    return notNull(this.getValueSafe(check), "Expected at least one row.")
  }

  /**
   * Gets the first value returned by the query, or `null` if no rows are
   * returned, or if there is a row but it has no columns. Optionally performs a
   * type check on the data.
   */
  getValueSafe<const T extends Check>(check: T): CheckResult<T> | null
  getValueSafe(check?: Check): SqlValue | null
  getValueSafe(check?: Check): SqlValue | null {
    try {
      this.used = true
      let data
      if (this.stmt.step()) {
        data = this.stmt.get(0)
      } else {
        return null
      }
      if (check) {
        if (!check(data)) {
          throw new Error(`Check failed: ${check}.`)
        }
      }
      return data
    } finally {
      this.stmt.reset()
    }
  }

  /** Runs the statement, discarding any potential results. */
  run() {
    this.used = true
    try {
      while (this.stmt.step());
      return this
    } finally {
      this.stmt.reset()
    }
  }

  /** Prevents this statement from automatically disposing as a microtask. */
  stopAutomaticDisposal() {
    this.autoDisposes = false
    return this
  }

  /** Iterates over all rows returned by the query. */
  [Symbol.iterator]<const T extends readonly Check[]>(
    checks: T,
  ): Generator<CheckResults<T>>
  [Symbol.iterator](checks?: Check[]): Generator<SqlValue[]>
  *[Symbol.iterator](checks?: Check[]): Generator<SqlValue[]> {
    try {
      this.used = true
      let first
      while (this.stmt.step()) {
        const row = this.stmt.get([])
        if (first && checks) {
          if (checks.length != row.length) {
            throw new Error(
              `Expected ${checks.length} column(s); received ${row.length}.`,
            )
          }
          for (let index = 0; index < checks.length; index++) {
            if (!checks[index]!(row[index]!)) {
              throw new Error(`Check failed: ${checks[index]}.`)
            }
          }
        }
        yield row
      }
    } finally {
      this.stmt.reset()
    }
  }
}

export class StmtEach {
  constructor(
    private readonly stmt: Stmt,
    private readonly data: BindingSpec[],
  ) {}

  getAll<const T extends readonly Check[]>(checks: T): CheckResults<T>[][]
  getAll(checks?: undefined): SqlValue[][][]
  getAll(checks?: Check[]): SqlValue[][][] {
    const output: SqlValue[][][] = []
    for (const el of this.data) {
      output.push(this.stmt.bindNew(el).getAll())
    }

    const row = output[0]?.[0]
    if (row && checks) {
      if (checks.length != row.length) {
        throw new Error(
          `Expected ${checks.length} column(s); received ${row.length}.`,
        )
      }
      for (let index = 0; index < checks.length; index++) {
        if (!checks[index]!(row[index]!)) {
          throw new Error(`Check failed: ${checks[index]}.`)
        }
      }
    }

    return output
  }

  getRow<const T extends readonly Check[]>(checks: T): CheckResults<T>[]
  getRow(checks?: undefined): SqlValue[][]
  getRow(checks?: Check[]): SqlValue[][] {
    const output: SqlValue[][] = []
    for (const el of this.data) {
      output.push(this.stmt.bindNew(el).getRow())
    }

    const row = output[0]
    if (row && checks) {
      if (checks.length != row.length) {
        throw new Error(
          `Expected ${checks.length} column(s); received ${row.length}.`,
        )
      }
      for (let index = 0; index < checks.length; index++) {
        if (!checks[index]!(row[index]!)) {
          throw new Error(`Check failed: ${checks[index]}.`)
        }
      }
    }

    return output
  }

  getValue<const T extends Check>(check: T): CheckResult<T>[]
  getValue(check?: Check): SqlValue[]
  getValue(check?: Check): SqlValue[] {
    const output: SqlValue[] = []
    for (const el of this.data) {
      output.push(this.stmt.bindNew(el).getValue())
    }
    const row = output[0]
    if (row != null && check) {
      if (!check(row)) {
        throw new Error(`Check failed: ${check}`)
      }
    }
    return output
  }
}

const isMulti = new WeakMap<TemplateStringsArray, boolean>()

export function createSqlFunction(db: {
  prepare(query: string): PreparedStatement
}) {
  function sql(strings: TemplateStringsArray, ...bindings: SqlValue[]) {
    {
      let val = isMulti.get(strings)
      if (val == null) {
        val = !!strings.join("").match(/;.+;/)
        isMulti.set(strings, val)
      }
      if (val) {
        throw new Error("Cannot prepare a query with multiple statements.")
      }
    }

    const stmt = new Stmt(db.prepare(strings.join("?")))
    if (bindings.length) {
      stmt.bindNew(bindings)
    }
    return stmt
  }

  sql.of = (query: string) => new Stmt(db.prepare(query))

  return sql
}

export type SQLFunction = ReturnType<typeof createSqlFunction>
