import { AddRow } from '../ui/AddRow';
import { Button } from '../ui/Button';
import { ItemList } from './ItemList';
import { VoiceAddBanner } from './VoiceAddBanner';
import { useGroceryData } from '../../hooks/useGroceryData';
import { useVoiceAdd } from '../../hooks/useVoiceAdd';

export function MasterListTab() {
  const { addItem } = useGroceryData();
  const voiceAdd = useVoiceAdd(names => names.forEach(addItem));

  return (
    <>
      <AddRow
        placeholder="הוסף מוצר..."
        onAdd={addItem}
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
