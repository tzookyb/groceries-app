import { useRef, useState } from 'react';
import { beep, unlockAudio } from '../lib/audio';
import { createSpeechEngine, isMobileSession, SR, type SpeechEngine } from '../lib/speech';
import { parseAnswer } from '../lib/hebrew';
import type { Item } from '../types';

interface SelectedEntry {
  itemId: string;
  qty: number;
}

export type SessionPhase = 'idle' | 'active' | 'result';
export type VoiceAnswerKind = '' | 'yes' | 'no';

export function useSession(masterItems: Item[]) {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SelectedEntry[]>([]);
  const [voiceAnswer, setVoiceAnswer] = useState<{ text: string; kind: VoiceAnswerKind }>({ text: '', kind: '' });

  const sessionRef = useRef<{ items: Item[]; idx: number; selected: SelectedEntry[] } | null>(null);
  const engineRef = useRef<SpeechEngine | null>(null);

  function getEngine(): SpeechEngine {
    if (!engineRef.current) engineRef.current = createSpeechEngine(text => handleVoice(text));
    return engineRef.current;
  }

  // The "your turn" beep fires the instant TTS finishes so feedback is immediate;
  // the mic begins right after (continuous mode on mobile keeps it warm).
  function speakItem(name: string) {
    const utt = new SpeechSynthesisUtterance(name);
    utt.lang = 'he-IL'; utt.rate = 1.3;
    speechSynthesis.cancel();
    let started = false;
    const go = () => {
      if (started) return; started = true;
      beep();
      setTimeout(() => getEngine().begin(), isMobileSession ? 300 : 0);
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
    if (kind === 'yes') {
      const q = qty || 1;
      beep(1319); // high beep = added (yes / amount)
      s.selected.push({ itemId: item.id, qty: q });
      setSelected(s.selected.slice());
      setVoiceAnswer({ text: q > 1 ? `✓ נוסף ×${q}` : '✓ נוסף', kind: 'yes' });
    } else {
      beep(392); // low beep = skipped (no)
      setVoiceAnswer({ text: '✗ דלג', kind: 'no' });
    }
    s.idx++;
    setTimeout(showCurrentItem, isMobileSession ? 900 : 600);
  }

  function start() {
    if (masterItems.length === 0) {
      alert('הוסף מוצרים לרשימת המלאי תחילה.');
      return;
    }
    unlockAudio();
    sessionRef.current = { items: masterItems.slice(), idx: 0, selected: [] };
    setSelected([]);
    setTotal(masterItems.length);
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
    start, stop, reset, answer, selectedItems,
  };
}
