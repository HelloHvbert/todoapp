import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';
import { formatPrice, formatShort } from '@/lib/dates';
import { listProgress, ShoppingList } from '@/lib/model';

export function ShoppingRow({ list, showDate = true }: { list: ShoppingList; showDate?: boolean }) {
  const c = useColors();
  const { done, total } = listProgress(list);
  const completed = list.completedAt != null;
  const sub: string[] = [];
  if (showDate && list.date) sub.push(formatShort(list.date));
  sub.push(total ? `${done}/${total} produktów` : 'pusta lista');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/shopping/[id]', params: { id: list.id } })}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: pressed ? c.bg : c.card }]}>
      <View style={[styles.icon, { backgroundColor: c.shopSoft }]}>
        <Text style={{ fontSize: 18 }}>🛒</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: completed ? c.muted : c.text }]} numberOfLines={1}>
          {list.title}
        </Text>
        <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>
          {sub.join(' · ')}
        </Text>
      </View>
      {completed ? (
        <Text style={[styles.price, { color: c.shop }]}>{formatPrice(list.finalPrice ?? 0)}</Text>
      ) : total > 0 ? (
        <View style={[styles.bar, { backgroundColor: c.border }]}>
          <View style={[styles.fill, { backgroundColor: c.shop, width: `${(done / total) * 100}%` }]} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700' },
  bar: { width: 48, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
