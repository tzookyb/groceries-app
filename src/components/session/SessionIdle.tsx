import { ShopPill } from '../ui/ShopPill';
import type { Shop } from '../../types';

interface SessionIdleProps {
  shops: Shop[];
  selectedShopIds: string[];
  onToggleShop(id: string): void;
  onStart(): void;
  canStart: boolean;
}

export function SessionIdle({ shops, selectedShopIds, onToggleShop, onStart, canStart }: SessionIdleProps) {
  return (
    <div className="flex flex-col gap-[18px] py-2">
      <div className="flex flex-col items-center gap-5 py-4">
        <div
          className={`w-[120px] h-[120px] rounded-full bg-accent-dim border-2 border-accent flex items-center justify-center text-5xl transition-transform duration-150 ${canStart ? 'cursor-pointer active:scale-105' : 'opacity-40 cursor-not-allowed'}`}
          onClick={() => { if (canStart) onStart(); }}
        >
          🎙️
        </div>

        {shops.length === 0 ? (
          <div className="text-sm text-muted text-center leading-[1.7]">
            אין חנויות עדיין. הוסף חנויות במסך ההגדרות כדי להתחיל סשן.
          </div>
        ) : (
          <>
            <div className="text-sm text-muted text-center leading-[1.7]">בחר חנות אחת או יותר לסשן:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {shops.map(shop => (
                <ShopPill
                  key={shop.id}
                  name={shop.name}
                  color={shop.color}
                  active={selectedShopIds.includes(shop.id)}
                  onToggle={() => onToggleShop(shop.id)}
                />
              ))}
            </div>
          </>
        )}

        <div className="text-sm text-muted text-center leading-[1.7]">
          לחץ להתחלה.
          <br />
          לכל מוצר ענה <strong>כן</strong> / <strong>לא</strong> / <strong>מספר</strong> (כמות).
        </div>
      </div>
    </div>
  );
}
