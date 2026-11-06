import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { QuickAdd } from '@/components/QuickAdd';
import { TaskRow } from '@/components/TaskRow';
import { Card, Empty, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { compareTasks } from '@/lib/model';
import { addTask, deleteTask, useStore } from '@/lib/store';

/** Tasks without a date. */
export default function GeneralScreen() {
  const c = useColors();
  const { tasks, loaded } = useStore();
  const [showDone, setShowDone] = useState(false);
  const undated = useMemo(() => tasks.filter((t) => !t.startDate).sort(compareTasks), [tasks]);
  const open = undated.filter((t) => !t.done);
  const done = undated.filter((t) => t.done);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic">
        <Header title="Ogólne" subtitle="Zadania bez terminu" onAdd={() => router.push('/task')} />
        <QuickAdd placeholder="Dodaj zadanie bez daty…" onSubmit={(title) => addTask({ title })} />

        <SectionTitle>Do zrobienia · {open.length}</SectionTitle>
        {open.length ? (
          <Card>
            {open.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </Card>
        ) : (
          loaded && <Empty title="Pusto" hint="Zadania bez ustawionej daty trafiają tutaj." />
        )}

        {done.length > 0 && (
          <>
            <Pressable onPress={() => setShowDone((v) => !v)} style={styles.doneHeader}>
              <SectionTitle>
                {showDone ? '▾' : '▸'} Zrobione · {done.length}
              </SectionTitle>
              {showDone && (
                <Pressable onPress={() => done.forEach((t) => deleteTask(t.id))} hitSlop={8}>
                  <Text style={{ color: c.danger, fontWeight: '600', marginTop: 12 }}>Wyczyść</Text>
                </Pressable>
              )}
            </Pressable>
            {showDone && (
              <Card>
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  doneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
