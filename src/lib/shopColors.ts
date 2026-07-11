export const SHOP_PALETTE = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#2dd4bf', '#fb923c', '#f87171'];

export function colorAt(i: number): string {
  return SHOP_PALETTE[i % SHOP_PALETTE.length];
}

export function nextColor(current: string): string {
  const i = SHOP_PALETTE.indexOf(current);
  return SHOP_PALETTE[(i + 1) % SHOP_PALETTE.length];
}
