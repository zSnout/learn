import { closeDatabaseTemporarily, DB_FILENAME, sqlite3 } from ".."

export async function import_sqlite(data: Uint8Array | ArrayBuffer) {
  // TODO: improve the import system so it works with undo/redo
  await closeDatabaseTemporarily(
    "Cannot access database during an import.",
    () => sqlite3.oo1.OpfsDb.importDb(DB_FILENAME, data),
  )
}
