export const DARK_COLORS = {
  bg: '#090E1A',
  card: '#121A2C',
  border: '#24314A',
  text: '#F4F6FA',
  muted: '#9AA6C2',
  gold: '#D6B36E',
  accent: '#3DA5D9',
  blobA: '#2B3F7A',
  blobB: '#166C6D',
};

export const LIGHT_COLORS = {
  bg: '#F5F7FB',
  card: '#FFFFFF',
  border: '#D8DFED',
  text: '#1E2433',
  muted: '#6A738A',
  gold: '#B58A2F',
  accent: '#1E7FB8',
  blobA: '#C9D9FF',
  blobB: '#CBEFEA',
};

// Backwards-compatible default for screens still using static import.
export const COLORS = DARK_COLORS;

export function getThemeColors(mode) {
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
}
