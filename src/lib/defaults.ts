import { Id, ID_ZERO, randomId } from "./id"
import type {
  Conf,
  Core,
  Deck,
  ModelField,
  ModelTemplate,
  Prefs,
} from "./types"

// FEAT: ID_MODEL_BASIC_OPTIONAL_REVERSED
// FEAT: ID_MODEL_BASIC_TYPE_ANSWER
// FEAT: ID_MODEL_BASIC_CLOZE
// FEAT: ID_MODEL_BASIC_IMAGE_OCCLUSION

export function createCore(now: number): Core {
  return {
    creation: now,
    last_edited: now,
    last_schema_edit: now,
    last_sync: now,
    tags: "",
  }
}

export function createPrefs(now: number): Prefs {
  return {
    last_edited: now,
    current_deck: null,
    last_model_used: null,
    new_spread: 0,
    collapse_time: 60 * 20,
    notify_after_time: 0,
    show_review_time_above_buttons: true,
    show_remaining_due_counts: true,
    next_new_card_position: 0,
    last_unburied: 0,
    day_start: 1000 * 60 * 60 * 4,
    debug: false,
    show_deck_name: true,
    sidebar_state: "closed",
    show_flags_in_sidebar: true,
    show_marks_in_sidebar: true,
    template_edit_style: {
      row: "inline",
      template: { front: true, back: true, styling: true },
      theme: { light: true, dark: true },
    },
    browser: {
      active_cols: ["Sort Field", "Due", "Card", "Tags", "Deck"],
      sort_field: "Sort Field",
      sort_backwards: false,
    },
  }
}

export function createConf(now: number): Conf {
  return {
    id: ID_ZERO,
    autoplay_audio: true,
    last_edited: now,
    name: "Default",
    new: {
      bury_related: false,
      pick_at_random: false,
      per_day: 20,
      learning_steps: [60, 10 * 60],
    },
    replay_question_audio: false,
    review: {
      bury_related: false,
      enable_fuzz: true,
      max_review_interval: 36500,
      per_day: Number.MAX_SAFE_INTEGER,
      relearning_steps: [10 * 60],
      requested_retention: 0.9,
      w: null,
    },
    show_global_timer: false,
    timer_per_card: null,
  }
}

export function createDeck(now: number, name: string, id: Id): Deck {
  return {
    id,
    creation: now,
    collapsed: false,
    desc: "",
    is_filtered: false,
    last_edited: now,
    name,
    new_today: [],
    cfid: ID_ZERO,
    today: now,
    revcards_today: [],
    revlogs_today: 0,
    custom_newcard_limit: null,
    custom_revcard_limit: null,
    default_newcard_limit: null,
    default_revcard_limit: null,
  }
}

export function createField(name: string, id = randomId()): ModelField {
  return {
    id,
    name,
    rtl: false,
    desc: "",
    collapsed: false,
    excludeFromSearch: false,
    html: false,
    sticky: "",
    font: null,
    size: null,
  }
}

export function createModelTemplate(
  qfmt: string,
  afmt: string,
  name: string,
  id = randomId(),
): ModelTemplate {
  return { id, qfmt, afmt, name, ab: null, qb: null }
}
