import { useRef, useState } from 'react';
import { beep, unlockAudio } from '../lib/audio';
import { createSpeechEngine, SR, type SpeechEngine } from '../lib/speech';
import { isCancel } from '../lib/hebrew';

export function useVoiceAdd(onFinish: (names: string[]) => void) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<string[]>([]);

  const activeRef = useRef(false);
  const pendingRef = useRef<string[]>([]);
  const engineRef = useRef<SpeechEngine | null>(null);

  function getEngine(): SpeechEngine {
    if (!engineRef.current) {
      engineRef.current = createSpeechEngine(text => {
        if (!activeRef.current) return;
        if (isCancel(text)) {
          if (pendingRef.current.length) {
            pendingRef.current = pendingRef.current.slice(0, -1);
            setPending(pendingRef.current.slice());
            beep(440);
          }
          return;
        }
        pendingRef.current = [...pendingRef.current, text];
        setPending(pendingRef.current.slice());
        beep(1175);
      });
    }
    return engineRef.current;
  }

  function start() {
    if (!SR) { alert('הדפדפן לא תומך בזיהוי קול. נסה Chrome באנדרואיד או במחשב.'); return; }
    unlockAudio();
    activeRef.current = true;
    pendingRef.current = [];
    setActive(true);
    setPending([]);
    getEngine().begin();
  }

  function stop() {
    activeRef.current = false;
    setActive(false);
    getEngine().end();
    pendingRef.current = [];
    setPending([]);
  }

  function finish() {
    if (!activeRef.current) return;
    if (pendingRef.current.length) onFinish(pendingRef.current.slice());
    stop();
  }

  function toggle() {
    activeRef.current ? stop() : start();
  }

  return { active, pending, start, stop, finish, toggle, supported: !!SR };
}
