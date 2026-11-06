import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';
import { useBackupStatus } from '@/lib/backup';

/** Cloud button in the "Dziś" header; the dot shows the backup state. */
export function BackupButton() {
  const c = useColors();
  const s = useBackupStatus();
  const dot = s.error ? c.danger : !s.email ? null : s.dirty || s.busy ? c.warn : c.shop;
  return (
    <Pressable
      onPress={() => router.push('/backup')}
      accessibilityLabel="Kopia zapasowa"
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={styles.icon}>☁️</Text>
      {dot && <View style={[styles.dot, { backgroundColor: dot, borderColor: c.card }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  icon: { fontSize: 20 },
  dot: { position: 'absolute', top: 6, right: 6, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
});
