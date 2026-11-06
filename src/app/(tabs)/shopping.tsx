import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { PickerField } from '@/components/PickerField';
import { ShoppingRow } from '@/components/ShoppingRow';
import { Button, Card, Empty, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { formatPrice, todayKey } from '@/lib/dates';
import { addList, useStore } from '@/lib/store';

export default function ShoppingScreen() {
  const c = useColors();
  const { lists, loaded } = useStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [withDate, setWithDate] = useState(true);
  const [date, setDate] = useState(todayKey());

  const { active, completed, monthTotal } = useMemo(() => {
    const now = new Date();
    const sortByDate = (a: { date?: string; createdAt: number }, b: { date?: string; createdAt: number }) =>
      (a.date ?? '9999') === (b.date ?? '9999') ? b.createdAt - a.createdAt : (a.date ?? '9999') < (b.date ?? '9999') ? -1 : 1;
    const done = lists.filter((l) => l.completedAt != null).sort((a, b) => b.completedAt! - a.completedAt!);
    const total = done
      .filter((l) => {
        const d = new Date(l.completedAt!);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, l) => sum + (l.finalPrice ?? 0), 0);
    return { active: lists.filter((l) => l.completedAt == null).sort(sortByDate), completed: done, monthTotal: total };
  }, [lists]);

  const create = () => {
    const t = title.trim();
    if (!t) return;
    const id = addList(t, withDate ? date : undefined);
    setTitle('');
    setCreating(false);
    router.push({ pathname: '/shopping/[id]', params: { id } });
  };

  const monthName = MONTHS_LOC[new Date().getMonth()];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <Header
          title="Zakupy"
          subtitle={`Wydano w ${monthName}: ${formatPrice(monthTotal)}`}
          onAdd={() => setCreating((v) => !v)}
          addColor={c.shop}
        />

        {creating && (
          <Card style={styles.form}>
            <TextInput
              autoFocus
              value={title}
              onChangeText={setTitle}
              placeholder="Tytuł listy, np. Biedronka"
              placeholderTextColor={c.muted}
              onSubmitEditing={create}
              style={[styles.input, { color: c.text, borderColor: c.border }]}
            />
            <View style={styles.row}>
              <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>Data zakupów</Text>
              <Switch value={withDate} onValueChange={setWithDate} trackColor={{ true: c.shop }} />
            </View>
            {withDate && (
              <View style={[styles.row, { justifyContent: 'flex-start' }]}>
                <PickerField mode="date" value={date} onChange={setDate} />
              </View>
            )}
            <Button label="Utwórz listę" kind="shop" onPress={create} disabled={!title.trim()} />
          </Card>
        )}

        <SectionTitle>Aktywne · {active.length}</SectionTitle>
        {active.length ? (
          <Card>
            {active.map((l) => (
              <ShoppingRow key={l.id} list={l} />
            ))}
          </Card>
        ) : (
          loaded && !creating && <Empty title="Brak list zakupów" hint="Naciśnij +, aby utworzyć listę z tytułem i datą." />
        )}

        {completed.length > 0 && (
          <>
            <SectionTitle>Zaliczone</SectionTitle>
            <Card>
              {completed.map((l) => (
                <ShoppingRow key={l.id} list={l} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Locative month names ("w listopadzie"). */
const MONTHS_LOC = [
  'styczniu', 'lutym', 'marcu', 'kwietniu', 'maju', 'czerwcu',
  'lipcu', 'sierpniu', 'wrześniu', 'październiku', 'listopadzie', 'grudniu',
];

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  form: { padding: 16, gap: 14, marginTop: 8 },
  input: { fontSize: 17, borderBottomWidth: 1, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
