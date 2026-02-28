/**
 * Shared color utilities — single source of truth for hex ↔ rgb conversion.
 */

/** Convert hex color (#rrggbb) to "r,g,b" string for rgba() usage. */
export function hexToRgb(hex: string): string {
  const clean = hex.replace(/^#/, '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
