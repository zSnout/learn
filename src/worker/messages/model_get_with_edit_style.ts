import type { Id } from "@/lib/id"
import { TemplateEditStyle } from "@/lib/types"
import { parse } from "valibot"
import { readonly, sql } from ".."
import { text } from "../lib/checks"
import { stmts } from "../lib/stmts"

export function model_get_with_edit_style(mid: Id) {
  const tx = readonly()
  try {
    return {
      model: stmts.models.interpret(
        sql`SELECT * FROM models WHERE id = ${mid};`.getRow(),
      ),
      editStyle: parse(
        TemplateEditStyle,
        JSON.parse(
          sql`SELECT template_edit_style FROM prefs WHERE id = 0;`.getValue(
            text,
          ),
        ),
      ),
    }
  } finally {
    tx.dispose()
  }
}
