import { useRef, useState } from 'react';
import { beep, unlockAudio } from '../lib/audio';
import { createSpeechEngine, isMobileSession, SR, type SpeechEngine } from '../lib/speech';
import { parseAnswer, isCorrection } from '../lib/hebrew';
import type { Item } from '../types';

interface SelectedEntry {
  itemId: string;
  qty: number;
}

interface HistoryEntry {
  kind: 'yes' | 'no';
  autoTagged: boolean;
}

export type SessionPhase = 'idle' | 'active' | 'result';
export type VoiceAnswerKind = '' | 'yes' | 'no';

interface SessionMutators {
  assignItemToShops(itemId: string, shopIds: string[]): void;
  unassignItemFromShops(itemId: string, shopIds: string[]): void;
}

export function useSession(masterItems: Item[], mutators: SessionMutators) {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SelectedEntry[]>([]);
  const [voiceAnswer, setVoiceAnswer] = useState<{ text: string; kind: VoiceAnswerKind }>({ text: '', kind: '' });

  const sessionRef = useRef<{ items: Item[]; idx: number; selected: SelectedEntry[]; history: HistoryEntry[] } | null>(null);
  const engineRef = useRef<SpeechEngine | null>(null);
  const sessionShopIdsRef = useRef<string[]>([]);
  const mutatorsRef = useRef(mutators);
  mutatorsRef.current = mutators;

  function getEngine(): SpeechEngine {
    if (!engineRef.current) {
      engineRef.current = createSpeechEngine(text => handleVoice(text), () => beep());
    }
    return engineRef.current;
  }

  // The mic begins warming up the instant TTS finishes; the "your turn" beep
  // fires only once the engine's onstart confirms it's genuinely listening,
  // so there's no dead-air window between the beep and a live mic.
  function speakItem(name: string) {
    const utt = new SpeechSynthesisUtterance(name);
    utt.lang = 'he-IL'; utt.rate = 1.3;
    speechSynthesis.cancel();
    let started = false;
    const go = () => {
      if (started) return; started = true;
      getEngine().begin();
    };
    const fallback = setTimeout(go, 4000);
    utt.onend = () => { clearTimeout(fallback); go(); };
    speechSynthesis.speak(utt);
  }

  function showCurrentItem() {
    const s = sessionRef.current;
    if (!s) return;
    if (s.idx >= s.items.length) { setPhase('result'); return; }
    const item = s.items[s.idx];
    setCurrentIdx(s.idx);
    setCurrentName(item.name);
    setVoiceAnswer({ text: '', kind: '' });
    speakItem(item.name);
  }

  function handleVoice(text: string) {
    if (isCorrection(text)) { undo(); return; }
    const p = parseAnswer(text);
    if (p.type === 'no') answer('no');
    else if (p.type === 'qty') answer('yes', p.qty);
    else if (p.type === 'yes') answer('yes', 1);
    else setVoiceAnswer({ text: `שמעתי: "${text}" — אמור כן / לא / מספר`, kind: '' });
  }

  function answer(kind: 'yes' | 'no', qty?: number) {
    const s = sessionRef.current;
    if (!s) return;
    getEngine().end();
    speechSynthesis.cancel();
    const item = s.items[s.idx];
    let autoTagged = false;
    if (kind === 'yes') {
      const q = qty || 1;
      beep(1319); // high beep = added (yes / amount)
      s.selected.push({ itemId: item.id, qty: q });
      setSelected(s.selected.slice());
      setVoiceAnswer({ text: q > 1 ? `✓ נוסף ×${q}` : '✓ נוסף', kind: 'yes' });
      if (item.shopIds.length === 0) {
        autoTagged = true;
        mutatorsRef.current.assignItemToShops(item.id, sessionShopIdsRef.current);
      }
    } else {
      beep(392); // low beep = skipped (no)
      setVoiceAnswer({ text: '✗ דלג', kind: 'no' });
    }
    s.history.push({ kind, autoTagged });
    s.idx++;
    setTimeout(showCurrentItem, isMobileSession ? 900 : 600);
  }

  function undo() {
    const s = sessionRef.current;
    if (!s) return;
    getEngine().end();
    speechSynthesis.cancel();
    if (s.history.length === 0) {
      beep(392);
      return;
    }
    const rec = s.history.pop()!;
    s.idx = s.history.length;
    const item = s.items[s.idx];
    if (rec.kind === 'yes') {
      s.selected.pop();
      setSelected(s.selected.slice());
    }
    if (rec.autoTagged) {
      mutatorsRef.current.unassignItemFromShops(item.id, sessionShopIdsRef.current);
    }
    showCurrentItem();
  }

  function start(selectedShopIds: string[]) {
    if (masterItems.length === 0) {
      alert('הוסף מוצרים לרשימת המלאי תחילה.');
      return;
    }
    if (selectedShopIds.length === 0) return;
    const items = masterItems.filter(
      it => it.shopIds.length === 0 || it.shopIds.some(id => selectedShopIds.includes(id))
    );
    unlockAudio();
    sessionShopIdsRef.current = selectedShopIds;
    sessionRef.current = { items, idx: 0, selected: [], history: [] };
    setSelected([]);
    setTotal(items.length);
    setPhase('active');
    showCurrentItem();
  }

  function stop() {
    getEngine().end();
    speechSynthesis.cancel();
    setPhase('result');
  }

  function reset() {
    setPhase('idle');
  }

  function selectedItems(): { item: Item; qty: number }[] {
    return selected
      .map(sel => {
        const item = masterItems.find(i => i.id === sel.itemId);
        return item ? { item, qty: sel.qty } : null;
      })
      .filter((x): x is { item: Item; qty: number } => x !== null);
  }

  return {
    phase, currentName, currentIdx, total, selected, voiceAnswer,
    supportsSR: !!SR,
    sessionShopIds: sessionShopIdsRef.current,
    start, stop, reset, answer, undo, selectedItems,
  };
}
