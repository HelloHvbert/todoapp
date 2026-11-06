import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackupButton } from '@/components/BackupButton';
import { Header } from '@/components/Header';
import { QuickAdd } from '@/components/QuickAdd';
import { ShoppingRow } from '@/components/ShoppingRow';
import { TaskRow } from '@/components/TaskRow';
import { Card, Empty, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { formatLong, todayKey } from '@/lib/dates';
import { compareTasks, taskOnDay } from '@/lib/model';
import { addTask, useStore } from '@/lib/store';

export default function TodayScreen() {
  const c = useColors();
  const { tasks, lists, loaded } = useStore();
  const today = todayKey();

  const { todays, overdue, shopping } = useMemo(() => {
    return {
      todays: tasks.filter((t) => taskOnDay(t, today)).sort(compareTasks),
      overdue: tasks
        .filter((t) => !t.done && t.startDate && (t.endDate ?? t.startDate) < today)
        .sort((a, b) => (a.startDate! < b.startDate! ? -1 : 1)),
      shopping: lists.filter((l) => l.date === today),
    };
  }, [tasks, lists, today]);

  const left = todays.filter((t) => !t.done).length;
  const subtitle = formatLong(today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <Header
          title="Dziś"
          subtitle={todays.length ? `${subtitle} · ${left ? `zostało ${left}` : 'wszystko zrobione 🎉'}` : subtitle}
          onAdd={() => router.push({ pathname: '/task', params: { date: today } })}
          extra={<BackupButton />}
        />
        <QuickAdd placeholder="Dodaj zadanie na dziś…" onSubmit={(title) => addTask({ title, startDate: today })} />

        {overdue.length > 0 && (
          <>
            <SectionTitle style={{ color: c.warn }}>Zaległe</SectionTitle>
            <Card>
              {overdue.map((t) => (
                <TaskRow key={t.id} task={t} showDate />
              ))}
            </Card>
          </>
        )}

        <SectionTitle>Zadania</SectionTitle>
        {todays.length ? (
          <Card>
            {todays.map((t) => (
              <TaskRow key={t.id} task={t} day={today} />
            ))}
          </Card>
        ) : (
          loaded && <Empty title="Wolny dzień" hint="Dodaj zadanie powyżej albo przyciskiem +, żeby ustawić godzinę lub czas trwania." />
        )}

        {shopping.length > 0 && (
          <>
            <SectionTitle>Zakupy na dziś</SectionTitle>
            <Card>
              {shopping.map((l) => (
                <ShoppingRow key={l.id} list={l} showDate={false} />
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
});
