import { getAccessToken } from './googleAuth';
import { displayTitle } from '../lib/hebrew';
import type { Item } from '../types';

export interface SelectedItem {
  item: Item;
  qty: number;
}

export interface TaskGroup {
  title: string;
  items: SelectedItem[];
}

async function saveOneList(title: string, items: SelectedItem[]): Promise<number> {
  const accessToken = getAccessToken();
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
  return ok;
}

// Export one Google Tasks list per shop — a shared item appears in every group it belongs to.
export async function saveToTasksByShop(groups: TaskGroup[]): Promise<{ ok: number; total: number }> {
  let ok = 0;
  let total = 0;
  for (const group of groups) {
    ok += await saveOneList(group.title, group.items);
    total += group.items.length;
  }
  return { ok, total };
}
