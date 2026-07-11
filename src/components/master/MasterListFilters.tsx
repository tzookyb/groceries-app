import { ShopPill } from '../ui/ShopPill';
import type { Shop } from '../../types';

interface MasterListFiltersProps {
  shops: Shop[];
  selectedShopIds: string[];
  onToggleShop(id: string): void;
  unassignedOnly: boolean;
  onToggleUnassignedOnly(): void;
  visibleCount: number;
  totalCount: number;
}

export function MasterListFilters({
  shops,
  selectedShopIds,
  onToggleShop,
  unassignedOnly,
  onToggleUnassignedOnly,
  visibleCount,
  totalCount,
}: MasterListFiltersProps) {
  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{visibleCount} מתוך {totalCount} מוצרים</span>
        <button
          type="button"
          onClick={onToggleUnassignedOnly}
          className="rounded-full border-[1.5px] text-sm font-semibold px-3 py-1.5 min-h-[32px] cursor-pointer transition-colors duration-150"
          style={unassignedOnly
            ? { backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: '#0f1117' }
            : { backgroundColor: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          ללא חנות
        </button>
      </div>

      {shops.length > 0 && !unassignedOnly && (
        <div className="flex flex-wrap gap-1.5">
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
      )}
    </div>
  );
}
