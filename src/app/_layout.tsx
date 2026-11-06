import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useColors } from '@/constants/theme';
import { initBackup } from '@/lib/backup';
import { loadStore } from '@/lib/store';

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = useColors();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  useEffect(() => {
    loadStore().then(initBackup);
  }, []);
  return (
    <ThemeProvider
      value={{ ...base, colors: { ...base.colors, background: c.bg, card: c.card, text: c.text, primary: c.accent, border: c.border } }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTintColor: c.accent, headerTitleStyle: { color: c.text } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task" options={{ presentation: 'modal', title: 'Zadanie' }} />
        <Stack.Screen name="backup" options={{ presentation: 'modal', title: 'Kopia zapasowa' }} />
        <Stack.Screen name="shopping/[id]" options={{ title: 'Lista zakupów', headerBackTitle: 'Zakupy' }} />
      </Stack>
    </ThemeProvider>
  );
}
