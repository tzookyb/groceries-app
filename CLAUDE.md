# CLAUDE.md — groceries-app

## Project & goal
A personal, Hebrew, voice-driven **grocery-inventory + shopping-list PWA**. You keep a master
inventory of things you buy, tag each to the stores that sell it, then run a fast voice "buy session"
that reads each item aloud and you answer **כן / לא / a number (quantity)**. Selected items are
exported to **Google Tasks**, one new list per store per trip, in that store's shopping-route order.

### Hard constraints
- **Swift**: no long waits between items in a session. Minimal delays.
- **Hebrew everywhere**: all UI is Hebrew; speech is `he-IL` (recognition + synthesis).
- **Mobile-first (hard constraint)**: runs almost entirely as an installed Android PWA. Every control
  is thumb-first — touch targets ≥44px, primary actions reachable, no hover-only affordances,
  **no HTML5 drag-and-drop** (it doesn't fire on touch — use up/down move buttons). Portrait-locked.
- **PWA installable**, hosted on **GitHub Pages**.
- **All data is local only** (`localStorage`). No backend. Import/export JSON is the only backup.

## Architecture
No build step, no dependencies, no framework.
- `index.html` — everything: inline HTML + CSS + JS (state, UI, speech, Google, session).
- `sw.js` — service worker (offline cache). **Bump `CACHE` version on every release.**
- `manifest.json` — PWA manifest (portrait-locked, RTL, Hebrew).
- `icon-192.png`, `icon-512.png` — app icons.

## Data model (localStorage `grocery-data`, one JSON blob)
```js
{
  version: 2,
  stores: [ { id, name } ],                        // e.g. Shufersal, OsherAd, KSP
  items:  [ { id, name, stores: [storeId, ...] } ], // ARRAY ORDER = house order
  aisleOrder: { [storeId]: [itemId, ...] }          // per-store shopping-route order
}
```
- **House order** = the `items` array order (up/down reorder on the master list). Used by "all" session mode.
- **Aisle order** = `aisleOrder[storeId]` (up/down reorder on the store's screen). Used by "per-store"
  session mode and by that store's Google Tasks export.
- `id` = `slug()` = `Date.now().toString(36) + Math.random().toString(36).slice(2,8)` (no `crypto` dependency).

### Aisle-order invariants (maintain on EVERY mutation — enforced centrally by `repairInvariants()`)
- Tagging an item to a store → append its `id` to that store's `aisleOrder`.
- Untagging / deleting an item → remove its `id` from that store's `aisleOrder`.
- Deleting a store → drop its `aisleOrder` entry and remove `storeId` from every item's `stores`.
- `repairInvariants()` runs on `load()` and on import; it heals any drift (stale ids, missing entries,
  orphan orders). Prefer routing new mutations through the existing helpers (`toggleItemStore`,
  `deleteItem`, store CRUD) which already maintain invariants.

### Migration
On load: if `grocery-data` is absent but legacy `grocery-items` (a `string[]`) exists, convert each
string → `{ id, name, stores: [] }`, write `grocery-data`. The legacy key is left untouched as a
one-release safety net.

## Feature map
- **Tab 1 — רשימת מלאי (master list):** items with a toggleable **store pill** per store (tap = sold
  there); up/down reorder = house order; text-add + voice-add.
- **Tab 2 — סשן קניות (buy session):** mode selector — **all items** (house order) vs **per store**
  (pick store → its aisle order). Each item: speak → listen → answer כן / לא / number. Selected tracked
  as `{ itemId, qty }`; chips + tasks display `name ×N` (×1 omitted). Result screen groups by store,
  saves per-store Google Tasks lists. Manual כן/לא + ×2–×5 buttons as fallback.
- **Tab 3 — חנויות (stores):** add / rename / delete stores; per-store screen to reorder aisle order;
  **backup** export (download full `grocery-data` JSON) + import (validate → replace).
- **Per-store export:** "all" mode duplicates each selected item into each of its tagged stores;
  "per store" mode → single store. **Unassigned selected items are skipped** (shown on the result screen).

## Speech-recognition contract (the top fragility area — treat as invariants)
Historic bug: voice-add "multiplied the previous item" because it committed from **interim** results and
patched it with a name/time dedup. The fix is a single strict contract, applied to **both** voice-add and
session via one factory `createSpeechEngine(onFinal)`:
- `continuous = false`, `interimResults = true` — **commit ONLY from `isFinal` results.**
  (interimResults **must** be `true`: Android Chrome fires **no** `onresult` events at all when
  it's `false` — mic runs but nothing is ever detected. The `onresult` handler ignores non-final
  events, so single-commit-per-instance + gen guard still prevent the historic multiply bug.)
- **`hasCommitted` flag per `SpeechRecognition` instance** — each instance commits **at most once**;
  after committing it ignores all further events.
- **Generation counter** (`gen`): every handler captures `myGen` at creation and bails if `myGen !== gen`.
  `begin()`/`end()` bump `gen`, invalidating in-flight handlers.
- **Full teardown before restart**: null `onresult/onend/onerror`, `abort()`, then start a fresh instance
  after one consistent delay. **One restart-timer variable**, always cleared before reschedule.
- **No name/time dedup.** Correctness comes from single-commit-per-instance + generation guard, so
  deliberate repeats of the same word are captured, and the previous item is never duplicated.
- **`continuous = isMobileSession`**: on mobile the mic stays open across pauses (Android SR has a
  long warmup and with `continuous=false` auto-stops after every phrase, so answers land in the dead
  warmup/restart gap). Desktop keeps `false`. In continuous mode, `onresult` re-arms a fresh instance
  after each commit (`scheduleStart`) so multi-item voice-add still captures the next phrase; in
  session mode the caller `end()`s first, bumping `gen` to invalidate that restart.
- **`onStarted` callback** (2nd arg of `createSpeechEngine`): fires on the real `onstart` event. The
  session engine beeps here — NOT before `begin()` — so the "your turn" cue lines up with the mic
  actually capturing (critical on mobile). Voice-add passes no `onStarted` (it beeps per capture).
- Beep on every accepted capture: `beep(1175)` for voice-add. Session beeps on `onstart` (mic live).
- Keep the 4s `speakItem` TTS fallback and the mobile start/restart delays (`START_DELAY`, `RESTART_DELAY`).

## Audio beep contract
`beep(freq)` returns a Promise that **always resolves within ~250ms** (safety timeout) so it can never
hang the flow. The shared `AudioContext` must be created/resumed inside a user gesture — `unlockAudio()`
is called on the first tap of voice-add and session start.

## Google Tasks
- `CLIENT_ID` = the OAuth web client id (in `index.html`); scope = `https://www.googleapis.com/auth/tasks`.
- Auth via **GIS token client** (`google.accounts.oauth2.initTokenClient`); token persisted in
  `localStorage['grocery-gtoken']` with expiry; `ensureToken(cb)` re-auths silently when expired.
- Export creates one list per store titled **`StoreName — DD/MM`**, tasks titled `name ×N` (×1 omitted),
  inserted in **reverse** so Google's prepend-on-insert yields correct aisle order top→bottom.
- **The service worker bypasses Google origins** (`googleapis.com`, `accounts.google.com`, `gsi/client`)
  in its `fetch` handler — never cache those.

## Versioning & release rule
- `const APP_VERSION` (integer, in `index.html`) is the user-visible version. **Tapping the 🛒 logo
  alerts `גרסה N`.**
- `.githooks/pre-commit` **auto-increments `APP_VERSION` on every commit to `main`** and keeps
  `sw.js`'s `CACHE` (`grocery-v<N>`) in sync as part of the same commit — so you never bump `CACHE`
  by hand and GitHub Pages clients always get a fresh cached shell. (Chosen over a pre-push hook
  because git resolves the pushed ref before pre-push runs, so a pre-push bump can't ride the same
  push.) **Activate once per clone:** `git config core.hooksPath .githooks`.
- `APP_VERSION` and the `CACHE` integer are kept identical by the hook — don't diverge them manually.

## Self-update rule
Any agent that changes the **data model**, a **feature**, the **speech contract**, or the **store logic**
**must update this CLAUDE.md in the same change** and note what moved.

## Verification
Serve locally (`python3 -m http.server` in the repo) and open in **Chrome** (Web Speech needs it).
- **Migration:** with a legacy `grocery-items` string list in localStorage and no `grocery-data`, load →
  items appear with empty store pills, no data loss.
- **Speech bug:** voice-add — say 5 distinct items with short pauses → each commits once, no duplication,
  a beep per item. Say the same word twice deliberately → both captured.
- **Stores:** create 2 stores, tag an item to both, reorder each store's aisle order.
- **Session "all":** run through items, answer mix of כן / לא / "שתיים" / a digit → chips show `name ×N`.
- **Session "per store":** pick one store → only its items iterate, in aisle order.
- **Export:** connect Google, finish a session → one list per store named `Store — DD/MM`, `×N` titles,
  aisle order preserved, unassigned items absent.
- **Import/export:** export JSON, clear localStorage, import → state restored identically.
- **PWA:** push to main (CI bumps version + cache), reload twice → new version served offline; tap
  the 🛒 logo → alert shows the incremented `APP_VERSION`.
