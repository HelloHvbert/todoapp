import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { MonthCalendar } from '@/components/MonthCalendar';
import { ShoppingRow } from '@/components/ShoppingRow';
import { TaskRow } from '@/components/TaskRow';
import { Card, Empty, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { formatLong, monthGrid, todayKey } from '@/lib/dates';
import { buildMarks, compareTasks, taskOnDay } from '@/lib/model';
import { useStore } from '@/lib/store';

export default function CalendarScreen() {
  const c = useColors();
  const { tasks, lists } = useStore();
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const marks = useMemo(() => {
    const grid = monthGrid(ym.year, ym.month);
    return buildMarks(tasks, lists, grid[0], grid[grid.length - 1]);
  }, [tasks, lists, ym]);

  const dayTasks = useMemo(() => tasks.filter((t) => taskOnDay(t, selected)).sort(compareTasks), [tasks, selected]);
  const dayLists = useMemo(() => lists.filter((l) => l.date === selected), [lists, selected]);

  const pressDay = (day: string) => {
    setSelected(day);
    const [y, m] = day.split('-').map(Number);
    if (y !== ym.year || m - 1 !== ym.month) setYm({ year: y, month: m - 1 });
  };

  const goToday = () => pressDay(today);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Header title="Kalendarz" onAdd={() => router.push({ pathname: '/task', params: { date: selected } })} />
        <Card style={{ padding: 8 }}>
          <MonthCalendar
            year={ym.year}
            month={ym.month}
            onChangeMonth={(year, month) => setYm({ year, month })}
            onPressDay={pressDay}
            selected={selected}
            marks={marks}
          />
          <View style={styles.legend}>
            <Legend color={c.accent} label="zadania" />
            <Legend color={c.muted} label="zrobione" />
            <Legend color={c.shop} label="zakupy" />
            {selected !== today && (
              <Pressable onPress={goToday} hitSlop={8} style={{ marginLeft: 'auto' }}>
                <Text style={{ color: c.accent, fontWeight: '700' }}>Dziś</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <SectionTitle>{formatLong(selected)}</SectionTitle>
        {dayTasks.length || dayLists.length ? (
          <Card>
            {dayTasks.map((t) => (
              <TaskRow key={t.id} task={t} day={selected} />
            ))}
            {dayLists.map((l) => (
              <ShoppingRow key={l.id} list={l} showDate={false} />
            ))}
          </Card>
        ) : (
          <Empty title="Nic zaplanowanego" hint="Naciśnij +, aby dodać zadanie na ten dzień." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const c = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
