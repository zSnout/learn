# Priority I

**Data storage**

- [x] all data is automatically saved locally
- [ ] if multiple tabs are opened, at least one will forcefully stop
- [x] a complete collection can be exported or imported as a file

**Decks**

- [x] deck overview
- [x] "create a deck" button

**Notes**

- [x] note creation screen
- [ ] note editing screen

**Reviews**

- [x] implement most of the scheduler
- [ ] implement relearning steps
- [x] finish the scheduler
- [x] have a screen to review cards

**Models**

- [x] model field editor
- [x] model template editor
- [x] model template generator
- [x] "create a model" button

**Preferences**

- [ ] basic global preferences screen
- [ ] basic per-deck preferences screen
- [ ] pick scheduling algorithm

# Priority II

**Navigation**

- [ ] url hash tracks layers and position

**Data storage**

- [ ] syncing to corporate
- [ ] syncing to g drive
- [ ] syncing to supabase
- [ ] syncing to custom
- [ ] import and export decks
- [ ] import from anki
- [ ] import from quizlet
- [ ] import from csv
- [ ] import from plain text
- [ ] import from json
- [ ] importable files can be dragged directly over the window
- [x] deck sharing

**Media**

- [x] media files can be uploaded
- [x] dragging media into a field uploads and references it
- [ ] audio and video automatically play correctly
- [ ] media files are saved and can be exported with a deck
- [ ] inline styling buttons exist instead of being direct-html-only

**Decks**

- [x] show "new", "learning", and "due" cards for the day
- [x] allow decks to be renamed
- [x] allow decks to be deleted
- [x] allow decks to be nested

**Browse**

- [x] implement card browser
- [ ] implement note browser
- [x] export selected cards from browse view
- [ ] export selected notes from browse view

**Statistics**

- [ ] show per-deck statistics when clicking a deck
- [x] show global statistics in dedicated screen
- [ ] show some global statistics on homepage
- [ ] show summary of what was learned each day

**Models**

- [ ] cloze
- [ ] image occlusion
- [ ] multiple choice

**Notes**

- [ ] latex is supported (mathquill or mathjax)
- [ ] mathquill for latex editing

**Cards**

- [ ] auto bury siblings
- [ ] customize card picking order
- [ ] manage card due order
- [x] suspend individual cards

# Priority III

**Breaks**

- [ ] vacation mode
- [ ] disperse after zero-review day

**Documentation**

- [ ] add thorough documentation
- [ ] quick help: some elements have a `data-z-help` attribute, and a button can
      be activated so that hovering over an element with that attribute shows
      the help text inside it
