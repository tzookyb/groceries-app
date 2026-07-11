import { beep, speak, unlockAudio } from '../lib/audio';

export function useAudio() {
  return { unlock: unlockAudio, beep, speak };
}
