// Google Drive sync (appDataFolder) — one grocery-data.json blob.
// Cross-device backup using the SAME GIS token (drive.appdata scope).
// Last-write-wins by data.updatedAt. Never blocks the UI; all failures
// are swallowed — localStorage stays the source of truth.
import { getAccessToken } from './googleAuth';
import { sanitize, writeLocal } from '../lib/storage';
import type { GroceryData } from '../types';

const DRIVE_FILE = 'grocery-data.json';

let driveFileId: string | null = null; // cached id of our blob (per session)
let drivePushTimer: ReturnType<typeof setTimeout> | null = null; // debounce handle
let driveSyncing = false; // reentrancy guard for the pull

export type DriveStatusKind = '' | 'ok' | 'err';
export type DriveStatusListener = (msg: string, kind: DriveStatusKind) => void;

let statusListener: DriveStatusListener | null = null;
export function onDriveStatus(listener: DriveStatusListener | null): void {
  statusListener = listener;
}
function setDriveStatus(msg: string, kind: DriveStatusKind) {
  if (statusListener) statusListener(msg, kind);
}

// Build an Error carrying the HTTP status + a slice of the response body,
// so a 403 (missing scope) or 401 (bad token) is visible instead of swallowed.
async function driveErr(res: Response, label: string): Promise<Error> {
  let detail = '';
  try { detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 160); } catch (e) {}
  return new Error(label + ' ' + res.status + (detail ? ': ' + detail : ''));
}

function driveAuth(): Record<string, string> {
  return { Authorization: 'Bearer ' + getAccessToken() };
}

async function driveFind(): Promise<string | null> {
  if (driveFileId) return driveFileId;
  const url = 'https://www.googleapis.com/drive/v3/files'
    + '?spaces=appDataFolder&fields=files(id,name)&q=' + encodeURIComponent("name='" + DRIVE_FILE + "'");
  const res = await fetch(url, { headers: driveAuth() });
  if (!res.ok) throw await driveErr(res, 'חיפוש');
  const j = await res.json();
  driveFileId = (j.files && j.files[0] && j.files[0].id) || null;
  return driveFileId;
}

async function driveDownload(): Promise<GroceryData | null> {
  const id = await driveFind();
  if (!id) return null;
  const res = await fetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media', { headers: driveAuth() });
  if (!res.ok) throw await driveErr(res, 'הורדה');
  return res.json();
}

async function driveUpload(data: GroceryData): Promise<void> {
  if (!getAccessToken()) return;
  const body = JSON.stringify(data);
  const id = await driveFind();
  if (id) {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files/' + id + '?uploadType=media', {
      method: 'PATCH', headers: { ...driveAuth(), 'Content-Type': 'application/json' }, body });
    if (!res.ok) throw await driveErr(res, 'עדכון');
  } else {
    // create in the hidden appDataFolder (multipart: metadata + media)
    const boundary = 'gx' + Date.now().toString(36);
    const meta = JSON.stringify({ name: DRIVE_FILE, parents: ['appDataFolder'] });
    const multipart =
      '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n' +
      '--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n' +
      '--' + boundary + '--';
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { ...driveAuth(), 'Content-Type': 'multipart/related; boundary=' + boundary }, body: multipart });
    if (!res.ok) throw await driveErr(res, 'יצירה');
    driveFileId = (await res.json()).id;
  }
}

export function scheduleDrivePush(getData: () => GroceryData): void {
  if (!getAccessToken()) return; // only sync when connected
  if (drivePushTimer) clearTimeout(drivePushTimer);
  drivePushTimer = setTimeout(() => {
    setDriveStatus('מעלה ל-Drive…', '');
    driveUpload(getData())
      .then(() => setDriveStatus('✓ נשמר ב-Drive', 'ok'))
      .catch(e => setDriveStatus('שגיאת סנכרון: ' + e.message, 'err'));
  }, 1500);
}

// Pull remote on connect/startup. If remote is newer (or local is empty and
// remote has data) → replace local + notify caller. Otherwise → push local up.
export async function driveSync(getData: () => GroceryData, applyRemote: (d: GroceryData) => void): Promise<void> {
  if (!getAccessToken() || driveSyncing) return;
  driveSyncing = true;
  setDriveStatus('מסנכרן…', '');
  try {
    const remote = await driveDownload();
    const data = getData();
    const localEmpty = data.items.length === 0 && data.shops.length === 0;
    const remoteHasData = !!(remote && ((remote.items && remote.items.length) || (remote.shops && remote.shops.length)));
    const remoteNewer = !!(remote && Number(remote.updatedAt) > Number(data.updatedAt || 0));
    // Take remote when it's newer, OR when local is empty (e.g. a cleared / fresh
    // device) and remote actually has data — so an empty device never clobbers a good remote.
    if (remote && (remoteNewer || (localEmpty && remoteHasData))) {
      const sanitized = sanitize(remote);
      writeLocal(sanitized); // NOT save() — don't re-stamp updatedAt
      applyRemote(sanitized);
      setDriveStatus('✓ נמשך מ-Drive (' + sanitized.items.length + ' פריטים)', 'ok');
    } else {
      await driveUpload(data);
      setDriveStatus(remote ? '✓ סונכרן (מקומי עדכני יותר)' : '✓ הועלה ל-Drive לראשונה', 'ok');
    }
  } catch (e: any) {
    setDriveStatus('שגיאת סנכרון: ' + e.message, 'err');
  } finally {
    driveSyncing = false;
  }
}

// Manual "sync now" — clears the cached file id so a stale/empty id can't
// mask a real remote, then re-runs the pull/push.
export function syncNow(getData: () => GroceryData, applyRemote: (d: GroceryData) => void): void {
  if (!getAccessToken()) { setDriveStatus('התחבר ל-Google תחילה', 'err'); return; }
  driveFileId = null;
  driveSync(getData, applyRemote);
}
