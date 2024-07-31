## Markers in the code

- `FIXME` – something which needs to be fixed, but which isn't urgent
- `FEAT` – where a new feature should be added, but which isn't urgent
- `TODO` – this needs fixing as soon as possible
- `CHECK` – this needs a label above assigned to it
- `PERF` – something which could affect performance and should be changed

## Sharing decks

To package a deck successfully, we need to save:

- decks
- models
- notes
- cards

Importing decks is more complicated, but requires:

1. We resolve models. If a model exists with...
   1. the same ID, fields, templates, and CSS, nothing happens.
   2. the same ID, this model's ID is incremented until there are no conflicts.
   3. the same name, `+` characters are appended until there are no conflicts.
2. We resolve deck configurations, if they are included. If one exists with...
   1. the same ID and name, whichever with the later `last_edited` is kept.
   2. the same name but different ID, the name is appended `+` until there are
      no conflicts.
   3. the same ID but different name, the ID is incremented until there are no
      conflicts.
3. We resolve notes. If a note exists with...
   1. the same ID and MID, whichever note has a later `last_edited` is kept.
   2. the same ID but a different MID, the imported note's ID is incremented
      until there are no conflicts.
4. We resolve decks. Pick an imported deck configuration, one already in the
   user's collection, or the
   [default deck configuration](#finding-a-default-deck-configuration). If a
   deck already exists with...
   1. the same ID, whichever has a later `last_edited` is kept
   2. the same name but a different ID, the imported deck is renamed with `+`
      until it has no collisions.
5. Scheduling information on cards should be reset if the user requested it.
6. We resolve cards. If a card already exists with...
   1. the same ID, NID, and TID, whichever card has a later `last_edited` is
      kept.
   2. the same ID, but a different NID/TID, the ID is incremented until there
      are no conflicts.
7. We resolve review log entries. If a review log exists with the same ID,
   nothing happens. Otherwise, the review log entry is imported.

## Finding a default deck configuration

The old algorithm is below. In the SQLite-based system, a configuration with ID
zero is always available due to triggers enforcing it.

Prefer, in order,

1. id zero
2. name `Default`
3. first one alphabetically
