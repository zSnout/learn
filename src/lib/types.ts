// TODO: maybe break this up, we don't usually need the whole thing at once

/* eslint-disable @typescript-eslint/no-empty-interface */
import type { TreeOf } from "./tree-structure"
import type JSZip from "jszip"
import { type Grade, Rating, State } from "ts-fsrs"
import * as v from "valibot"
import { Id, IdKey } from "./id"

export function makeCard<
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  U extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(last_review: T, state: U) {
  return v.object({
    /** Card id (unique to this card) */
    id: Id,

    /** Note id (links to a corresponding note) */
    nid: Id,

    /** Template id (can be found on the corresponding model) */
    tid: Id,

    /** Deck id (links to a corresponding deck) */
    did: Id,

    /** Original deck id (used when this card is part of a filtered deck) */
    odid: v.optional(v.nullable(Id), null),

    // DB: new in v4
    /** Timestamp of original creation */
    creation: v.optional(v.nullable(v.number(), Date.now), null),

    /** Timestamp of last edit */
    last_edited: v.number(),

    /** 0 = normal, 1 = buried, 2 = suspended */
    queue: v.picklist([0, 1, 2]),

    /** For reviewed cards, when they're due. For new cards, their due order */
    due: v.number(),

    /** Date of the last review (possibly optional) */
    last_review,

    /** Stability */
    stability: v.number(),

    /** Difficulty level */
    difficulty: v.number(),

    /** Number of days elapsed */
    elapsed_days: v.number(),

    /** Number of days scheduled */
    scheduled_days: v.number(),

    /** Repetition count */
    reps: v.number(),

    /** Number of lapses or mistakes */
    lapses: v.number(),

    /** Flags bitmask */
    flags: v.number(),

    /** Card state */
    state,
  })
}

export interface NewCard extends v.InferOutput<typeof NewCard> {}
export const NewCard = makeCard(
  v.optional(v.null(), null),
  v.literal(State.New),
)

export interface ReviewedCard extends v.InferOutput<typeof ReviewedCard> {}
export const ReviewedCard = makeCard(v.number(), v.enum(State))

export interface AnyCard extends v.InferOutput<typeof AnyCard> {}
export const AnyCard = makeCard(
  v.optional(v.nullable(v.number()), null),
  v.enum(State),
)

export interface Grave extends v.InferOutput<typeof Grave> {}
export const Grave = v.object({
  /** The original id of the item to delete */
  oid: Id,

  /**
   * The type of item to delete. 0=card, 1=note, 2=deck, 3=model, 4=pref,
   * 5=chart.
   */
  type: v.picklist([0, 1, 2, 3, 4, 5]),
})

export interface NoteFields extends v.InferOutput<typeof NoteFields> {}
export const NoteFields = v.record(IdKey, v.string())

export interface Note extends v.InferOutput<typeof Note> {}
export const Note = v.object({
  /** Note id */
  id: Id,

  /** Creation timestamp */
  creation: v.number(),

  /** Model id */
  mid: Id,

  /** Last edited timestamp */
  last_edited: v.number(),

  /** List of tags */
  tags: v.array(v.string()),

  /** List of fields */
  fields: NoteFields,

  /** Value of sort field */
  sort_field: v.string(),

  /** Checksum used for duplicate check */
  csum: v.number(),

  /** Mark bitflag for the note, as opposed to its specific cards */
  marks: v.number(),
})

export interface Review extends v.InferOutput<typeof Review> {}
export const Review = v.object({
  /** Unique id corresponding to review */
  id: Id,

  /** Card id */
  cid: Id,

  /** The number of milliseconds taken in this review (max 60000) */
  time: v.number(),

  /** 0=learn, 3=filtered, 4=manual */
  type: v.pipe(
    v.picklist([-1, 0, 1, 2, 3, 4]),
    v.transform((x) => (x == 3 || x == 4 ? x : 0)),
  ),

  /** Rating of the review */
  rating: v.enum(Rating),

  /** State of the review */
  state: v.enum(State),

  /** Date of the last scheduling */
  due: v.number(),

  /** Memory stability during the review */
  stability: v.number(),

  /** Difficulty of the card during the review */
  difficulty: v.number(),

  /** Number of days elapsed since the last review */
  elapsed_days: v.number(),

  /** Number of days between the last two reviews */
  last_elapsed_days: v.number(),

  /** Number of days until the next review */
  scheduled_days: v.number(),

  /** Date of the review */
  review: v.number(),
})

export interface ModelField extends v.InferOutput<typeof ModelField> {}
export const ModelField = v.object({
  /** Id used when sorting fields */
  id: Id,

  /** Font family displayed in the entry window */
  font: v.optional(v.nullable(v.string()), null),

  /** Font size displayed in the entry window */
  size: v.optional(v.nullable(v.number()), null),

  /** Whether the entry window should use RTL text direction */
  rtl: v.boolean(),

  /** Name of this field */
  name: v.string(),

  /** The value to fill in by default when creating a new card of this model */
  sticky: v.string(),

  /** Whether the field is collapsed in the editor */
  collapsed: v.boolean(),

  /** Whether the field defaults to html view */
  html: v.boolean(),

  /** The placeholder to show in the entry window when no value is entered. */
  desc: v.string(),

  /** Whether to exclude this field from unqualified searches */
  excludeFromSearch: v.boolean(),
})

export interface ModelFields extends v.InferOutput<typeof ModelFields> {}
export const ModelFields = v.record(IdKey, ModelField)

export interface MathjaxOptions extends v.InferOutput<typeof MathjaxOptions> {}
export const MathjaxOptions = v.object({
  /** Inserted at the beginning of any latex text */
  pre: v.string(),

  /** Inserted after any latex text */
  post: v.string(),
})

export interface ModelTemplate extends v.InferOutput<typeof ModelTemplate> {}
export const ModelTemplate = v.object({
  /** Template id used for sorting */
  id: Id,

  /** Format string for the question */
  qfmt: v.string(),

  /** Format string for the answer */
  afmt: v.string(),

  /** Template for displaying question in browser */
  qb: v.optional(v.nullable(v.string()), null),

  /** Template for displaying answer in browser */
  ab: v.optional(v.nullable(v.string()), null),

  /** Name of the template */
  name: v.string(),
})

export interface ModelTemplates extends v.InferOutput<typeof ModelTemplates> {}
export const ModelTemplates = v.record(IdKey, ModelTemplate)

/** 0=standard, 1=cloze */
export type ModelType = v.InferOutput<typeof ModelType>
/** 0=standard, 1=cloze */
export const ModelType = v.picklist([0, 1])

export interface Model extends v.InferOutput<typeof Model> {}
export const Model = v.object({
  /** Model id */
  id: Id,

  /** CSS of this template */
  css: v.string(),

  // /** Deck id that cards of this type go into by default */
  // did: v.optional(v.nullable(Id), null),

  /** Fields in this model */
  fields: ModelFields,

  /** If present, Mathjax options. If absent, Mathquill is used */
  latex: v.optional(v.nullable(MathjaxOptions), null),

  /** Model name */
  name: v.string(),

  /** Which field to use when sorting */
  sort_field: v.optional(v.nullable(Id), null),

  /** Templates that this model generates */
  tmpls: ModelTemplates,

  /** Last tags used with this model */
  tags: v.array(v.string()),

  /** 0=standard model, 1=cloze model */
  type: ModelType,

  // DB: new in v4
  /** Creation timestamp of this model */
  creation: v.optional(v.nullable(v.number(), Date.now), null),

  /** Last time this model was edited */
  last_edited: v.number(),
})

export interface Deck extends v.InferOutput<typeof Deck> {}
export const Deck = v.object({
  /** Deck id */
  id: Id,

  /** Name of deck */
  name: v.string(),

  /** Whether deck is collapsed */
  collapsed: v.boolean(),

  /** Whether deck is a filtered deck */
  is_filtered: v.boolean(),

  /** Custom limit on review cards for today */
  custom_revcard_limit: v.optional(v.nullable(v.number()), null),

  /** Custom limit on new cards for today */
  custom_newcard_limit: v.optional(v.nullable(v.number()), null),

  /** Custom limit on review cards for all days. Defaults to limit in `conf`. */
  default_revcard_limit: v.optional(v.nullable(v.number()), null),

  /** Custom limit on new cards for all days. Defaults to limit in `conf`. */
  default_newcard_limit: v.optional(v.nullable(v.number()), null),

  /**
   * Last time this deck was edited. WILL ALWAYS BE AS RECENT OR MORE THAN
   * `today`. DO NOT USE AS A REPLACEMENT FOR `today`.
   */
  last_edited: v.number(),

  /** Ids of new cards seen today (each entry is unique) */
  new_today: v.array(Id),

  /** Ids of reviewed cards done today (each entry is unique) */
  revcards_today: v.array(Id),

  /** Ids of review logs done today (each entry is unique) */
  // DB: changed from id array to number in v8
  revlogs_today: v.union([
    v.number(),
    v.pipe(
      v.array(v.number()),
      v.transform((x) => x.length),
    ),
  ]),

  /** When `new_today` and the `..._limit` properties were last updated */
  today: v.number(),

  /** Description of deck */
  desc: v.string(),

  /** Conf id */
  cfid: Id,

  /** Creation timestamp */
  creation: v.optional(v.nullable(v.number(), Date.now), null),
})

export interface Conf extends v.InferOutput<typeof Conf> {}
export const Conf = v.object({
  /** Conf id */
  id: Id,

  /** Whether to autoplay audio */
  autoplay_audio: v.boolean(),

  /** Last time this configuration was edited */
  last_edited: v.number(),

  /** Name of the configuration */
  name: v.string(),

  /** Configuration relating to new cards */
  new: v.object({
    /** Whether to bury cards from the same note */
    bury_related: v.boolean(),

    /** Whether to pick new cards at random (default is in order) */
    pick_at_random: v.boolean(),

    /** The number of new cards available each day */
    per_day: v.number(),

    /** Learning steps (in seconds) */
    learning_steps: v.array(v.number()),
  }),

  /** Whether to replay audio that's used in the question once answer is shown */
  replay_question_audio: v.boolean(),

  /** Configuration relating to review cards */
  review: v.object({
    /** Whether to bury cards from the same note */
    bury_related: v.boolean(),

    /** Whether to enable fuzz when reviewing */
    enable_fuzz: v.boolean(),

    /** The maximum review interval, in days */
    max_review_interval: v.number(),

    /** The number of review cards per day */
    per_day: v.optional(v.nullable(v.number()), null),

    /** Relearning steps (in seconds) */
    relearning_steps: v.array(v.number()),

    /** The requested retention value */
    requested_retention: v.number(),

    /** The w-array for FSRS */
    w: v.optional(v.nullable(v.array(v.number())), null),
  }),

  /** Whether to show the global timer */
  show_global_timer: v.boolean(),

  /** If not undefined, shows a timer on each card (in seconds) */
  timer_per_card: v.optional(v.nullable(v.number()), null),

  // lapse : {
  //     "The configuration for lapse cards."
  //     delays : "The list of successive delay between the learning steps of the new cards, as explained in the manual."
  //     leechAction : "What to do to leech cards. 0 for suspend, 1 for mark. Numbers according to the order in which the choices appear in aqt/dconf.ui"
  //     leechFails : "the number of lapses authorized before doing leechAction."
  //     minInt: "a lower limit to the new interval after a leech"
  //     mult : "percent by which to multiply the current interval when a card goes has lapsed"
  // }
  // new : {
  //     "The configuration for new cards."
  //     delays : "The list of successive delay between the learning steps of the new cards, as explained in the manual."
  //     initialFactor : "The initial ease factor"
  //     // ints : "The list of delays according to the button pressed while leaving the learning mode. Good, easy and unused. In the GUI, the first two elements corresponds to Graduating Interval and Easy interval"

  // }
  // rev : {
  //     "The configuration for review cards."
  //     // bury : "Whether to bury cards related to new cards answered"
  //     ease4 : "the number to add to the easyness when the easy button is pressed"
  //     fuzz : "The new interval is multiplied by a random number between -fuzz and fuzz"
  //     ivlFct : "multiplication factor applied to the intervals Anki generates"
  //     // maxIvl : "the maximal interval for review"
  //     // minSpace : "not currently used according to decks.py code's comment"
  //     perDay : "Numbers of cards to review per day"
  // }
})

export type BrowserColumn = v.InferOutput<typeof BrowserColumn>
export const BrowserColumn = v.picklist([
  "Question",
  "Answer",
  "Card",
  "Deck",
  "Sort Field",
  "Created",
  "Edited",
  "Due",
  "Interval",
  "Difficulty",
  "Reviews",
  "Lapses",
  "Tags",
  "Model",
  "Stability",
  "State",
])

export type EditStyleRow = v.InferOutput<typeof EditStyleRow>
export const EditStyleRow = v.picklist(["inline", "separate", "all-separate"])

export interface TemplateEditStyle
  extends v.InferOutput<typeof TemplateEditStyle> {}
export const TemplateEditStyle = v.object({
  row: EditStyleRow,
  template: v.object({
    front: v.boolean(),
    back: v.boolean(),
    styling: v.boolean(),
  }),
  theme: v.object({
    light: v.boolean(),
    dark: v.boolean(),
  }),
})

export interface Prefs extends v.InferOutput<typeof Prefs> {}
export const Prefs = v.object({
  /** Last edit timestamp */
  last_edited: v.number(),

  /** Current deck id */
  current_deck: v.optional(v.nullable(Id), null),

  /** Last model used */
  last_model_used: v.optional(v.nullable(Id), null),

  /** 0 = mix new and review, 1 = new after review, 2 = new before review */
  new_spread: v.picklist([0, 1, 2]),

  /** If a review is due before this many seconds, it is advanced to now */
  collapse_time: v.number(),

  /**
   * Each time this number of seconds elapses, the application tells you how
   * many cards you reviewed
   */
  notify_after_time: v.number(),

  /** Whether to show review time above the buttons */
  show_review_time_above_buttons: v.boolean(),

  /** Whether to show the remaining due counts */
  show_remaining_due_counts: v.boolean(),

  /** Whether to show deck names */
  show_deck_name: v.boolean(),

  /**
   * Highest due value of a new card. Next note created should be higher than
   * this
   */
  next_new_card_position: v.number(),

  /**
   * The last time any card was unburied. If not today, then buried notes need
   * to be unburied
   */
  last_unburied: v.optional(v.nullable(v.number(), 0), null),

  /** When the day is considered to start, in milliseconds after midnight */
  day_start: v.number(),

  /** Whether to enable debug features */
  debug: v.boolean(),

  /** The state of the sidebar during reviews */
  sidebar_state: v.picklist(["auto", "open", "closed"]),

  /** Options used when editing templates */
  template_edit_style: TemplateEditStyle,

  /** Whether to show flags in the sidebar */
  show_flags_in_sidebar: v.boolean(),

  /** Whether to show marks in the sidebar */
  show_marks_in_sidebar: v.boolean(),

  /** Configuration relating to the browser */
  browser: v.object({
    /** Active columns in the browser */
    active_cols: v.array(BrowserColumn),

    /** The field to sort by in the browser */
    sort_field: BrowserColumn,

    /** Whether to sort backwards */
    sort_backwards: v.boolean(),
  }),
})

export interface Core extends v.InferOutput<typeof Core> {}
export const Core = v.object({
  /** Creation timestamp of the collection */
  creation: v.number(),

  /** Last time the core object was modified */
  last_edited: v.number(),

  /**
   * Last time note types or fields were edited.
   *
   * If later than the server, a force push is required. If earlier than the
   * server, a force pull is required.
   */
  last_schema_edit: v.number(),

  /** Last sync time */
  last_sync: v.number(),

  /** Space-separated list of tags used in this collection */
  tags: v.string(),
})

export type ChartLabelFormat = v.InferOutput<typeof ChartLabelFormat>
export const ChartLabelFormat = v.picklist([
  "preserve",
  "numeric",
  "date",
  "time",
  "dt-offset",
])

export type ChartLabelFrequency = v.InferOutput<typeof ChartLabelFrequency>
export const ChartLabelFrequency = v.union([
  // Will show a label every `each` labels.
  v.object({ by: v.literal("count"), each: v.number() }),

  // Will show a label every `each`rem.
  v.object({ by: v.literal("rem"), each: v.number() }),

  // Will show all labels.
  v.object({ by: v.literal("all"), each: v.literal(1) }),
])

export type ChartLabelOverflow = v.InferOutput<typeof ChartLabelOverflow>
export const ChartLabelOverflow = v.picklist(["overflow", "cutoff", "ellipsis"])

export type ChartLabelDisplay = v.InferOutput<typeof ChartLabelDisplay>
export const ChartLabelDisplay = v.picklist(["hidden", "separate", "inline"])

export interface ChartLabel extends v.InferOutput<typeof ChartLabel> {}
export const ChartLabel = v.object({
  /** How to format the label. */
  format: ChartLabelFormat,

  /** How to handle overflowing labels. */
  overflow: ChartLabelOverflow,

  /** How often to show labels. */
  frequency: ChartLabelFrequency,

  /** How to display the labels. */
  display: ChartLabelDisplay,
})

export interface ChartMainAxis extends v.InferOutput<typeof ChartMainAxis> {}
export const ChartMainAxis = v.object({
  /** The minimum value, or `null` to automatically determine. */
  min: v.string(),

  /** The maximum value, or `null` to automatically determine. */
  max: v.string(),

  /** The group size, or `null` to avoid grouping. */
  groupSize: v.string(),

  /** Whether the group size is a percentage. */
  groupSizeIsPercentage: v.boolean(),

  /** Settings for the main axis labels. */
  label: ChartLabel,
})

export interface ChartCrossAxis extends v.InferOutput<typeof ChartCrossAxis> {}
export const ChartCrossAxis = v.object({
  /** The minimum value, or `null` to automatically determine. */
  min: v.string(),

  /** The maximum value, or `null` to automatically determine. */
  max: v.string(),

  /** Settings for the cross axis labels. */
  label: ChartLabel,
})

export interface ChartComputedAxis
  extends v.InferOutput<typeof ChartComputedCrossAxis> {}
export const ChartComputedCrossAxis = v.object({
  /** The minimum value of the chart's cross axis. */
  min: v.number(),

  /** The maximum value of the chart's cross axis. */
  max: v.number(),
})

export interface Chart extends v.InferOutput<typeof Chart> {}
export const Chart = v.object({
  /** Settings related to the chart's main axis. */
  mainAxis: ChartMainAxis,

  /** Settings related to the chart's cross axis. */
  crossAxis: ChartCrossAxis,

  /** The type of this chart. */
  type: v.literal("bar"),

  /** Whether to space the chart items. */
  space: v.boolean(),

  /** Whether to round the chart items. */
  rounded: v.boolean(),

  /** @deprecated Show a cummulative total in the background. */
  showTotal: v.boolean(),

  /** @deprecated Stack bars when multiple values are present. */
  stacked: v.boolean(),
})

export type ChartTitleLocation = v.InferOutput<typeof ChartTitleLocation>
export const ChartTitleLocation = v.picklist([
  "hidden",
  "floating",
  "floating-anchored",
  "inline",
  "inline-big",
])

export type ChartTitleBorder = v.InferOutput<typeof ChartTitleBorder>
export const ChartTitleBorder = v.picklist(["normal", "none"])

export type ChartTitleAlign = v.InferOutput<typeof ChartTitleAlign>
export const ChartTitleAlign = v.picklist(["left", "center", "right"])

export interface ChartStyle extends v.InferOutput<typeof ChartStyle> {}
export const ChartStyle = v.object({
  /** Whether the chart is padded. */
  padded: v.boolean(),

  /** Whether the chart has a border. */
  bordered: v.boolean(),

  /** Whether the chart is in a different background from the main page. */
  layered: v.boolean(),

  /** Whether the stat card itself is rounded. */
  roundCard: v.boolean(),

  /** The chart's width (number of grid cells it takes up). */
  width: v.number(),

  /** The chart's height (number of grid cells it takes up). */
  height: v.number(),

  /** The location of the title. */
  titleLocation: ChartTitleLocation,

  /** Whether the title has a border or not. */
  titleBorder: ChartTitleBorder,

  /** The alignment of the title text. */
  titleAlign: ChartTitleAlign,
})

export interface ChartOptionCheckbox
  extends v.InferOutput<typeof ChartOptionCheckbox> {}
export const ChartOptionCheckbox = v.object({
  /** The type of this chart option. */
  type: v.literal("checkbox"),

  /** The current value of this chart option. */
  value: v.boolean(),

  /** A label for this chart option. */
  label: v.string(),

  /** The name of the variable to interpolate. */
  name: v.string(),
})

export type ChartOptionValue = v.InferOutput<typeof ChartOptionValue>
export const ChartOptionValue = v.union([
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
])

export interface ChartOptionSelect
  extends v.InferOutput<typeof ChartOptionSelect> {}
export const ChartOptionSelect = v.object({
  /** The type of this chart option. */
  type: v.picklist(["select", "dropdown"]),

  /** The current value of this chart option. */
  value: ChartOptionValue,

  /** A label for this chart option. */
  label: v.string(),

  /** The name of the variable to interpolate. */
  name: v.string(),

  /** Possible values for this option and their labels. */
  values: v.array(v.tuple([v.string(), ChartOptionValue])),
})

export type ChartOption = v.InferOutput<typeof ChartOption>
export const ChartOption = v.union([ChartOptionCheckbox, ChartOptionSelect])

export interface ChartCard extends v.InferOutput<typeof ChartCard> {}
export const ChartCard = v.object({
  /** The id of the stat card. */
  id: Id,

  /** The last edited timestamp of the stat card. */
  last_edited: v.number(),

  /** The title of the stat card. */
  title: v.string(),

  /** The query run to get the information. */
  query: v.string(),

  /** A definition of the chart itself. */
  chart: Chart,

  /** A definition of the chart's styles. */
  style: ChartStyle,

  /** An array of chart options. */
  options: v.array(ChartOption),
})

export type ChartDataLabel = v.InferOutput<typeof ChartDataLabel>
export const ChartDataLabel = v.union([v.string(), v.number()])

export interface ChartDataEntry extends v.InferOutput<typeof ChartDataEntry> {}
export const ChartDataEntry = v.tuple([ChartDataLabel, v.array(v.number())])

export interface ChartData extends v.InferOutput<typeof ChartData> {}
export const ChartData = v.array(ChartDataEntry)

export interface ChartComputedInfo
  extends v.InferOutput<typeof ChartComputedInfo> {}
export const ChartComputedInfo = v.object({
  /** The data of the query. */
  data: ChartData,

  /** A computed definition of the chart's cross axis. */
  crossAxis: ChartComputedCrossAxis,
})

export interface ChartColorEntry
  extends v.InferOutput<typeof ChartColorEntry> {}
export const ChartColorEntry = v.tuple([v.string(), v.string()])

export interface ChartColors extends v.InferOutput<typeof ChartColors> {}
export const ChartColors = v.array(ChartColorEntry)

export interface Collection extends v.InferOutput<typeof Collection> {}
export const Collection = v.object({
  version: v.picklist([3, 6]),
  cards: v.array(AnyCard),
  graves: v.array(Grave),
  notes: v.array(Note),
  rev_log: v.array(Review),
  core: Core,
  models: v.array(Model),
  decks: v.array(Deck),
  confs: v.array(Conf),
  prefs: Prefs,
  charts: v.nullish(v.array(ChartCard), []),
})

export interface PackagedDeckMeta
  extends v.InferOutput<typeof PackagedDeckMeta> {}
export const PackagedDeckMeta = v.object({
  version: v.literal(1),
  /** A record from hashed names to original names. */
  media: v.nullable(v.record(v.string(), v.string())),
  hasScheduling: v.boolean(),
  hasRevlog: v.boolean(),
  hasConfs: v.boolean(),
})

export interface PackagedDeckData
  extends v.InferOutput<typeof PackagedDeckData> {}
export const PackagedDeckData = v.object({
  models: v.array(Model),
  confs: v.nullable(v.array(Conf)),
  notes: v.array(Note),
  decks: v.array(Deck),
  cards: v.array(AnyCard),
  rev_log: v.nullable(v.array(Review)),
})

export interface PackagedDeck {
  meta: PackagedDeckMeta
  data: PackagedDeckData
  media: JSZip | null
}

export interface RepeatItem {
  card: AnyCard
  log: Review
}

export type RepeatInfo = Record<Grade, RepeatItem>

export type AddedModel = { id: Id; name: string; cloned: Model }

export type RemovedModel = [Id, string]

export type Buckets = [new: number, lrn: number, rev: number]

export type DeckHomeInfo = {
  deck?: { collapsed: boolean; name: string; id: Id }
  self: Buckets
  sub: Buckets
}

export type DeckHomeTree = TreeOf<DeckHomeInfo | undefined, DeckHomeInfo>

export type CardBucket = 0 | 1 | 2 | null
