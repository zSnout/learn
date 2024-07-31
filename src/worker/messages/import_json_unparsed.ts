import { Collection } from "@/lib/types"
import { parse } from "valibot"
import { import_json_parsed } from "./import_json_parsed"

export function import_json_unparsed(json: string) {
  try {
    var data = JSON.parse(json)
  } catch (err) {
    console.error(err)
    throw new Error("The data is not a valid JSON file.")
  }

  try {
    var collection = parse(Collection, data)
  } catch (err) {
    console.error(err)
    throw new Error("The data is not a valid collection.")
  }

  import_json_parsed(collection)
}
