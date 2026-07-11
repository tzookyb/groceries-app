import { AddRow } from '../ui/AddRow';
import { Button } from '../ui/Button';
import { ItemList } from './ItemList';
import { VoiceAddBanner } from './VoiceAddBanner';
import { useGroceryData } from '../../hooks/useGroceryData';
import { useVoiceAdd } from '../../hooks/useVoiceAdd';
import { normalizeForDupCheck } from '../../lib/hebrew';

export function MasterListTab() {
  const { data, addItem } = useGroceryData();

  function addItemWithDupCheck(name: string) {
    const norm = normalizeForDupCheck(name);
    const existing = data.items.find(it => normalizeForDupCheck(it.name) === norm);
    if (existing && !confirm(`"${existing.name}" כבר קיים ברשימה. להוסיף בכל זאת?`)) return;
    addItem(name);
  }

  const voiceAdd = useVoiceAdd(names => names.forEach(addItemWithDupCheck));

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

      <ItemList />
    </>
  );
}
