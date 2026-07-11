export function ProgressBar({ idx, total }: { idx: number; total: number }) {
  const pct = total > 0 ? (idx / total) * 100 : 0;
  return (
    <>
      <div className="w-full h-[5px] bg-surface rounded overflow-hidden">
        <div className="h-full bg-accent rounded transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted self-end">{idx + 1} / {total}</div>
    </>
  );
}
