import { notNull } from "@/lib/pray"
import { PackagedDeckMeta } from "@/lib/types"
import { Show, type Owner } from "solid-js"
import { parse } from "valibot"
import type { Worker } from "../db"
import type { ImportPackagedDeckProps } from "../worker/messages/import_deck"
import {
  alert,
  confirm,
  load,
  ModalCheckbox,
  ModalCode,
  ModalDescription,
  ModalLi,
  ModalStrong,
  ModalUl,
} from "./Modal"

export function importDeck(worker: Worker, file: File, owner: Owner | null) {
  if (file.name.endsWith(".zl.deck.zip")) {
    return importZlDeckZip(worker, file, owner)
  }

  return alert({
    owner,
    title: "Invalid format",
    description: (
      <>
        <ModalDescription>
          Sorry, we can't import that file type yet. Currently, we support these
          types of files:
        </ModalDescription>

        <ModalUl>
          <ModalLi>
            <ModalCode>.zl.deck.zip</ModalCode> (exported by this application)
          </ModalLi>
        </ModalUl>
      </>
    ),
  })
}

async function importZlDeckZip(
  worker: Worker,
  file: File,
  owner: Owner | null,
) {
  const meta = parse(
    PackagedDeckMeta,
    JSON.parse(
      await load(
        owner,
        new (await import("jszip")).default()
          .loadAsync(file.arrayBuffer().then((x) => x.slice(0)))
          .then((x) =>
            notNull(
              x.file("meta.json"),
              "The imported deck is missing the required `meta.json` file.",
            ).async("string"),
          ),
      ),
    ),
  )

  const props: ImportPackagedDeckProps = {
    importConfs: false,
    importMedia: true,
    importRevlog: false,
    importScheduling: false,
  }

  if (meta.hasConfs || meta.hasRevlog || meta.hasScheduling || meta.media) {
    const willContinue = await confirm({
      owner,
      title: "Import options",
      get description() {
        return (
          <>
            <ModalDescription>
              What parts of this deck package would you like to import?
            </ModalDescription>

            <Show when={meta.hasConfs}>
              <ModalCheckbox
                checked={props.importConfs}
                children="Import deck configurations?"
                onInput={(x) => (props.importConfs = x)}
              />
            </Show>

            <Show when={meta.media}>
              <ModalCheckbox
                checked={props.importMedia}
                onInput={(x) => (props.importMedia = x)}
              >
                Import media? <ModalStrong>Highly recommended.</ModalStrong>
              </ModalCheckbox>
            </Show>

            <Show when={meta.hasRevlog}>
              <ModalCheckbox
                checked={props.importRevlog}
                children="Import review log?"
                onInput={(x) => (props.importRevlog = x)}
              />
            </Show>

            <Show when={meta.hasScheduling}>
              <ModalCheckbox
                checked={props.importScheduling}
                children="Import scheduling information?"
                onInput={(x) => (props.importScheduling = x)}
              />
            </Show>
          </>
        )
      },
      cancelText: "Cancel",
      okText: "Import",
    })

    if (!willContinue) {
      return
    }
  }

  await load(owner, worker.post("import_deck", file, props), () => (
    <ModalDescription>Importing...</ModalDescription>
  ))
}
