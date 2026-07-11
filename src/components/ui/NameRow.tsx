import type { ReactNode } from 'react';

export function NameRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-surface rounded-xl px-3.5 py-3 border-[1.5px] border-border">
      {children}
    </div>
  );
}
