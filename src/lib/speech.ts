// ═══════════════════════════════════════════════════════════
//  Speech engine — ONE strict contract for add + session.
//  • continuous=false, interimResults=TRUE (Android fires no onresult when
//    false) but we still commit ONLY from isFinal results
//  • hasCommitted: each SpeechRecognition instance commits at most ONCE
//  • generation counter: stale handlers ignored (myGen !== gen)
//  • single restart timer, always cleared before reschedule
//  No name/time dedup — correctness comes from single-commit + gen guard.
//
//  Lifted verbatim from the original index.html implementation — treat as
//  an invariant. Only type annotations were added; internal logic
//  (gen counter, baseIdx, committedPrefix, continuous/hasCommitted,
//  teardown) is byte-identical.
// ═══════════════════════════════════════════════════════════
import { normalizeSpeechText } from './hebrew';

export const isMobileSession = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const RESTART_DELAY = isMobileSession ? 400 : 200;
export const START_DELAY = isMobileSession ? 350 : 100;
// Silence window (continuous mode only) to let a multi-word phrase finish
// finalizing word-by-word before we commit it.
export const MULTIWORD_DELAY = 900;

export interface SpeechEngine {
  begin(): void;
  end(): void;
  isActive(): boolean;
}

export function createSpeechEngine(onFinal: (text: string) => void, onStarted?: () => void): SpeechEngine {
  let rec: any = null, gen = 0, active = false, restartTimer: ReturnType<typeof setTimeout> | null = null;

  function teardown() {
    if (!rec) return;
    const r = rec; rec = null;
    r.onresult = null; r.onend = null; r.onerror = null; r.onstart = null;
    try { r.abort(); } catch (e) { try { r.stop(); } catch (e2) {} }
  }
  function clearTimer() { if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; } }
  function scheduleStart(delay: number) {
    clearTimer();
    restartTimer = setTimeout(() => { restartTimer = null; if (active) start(); }, delay);
  }
  function start() {
    if (!active || !SR) return;
    teardown();
    const myGen = gen;
    const r = new (SR as any)();
    rec = r;
    // hasCommitted guards single-commit for non-continuous (desktop). In
    // continuous mode ONE live instance commits many phrases; baseIdx marks where
    // the current phrase's results start, and pendingEndIdx where the next begins.
    let hasCommitted = false, pendingFinal = '', pendingFull = '', pendingEndIdx = 0, commitTimer: ReturnType<typeof setTimeout> | null = null, baseIdx = 0, committedPrefix = '';
    function commit() {
      if (myGen !== gen || !active || !pendingFinal) return;
      const txt = pendingFinal; pendingFinal = '';
      if (r.continuous) {
        // Remember the cumulative raw transcript so the NEXT phrase can strip it
        // (Android re-emits the whole session transcript, prefix embedded).
        committedPrefix = pendingFull;
        // Advance past this phrase and keep the SAME instance listening — no
        // teardown/restart, so the mic stays hot and the next item spoken right
        // after the beep is captured with no dead gap.
        baseIdx = pendingEndIdx;
        onFinal(txt);
      } else {
        if (hasCommitted) return;
        hasCommitted = true;
        onFinal(txt);
      }
    }
    r.lang = 'he-IL';
    // On mobile keep the mic open across pauses: Android SR has a long warmup
    // and with continuous=false it auto-stops after every phrase, so speech lands
    // in the dead warmup/restart gap. continuous=true holds the mic live across
    // many phrases on one instance (see baseIdx/commit above).
    r.continuous = isMobileSession;
    // interimResults MUST be true: Android Chrome never fires onresult when it's
    // false (mic runs, zero result events). We still commit ONLY from isFinal
    // results below.
    r.interimResults = true;
    r.onstart = () => { if (myGen === gen && active && onStarted) onStarted(); };
    r.onresult = (e: any) => {
      if (myGen !== gen || !active) return;
      if (!r.continuous && hasCommitted) return;
      // Only look at results for the CURRENT phrase (index >= baseIdx). Android
      // re-emits a growing final at a NEW index ("רסק", then "רסק עגבניות"), so
      // take the single LONGEST final rather than concatenating (which doubled
      // the first word). Track the last final index so the next phrase starts
      // after it (ignoring trailing interim slots).
      let full = '', lastFinal = -1;
      for (let i = baseIdx; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        lastFinal = i;
        const t = e.results[i][0].transcript.trim();
        if (t.length > full.length) full = t;
      }
      if (!full) return; // only interim results so far — wait for a final
      // Android continuous SR re-emits the ENTIRE session transcript cumulatively,
      // so a new phrase's final embeds every prior committed item ("rice" then
      // "rice milky" then "rice milky coca cola"). Strip the committed prefix so we
      // commit only the newly-spoken words. (baseIdx handles growing finals WITHIN
      // one phrase; this handles the prefix carried ACROSS phrases.)
      let itemRaw = full;
      if (committedPrefix && full.startsWith(committedPrefix)) {
        itemRaw = full.slice(committedPrefix.length);
      }
      let txt = normalizeSpeechText(itemRaw.trim());
      if (!txt) return;
      pendingFinal = txt;
      pendingFull = full;
      pendingEndIdx = lastFinal + 1;
      // Android finalizes a multi-word phrase word-by-word; debounce so the whole
      // phrase accumulates before we commit. Desktop (non-continuous) gets the
      // whole phrase in one final, so commit immediately for swiftness.
      if (r.continuous) {
        if (commitTimer) clearTimeout(commitTimer);
        commitTimer = setTimeout(commit, MULTIWORD_DELAY);
      } else {
        commit();
      }
    };
    r.onerror = (e: any) => {
      if (myGen !== gen) return;
      if (rec === r) rec = null;
      if (active && e.error !== 'aborted') scheduleStart(RESTART_DELAY + 200);
    };
    r.onend = () => {
      if (myGen !== gen) return;
      if (rec === r) rec = null;
      if (commitTimer) { clearTimeout(commitTimer); commitTimer = null; }
      if (pendingFinal) commit(); // flush a phrase cut short by silence
      // Android eventually stops a continuous instance after long silence; resume
      // with a fresh instance (baseIdx resets to 0 in the new one).
      if (active) scheduleStart(RESTART_DELAY);
    };
    setTimeout(() => {
      if (myGen === gen && rec === r && active) { try { r.start(); } catch (e) {} }
    }, START_DELAY);
  }
  return {
    begin() { active = true; gen++; clearTimer(); start(); },
    end() { active = false; gen++; clearTimer(); teardown(); },
    isActive() { return active; }
  };
}
