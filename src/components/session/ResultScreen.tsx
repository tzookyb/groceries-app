import { useState } from 'react';
import { Button } from '../ui/Button';
import { StatusMsg, type StatusKind } from '../ui/StatusMsg';
import { displayTitle } from '../../lib/hebrew';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { saveToTasksByShop } from '../../services/googleTasks';
import type { Item, Shop } from '../../types';

interface ResultScreenProps {
  items: { item: Item; qty: number }[];
  shops: Shop[];
  shopIds: string[];
  onReset(): void;
}

function todayDm(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function ResultScreen({ items, shops, shopIds, onReset }: ResultScreenProps) {
  const { ensureToken } = useGoogleAuth();
  const [status, setStatus] = useState<{ text: string; kind: StatusKind }>({ text: '', kind: '' });

  const dm = todayDm();
  const groups = shopIds
    .map(id => {
      const shop = shops.find(s => s.id === id);
      const sel = items.filter(x => x.item.shopIds.includes(id));
      return shop && sel.length > 0 ? { shop, sel } : null;
    })
    .filter((g): g is { shop: Shop; sel: { item: Item; qty: number }[] } => g !== null);

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
      const { ok, total } = await saveToTasksByShop(groups.map(g => ({ title: `${g.shop.name} — ${dm}`, items: g.sel })));
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
          groups.map(g => (
            <div key={g.shop.id} className="w-full bg-surface rounded-app border-[1.5px] border-border p-4 flex flex-col gap-2">
              <h4 className="text-[15px]" style={{ color: g.shop.color }}>{g.shop.name}</h4>
              {g.sel.map((x, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[15px] before:content-['✓'] before:text-accent before:font-bold">
                  {displayTitle(x.item.name, x.qty)}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="w-full bg-surface border-[1.5px] border-border rounded-app p-5 flex flex-col gap-3">
          <p className="text-[13px] text-muted leading-[1.6]">
            שמור רשימה לכל חנות ב-Google Tasks (שם: <strong>חנות — DD/MM</strong>):
          </p>
          <Button variant="accent" onClick={handleSave} className="w-full">שמור ב-Google Tasks</Button>
          <StatusMsg kind={status.kind}>{status.text}</StatusMsg>
        </div>
      )}

      <Button variant="ghost" onClick={onReset} className="w-full">סשן חדש</Button>
    </div>
  );
}
