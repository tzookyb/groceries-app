import { useState, type ReactNode } from 'react';
import { Header } from './components/Header';
import { TabBar, type TabId } from './components/TabBar';
import { GroceryProvider } from './hooks/useGroceryData';
import { GoogleAuthProvider } from './hooks/useGoogleAuth';
import { MasterListTab } from './components/master/MasterListTab';
import { SessionTab } from './components/session/SessionTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { SHELL_WIDTH } from './lib/layout';

function Panel({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className={`${SHELL_WIDTH} mt-5 mb-10 flex-1 ${active ? 'flex flex-col gap-3' : 'hidden'}`}>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>('list');

  return (
    <GroceryProvider>
      <GoogleAuthProvider>
        <Header />
        <TabBar active={tab} onChange={setTab} />
        <Panel active={tab === 'list'}>
          <MasterListTab />
        </Panel>
        <Panel active={tab === 'session'}>
          <SessionTab />
        </Panel>
        <Panel active={tab === 'settings'}>
          <SettingsTab />
        </Panel>
      </GoogleAuthProvider>
    </GroceryProvider>
  );
}
