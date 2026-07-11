import { useState } from 'react';
import { AddRow } from '../ui/AddRow';
import { Button } from '../ui/Button';
import { ItemList } from './ItemList';
import { MasterListFilters } from './MasterListFilters';
import { VoiceAddBanner } from './VoiceAddBanner';
import { useGroceryData } from '../../hooks/useGroceryData';
import { useVoiceAdd } from '../../hooks/useVoiceAdd';
import { normalizeForDupCheck } from '../../lib/hebrew';

export function MasterListTab() {
  const { data, addItem } = useGroceryData();
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  function addItemWithDupCheck(name: string) {
    const norm = normalizeForDupCheck(name);
    const existing = data.items.find(it => normalizeForDupCheck(it.name) === norm);
    if (existing && !confirm(`"${existing.name}" כבר קיים ברשימה. להוסיף בכל זאת?`)) return;
    addItem(name);
  }

  const voiceAdd = useVoiceAdd(names => names.forEach(addItemWithDupCheck));

  function toggleShop(id: string) {
    setUnassignedOnly(false);
    setSelectedShopIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function toggleUnassignedOnly() {
    setSelectedShopIds([]);
    setUnassignedOnly(prev => !prev);
  }

  const filteredItems = data.items.filter(item => {
    if (unassignedOnly) return item.shopIds.length === 0;
    if (selectedShopIds.length > 0) return item.shopIds.some(id => selectedShopIds.includes(id));
    return true;
  });

  return (
    <>
      <AddRow
        placeholder="הוסף מוצר..."
        onAdd={addItemWithDupCheck}
        extra={
          <Button
            variant="ghost"
            onClick={voiceAdd.toggle}
            className="whitespace-nowrap px-3.5"
            style={voiceAdd.active ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : undefined}
          >
            🎙️
          </Button>
        }
      />

      {voiceAdd.active && (
        <VoiceAddBanner pending={voiceAdd.pending} onFinish={voiceAdd.finish} onCancel={voiceAdd.stop} />
      )}

      {data.items.length > 0 && (
        <MasterListFilters
          shops={data.shops}
          selectedShopIds={selectedShopIds}
          onToggleShop={toggleShop}
          unassignedOnly={unassignedOnly}
          onToggleUnassignedOnly={toggleUnassignedOnly}
          visibleCount={filteredItems.length}
          totalCount={data.items.length}
        />
      )}

      <ItemList items={filteredItems} />
    </>
  );
}
