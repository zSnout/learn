// @ts-ignore shut up typescript. this makes vite happy
import sqlite3InitModule from "../../node_modules/@sqlite.org/sqlite-wasm/sqlite-wasm/jswasm/sqlite3-bundler-friendly.mjs"

import { startOfDaySync } from "@/lib/day"
import { randomId } from "@/lib/id"
import { notNull } from "@/lib/pray"
import type { Reason } from "@/lib/reason"
import type {
  default as initSqlite,
  OpfsDatabase,
} from "@sqlite.org/sqlite-wasm"
import {
  ZID_REJECT,
  type Handler,
  type WorkerNotification,
  type WorkerRequest,
  type WorkerResponse,
} from "../shared"
import { int } from "./lib/checks"
import { createSqlFunction } from "./lib/sql"
import { StateManager, type UndoMeta } from "./lib/undo"
import { latest, upgrade } from "./lib/version"
import * as messages from "./messages"
import { load } from "./py"
import query_schema from "./query/schema.sql?raw"

export const sqlite3 = await (sqlite3InitModule as typeof initSqlite)()

if (!("opfs" in sqlite3)) {
  throw new Error("OPFS is not supported on this browser.")
}

export type WorkerDB = OpfsDatabase

export const DB_FILENAME = "/learn/User 1.sqlite3"

async function init() {
  try {
    // the database requires OPFS to be persistent
    // without persistency, the site is quite useless
    // so we'll just require persistency out of the gate
    if (!("opfs" in sqlite3)) {
      throw new Error("OPFS is not supported on this browser.")
    }

    // create the database
    const db = new sqlite3.oo1.OpfsDb(DB_FILENAME)

    // initialize helper functions (especially useful for charts)
    db.createFunction({
      name: "random_id",
      xFunc() {
        return randomId()
      },
      directOnly: true,
    })

    db.createFunction({
      name: "start_of_day",
      xFunc(_ctxPtr, now, dayStart) {
        if (now == null) return null
        if (typeof now != "number") {
          throw new Error("Expected argument 1 `now` to be a number.")
        }
        if (typeof dayStart != "number") {
          throw new Error("Expected argument 2 `day_start` to be a number.")
        }
        return startOfDaySync(dayStart, now)
      },
    })

    db.createFunction({
      name: "start_of_day",
      xFunc(_ctxPtr, now) {
        if (now == null) return null
        if (typeof now != "number") {
          throw new Error("Expected argument 1 `now` to be a number.")
        }
        return startOfDaySync(
          notNull(
            db.selectValue(
              "SELECT day_start FROM prefs WHERE id = 0",
              undefined,
              1,
            ),
            "The preferences object does not exist.",
          ),
          now,
        )
      },
    })

    db.createFunction({
      name: "start_of_day",
      xFunc(_ctxPtr) {
        return startOfDaySync(
          notNull(
            db.selectValue(
              "SELECT day_start FROM prefs WHERE id = 0",
              undefined,
              1,
            ),
            "The preferences object does not exist.",
          ),
          Date.now(),
        )
      },
    })

    // make sure database is up to date
    checkVersion(db)

    // TODO: virtual table for user media

    // activate undo/redo
    const state = new StateManager(db)
    state.activate([
      "core",
      "graves",
      "confs",
      "decks",
      "models",
      "notes",
      "cards",
      "rev_log",
      "prefs",
      "charts",
    ])
    return [db, state] as const
  } catch (reason) {
    try {
      postMessage({ zid: ZID_REJECT, reason } satisfies WorkerNotification)
    } catch {
      postMessage({
        zid: ZID_REJECT,
        reason: "Error is unable to be reported.",
      } satisfies WorkerNotification)
    }
    throw reason
  }
}

// this function cannot access external `db` since that variable isn't set yet
// this upgrades similarly to indexedDB since indexedDB does upgrades well
// this handles the meta of upgrading, while `upgrade` is the main script
function checkVersion(db: WorkerDB) {
  db.exec(query_schema)
  const sql = createSqlFunction(db)
  sql`BEGIN TRANSACTION;`.run()
  try {
    const current =
      sql`SELECT version FROM core WHERE id = 0;`.getValueSafe(int) ?? 0
    upgrade(db, current)
    if (current != latest) {
      sql`UPDATE core SET version = ${latest} WHERE id = 0;`.run()
    }
    sql`COMMIT;`.run()
  } catch (err) {
    sql`ROLLBACK;`.run()
    throw err
  }
}

export class TxReadonly {
  private done = false

  constructor() {
    db.exec("BEGIN TRANSACTION")
    if (import.meta.env.DEV) {
      setTimeout(() => {
        if (!this.done) {
          console.warn("Readonly transaction was never completed.")
        }
      })
    }
  }

  dispose() {
    if (!this.done) {
      this.done = true
      db.exec("ROLLBACK")
    }
  }
}

export class TxReadwrite {
  private done = false
  readonly meta: UndoMeta = {}

  constructor(private readonly reason: Reason) {
    db.exec("BEGIN TRANSACTION")
    if (import.meta.env.DEV) {
      setTimeout(() => {
        if (!this.done) {
          console.warn("Readwrite transaction was never completed.")
        }
      })
    }
  }

  commit() {
    if (this.done) {
      throw new Error("Cannot commit a transaction after it is finished.")
    }

    db.exec("COMMIT")
    state.mark(this.reason, this.meta)
    this.done = true
  }

  rollback() {
    if (this.done) {
      throw new Error("Cannot rollback a transaction after it is finished.")
    }

    db.exec("ROLLBACK")
    this.done = true
  }

  dispose() {
    if (!this.done) {
      console.warn("Rolling back transaction due to failure.")
      this.rollback()
    }
  }
}

declare global {
  var __ZID__handled: Set<number> | undefined
}

// somehow this module code ends up getting run twice, even though the worker is
// only created once. this means requests are duplicated, so we add a simple
// check here to ensure that we don't handle the same request twice
const handled = (globalThis.__ZID__handled ??= new Set<number>())

addEventListener("message", async ({ data }: { data: unknown }) => {
  if (
    typeof data != "object" ||
    data == null ||
    !("zid" in data) ||
    typeof data.zid != "number"
  ) {
    return
  }

  const req = data as unknown as WorkerRequest

  if (handled.has(req.zid)) {
    return
  } else {
    handled.add(req.zid)
  }

  try {
    const value = await (messages[req.type] as Handler)(...req.data)

    const res: WorkerResponse = {
      zid: req.zid,
      ok: true,
      value: value as any,
    }

    postMessage(res)
  } catch (err) {
    console.error(err)
    const res: WorkerResponse = {
      zid: req.zid,
      ok: false,
      value: String(err),
    }

    postMessage(res)
  }
  return
})

/** These are `let` bindings so we can close and reopen them. */
export let [db, state] = await init()

export const sql = createSqlFunction({
  prepare(query) {
    return db.prepare(query)
  },
})

export function readonly() {
  return new TxReadonly()
}

export function readwrite(reason: Reason) {
  return new TxReadwrite(reason)
}

function createClosedDatabase(message: string) {
  function dbImporting(): never {
    throw new Error(message)
  }

  return new Proxy<any>(
    {},
    {
      defineProperty: dbImporting,
      deleteProperty: dbImporting,
      get: dbImporting,
      getOwnPropertyDescriptor: dbImporting,
      getPrototypeOf: dbImporting,
      has: dbImporting,
      isExtensible: dbImporting,
      ownKeys: dbImporting,
      preventExtensions: dbImporting,
      set: dbImporting,
      setPrototypeOf: dbImporting,
    },
  )
}

export async function closeDatabaseTemporarily(
  message: string,
  fn: () => Promise<unknown>,
) {
  try {
    db.close()
    state = db = createClosedDatabase(message)
    await fn()
  } finally {
    ;[db, state] = await init()
  }
}

postMessage({ zid: "zdb:resolve" } satisfies WorkerNotification)

Object.assign(globalThis, { load })
