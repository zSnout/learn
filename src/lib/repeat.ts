import { FSRS, Rating, type RecordLogItem, State } from "ts-fsrs"
import { daysBetweenSync } from "./day"
import { randomId } from "./id"
import { pray } from "./pray"
import { AnyCard, Conf, type RepeatInfo, type RepeatItem } from "./types"

function createRepeatItem(
  prev: AnyCard,
  rating: Rating,
  time: number,
  dayStart: number,
  next: AnyCard,
  review: number,
): RepeatItem {
  return {
    card: next,
    log: {
      cid: next.id,
      difficulty: next.difficulty,
      type: 0, // FEAT: filtered or manual
      due: next.due,
      state: next.state,
      id: randomId(),
      rating,
      review,
      last_elapsed_days: prev.elapsed_days,
      elapsed_days: daysBetweenSync(
        dayStart,
        prev.last_review,
        next.last_review,
      ),
      scheduled_days: daysBetweenSync(dayStart, next.due, next.last_review),
      stability: next.stability,
      time,
    },
  }
}

function merge(
  prev: AnyCard,
  rating: Rating,
  { card: fsrsCard }: RecordLogItem,
  time: number,
  dayStart: number,
  review: number,
) {
  return createRepeatItem(
    prev,
    rating,
    time,
    dayStart,
    {
      ...prev,
      due: fsrsCard.due.getTime(),
      last_review: fsrsCard.last_review?.getTime() ?? null,
      reps: fsrsCard.reps,
      state: fsrsCard.state,
      elapsed_days: fsrsCard.elapsed_days,
      scheduled_days: fsrsCard.scheduled_days,
      stability: fsrsCard.stability,
      difficulty: fsrsCard.difficulty,
      lapses: fsrsCard.lapses,
    },
    review,
  )
}

function setDue(card: AnyCard, now: number): AnyCard {
  if (card.state == State.New) {
    return { ...card, state: State.New, due: now }
  } else {
    return card
  }
}

function repeatFsrs(
  card: AnyCard,
  dayStart: number,
  f: FSRS,
  now: number,
  time: number,
): RepeatInfo {
  card = setDue(card, now)
  const byFsrs = f.repeat(card, now)

  return {
    [Rating.Again]: merge(
      card,
      Rating.Again,
      byFsrs[Rating.Again],
      time,
      dayStart,
      now,
    ),
    [Rating.Hard]: merge(
      card,
      Rating.Hard,
      byFsrs[Rating.Hard],
      time,
      dayStart,
      now,
    ),
    [Rating.Good]: merge(
      card,
      Rating.Good,
      byFsrs[Rating.Good],
      time,
      dayStart,
      now,
    ),
    [Rating.Easy]: merge(
      card,
      Rating.Easy,
      byFsrs[Rating.Easy],
      time,
      dayStart,
      now,
    ),
  }
}

function findLastIndex<T>(array: T[], fn: (item: T, index: number) => boolean) {
  for (let index = array.length - 1; index >= 0; index--) {
    if (fn(array[index]!, index)) {
      return index
    }
  }
  return -1
}

function repeatLearning(
  card: AnyCard,
  conf: Conf,
  dayStart: number,
  f: FSRS,
  now: number,
  time: number,
): RepeatInfo {
  card = setDue(card, now)
  const learningSteps = conf.new.learning_steps

  const againStep = learningSteps[0]
  pray(againStep != null, "must have at least one learning step")

  const lastStepInSeconds =
    card.last_review ? (card.due - card.last_review) / 1000 : againStep
  let lastStepIndex = findLastIndex(
    learningSteps,
    (step) => step <= lastStepInSeconds,
  )
  if (lastStepIndex == -1) {
    lastStepIndex = 0
  }

  const byFsrs = repeatFsrs(card, dayStart, f, now, time)

  const dueAgain = now + againStep * 1000

  const areLearningStepsLeft = lastStepIndex + 1 < learningSteps.length

  const dueGood =
    areLearningStepsLeft ?
      now + learningSteps[lastStepIndex + 1]! * 1000
    : byFsrs[Rating.Good].card.due

  const dueHard =
    areLearningStepsLeft ?
      // average again and good
      (dueAgain + dueGood) / 2
    : learningSteps.length == 1 ?
      // higher than `Again`
      now + againStep * 1500
      // go back to last learning step
    : now + learningSteps[learningSteps.length - 1]! * 1000

  return {
    [Rating.Again]: createRepeatItem(
      card,
      Rating.Again,
      time,
      dayStart,
      {
        ...card,
        due: dueAgain,
        last_review: now,
        reps: card.reps + 1,
        state: State.Learning,
        elapsed_days: daysBetweenSync(dayStart, card.last_review, now),
        scheduled_days: 0,
        stability: byFsrs[Rating.Again].card.stability,
        difficulty: byFsrs[Rating.Again].card.difficulty,
        lapses: byFsrs[Rating.Again].card.lapses,
      },
      now,
    ),

    [Rating.Hard]: createRepeatItem(
      card,
      Rating.Hard,
      time,
      dayStart,
      {
        ...card,
        due: dueHard,
        last_review: now,
        reps: card.reps + 1,
        state: State.Learning,
        elapsed_days: daysBetweenSync(dayStart, card.last_review, now),
        scheduled_days: 0,
        stability: byFsrs[Rating.Hard].card.stability,
        difficulty: byFsrs[Rating.Hard].card.difficulty,
        lapses: byFsrs[Rating.Hard].card.lapses,
      },
      now,
    ),

    [Rating.Good]:
      areLearningStepsLeft ?
        createRepeatItem(
          card,
          Rating.Good,
          time,
          dayStart,
          {
            ...card,
            due: dueGood,
            last_review: now,
            reps: card.reps + 1,
            state: State.Learning,
            elapsed_days: daysBetweenSync(dayStart, card.last_review, now),
            scheduled_days: 0,
            stability: byFsrs[Rating.Good].card.stability,
            difficulty: byFsrs[Rating.Good].card.difficulty,
            lapses: byFsrs[Rating.Good].card.lapses,
          },
          now,
        )
      : byFsrs[Rating.Good],

    [Rating.Easy]: byFsrs[Rating.Easy],
  }
}

/**
 * This should really only be available in `state.ts`, but it's nice to break up
 * the code into multiple modules. So this function is given a very long name to
 * dissuade it from being used in other areas of the code.
 */
export function __unsafeDoNotUseDangerouslySetInnerHtmlYetAnotherMockOfReactRepeatUnfiltered(
  card: AnyCard,
  conf: Conf,
  dayStart: number,
  f: FSRS,
  now: number,
  time: number,
): RepeatInfo {
  if (
    card.last_review == null ||
    card.state == State.New ||
    card.state == State.Learning
  ) {
    return repeatLearning(card, conf, dayStart, f, now, time)
  }

  // TODO: handle relearning

  return repeatFsrs(card, dayStart, f, now, time)
}

/**
 * This should really only be available in `state.ts`, but it's nice to break up
 * the code into multiple modules. So this function is given a very long name to
 * dissuade it from being used in other areas of the code.
 */
export function __unsafeDoNotUseDangerouslySetInnerHtmlYetAnotherMockOfReactForget(
  card: AnyCard,
  dayStart: number,
  f: FSRS,
  now: number,
  time: number,
  reset_count: boolean,
): RepeatItem {
  return merge(
    card,
    Rating.Manual,
    f.forget(card, now, reset_count),
    time,
    dayStart,
    now,
  )
}
