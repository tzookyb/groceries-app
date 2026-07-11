import { SHELL_WIDTH } from '../lib/layout';

export function Header() {
  return (
    <header className={`${SHELL_WIDTH} pt-6 flex items-center gap-4`}>
      <div
        className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-xl cursor-pointer"
        onClick={() => alert('גרסה ' + __APP_VERSION__)}
        title="גרסה"
      >
        🛒
      </div>
      <h1 className="text-xl font-extrabold tracking-tight">
        רשימת <span className="text-accent">קניות</span> קולית
      </h1>
    </header>
  );
}
