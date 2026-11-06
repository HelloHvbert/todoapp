import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Empty } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { formatLong, plural } from '@/lib/dates';
import { formatQty, parseItem, ParsedItem } from '@/lib/quantity';
import { addItem, addList } from '@/lib/store';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Row = { kind: 'header'; text: string } | { kind: 'item'; line: string; parsed: ParsedItem };

/**
 * Deep link target: todoapp:///import?title=…&date=YYYY-MM-DD&items=<lines separated by \n>.
 * Lines starting with "#" are category headers (shown in the preview, never saved as items).
 */
export default function ImportScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string; items?: string; date?: string }>();
  const [saving, setSaving] = useState(false);

  const title = params.title?.trim() || 'Lista zakupów';
  const date = params.date && DATE_RE.test(params.date) ? params.date : undefined;

  const rows = useMemo<Row[]>(
    () =>
      (params.items ?? '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line): Row =>
          line.startsWith('#')
            ? { kind: 'header', text: line.replace(/^#+\s*/, '') }
            : { kind: 'item', line, parsed: parseItem(line) },
        ),
    [params.items],
  );
  const items = rows.filter((r) => r.kind === 'item');

  const cancel = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/shopping'));

  const save = () => {
    if (saving || items.length === 0) return;
    setSaving(true);
    const id = addList(title, date);
    for (const r of items) addItem(id, r.line);
    router.replace({ pathname: '/shopping/[id]', params: { id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: 'Import listy' }} />
      {items.length === 0 ? (
        <View style={styles.content}>
          <Empty title="Pusty import" hint="Link nie zawierał żadnych pozycji." />
          <Button label="Wróć" kind="secondary" onPress={cancel} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>
              {[date && formatLong(date), plural(items.length, 'pozycja', 'pozycje', 'pozycji')].filter(Boolean).join(' · ')}
            </Text>

            <Card style={{ marginTop: 16 }}>
              {rows.map((r, i) =>
                r.kind === 'header' ? (
                  <Text
                    key={`h${i}`}
                    style={[styles.header, { color: c.muted, backgroundColor: c.bg, borderColor: c.border }]}>
                    {r.text}
                  </Text>
                ) : (
                  <View key={`i${i}`} style={[styles.row, { borderColor: c.border }]}>
                    <Text style={[styles.name, { color: c.text }]}>{r.parsed.name}</Text>
                    {r.parsed.qty != null && (
                      <Text style={[styles.qty, { color: c.muted }]}>{formatQty(r.parsed.qty, r.parsed.unit)}</Text>
                    )}
                  </View>
                ),
              )}
            </Card>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderColor: c.border }]}>
            <Button label="Anuluj" kind="secondary" onPress={cancel} disabled={saving} style={{ flex: 1 }} />
            <Button label="Dodaj listę" kind="shop" onPress={save} disabled={saving} style={{ flex: 1 }} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24, gap: 0 },
  title: { fontSize: 26, fontWeight: '800' },
  header: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { flex: 1, fontSize: 16 },
  qty: { fontSize: 15, fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
