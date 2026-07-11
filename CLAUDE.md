# CLAUDE.md — groceries-app

## Project & goal
A personal, Hebrew, voice-driven **grocery-inventory + shopping-list PWA**. You keep a master
inventory of things you buy in your own **house order**, then run a fast voice "buy session"
that reads each item aloud and you answer **כן / לא / a number (quantity)**. Selected items are
exported to **Google Tasks**, one new list per trip, in house order.

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
  version: 3,
  items:  [ { id, name } ],  // ARRAY ORDER = house order
  shops:  [ { id, name } ]   // user's shops (settings tab); display-only, no ordering semantics
}
```
- **House order** = the `items` array order (up/down reorder on the master list). It is the ONLY
  ordering — used by the session and by the Google Tasks export.
- `id` = `slug()` = `Date.now().toString(36) + Math.random().toString(36).slice(2,6)` (no `crypto` dependency).
- `sanitize(d)` runs on `load()` and on import: coerces any blob into a clean v3 (`items[]` + `shops[]`,
  each an array of `{id,name}`, minting missing ids). It also silently upgrades a **v2** blob by keeping `items[].name` and dropping the
  removed `stores` / `aisleOrder` fields.

### Migration
- **Legacy `grocery-items` (`string[]`):** on load, if `grocery-data` is absent, convert each string →
  `{ id, name }`, write `grocery-data`. The legacy key is left untouched as a one-release safety net.
- **v2 → v3 (stores removed):** an existing v2 blob loads through `sanitize()`, which preserves item
  names + house order and drops all store data. No user action needed.

## Feature map
- **Tab 1 — רשימת מלאי (master list):** items in house order; up/down reorder; delete; text-add + voice-add.
- **Tab 2 — סשן קניות (buy session):** single flow over all items in house order. Each item: speak →
  listen → answer כן / לא / number. Selected tracked as `{ itemId, qty }`; chips + tasks display
  `name ×N` (×1 omitted). Result screen lists selected items in house order and saves ONE Google Tasks
  list. Manual כן/לא + ×2–×5 buttons as fallback.
- **Tab 3 — הגדרות (settings):** **חנויות** — add shops via text input, remove each (display-only list,
  no ordering); **backup** export (download full `grocery-data` JSON) + import (validate → `sanitize` → replace).
- **Export:** all selected items → a single Google Tasks list, in house order.

## Speech-recognition contract (the top fragility area — treat as invariants)
Historic bug: voice-add "multiplied the previous item" because it committed from **interim** results and
patched it with a name/time dedup. The fix is a single strict contract, applied to **both** voice-add and
session via one factory `createSpeechEngine(onFinal)`:
- `continuous = false`, `interimResults = true` — **commit ONLY from `isFinal` results.**
  (interimResults **must** be `true`: Android Chrome fires **no** `onresult` events at all when
  it's `false` — mic runs but nothing is ever detected. The `onresult` handler ignores non-final
  events, so single-commit-per-instance + gen guard still prevent the historic multiply bug.)
- **`hasCommitted` flag (non-continuous / desktop only)** — that instance commits **at most once**,
  then ignores further events (restart via `onend` handles the next phrase). In **continuous mode**
  ONE live instance commits **many** phrases (see `continuous` bullet); a per-phrase `baseIdx` (advanced
  to the last-final index +1 on each commit) scopes each phrase, so repeats are still captured cleanly.
- **Generation counter** (`gen`): every handler captures `myGen` at creation and bails if `myGen !== gen`.
  `begin()`/`end()` bump `gen`, invalidating in-flight handlers.
- **Full teardown before restart**: null `onresult/onend/onerror`, `abort()`, then start a fresh instance
  after one consistent delay. **One restart-timer variable**, always cleared before reschedule.
- **No name/time dedup.** Correctness comes from committing only from finals + the `baseIdx`/`hasCommitted`
  phrase scoping + generation guard, so deliberate repeats of the same word are captured and the
  previous item is never duplicated.
- **`continuous = isMobileSession`**: on mobile the mic stays open across pauses (Android SR has a
  long warmup and with `continuous=false` auto-stops after every phrase, so speech lands in the dead
  warmup/restart gap). Desktop keeps `false`. In continuous mode we **do NOT tear down between phrases**
  — the one live instance keeps listening and commits repeatedly via `baseIdx`, so an item spoken
  right after the beep is captured with no dead gap. A fresh instance is only started when Android
  itself ends the recognition after long silence (`onend` → `scheduleStart`). (Earlier versions
  re-armed a fresh instance after every commit; that reintroduced the ~750ms dead gap and is gone.)
- **`onStarted` callback** (2nd arg of `createSpeechEngine`): fires on the real `onstart` event.
  Currently unused by session and voice-add (both pass no `onStarted`). The session's "your turn"
  beep instead fires the instant TTS finishes (in `speakItem`'s `go()`), so feedback is immediate
  rather than waiting for mic warmup; the mic `begin()`s right after (continuous mode keeps it open
  on mobile so the short warmup no longer eats the beep-to-capture gap).
- **Multi-word debounce (continuous mode only):** Android finalizes a multi-word phrase word-by-word,
  so committing on the first `isFinal` dropped later words. In continuous mode `onresult` takes the
  **longest** final transcript (Android re-emits a growing final at a NEW index — "רסק" then
  "רסק עגבניות" — so concatenating all finals doubles the first word) and commits only after
  `MULTIWORD_DELAY` (~900ms) of silence, or on `onend` (flush). Desktop (non-continuous) commits immediately —
  it gets the whole phrase in one final. Single-commit-per-instance still holds.
- **Cumulative-prefix strip (continuous mode only):** Android's continuous SR re-emits the **entire
  session transcript** on each new phrase's final, so item N's final embeds every prior committed item
  ("rice" → "rice milky" → "rice milky coca cola"). `baseIdx` skips old *result indices* but the prefix
  lives *inside the new final's string*, so it survives — the historic "concatenated the previous item"
  bug. Fix: on each continuous commit, save the cumulative raw transcript as `committedPrefix`; on the
  next `onresult`, if the longest final `startsWith(committedPrefix)`, strip it and commit only the
  new suffix. A fresh instance (post-`onend`) resets `committedPrefix`/`baseIdx` to '' /0, matching
  Android's own session reset.
- **Voice-add "cancel"** (`CANCEL_WORDS`: בטל/ביטול/מחק/טעות/cancel/undo…): pops the last captured
  pending item and beeps low (`beep(440)`) instead of adding. Voice-add only — not session.
- Beep on every accepted capture: `beep(1175)` for voice-add (`beep(440)` on cancel). Session beeps
  on TTS end (the "your turn" cue), then again on each answer: `beep(1319)` high for yes/amount,
  `beep(392)` low for no.
- Keep the 4s `speakItem` TTS fallback and the mobile start/restart delays (`START_DELAY`, `RESTART_DELAY`).

## Audio beep contract
`beep(freq)` returns a Promise that **always resolves within ~250ms** (safety timeout) so it can never
hang the flow. The shared `AudioContext` must be created/resumed inside a user gesture — `unlockAudio()`
is called on the first tap of voice-add and session start.

## Google Tasks
- `CLIENT_ID` = the OAuth web client id (in `index.html`); scope = `https://www.googleapis.com/auth/tasks`.
- Auth via **GIS token client** (`google.accounts.oauth2.initTokenClient`); token persisted in
  `localStorage['grocery-gtoken']` with expiry; `ensureToken(cb)` re-auths silently when expired.
- Export creates ONE list per trip titled **`קניות — DD/MM`**, tasks titled `name ×N` (×1 omitted),
  inserted in **reverse** so Google's prepend-on-insert yields correct house order top→bottom.
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
Any agent that changes the **data model**, a **feature**, or the **speech contract**
**must update this CLAUDE.md in the same change** and note what moved.

## Verification
Serve locally (`python3 -m http.server` in the repo) and open in **Chrome** (Web Speech needs it).
- **Migration (legacy):** with a legacy `grocery-items` string list in localStorage and no `grocery-data`,
  load → items appear in house order, no data loss.
- **Migration (v2 → v3):** with an old v2 `grocery-data` blob (stores + aisleOrder), load → item names +
  house order preserved, store data silently dropped, no error.
- **Speech bug:** voice-add — say 5 distinct items with short pauses → each commits once, no duplication,
  a beep per item. Say the same word twice deliberately → both captured. Say a **two-word** item (e.g.
  "רסק עגבניות") on mobile → captured whole, not just the first word. Say "בטל"/"cancel" → last item removed (low beep).
- **Session:** run through items in house order, answer mix of כן / לא / "שתיים" / a digit → chips show `name ×N`.
- **Export:** connect Google, finish a session → ONE list named `קניות — DD/MM`, `×N` titles, house order
  preserved top→bottom.
- **Import/export:** export JSON (Tab 3 הגדרות), clear localStorage, import → state restored identically.
- **PWA:** push to main (CI bumps version + cache), reload twice → new version served offline; tap
  the 🛒 logo → alert shows the incremented `APP_VERSION`.
