import { defineLayer } from "@/el/DefineLayer"
import { Fa } from "@/el/Fa"
import { timestampDist } from "@/el/Quiz"
import {
  ContentCard,
  ContentIcon,
  Full,
  Response,
  ResponseGray,
  ResponsesGrid,
  ShortcutLabel,
} from "@/el/QuizLayout"
import { Write } from "@/el/Write"
import { Id } from "@/lib/id"
import { notNull, prayTruthy } from "@/lib/pray"
import { createPrefsStore } from "@/lib/prefs"
import { Render } from "@/lib/render"
import { unwrap } from "@/lib/result"
import { type Shortcut } from "@/lib/shortcuts"
import * as Template from "@/lib/template"
import {
  faBackward,
  faBook,
  faBrain,
  faCalendar,
  faClock,
  faCopy,
  faEarListen,
  faEyeSlash,
  faFlag,
  faForward,
  faInfoCircle,
  faMarker,
  faMicrophone,
  faPause,
  faPen,
  faPersonDigging,
  faPlay,
  faRightFromBracket,
  faSliders,
  faSpinner,
  faSync,
  faTags,
  faTrash,
  faUndo,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons"
import {
  batch,
  createMemo,
  createResource,
  createSignal,
  JSX,
  Show,
} from "solid-js"
import { Rating, State, type Grade } from "ts-fsrs"
import type { Worker } from "../db"

// TODO: keyboard shortcuts should have `keydown` listeners
// TODO: adjust shortcuts for mac/windows
// FEAT: improve screen for when no cards are left

export default defineLayer({
  init(_: { worker: Worker; root: Id | null; all: Id[] }): {
    lastCid?: Id | undefined
  } {
    return {}
  },
  async load({ props: { worker } }) {
    const [prefs, setPrefs, ready] = createPrefsStore(worker)
    await ready
    return { prefs, setPrefs }
  },
  render({
    props: { worker, root, all },
    data: { prefs, setPrefs },
    pop,
    state,
    shortcuts,
    onUndo,
    onBeforeUndo,
  }) {
    const [answerShown, setAnswerShown] = createSignal(false)

    const [getData, { mutate, refetch: unsafeRawRefetch }] = createResource(
      () => fetch(),
    )

    async function fetch(cid?: Id) {
      const now = Date.now()
      setAnswerShown(false)
      const data = await worker.post("study_select", root, all, cid)
      state.lastCid = data?.cid
      return { data, shownAt: now }
    }

    onBeforeUndo((_, { meta }) => {
      meta.currentCard = getData()?.data?.cid
    })

    onUndo(async (_, { meta: { currentCard } }) => {
      if (currentCard == null) {
        mutate(await fetch(state.lastCid))
      } else {
        mutate(await fetch(currentCard))
      }
      return "preserve-data" as const
    })

    async function refetch() {
      state.lastCid = getData()?.data?.card.id
      return await unsafeRawRefetch()
    }

    // function notifyOfDataUpdate() {
    //   mutate((x) => (x ? { ...x } : undefined))
    // }

    const tmpl = createMemo(() => {
      const data = getData()?.data
      if (!data) {
        return { qhtml: "", ahtml: "", css: "", source: [] }
      }

      const c = data.card

      const fields = Template.fieldRecord(data.model.fields, data.note.fields)

      const tmpl = notNull(
        data.model.tmpls[c.tid],
        "Card must be linked to a template which exists.",
      )

      const qc = unwrap(Template.parse(tmpl.qfmt))
      const ac = unwrap(Template.parse(tmpl.afmt))
      const qhtml = Template.generate(qc, fields, { FrontSide: undefined })
      const ahtml = Template.generate(ac, fields, { FrontSide: qhtml })

      return { qhtml, ahtml, css: data.model.css, source: [data.deck.name] }
    })

    // const [now, setNow] = createSignal(Date.now())
    // setInterval(() => setNow(Date.now()), 30_000)

    return (
      <div class="flex min-h-full w-full flex-1 flex-col">
        <Full
          layer
          responses={Responses()}
          content={Content()}
          sidebar={Sidebar()}
          sidebarState={prefs.sidebar_state}
          onSidebarState={(state) =>
            setPrefs("Toggle sidebar")("sidebar_state", state)
          }
        />
      </div>
    )

    // async function updateCurrentCard(
    //   reason: Reason,
    //   data: (card: AnyCard) => Partial<AnyCard>,
    // ) {
    //   const selectInfo = getData()?.data
    //   if (!selectInfo) {
    //     return
    //   }

    //   const { card } = selectInfo
    //   state.lastCid = card.id
    //   const merged = data(card)
    //   Object.assign(card, merged)
    //   const now = Date.now()
    //   await putCard(db, card, reason)
    //   checkBucket(card, selectInfo, info, now)
    //   notifyOfDataUpdate()
    // }

    // async function updateCurrentNote(
    //   reason: Reason,
    //   data: (card: Note) => Partial<Note>,
    // ) {
    //   const info = getData()
    //   if (!info) {
    //     return
    //   }

    //   if (!info.data) {
    //     return
    //   }

    //   const { note } = info.data
    //   state.lastCid = info.data.card.id
    //   const merged = data(note)
    //   Object.assign(note, merged)
    //   await putNote(db, note, reason)
    //   notifyOfDataUpdate()
    // }

    function Content() {
      return (
        <Show fallback={<Loading />} when={getData()}>
          <Show fallback={<NullCard />} when={getData()?.data}>
            <ContentCard
              fullFront
              source={prefs.show_deck_name && tmpl().source}
              front={
                <Render
                  html={tmpl()[answerShown() ? "ahtml" : "qhtml"]}
                  css={tmpl().css}
                  class="flex-1"
                  theme="auto"
                />
              }
            />
          </Show>
        </Show>
      )
    }

    function Responses() {
      return (
        <Show
          fallback={
            <ResponseGray onClick={pop}>
              Exit Session
              <ShortcutLabel shortcuts={shortcuts} key={{ key: "0" }} />
            </ResponseGray>
          }
          when={getData()?.data}
        >
          <Show
            fallback={
              <ResponseGray
                onClick={() => {
                  setAnswerShown(true)
                }}
              >
                Reveal Answer
                <ShortcutLabel shortcuts={shortcuts} key={{ key: " " }} />
              </ResponseGray>
            }
            when={answerShown()}
          >
            <ResponsesGrid class="grid-cols-4">
              <Button
                class="bg-red-300 text-red-900 dark:bg-red-800 dark:text-red-100"
                rating={Rating.Again}
                label="Again"
                shortcut={{ key: "1" }}
              />

              <Button
                class="bg-[#ffcc91] text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100"
                rating={Rating.Hard}
                label="Hard"
                shortcut={{ key: "2" }}
              />

              <Button
                class="bg-green-300 text-green-900 dark:bg-green-800 dark:text-green-100"
                rating={Rating.Good}
                label="Good"
                shortcut={{ key: "3" }}
              />

              <Button
                class="bg-blue-300 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                rating={Rating.Easy}
                label="Easy"
                shortcut={{ key: "4" }}
              />
            </ResponsesGrid>
          </Show>
        </Show>
      )
    }

    async function answer(grade: Grade) {
      const { data: c, shownAt } = notNull(
        getData(),
        "Cannot answer before a card has been drawn.",
      )
      prayTruthy(c, "Cannot answer a `null` card.")
      state.lastCid = c.card.id
      const now = Date.now()
      await worker.post(
        "study_save_review",
        // TODO: if a review takes a very long time it might be the next day, so
        // make sure that the log is updated properly. we only do this to avoid
        // fuzz showing the wrong time but we can probably control fuzz manually
        // somehow
        c.repeat[grade].card,
        c.repeat[grade].log,
        c.card.state == State.New,
        now - shownAt,
      )
      batch(() => {
        refetch()
        setAnswerShown(false)
      })
    }

    // async function answerForget() {
    //   const { data: c, shownAt } = notNull(
    //     getData(),
    //     "Cannot forget before a card has been drawn.",
    //   )
    //   prayTruthy(c, "Cannot answer a `null` card.")
    //   const now = Date.now()
    //   const resetCount = await selectForgetMode(owner)
    //   if (resetCount == null) return
    //   await saveForget(db, c, info, now, now - shownAt, resetCount)
    //   batch(() => {
    //     refetch()
    //     setAnswerShown(false)
    //   })
    // }

    function Button(props: {
      class: string
      rating: Grade
      shortcut: Shortcut
      label: string
    }) {
      return (
        <Response class={props.class} onClick={() => answer(props.rating)}>
          {props.label}
          <br />
          {(() => {
            const r = getData()?.data?.repeat
            if (!r) {
              return "<null>"
            }

            const item = r[props.rating]
            return timestampDist((item.card.due - item.log.review) / 1000)
          })()}
          <ShortcutLabel shortcuts={shortcuts} key={props.shortcut} />
        </Response>
      )
    }

    function QuickAction(props: {
      icon: IconDefinition
      label: string
      onClick?: () => void
      shortcut: Shortcut
      disabled?: boolean
      noShortcut?: true
    }) {
      if (props.onClick && !props.noShortcut) {
        shortcuts.scoped(props.shortcut, props.onClick)
      }

      return (
        <button
          class="z-field text-z hover:enabled:bg-z-body-selected mx-[calc(-0.5rem_-_1px)] flex items-center gap-2 border-transparent bg-transparent px-2 py-0.5 shadow-none transition"
          onClick={props.onClick}
          disabled={props.disabled || !props.onClick}
        >
          <Fa class="h-4 w-4" icon={props.icon} title={false} />
          <span class="flex-1 text-left">{props.label}</span>
          <Write shortcut={props.shortcut} />
        </button>
      )
    }

    function QuickActionLine() {
      return <hr class="border-z my-2" />
    }

    // function FlagsSelector() {
    //   return (
    //     <div class="mb-1 flex gap-2">
    //       <For each={Flags.ALL_FLAGS}>
    //         {(flag) => {
    //           const checked = createMemo(() => {
    //             const c = getData()?.data?.card
    //             if (!c) {
    //               return false
    //             }
    //             return Flags.has(c.flags, flag)
    //           })

    //           return (
    //             <button
    //               class={`flex aspect-square flex-1 items-center justify-center rounded-lg border border-current ${flag.text} ${flag.bg} z-field p-0 shadow-none`}
    //               classList={{ "opacity-30": !checked() }}
    //               role="checkbox"
    //               aria-checked={checked()}
    //               aria-label={flag.color + " flag"}
    //               onClick={() => {
    //                 updateCurrentCard(
    //                   `Toggle ${flag.color} card flag`,
    //                   (card) => ({
    //                     flags:
    //                       Flags.has(card.flags, flag) ? 0 : 1 << flag.valueOf(),
    //                   }),
    //                 )
    //               }}
    //             >
    //               <Show when={checked()}>
    //                 <Fa
    //                   class="h-4 w-4 icon-current"
    //                   icon={faFlag}
    //                   title={false}
    //                 />
    //               </Show>
    //             </button>
    //           )
    //         }}
    //       </For>
    //     </div>
    //   )
    // }

    function Sidebar() {
      return (
        <div class="flex w-full flex-1 flex-col">
          <h1 class="pb-0.5 text-center">Quick Actions</h1>
          <QuickActionLine />
          <QuickAction
            icon={faRightFromBracket}
            label="Exit Session"
            shortcut={{ key: "Escape" }}
            noShortcut
            onClick={pop}
          />
          <QuickAction
            icon={faUndo}
            label="Undo"
            shortcut={{ key: "Z" }}
            noShortcut
            onClick={() =>
              document.body.dispatchEvent(
                new KeyboardEvent("keydown", { key: "z", bubbles: true }),
              )
            }
          />
          <QuickAction icon={faSync} label="Sync" shortcut={{ key: "Y" }} />
          <QuickActionLine />
          <QuickAction
            icon={faSliders}
            label="Deck Options"
            shortcut={{ key: "O" }}
          />
          <QuickAction
            icon={faBook}
            label="Toggle Deck Name"
            shortcut={{ key: "N" }}
            onClick={() =>
              setPrefs("Toggle deck name visibility")(
                "show_deck_name",
                (v) => !v,
              )
            }
          />
          <QuickAction
            icon={faClock}
            label="Toggle Per-Card Timer"
            shortcut={{ key: "C" }}
          />
          <QuickAction
            icon={faForward}
            label="Auto Advance"
            shortcut={{ key: "A", shift: true }}
          />
          <QuickActionLine />
          {/* <Show when={prefs.show_flags_in_sidebar}>
            <FlagsSelector />
          </Show> */}
          <QuickAction
            icon={faFlag}
            label={prefs.show_flags_in_sidebar ? "Hide Flags" : "Show Flags"}
            onClick={() =>
              setPrefs("Toggle flag visibility in sidebar")(
                "show_flags_in_sidebar",
                (x) => !x,
              )
            }
            shortcut={{ key: "F" }}
          />
          <QuickAction
            icon={faPersonDigging}
            label="Bury Card"
            shortcut={{ key: "-" }}
            // onClick={async () => {
            //   await updateCurrentCard("Bury card", () => ({ queue: 1 }))
            //   batch(() => {
            //     refetch()
            //     setAnswerShown(false)
            //   })
            // }}
            disabled={!getData()?.data?.card}
          />
          <QuickAction
            icon={faBrain}
            label="Forget Card..."
            shortcut={{ key: "N", mod: "macctrl", alt: true }}
            // onClick={answerForget}
            disabled={!getData()?.data?.card}
          />
          <QuickAction
            icon={faCalendar}
            label="Set Due Date..."
            shortcut={{ key: "D", mod: "macctrl", shift: true }}
          />
          <QuickAction
            icon={faEyeSlash}
            label="Suspend Card"
            shortcut={{ key: "@" }}
            // onClick={async () => {
            //   await updateCurrentCard("Suspend card", () => ({ queue: 2 }))
            //   batch(() => {
            //     refetch()
            //     setAnswerShown(false)
            //   })
            // }}
            disabled={!getData()?.data?.card}
          />
          <QuickAction
            icon={faInfoCircle}
            label="Card Info"
            shortcut={{ key: "I" }}
          />
          <QuickAction
            icon={faInfoCircle}
            label="Previous Card Info"
            shortcut={{ key: "I", mod: "macctrl", alt: true }}
          />
          <QuickActionLine />
          <QuickAction
            icon={faMarker}
            label={getData()?.data?.note.marks ? "Unmark Note" : "Mark Note"}
            disabled={!getData()?.data?.card}
            // onClick={() =>
            //   updateCurrentNote("Toggle whether note is marked", (note) => ({
            //     marks: note.marks ? 0 : 1,
            //   }))
            // }
            shortcut={{ key: "M" }}
          />
          <QuickAction
            icon={faPersonDigging}
            label="Bury Note"
            shortcut={{ key: "=" }}
            // TODO: onClick={() => {
            //   const c = getData().card
            //   if (!c) {
            //     return
            //   }
            //   const all = app.cards.byNid[c.card.nid]
            //   if (!all) {
            //     return
            //   }
            //   for (const card of all) {
            //     // don't bury suspended cards
            //     if (card.queue == 0) {
            //       card.queue = 1
            //     }
            //   }
            //   refetch()
            // }}
            // disabled={!getData().card}
          />
          <QuickAction
            icon={faEyeSlash}
            label="Suspend Note"
            shortcut={{ key: "!" }}
            // TODO: onClick={() => {
            //   const c = getData().card
            //   if (!c) {
            //     return
            //   }
            //   const all = app.cards.byNid[c.card.nid]
            //   if (!all) {
            //     return
            //   }
            //   for (const card of all) {
            //     card.queue = 2
            //   }
            //   refetch()
            // }}
            // disabled={!getData().card}
          />
          <QuickAction
            icon={faCopy}
            label="Create Copy..."
            shortcut={{ key: "E", mod: "macctrl", alt: true }}
          />
          <QuickAction
            icon={faTrash}
            label="Delete Note"
            shortcut={{ key: "Backspace", mod: "macctrl" }}
          />
          <QuickAction icon={faPen} label="Edit Note" shortcut={{ key: "E" }} />
          <QuickAction
            icon={faTags}
            label="Edit Tags"
            shortcut={{ key: "T" }}
          />
          <QuickActionLine />
          {/* play audio should change to replay audio sometimes */}
          <QuickAction
            icon={faPlay}
            label="Play Audio"
            shortcut={{ key: "R" }}
          />
          <QuickAction
            icon={faPause}
            label="Pause Audio"
            shortcut={{ key: "5" }}
          />
          <QuickAction
            icon={faBackward}
            label="Audio -5s"
            shortcut={{ key: "6" }}
          />
          <QuickAction
            icon={faForward}
            label="Audio +5s"
            shortcut={{ key: "7" }}
          />
          <QuickAction
            icon={faMicrophone}
            label="Record Own Voice"
            shortcut={{ key: "V", shift: true }}
          />
          <QuickAction
            icon={faEarListen}
            label="Replay Own Voice"
            shortcut={{ key: "V", shift: false }}
          />
        </div>
      )
    }

    function NullCard() {
      return (
        <div class="flex w-full flex-1 flex-col items-center justify-center gap-8">
          <p class="text-8xl">🎉</p>
          <h1 class="text-z-heading text-center text-xl font-semibold">
            Congratulations! You have finished this deck for now.
          </h1>
          <div class="mx-auto flex w-full max-w-md flex-col gap-2">
            {/* TODO: <Show when={info.cards.b0.length}>
              <NullMoreNewAvailable />
            </Show>
            <Show when={info.cards.b1.length}>
              <NullMoreLearningAvailable />
            </Show>
            <Show when={info.cards.b2.length}>
              <NullMoreReviewBacklogAvailable />
            </Show> */}
            <p>
              If you wish to study outside of the regular schedule, you can use
              the{" "}
              <InlineButton
                onClick={() => {
                  // FEAT:
                  throw new Error("this doesn't do anything yet")
                }}
              >
                custom study
              </InlineButton>{" "}
              feature.
            </p>
          </div>
        </div>
      )
    }

    function Loading() {
      return (
        <ContentIcon icon={faSpinner} title="Loading">
          Preparing deck...
        </ContentIcon>
      )
    }

    // function NullMoreNewAvailable() {
    //   return (
    //     <p>
    //       There are more new cards available, but the daily limit has been
    //       reached. You may{" "}
    //       <InlineButton
    //         onClick={() => {
    //           // FEAT:
    //           throw new Error("this doesn't do anything")
    //         }}
    //       >
    //         increase today's limit
    //       </InlineButton>{" "}
    //       if you wish, but beware that adding too many new cards will make your
    //       daily reviews in the near future skyrocket.
    //     </p>
    //   )
    // }

    // function NullMoreLearningAvailable() {
    //   const earliest =
    //     info.cards.b1.length ?
    //       info.cards.b1.reduce((a, b) => (a.due < b.due ? a : b))
    //     : undefined

    //   return (
    //     <p>
    //       There are still some learning cards left, but they aren't due for{" "}
    //       {earliest ?
    //         timestampDist((earliest.due - now()) / 1000)
    //       : "<unknown time>"}
    //       .
    //     </p>
    //   )
    // }

    // function NullMoreReviewBacklogAvailable() {
    //   return (
    //     <p>
    //       There are more review cards due today, but the daily limit has been
    //       reached. You may{" "}
    //       <InlineButton
    //         onClick={() => {
    //           // FEAT:
    //           throw new Error("this doesn't do anything")
    //         }}
    //       >
    //         increase today's limit
    //       </InlineButton>{" "}
    //       if you wish, which can help if you have a large backlog.
    //     </p>
    //   )
    // }

    function InlineButton(props: {
      children: JSX.Element
      onClick: () => void
    }) {
      return (
        <button
          class="text-z-link whitespace-normal underline underline-offset-2"
          classList={{ "bg-red-500": !props.onClick }}
          onClick={props.onClick}
        >
          {props.children}
        </button>
      )
    }
  },
})

// async function selectForgetMode(owner: Owner | null) {
//   return await new Promise<null | boolean>((resolve) => {
//     let modal: ModalRef
//     let portal: HTMLDivElement

//     runWithOwner(owner, () => (
//       <Modal
//         ref={(e) => (modal = e)}
//         refPortal={(e) => (portal = e)}
//         onClose={(value) => {
//           resolve(
//             value == "false" ? false
//             : value == "true" ? true
//             : null,
//           )
//           portal.ontransitionend = () => portal.remove()
//         }}
//       >
//         <ModalTitle>Reset review and lapse counts?</ModalTitle>
//         <ModalDescription>
//           By the way, forgetting a card means that it will be treated as a new
//           card.
//         </ModalDescription>
//         <ModalButtons>
//           <ModalCancel onClick={() => modal.close("null")}>Cancel</ModalCancel>
//           <ModalCancel onClick={() => modal.close("false")}>
//             Yes, reset
//           </ModalCancel>
//           <ModalConfirm onClick={() => modal.close("true")}>
//             No, keep them
//           </ModalConfirm>
//         </ModalButtons>
//       </Modal>
//     ))

//     setTimeout(() => modal!.showModal(), 1)
//   })
// }
