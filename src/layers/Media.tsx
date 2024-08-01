import { Action } from "@/el/BottomButtons"
import { ContextMenuItem } from "@/el/ContextMenu"
import { defineLayer } from "@/el/DefineLayer"
import { Fa } from "@/el/Fa"
import { InlineLoading } from "@/el/Loading"
import {
  alert,
  ModalButtons,
  ModalCancel,
  ModalCode,
  ModalConfirm,
  ModalDescription,
  ModalDetails,
  ModalStrong,
  ModalTitle,
  popup,
} from "@/el/Modal"
import { Table, Td, Th, Tr } from "@/el/Table"
import {
  createSelectable,
  TbodySelectable,
  type TbodyRef,
} from "@/el/TbodySelectable"
import { UploadButton } from "@/el/upload"
import { download } from "@/lib/download"
import { createExpr } from "@/lib/expr"
import { filename } from "@/lib/filename"
import { displayFileSize } from "@/lib/fileSize"
import { MEDIA_PREFIX, parseKey, UserMedia, writeKey } from "@/lib/media"
import {
  faArrowUpRightFromSquare,
  faDownload,
  faMagnifyingGlass,
  faUpload,
} from "@fortawesome/free-solid-svg-icons"
import JSZip from "jszip"
import { createResource, For, Show } from "solid-js"
import type { Worker } from "../db"

const media = new UserMedia()

export default defineLayer({
  init(_: Worker) {
    const [entries, { refetch }] = createResource(() => media.keys())
    return { entries, refetch, data: createSelectable() }
  },
  load() {},
  render({ owner, props: worker, state: { entries, refetch, data } }) {
    let tbody!: TbodyRef

    return (
      <div class="flex h-[calc(100dvh_-_7rem)] w-full flex-1 flex-col">
        <TopActions />
        <Grid />
      </div>
    )

    function TopActions() {
      return (
        <div class="mx-auto mb-4 grid w-full max-w-xl grid-cols-2 gap-1 sm:grid-cols-3">
          <UploadButton
            accept="*/*"
            multiple
            onUpload={async (files) => {
              await Promise.all(files.map((file) => media.upload(file).done))
              refetch()
            }}
          >
            {(trigger) => (
              <Action
                class="col-span-2 sm:col-auto"
                icon={faUpload}
                label="Upload"
                center
                onClick={trigger}
              />
            )}
          </UploadButton>
          <Action
            icon={faDownload}
            label="Export"
            center
            onClick={() => {
              throw new Error("Not implemented yet.") // FEAT: export media
            }}
          />
          <Action
            icon={faMagnifyingGlass}
            label="Usage"
            center
            onClick={() =>
              popup<void>({
                owner,
                onCancel: undefined,
                children(close) {
                  return <Usage close={close} />
                },
              })
            }
          />
        </div>
      )
    }

    function Grid() {
      return (
        <Table
          class="border-z rounded-lg border"
          onCtx={({ detail }) => detail(() => <CtxMenu />)}
        >
          <thead>
            <tr>
              <Th>Key</Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Size</Th>
            </tr>
          </thead>
          <TbodySelectable
            getId={writeKey}
            data={data}
            items={entries() ?? []}
            ref={(el) => (tbody = el)}
          >
            {(key, selected) => <Entry key={key} selected={selected()} />}
          </TbodySelectable>
        </Table>
      )
    }

    function CtxMenu() {
      return (
        <ContextMenuItem
          onClick={async () => {
            const keys = tbody
              .getSelected()
              .map(parseKey)
              .filter((x) => x != null)

            if (keys.length == 0) {
              await alert({ owner, title: "No items selected" })
              return
            }

            const mode = await popup<"original" | "hashed" | void>({
              owner,
              onCancel: undefined,
              children(close) {
                return (
                  <>
                    <ModalTitle>File name format</ModalTitle>
                    <ModalDescription>
                      When you uploaded media files, their names were rewritten.
                      For example, a file named{" "}
                      <ModalCode>dog-46.png</ModalCode> might become{" "}
                      <ModalCode>ed59597ada9fe2f5.png</ModalCode> (this is
                      called its <ModalStrong>key</ModalStrong>).
                    </ModalDescription>
                    <ModalDescription>
                      Do you want to download by the original file names, or
                      their new names? Either way, the same files will be
                      downloaded.
                    </ModalDescription>
                    <ModalButtons>
                      <ModalCancel onClick={() => close()}>Cancel</ModalCancel>
                      <ModalCancel onClick={() => close("hashed")}>
                        Keys
                      </ModalCancel>
                      <ModalConfirm onClick={() => close("original")}>
                        Original names
                      </ModalConfirm>
                    </ModalButtons>
                  </>
                )
              },
            })

            if (!mode) {
              return
            }

            if (keys.length == 1) {
              const key = keys[0]!
              const file = await media.get(key)
              if (file) {
                download(file)
              } else {
                await alert({
                  owner,
                  title: "File was deleted",
                  get description() {
                    return (
                      <ModalDescription>
                        The file was deleted before it could be downloaded.
                        Maybe you removed it in another tab?
                      </ModalDescription>
                    )
                  },
                })
              }
              return
            }

            const zip = new JSZip()

            await Promise.all(
              keys.map(async (key) => {
                const file = await media.get(key)
                if (!file) return
                if (mode == "hashed") {
                  zip.file(
                    writeKey(key) + (file.name.match(/\..+$/) ?? ""),
                    file,
                  )
                } else {
                  zip.file(file.name, file)
                }
              }),
            )

            const blob = await zip.generateAsync({ type: "blob" })

            download(
              new File([blob], filename(".media.zip"), {
                type: "application/zip",
              }),
            )
          }}
        >
          Export files
        </ContextMenuItem>
      )
    }

    function Entry(props: { key: ArrayBuffer; selected: boolean }) {
      const [file] = createResource(
        () => props.key,
        (name) => media.get(name),
      )

      return (
        <>
          <Td selected={props.selected} class="w-[20ch] font-mono">
            {writeKey(props.key)}
          </Td>
          <Td selected={props.selected}>
            <div class="inline-flex items-center gap-1">
              <a href={MEDIA_PREFIX + writeKey(props.key)} target="_new">
                <Fa
                  class="icon-z-text-link h-3 w-3"
                  icon={faArrowUpRightFromSquare}
                  title="open file"
                />
              </a>
              <div>{file()?.name ?? "..."}</div>
            </div>
          </Td>
          <Td selected={props.selected}>{file()?.type}</Td>
          <Td selected={props.selected}>{displayFileSize(file()) ?? "..."}</Td>
        </>
      )
    }

    function Usage(props: { close: () => void }) {
      const [unused] = createExpr(() => worker.post("media_analyze_unused"))
      const [missing] = createExpr(() => worker.post("media_analyze_missing"))

      return (
        <>
          <ModalTitle>Media usage</ModalTitle>

          <InlineLoading data={unused()}>
            {(unused) => (
              <Show
                when={unused.length}
                fallback={
                  <ModalDescription>All media files are used.</ModalDescription>
                }
              >
                <ModalDetails
                  summary={
                    <>
                      {unused.length}{" "}
                      {unused.length == 1 ?
                        "file is unused. It exists"
                      : "files are unused. They exist"}{" "}
                      in your media folder, but they don't show up on any cards.
                      Click to show which files are unused.
                    </>
                  }
                >
                  <Table class="border-z max-h-96 rounded-lg border">
                    <thead>
                      <tr>
                        <Th>Key</Th>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th>Size</Th>
                      </tr>
                    </thead>

                    <tbody>
                      <For each={unused}>
                        {(key) => {
                          const [file] = createResource(() => media.get(key))
                          return (
                            <Tr>
                              <Td>{writeKey(key)}</Td>
                              <Td>{file()?.name}</Td>
                              <Td>{file()?.type}</Td>
                              <Td>{displayFileSize(file()) ?? "..."}</Td>
                            </Tr>
                          )
                        }}
                      </For>
                    </tbody>
                  </Table>
                </ModalDetails>
              </Show>
            )}
          </InlineLoading>

          <InlineLoading data={missing()}>
            {(missing) => (
              <Show
                when={missing.length}
                fallback={
                  <ModalDescription>
                    No media files are missing.
                  </ModalDescription>
                }
              >
                <ModalDetails
                  summary={
                    <>
                      {missing.length}{" "}
                      {missing.length == 1 ?
                        "file is unused. It exists"
                      : "files are unused. They exist"}{" "}
                      in your media folder, but they don't show up on any cards.
                      Click to show which files are unused.
                    </>
                  }
                >
                  <Table class="border-z max-h-96 rounded-lg border">
                    <thead>
                      <tr>
                        <Th>Key</Th>
                      </tr>
                    </thead>

                    <tbody>
                      <For each={missing}>
                        {(key) => {
                          return (
                            <Tr>
                              <Td>{key}</Td>
                            </Tr>
                          )
                        }}
                      </For>
                    </tbody>
                  </Table>
                </ModalDetails>
              </Show>
            )}
          </InlineLoading>

          <ModalButtons>
            <ModalCancel
              onClick={async () => {
                const [result] = createResource(async () => {
                  await worker.post("media_delete_unused")
                  refetch()
                })

                props.close()

                popup<void>({
                  owner,
                  children(close) {
                    return (
                      <>
                        <ModalTitle>Purging unused media</ModalTitle>
                        <ModalDescription>
                          {result.state == "ready" ?
                            "Unused media successfully removed!"
                          : "Removing..."}
                        </ModalDescription>
                        <ModalButtons>
                          <ModalCancel onClick={close}>Close</ModalCancel>
                        </ModalButtons>
                      </>
                    )
                  },
                  onCancel: undefined,
                })
              }}
            >
              Delete Unused
            </ModalCancel>

            <ModalConfirm onClick={props.close}>Close</ModalConfirm>
          </ModalButtons>
        </>
      )
    }
  },
  onReturn({ state }) {
    state.refetch()
    return "preserve-data"
  },
  onUndo({ state }) {
    state.refetch()
    return "preserve-data"
  },
})
