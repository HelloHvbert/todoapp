import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';

export function Header({ title, subtitle, onAdd, addColor }: { title: string; subtitle?: string; onAdd?: () => void; addColor?: string }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text> : null}
      </View>
      {onAdd && (
        <Pressable
          onPress={onAdd}
          accessibilityLabel="Dodaj"
          style={({ pressed }) => [styles.add, { backgroundColor: addColor ?? c.accent, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.plus, { color: c.onAccent }]}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // On web the tab bar sits at the top of the page, so leave room for it.
  row: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'web' ? 64 : 12, paddingBottom: 8, gap: 12 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 2 },
  add: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 28, fontWeight: '500', lineHeight: 30 },
});
