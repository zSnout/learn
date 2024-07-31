import { filename } from "@/lib/filename"
import { export_json_raw } from "./export_json_raw"

export function export_json() {
  return new File([JSON.stringify(export_json_raw())], filename(".col.json"))
}
