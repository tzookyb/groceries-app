interface ShopPillProps {
  name: string;
  color: string;
  active: boolean;
  onToggle(): void;
}

// Inline style for the runtime hex — Tailwind v4 can't generate classes from runtime values.
export function ShopPill({ name, color, active, onToggle }: ShopPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full border-[1.5px] text-sm font-semibold px-3 py-1.5 min-h-[32px] cursor-pointer transition-colors duration-150"
      style={active
        ? { backgroundColor: color, borderColor: color, color: '#0f1117' }
        : { backgroundColor: 'transparent', borderColor: color, color }}
    >
      {name}
    </button>
  );
}
