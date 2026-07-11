import { Chip } from '../ui/Chip';
import { displayTitle } from '../../lib/hebrew';
import type { Item } from '../../types';

interface SelectedChipsProps {
  items: { item: Item; qty: number }[];
}

export function SelectedChips({ items }: SelectedChipsProps) {
  return (
    <div className="w-full bg-surface rounded-app border-[1.5px] border-border p-4">
      <h3 className="text-xs text-muted tracking-wide mb-2.5">נבחרו עד כה</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-muted text-[13px]">טרם נבחרו פריטים</span>
        ) : (
          items.map((x, i) => <Chip key={i}>{displayTitle(x.item.name, x.qty)}</Chip>)
        )}
      </div>
    </div>
  );
}
