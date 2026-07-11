import { useGroceryData } from '../../hooks/useGroceryData';
import { useSession } from '../../hooks/useSession';
import { SessionIdle } from './SessionIdle';
import { SessionActive } from './SessionActive';
import { ResultScreen } from './ResultScreen';

export function SessionTab() {
  const { data } = useGroceryData();
  const session = useSession(data.items);

  return (
    <>
      {session.phase === 'idle' && <SessionIdle onStart={session.start} />}
      {session.phase === 'active' && <SessionActive session={session} />}
      {session.phase === 'result' && <ResultScreen items={session.selectedItems()} onReset={session.reset} />}
    </>
  );
}
