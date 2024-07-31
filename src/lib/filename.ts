export type ExportableItem = "col" | "cards" | "notes" | "deck" | "media"
export type ExportableFile = "json" | "txt" | "csv" | "sqlite" | "zip"
export type Ending = `.${ExportableItem}.${ExportableFile}`

export function filename(ending: Ending) {
  return "zsnout-learn-" + new Date().toISOString() + ".zl" + ending
}
