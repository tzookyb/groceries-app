import { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusMsg, type StatusKind } from '../ui/StatusMsg';
import { displayTitle } from '../../lib/hebrew';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { saveToTasks } from '../../services/googleTasks';
import type { Item } from '../../types';

interface ResultScreenProps {
  items: { item: Item; qty: number }[];
  onReset(): void;
}

export function ResultScreen({ items, onReset }: ResultScreenProps) {
  const { ensureToken } = useGoogleAuth();
  const [status, setStatus] = useState<{ text: string; kind: StatusKind }>({ text: '', kind: '' });

  function handleSave() {
    if (items.length === 0) {
      setStatus({ text: 'אין פריטים לשמירה', kind: 'err' });
      return;
    }
    ensureToken(() => doSave());
  }

  async function doSave() {
    if (!items.length) { setStatus({ text: 'אין פריטים לשמירה', kind: 'err' }); return; }
    setStatus({ text: 'שומר...', kind: '' });
    try {
      const { ok, total } = await saveToTasks(items);
      setStatus({ text: `✓ נשמר — ${ok}/${total} פריטים`, kind: 'ok' });
    } catch (e) {
      setStatus({ text: 'שגיאה בשמירה. נסה שוב.', kind: 'err' });
    }
  }

  return (
    <div className="flex flex-col items-center gap-[18px] py-3">
      <div className="text-[56px]">✅</div>
      <div className="text-[22px] font-extrabold">הסשן הסתיים!</div>

      <div className="w-full flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="text-muted text-sm text-center">לא נבחרו פריטים</div>
        ) : (
          <div className="w-full bg-surface rounded-app border-[1.5px] border-border p-4 flex flex-col gap-2">
            <h4 className="text-[15px] text-accent">רשימת קניות</h4>
            {items.map((x, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[15px] before:content-['✓'] before:text-accent before:font-bold">
                {displayTitle(x.item.name, x.qty)}
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="w-full bg-surface border-[1.5px] border-border rounded-app p-5 flex flex-col gap-3">
          <p className="text-[13px] text-muted leading-[1.6]">
            שמור את הרשימה ב-Google Tasks (שם: <strong>קניות — DD/MM</strong>):
          </p>
          <Button variant="accent" onClick={handleSave} className="w-full">שמור ב-Google Tasks</Button>
          <StatusMsg kind={status.kind}>{status.text}</StatusMsg>
        </div>
      )}

      <Button variant="ghost" onClick={onReset} className="w-full">סשן חדש</Button>
    </div>
  );
}
