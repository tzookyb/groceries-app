import { Button } from '../ui/Button';
import { ProgressBar } from './ProgressBar';
import { CurrentItemCard } from './CurrentItemCard';
import { SessionControls } from './SessionControls';
import { QtyRow } from './QtyRow';
import { SelectedChips } from './SelectedChips';
import type { useSession } from '../../hooks/useSession';

export function SessionActive({ session }: { session: ReturnType<typeof useSession> }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <ProgressBar idx={session.currentIdx} total={session.total} />
      <CurrentItemCard name={session.currentName} supportsSR={session.supportsSR} voiceAnswer={session.voiceAnswer} />
      <SessionControls onAnswer={session.answer} />
      <QtyRow onAnswer={session.answer} />
      <SelectedChips items={session.selectedItems()} />
      <Button variant="ghost" onClick={session.stop} className="w-full">סיים סשן</Button>
    </div>
  );
}
