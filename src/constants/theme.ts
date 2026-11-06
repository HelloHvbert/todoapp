import { useColorScheme } from 'react-native';

const light = {
  bg: '#f4f5f7',
  card: '#ffffff',
  border: '#e2e4e9',
  text: '#16181d',
  muted: '#6b7280',
  accent: '#4f46e5',
  accentSoft: '#e0e7ff',
  onAccent: '#ffffff',
  shop: '#059669',
  shopSoft: '#d1fae5',
  danger: '#dc2626',
  warn: '#d97706',
};

const dark: typeof light = {
  bg: '#0e0f13',
  card: '#181a20',
  border: '#2a2d36',
  text: '#eceef2',
  muted: '#9096a3',
  accent: '#818cf8',
  accentSoft: '#272a4a',
  onAccent: '#0e0f13',
  shop: '#34d399',
  shopSoft: '#123327',
  danger: '#f87171',
  warn: '#fbbf24',
};

export type Palette = typeof light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
