// adapted from https://www.sqlite.org/undoredo.html

import { error, ok } from "@/lib/result"
import type { WorkerDB } from ".."
import type { Id } from "@/lib/id"
import type { Reason } from "@/lib/reason"
import {
  ZID_UNDO_FAILED,
  ZID_UNDO_HAPPENED,
  ZID_UNDO_STACK_CHANGED,
  type UndoType,
  type WorkerNotification,
} from "../../shared"
import { int, text } from "./checks"
import { createSqlFunction } from "./sql"

export interface UndoMeta {
  currentCard?: Id
}

export type Item = [
  start: number,
  end: number,
  reason: Reason | null,
  meta: UndoMeta,
]

export class StateManager {
  private undoStack: Item[] = []
  private redoStack: Item[] = []
  private active = false
  private freeze = -1
  private firstlog = 1
  private sql

  constructor(private readonly db: WorkerDB) {
    this.sql = createSqlFunction(db)
  }

  maxSeq() {
    return this.sql`SELECT coalesce(max(seq), 0) FROM undolog;`.getValue(int)
  }

  activate(args: string[]) {
    if (this.active) {
      return
    }
    this.createTriggers(args)
    this.undoStack = []
    this.redoStack = []
    this.active = true
    this.freeze = -1
    this.startInterval()
  }

  deactivate() {
    if (!this.active) {
      return
    }
    this.dropTriggers()
    this.undoStack = []
    this.redoStack = []
    this.active = false
    this.freeze = -1
  }

  makeFrozen() {
    if (this.freeze >= 0) {
      throw new Error("Recursive call to `freeze`.")
    }

    this.freeze = this.maxSeq()
  }

  makeUnfrozen() {
    if (this.freeze < 0) {
      throw new Error("Called `unfreeze` while not frozen.")
    }

    this.sql`DELETE FROM undolog WHERE seq > ${this.freeze};`.run()
    this.freeze = -1
  }

  mark(reason: Reason | null, meta: UndoMeta) {
    if (!this.active) {
      this.msgStackChanged()
      return
    }

    let end = this.maxSeq()
    if (this.freeze >= 0 && end > this.freeze) {
      end = this.freeze
    }
    const begin = this.firstlog
    this.startInterval()
    if (begin == this.firstlog) {
      this.msgStackChanged()
      return
    }

    this.undoStack.push([begin, end, reason, meta])
    this.redoStack = []
    this.msgStackChanged()
  }

  dispatch(type: UndoType, meta: UndoMeta) {
    return this.step(
      type == "undo" ? this.undoStack : this.redoStack,
      type == "undo" ? this.redoStack : this.undoStack,
      type,
      meta,
    )
  }

  private msgStackChanged() {
    postMessage({
      zid: ZID_UNDO_STACK_CHANGED,
      canUndo: this.active && this.undoStack.length > 0,
      canRedo: this.active && this.redoStack.length > 0,
    } satisfies WorkerNotification)
  }

  private msgUndoHappened(
    type: UndoType,
    reason: Reason | null,
    meta: UndoMeta,
  ) {
    postMessage({
      zid: ZID_UNDO_HAPPENED,
      type,
      reason,
      meta,
    } satisfies WorkerNotification)
  }

  private msgUndoFailed(type: UndoType) {
    postMessage({
      zid: ZID_UNDO_FAILED,
      type,
    } satisfies WorkerNotification)
  }

  private createTriggers(args: string[]) {
    this.db.exec("DROP TABLE IF EXISTS undolog")
    let sql = "CREATE TEMP TABLE undolog (seq integer primary key, sql text);\n"
    for (const tbl of args) {
      const colList = this.db
        .exec(`pragma table_info(${tbl})`, { returnValue: "resultRows" })
        .map((x) => x[1] as string)

      sql += `CREATE TEMP TRIGGER _${tbl}_it AFTER INSERT ON ${tbl} BEGIN
INSERT INTO undolog VALUES (NULL, 'DELETE FROM ${tbl} WHERE rowid='||new.rowid);
END;`

      sql += `CREATE TEMP TRIGGER _${tbl}_ut AFTER UPDATE ON ${tbl} BEGIN
INSERT INTO undolog VALUES (NULL, 'UPDATE ${tbl} `
      let sep = "SET "
      for (const name of colList) {
        sql += `${sep}${name}='||quote(old.${name})||'`
        sep = ","
      }
      sql += ` WHERE rowid='||old.rowid);
END;`

      sql += `CREATE TEMP TRIGGER _${tbl}_dt AFTER DELETE ON ${tbl} BEGIN
INSERT INTO undolog VALUES (NULL, 'INSERT INTO ${tbl}(rowid`
      for (const name of colList) {
        sql += `,${name}`
      }
      sql += `) VALUES ('||old.rowid||'`
      for (const name of colList) {
        sql += `,'||quote(old.${name})||'`
      }
      sql += `)');
END;`
    }
    this.db.exec(sql)
  }

  private dropTriggers() {
    const tlist = this.sql`
      SELECT name FROM sqlite_temp_schema WHERE type = 'trigger';
    `.getAll([text])

    for (const [trigger] of tlist) {
      if (!/^_.*_[iud]t$/.test(trigger)) {
        continue
      }

      this.db.exec(`DROP TRIGGER ${trigger}`)
    }

    this.db.exec("DROP TABLE IF EXISTS undolog")
  }

  private startInterval() {
    this.firstlog = this.maxSeq() + 1
  }

  private step(
    v1: Item[],
    v2: Item[],
    type: UndoType,
    metaForThisState: UndoMeta,
  ) {
    const first = v1.pop()
    if (!first) {
      this.msgUndoFailed(type)
      return error("Nothing left in " + type + " stack.")
    }
    let [begin, end, reason, meta] = first
    this.db.exec("BEGIN")
    try {
      const sqllist = this.sql`
        SELECT sql
        FROM undolog
        WHERE seq >= ${begin} AND seq <= ${end}
        ORDER BY seq DESC;
      `
        .getAll([text])
        .map((x) => x[0])

      this.sql`
        DELETE FROM undolog WHERE seq >= ${begin} AND seq <= ${end};
      `.run()

      this.firstlog = this.maxSeq() + 1
      for (const sql of sqllist) {
        this.db.exec(sql)
      }
      this.db.exec("COMMIT")
    } catch (err) {
      this.db.exec("ROLLBACK")
      throw err
    }

    this.msgUndoHappened(type, reason, meta)

    end = this.maxSeq() + 1
    begin = this.firstlog
    v2.push([begin, end, reason, metaForThisState])
    this.startInterval()
    this.msgStackChanged()

    return ok(reason)
  }
}
