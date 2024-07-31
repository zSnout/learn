(idb versions, that is)

# v1

(never in use)

# v2

```ts
export interface DBTypes extends DBSchema {
  cards: { key: Id; value: AnyCard; indexes: { nid: Id; did: Id } }
  graves: { key: Id; value: Grave; indexes: {} }
  notes: { key: Id; value: Note; indexes: { mid: Id } }
  rev_log: { key: Id; value: Review; indexes: { cid: Id } }
  core: { key: Id; value: Core; indexes: {} }
  models: { key: Id; value: Model; indexes: {} }
  decks: { key: Id; value: Deck; indexes: { cfid: Id } }
  confs: { key: Id; value: Conf; indexes: {} }
  prefs: { key: Id; value: Prefs; indexes: {} }
}
```

# v3

- added `keyPath` to everything that can have `keyPath`
- added `name: string` index on object store `decks`
- installs default deck if no decks exist
- installs core, confs, and prefs
- adds "basic" model
- adds "basic and reversed" model

# v4

- cards and models now have a `creation` property

# v5

- the `prefs.last_edit` property is now `prefs.last_edited`

# v6

- the `Review.type` property can now only be 0, 3, or 4

# v7

- the `Deck` type now has a `creation` property

# v8

- the `Grave` type now has the `id` property
- the `Deck.revlogs_today` property is now a number instead of an array
- the `Prefs.active_decks` property has been removed

# v9

- the `Prefs.last_unburied` property is now required
