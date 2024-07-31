import { ID_ZERO } from "@/lib/id"
import { deserializeSidebar, serializeSidebar } from "@/lib/sidebar"
import {
  AnyCard,
  Conf,
  Core,
  Deck,
  Grave,
  Model,
  Note,
  Prefs,
  Review,
  type ChartCard,
} from "@/lib/types"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"
import { sql } from ".."
import type { SQLFunctionOnly } from "./sql"
import { latest } from "./version"

export type INTEGER = number
export type REAL = number
export type BOOLEAN = number
export type TEXT = string

export function createStmts(sql: SQLFunctionOnly) {
  return {
    core: {
      insert() {
        return sql`INSERT INTO core VALUES (?, ?, ?, ?, ?, ?, ?);`
      },
      interpret(data: SqlValue[]): Core {
        return {
          // data[0] is id
          // data[1] is version
          creation: data[2],
          last_edited: data[3],
          last_schema_edit: data[4],
          last_sync: data[5],
          tags: data[6],
        } as Core
      },
      insertArgs(core: Core): SqlValue[] {
        return [
          ID_ZERO satisfies INTEGER,
          latest satisfies INTEGER,
          core.creation satisfies INTEGER,
          core.last_edited satisfies INTEGER,
          core.last_schema_edit satisfies INTEGER,
          core.last_sync satisfies INTEGER,
          core.tags satisfies TEXT,
        ]
      },
    },
    graves: {
      insert() {
        return sql`INSERT INTO graves VALUES (?, ?);`
      },
      insertArgs(grave: Grave): SqlValue[] {
        return [grave.oid satisfies INTEGER, grave.type satisfies INTEGER]
      },
      interpret(data: SqlValue[]): Grave {
        return {
          oid: data[0],
          type: data[1],
        } as Grave
      },
    },
    confs: {
      insert() {
        return sql`
          INSERT INTO confs
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      },
      update() {
        return sql`
          UPDATE confs
          SET
            autoplay_audio = ?,
            last_edited = ?,
            name = ?,
            new_bury_related = ?,
            new_pick_at_random = ?,
            new_per_day = ?,
            new_learning_steps = ?,
            replay_question_audio = ?,
            review_bury_related = ?,
            review_enable_fuzz = ?,
            review_max_review_interval = ?,
            review_per_day = ?,
            review_relearning_steps = ?,
            review_requested_retention = ?,
            review_w = ?,
            show_global_timer = ?,
            timer_per_card = ?
          WHERE id = ?;
        `
      },
      interpret(data: SqlValue[]): Conf {
        return {
          id: data[0],
          autoplay_audio: !!data[1],
          last_edited: data[2],
          name: data[3],
          new: {
            bury_related: !!data[4],
            pick_at_random: !!data[5],
            per_day: data[6],
            learning_steps: JSON.parse(data[7] as string),
          },
          replay_question_audio: !!data[8],
          review: {
            bury_related: !!data[9],
            enable_fuzz: !!data[10],
            max_review_interval: data[11],
            per_day: data[12],
            relearning_steps: JSON.parse(data[13] as string),
            requested_retention: data[14],
            w: data[15] ? JSON.parse(data[15] as string) : null,
          },
          show_global_timer: !!data[16],
          timer_per_card: data[17],
        } as Conf // TODO: validate data
      },
      insertArgs(conf: Conf): SqlValue[] {
        return [
          conf.id satisfies INTEGER,
          +conf.autoplay_audio satisfies BOOLEAN,
          conf.last_edited satisfies INTEGER,
          conf.name satisfies TEXT,
          +conf.new.bury_related satisfies BOOLEAN,
          +conf.new.pick_at_random satisfies BOOLEAN,
          conf.new.per_day satisfies INTEGER,
          JSON.stringify(conf.new.learning_steps) satisfies TEXT,
          +conf.replay_question_audio satisfies BOOLEAN,
          +conf.review.bury_related satisfies BOOLEAN,
          +conf.review.enable_fuzz satisfies BOOLEAN,
          conf.review.max_review_interval satisfies INTEGER,
          conf.review.per_day ?? (null satisfies INTEGER | null),
          JSON.stringify(conf.review.relearning_steps) satisfies TEXT,
          conf.review.requested_retention satisfies INTEGER,
          (conf.review.w ?
            JSON.stringify(conf.review.w)
          : null) satisfies TEXT | null,
          +conf.show_global_timer satisfies BOOLEAN,
          conf.timer_per_card ?? (null satisfies INTEGER | null),
        ]
      },
      updateArgs(conf: Conf): SqlValue[] {
        return [
          +conf.autoplay_audio satisfies BOOLEAN,
          conf.last_edited satisfies INTEGER,
          conf.name satisfies TEXT,
          +conf.new.bury_related satisfies BOOLEAN,
          +conf.new.pick_at_random satisfies BOOLEAN,
          conf.new.per_day satisfies INTEGER,
          JSON.stringify(conf.new.learning_steps) satisfies TEXT,
          +conf.replay_question_audio satisfies BOOLEAN,
          +conf.review.bury_related satisfies BOOLEAN,
          +conf.review.enable_fuzz satisfies BOOLEAN,
          conf.review.max_review_interval satisfies INTEGER,
          conf.review.per_day ?? (null satisfies INTEGER | null),
          JSON.stringify(conf.review.relearning_steps) satisfies TEXT,
          conf.review.requested_retention satisfies INTEGER,
          (conf.review.w ?
            JSON.stringify(conf.review.w)
          : null) satisfies TEXT | null,
          +conf.show_global_timer satisfies BOOLEAN,
          conf.timer_per_card ?? (null satisfies INTEGER | null),
          conf.id satisfies INTEGER,
        ]
      },
    },
    decks: {
      insert() {
        return sql`
          INSERT INTO decks
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      },
      /** Expects data from a `SELECT * FROM decks` statement. */
      interpret(data: SqlValue[]): Deck {
        return {
          id: data[0],
          name: data[1],
          collapsed: !!data[2],
          is_filtered: !!data[3],
          custom_revcard_limit: data[4],
          custom_newcard_limit: data[5],
          default_revcard_limit: data[6],
          default_newcard_limit: data[7],
          last_edited: data[8],
          new_today: JSON.parse(data[9] as string),
          revcards_today: JSON.parse(data[10] as string),
          revlogs_today: data[11],
          today: data[12],
          desc: data[13],
          cfid: data[14],
          creation: data[15],
        } as Deck // TODO: verify type
      },
      insertArgs(deck: Deck): SqlValue[] {
        return [
          deck.id satisfies INTEGER,
          deck.name satisfies TEXT,
          +deck.collapsed satisfies BOOLEAN,
          +deck.is_filtered satisfies BOOLEAN,
          (deck.custom_revcard_limit ?? null) satisfies INTEGER | null,
          (deck.custom_newcard_limit ?? null) satisfies INTEGER | null,
          (deck.default_revcard_limit ?? null) satisfies INTEGER | null,
          (deck.default_newcard_limit ?? null) satisfies INTEGER | null,
          deck.last_edited satisfies INTEGER,
          JSON.stringify(deck.new_today) satisfies TEXT,
          JSON.stringify(deck.revcards_today) satisfies TEXT,
          deck.revlogs_today satisfies INTEGER,
          deck.today satisfies INTEGER,
          deck.desc satisfies TEXT,
          deck.cfid satisfies INTEGER,
          deck.creation satisfies INTEGER,
        ]
      },
      update() {
        return sql`
          UPDATE decks
          SET
            name = ?,
            collapsed = ?,
            is_filtered = ?,
            custom_revcard_limit = ?,
            custom_newcard_limit = ?,
            default_revcard_limit = ?,
            default_newcard_limit = ?,
            last_edited = ?,
            new_today = ?,
            revcards_today = ?,
            revlogs_today = ?,
            today = ?,
            \`desc\` = ?,
            cfid = ?,
            creation = ?
          WHERE id = ?;
        `
      },
      updateArgs(deck: Deck): SqlValue[] {
        return [
          deck.name satisfies TEXT,
          +deck.collapsed satisfies BOOLEAN,
          +deck.is_filtered satisfies BOOLEAN,
          (deck.custom_revcard_limit ?? null) satisfies INTEGER | null,
          (deck.custom_newcard_limit ?? null) satisfies INTEGER | null,
          (deck.default_revcard_limit ?? null) satisfies INTEGER | null,
          (deck.default_newcard_limit ?? null) satisfies INTEGER | null,
          deck.last_edited satisfies INTEGER,
          JSON.stringify(deck.new_today) satisfies TEXT,
          JSON.stringify(deck.revcards_today) satisfies TEXT,
          deck.revlogs_today satisfies INTEGER,
          deck.today satisfies INTEGER,
          deck.desc satisfies TEXT,
          deck.cfid satisfies INTEGER,
          deck.creation satisfies INTEGER,
          deck.id satisfies INTEGER,
        ]
      },
    },
    models: {
      insert() {
        return sql`INSERT INTO models VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
      },
      update() {
        return sql`
          UPDATE models
          SET
            css = ?,
            fields = ?,
            latex = ?,
            name = ?,
            sort_field = ?,
            tmpls = ?,
            tags = ?,
            type = ?,
            creation = ?,
            last_edited = ?
          WHERE id = ?;
        `
      },
      interpret(data: SqlValue[]): Model {
        return {
          id: data[0],
          css: data[1],
          fields: JSON.parse(data[2] as string),
          latex: data[3] ? JSON.parse(data[3] as string) : null,
          name: data[4],
          sort_field: data[5],
          tmpls: JSON.parse(data[6] as string),
          tags: (data[7] as string).split(" ").filter((x) => x),
          type: data[8],
          creation: data[9],
          last_edited: data[10],
        } as Model // TODO: maybe do some data validation
      },
      insertArgs(model: Model): SqlValue[] {
        return [
          model.id satisfies INTEGER,
          model.css satisfies TEXT,
          JSON.stringify(model.fields) satisfies TEXT,
          (model.latex ?
            JSON.stringify(model.latex)
          : null) satisfies TEXT | null,
          model.name satisfies TEXT,
          (model.sort_field ?? null) satisfies INTEGER | null,
          JSON.stringify(model.tmpls) satisfies TEXT,
          model.tags.join(" ") satisfies TEXT,
          model.type satisfies INTEGER,
          model.creation satisfies INTEGER,
          model.last_edited satisfies INTEGER,
        ]
      },
      updateArgs(model: Model): SqlValue[] {
        return [
          model.css satisfies TEXT,
          JSON.stringify(model.fields) satisfies TEXT,
          (model.latex ?
            JSON.stringify(model.latex)
          : null) satisfies TEXT | null,
          model.name satisfies TEXT,
          (model.sort_field ?? null) satisfies INTEGER | null,
          JSON.stringify(model.tmpls) satisfies TEXT,
          model.tags.join(" ") satisfies TEXT,
          model.type satisfies INTEGER,
          model.creation satisfies INTEGER,
          model.last_edited satisfies INTEGER,
          model.id satisfies INTEGER,
        ]
      },
    },
    notes: {
      insert() {
        return sql`INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
      },
      interpret(data: SqlValue[]): Note {
        return {
          id: data[0],
          creation: data[1],
          mid: data[2],
          last_edited: data[3],
          tags: (data[4] as string).split(" ").filter((x) => x),
          fields: JSON.parse(data[5] as string),
          sort_field: data[6],
          csum: data[7],
          marks: data[8],
        } as Note // TODO: maybe do data checking
      },
      insertArgs(note: Note): SqlValue[] {
        return [
          note.id satisfies INTEGER,
          note.creation satisfies INTEGER,
          note.mid satisfies INTEGER,
          note.last_edited satisfies INTEGER,
          note.tags.join(" ") satisfies TEXT,
          JSON.stringify(note.fields) satisfies TEXT,
          note.sort_field satisfies TEXT,
          note.csum satisfies INTEGER,
          note.marks satisfies INTEGER,
        ]
      },
      update() {
        return sql`
          UPDATE notes
          SET
            creation = ?,
            mid = ?,
            last_edited = ?,
            tags = ?,
            fields = ?,
            sort_field = ?,
            csum = ?,
            marks = ?
          WHERE id = ?;
        `
      },
      updateArgs(note: Note): SqlValue[] {
        return [
          note.creation satisfies INTEGER,
          note.mid satisfies INTEGER,
          note.last_edited satisfies INTEGER,
          note.tags.join(" ") satisfies TEXT,
          JSON.stringify(note.fields) satisfies TEXT,
          note.sort_field satisfies TEXT,
          note.csum satisfies INTEGER,
          note.marks satisfies INTEGER,
          note.id satisfies INTEGER,
        ]
      },
    },
    cards: {
      insert() {
        return sql`
          INSERT INTO cards
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      },
      interpret(data: SqlValue[]): AnyCard {
        return {
          id: data[0],
          nid: data[1],
          tid: data[2],
          did: data[3],
          odid: data[4],
          creation: data[5],
          last_edited: data[6],
          queue: data[7],
          due: data[8],
          last_review: data[9],
          stability: data[10],
          difficulty: data[11],
          elapsed_days: data[12],
          scheduled_days: data[13],
          reps: data[14],
          lapses: data[15],
          flags: data[16],
          state: data[17],
        } as AnyCard
      },
      insertArgs(card: AnyCard): SqlValue[] {
        return [
          card.id satisfies INTEGER,
          card.nid satisfies INTEGER,
          card.tid satisfies INTEGER,
          card.did satisfies INTEGER,
          (card.odid ?? null) satisfies INTEGER | null,
          card.creation satisfies INTEGER,
          card.last_edited satisfies INTEGER,
          card.queue satisfies INTEGER,
          card.due satisfies INTEGER,
          (card.last_review ?? null) satisfies INTEGER | null,
          card.stability satisfies REAL,
          card.difficulty satisfies REAL,
          card.elapsed_days satisfies INTEGER,
          card.scheduled_days satisfies INTEGER,
          card.reps satisfies INTEGER,
          card.lapses satisfies INTEGER,
          card.flags satisfies INTEGER,
          card.state satisfies INTEGER,
        ]
      },
      update() {
        return sql`
          UPDATE cards
          SET
            nid = ?,
            tid = ?,
            did = ?,
            odid = ?,
            creation = ?,
            last_edited = ?,
            queue = ?,
            due = ?,
            last_review = ?,
            stability = ?,
            difficulty = ?,
            elapsed_days = ?,
            scheduled_days = ?,
            reps = ?,
            lapses = ?,
            flags = ?,
            state = ?
          WHERE id = ?;
        `
      },
      updateArgs(card: AnyCard): SqlValue[] {
        return [
          card.nid satisfies INTEGER,
          card.tid satisfies INTEGER,
          card.did satisfies INTEGER,
          (card.odid ?? null) satisfies INTEGER | null,
          card.creation satisfies INTEGER,
          card.last_edited satisfies INTEGER,
          card.queue satisfies INTEGER,
          card.due satisfies INTEGER,
          (card.last_review ?? null) satisfies INTEGER | null,
          card.stability satisfies REAL,
          card.difficulty satisfies REAL,
          card.elapsed_days satisfies INTEGER,
          card.scheduled_days satisfies INTEGER,
          card.reps satisfies INTEGER,
          card.lapses satisfies INTEGER,
          card.flags satisfies INTEGER,
          card.state satisfies INTEGER,
          card.id satisfies INTEGER,
        ]
      },
    },
    rev_log: {
      insert() {
        return sql`
          INSERT INTO rev_log VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      },
      insertArgs(review: Review) {
        return [
          review.id satisfies INTEGER,
          review.cid satisfies INTEGER,
          review.time satisfies INTEGER,
          review.type satisfies INTEGER,
          review.rating satisfies INTEGER,
          review.state satisfies INTEGER,
          review.due satisfies INTEGER,
          review.stability satisfies REAL,
          review.difficulty satisfies REAL,
          review.elapsed_days satisfies INTEGER,
          review.last_elapsed_days satisfies INTEGER,
          review.scheduled_days satisfies INTEGER,
          review.review satisfies INTEGER,
        ]
      },
      interpret(data: SqlValue[]): Review {
        return {
          id: data[0],
          cid: data[1],
          time: data[2],
          type: data[3],
          rating: data[4],
          state: data[5],
          due: data[6],
          stability: data[7],
          difficulty: data[8],
          elapsed_days: data[9],
          last_elapsed_days: data[10],
          scheduled_days: data[11],
          review: data[12],
        } as Review
      },
    },
    prefs: {
      insert() {
        return sql`
          INSERT INTO prefs
          VALUES (0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `
      },
      update() {
        return sql`
          UPDATE prefs
          SET
            last_edited = ?,
            current_deck = ?,
            last_model_used = ?,
            new_spread = ?,
            collapse_time = ?,
            notify_after_time = ?,
            show_review_time_above_buttons = ?,
            show_remaining_due_counts = ?,
            show_deck_name = ?,
            next_new_card_position = ?,
            last_unburied = ?,
            day_start = ?,
            debug = ?,
            sidebar_state = ?,
            template_edit_style = ?,
            show_flags_in_sidebar = ?,
            show_marks_in_sidebar = ?,
            browser = ?
          WHERE id = 0;
        `
      },
      /**
       * Expects data from SELECT *.
       *
       * Not compatiable with makeArgs.
       */
      interpret(data: SqlValue[]): Prefs {
        return {
          // data[0] is ID_ZERO
          last_edited: data[1],
          current_deck: data[2],
          last_model_used: data[3],
          new_spread: data[4],
          collapse_time: data[5],
          notify_after_time: data[6],
          show_review_time_above_buttons: !!data[7],
          show_remaining_due_counts: !!data[8],
          show_deck_name: !!data[9],
          next_new_card_position: data[10],
          last_unburied: data[11],
          day_start: data[12],
          debug: !!data[13],
          sidebar_state: deserializeSidebar(data[14] as number),
          template_edit_style: JSON.parse(data[15] as string),
          show_flags_in_sidebar: !!data[16],
          show_marks_in_sidebar: !!data[17],
          browser: JSON.parse(data[18] as string),
        } as Prefs
      },
      /**
       * Prepares arguments for INSERT or UPDATE.
       *
       * Not compatiable with interpret.
       */
      insertArgs(prefs: Prefs) {
        return [
          prefs.last_edited satisfies INTEGER,
          (prefs.current_deck ?? null) satisfies INTEGER | null,
          (prefs.last_model_used ?? null) satisfies INTEGER | null,
          prefs.new_spread satisfies INTEGER,
          prefs.collapse_time satisfies INTEGER,
          prefs.notify_after_time satisfies INTEGER,
          +prefs.show_review_time_above_buttons satisfies BOOLEAN,
          +prefs.show_remaining_due_counts satisfies BOOLEAN,
          +prefs.show_deck_name satisfies BOOLEAN,
          prefs.next_new_card_position satisfies INTEGER,
          prefs.last_unburied satisfies INTEGER,
          prefs.day_start satisfies INTEGER,
          +prefs.debug satisfies BOOLEAN,
          serializeSidebar(prefs.sidebar_state) satisfies INTEGER,
          JSON.stringify(prefs.template_edit_style) satisfies TEXT,
          +prefs.show_flags_in_sidebar satisfies BOOLEAN,
          +prefs.show_marks_in_sidebar satisfies BOOLEAN,
          JSON.stringify(prefs.browser) satisfies TEXT,
        ] satisfies SqlValue[]
      },
    },
    charts: {
      insert() {
        return sql`INSERT INTO charts VALUES (?, ?, ?, ?, ?, ?, ?);`
      },
      update() {
        return sql`
          UPDATE charts
          SET
            last_edited = ?,
            title = ?,
            \`query\` = ?,
            chart = ?,
            style = ?,
            options = ?
          WHERE id = ?;
        `
      },
      /**
       * Expects data from SELECT *.
       *
       * Not compatiable with makeArgs.
       */
      interpret(data: SqlValue[]): ChartCard {
        return {
          id: data[0],
          last_edited: data[1],
          title: data[2],
          query: data[3],
          chart: JSON.parse(data[4] as string),
          style: JSON.parse(data[5] as string),
          options: JSON.parse(data[6] as string),
        } as ChartCard
      },
      /**
       * Prepares arguments for INSERT.
       *
       * Not compatiable with interpret.
       */
      insertArgs(card: ChartCard) {
        return [
          card.id,
          card.last_edited,
          card.title,
          card.query,
          JSON.stringify(card.chart),
          JSON.stringify(card.style),
          JSON.stringify(card.options),
        ] satisfies SqlValue[]
      },
      /**
       * Prepares arguments for UPDATE.
       *
       * Not compatiable with interpret.
       */
      updateArgs(card: ChartCard) {
        return [
          card.last_edited,
          card.title,
          card.query,
          JSON.stringify(card.chart),
          JSON.stringify(card.style),
          JSON.stringify(card.options),
          card.id,
        ] satisfies SqlValue[]
      },
    },
  }
}

export const stmts = createStmts((strings, ...bindings) =>
  sql(strings, ...bindings),
)
