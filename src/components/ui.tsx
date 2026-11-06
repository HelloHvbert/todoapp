import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useColors } from '@/constants/theme';

export function Checkbox({ checked, onPress, color }: { checked: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const tint = color ?? c.accent;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.check, { borderColor: checked ? tint : c.muted, backgroundColor: checked ? tint : 'transparent' }]}>
      {checked && <Text style={[styles.tick, { color: c.onAccent }]}>✓</Text>}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'shop';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const c = useColors();
  const bg = { primary: c.accent, shop: c.shop, secondary: c.card, danger: 'transparent' }[kind];
  const fg = { primary: c.onAccent, shop: c.onAccent, secondary: c.text, danger: c.danger }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
        style,
      ]}>
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress: () => void; color?: string }) {
  const c = useColors();
  const tint = color ?? c.accent;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? tint : c.border, backgroundColor: active ? tint : c.card }]}>
      <Text style={{ color: active ? c.onAccent : c.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: TextStyle }) {
  const c = useColors();
  return <Text style={[styles.section, { color: c.muted }, style]}>{children}</Text>;
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {hint ? <Text style={{ color: c.muted, textAlign: 'center' }}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  button: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  section: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 20, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
