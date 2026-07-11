export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-accent-dim text-accent rounded-full px-3 py-1.5 text-sm font-semibold">
      {children}
    </span>
  );
}
