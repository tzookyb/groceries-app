import { SectionTitle } from '../ui/SectionTitle';
import { AddRow } from '../ui/AddRow';
import { NameRow } from '../ui/NameRow';
import { IconButton } from '../ui/IconButton';
import { useGroceryData } from '../../hooks/useGroceryData';

export function ShopsSection() {
  const { data, addShop, deleteShop } = useGroceryData();

  return (
    <>
      <SectionTitle>חנויות</SectionTitle>
      <AddRow placeholder="הוסף חנות..." onAdd={addShop} />
      <div className="flex flex-col gap-2">
        {data.shops.map(shop => (
          <NameRow key={shop.id}>
            <span className="flex-1 text-base font-semibold [overflow-wrap:anywhere]">{shop.name}</span>
            <IconButton kind="del" onClick={() => deleteShop(shop.id)}>✕</IconButton>
          </NameRow>
        ))}
      </div>
    </>
  );
}
