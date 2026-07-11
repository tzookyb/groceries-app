// Google Auth (GIS + localStorage persistence) — unchanged contract.
export const CLIENT_ID = '160959495941-tjn77c642badgo8bldlcmctur7s2knpm.apps.googleusercontent.com';
export const SCOPES = 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/drive.appdata';
export const TOKEN_KEY = 'grocery-gtoken';

let accessToken: string | null = null;
let tokenClient: any = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function isGoogleConnected(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    return !!(s && s.token && s.expiry > Date.now());
  } catch (e) {
    return false;
  }
}

function saveToken(token: string, expiresIn: number): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiry: Date.now() + (expiresIn - 60) * 1000 }));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  accessToken = null;
}

// Loads a previously-saved valid token (on app startup). Returns true if one was found.
export function loadSavedToken(): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (saved && saved.token && saved.expiry > Date.now()) {
      accessToken = saved.token;
      return true;
    }
  } catch (e) {}
  return false;
}

function getTokenClient(onGranted: (token: string) => void): any {
  if (!tokenClient) {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) return;
        accessToken = resp.access_token;
        saveToken(resp.access_token, resp.expires_in);
        onGranted(accessToken!);
      },
    });
  }
  return tokenClient;
}

export function connectGoogle(onConnected: () => void): void {
  const client = getTokenClient(() => onConnected());
  client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
}

export function disconnectGoogle(): void {
  clearToken();
}

export function ensureToken(callback: () => void): void {
  if (accessToken) {
    try {
      const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
      if (saved && saved.expiry > Date.now()) { callback(); return; }
    } catch (e) {}
  }
  clearToken();
  const client = getTokenClient(() => callback());
  client.requestAccessToken({ prompt: '' });
}
