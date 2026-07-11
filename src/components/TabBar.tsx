export type TabId = 'list' | 'session' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'list', label: 'רשימת מלאי' },
  { id: 'session', label: 'בנה רשימה' },
  { id: 'settings', label: 'הגדרות' },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex gap-1 bg-surface rounded-xl p-1 mt-6 w-[calc(100%-32px)] max-w-[640px] mx-auto">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 px-1.5 py-3 min-h-11 border-none rounded-[9px] text-sm font-semibold cursor-pointer transition-all duration-200 ${
            active === t.id ? 'bg-surface2 text-text' : 'bg-transparent text-muted'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
