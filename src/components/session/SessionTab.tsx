import { useState } from 'react';
import { useGroceryData } from '../../hooks/useGroceryData';
import { useSession } from '../../hooks/useSession';
import { SessionIdle } from './SessionIdle';
import { SessionActive } from './SessionActive';
import { ResultScreen } from './ResultScreen';

export function SessionTab() {
  const { data, assignItemToShops, unassignItemFromShops } = useGroceryData();
  const session = useSession(data.items, { assignItemToShops, unassignItemFromShops });
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);

  function toggleShop(id: string) {
    setSelectedShopIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  return (
    <>
      {session.phase === 'idle' && (
        <SessionIdle
          shops={data.shops}
          selectedShopIds={selectedShopIds}
          onToggleShop={toggleShop}
          onStart={() => session.start(selectedShopIds)}
          canStart={selectedShopIds.length > 0}
        />
      )}
      {session.phase === 'active' && <SessionActive session={session} />}
      {session.phase === 'result' && (
        <ResultScreen
          items={session.selectedItems()}
          shops={data.shops}
          shopIds={session.sessionShopIds}
          onReset={session.reset}
        />
      )}
    </>
  );
}
