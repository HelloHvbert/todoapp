import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useColors } from '@/constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const c = useColors();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{ ...base, colors: { ...base.colors, background: c.bg, card: c.card, text: c.text, primary: c.accent, border: c.border } }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerTintColor: c.accent, headerTitleStyle: { color: c.text } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="task" options={{ presentation: 'modal', title: 'Zadanie' }} />
        <Stack.Screen name="shopping/[id]" options={{ title: 'Lista zakupów', headerBackTitle: 'Zakupy' }} />
      </Stack>
    </ThemeProvider>
  );
}
