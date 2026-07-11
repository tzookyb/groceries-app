import { getAccessToken } from './googleAuth';
import { displayTitle } from '../lib/hebrew';
import type { Item } from '../types';

export interface SelectedItem {
  item: Item;
  qty: number;
}

// Export to Google Tasks — one new list per trip: "קניות — DD/MM"
export async function saveToTasks(items: SelectedItem[]): Promise<{ ok: number; total: number }> {
  const accessToken = getAccessToken();
  const d = new Date();
  const dm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const title = `קניות — ${dm}`;

  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const listData = await listRes.json();
  const listId = listData.id;
  let ok = 0;
  // Google Tasks prepends new tasks; insert in reverse so house order is preserved top→bottom.
  for (let i = items.length - 1; i >= 0; i--) {
    const x = items[i];
    const r = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: displayTitle(x.item.name, x.qty) }),
    });
    if (r.ok) ok++;
  }
  return { ok, total: items.length };
}
