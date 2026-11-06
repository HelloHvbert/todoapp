import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';
import { dayCount, formatRange } from '@/lib/dates';
import { isMultiDay, Task } from '@/lib/model';
import { toggleTask } from '@/lib/store';
import { Checkbox } from './ui';

/** `showDate` adds the date/range to the subtitle (used outside of a single-day view). */
export function TaskRow({ task, showDate, day }: { task: Task; showDate?: boolean; day?: string }) {
  const c = useColors();
  const parts: string[] = [];
  if (task.startDate && (showDate || isMultiDay(task))) {
    let label = formatRange(task.startDate, task.endDate);
    if (day && isMultiDay(task)) {
      label += ` · dzień ${dayCount(task.startDate, day)}/${dayCount(task.startDate, task.endDate!)}`;
    }
    parts.push(label);
  }
  if (task.startTime) parts.push(task.endTime ? `${task.startTime}–${task.endTime}` : task.startTime);
  if (task.note) parts.push(task.note.split('\n')[0]);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/task', params: { id: task.id } })}
      style={({ pressed }) => [styles.row, { borderColor: c.border, backgroundColor: pressed ? c.bg : c.card }]}>
      <Checkbox checked={task.done} onPress={() => toggleTask(task.id)} />
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, { color: task.done ? c.muted : c.text }, task.done && styles.strike]}
          numberOfLines={2}>
          {task.title}
        </Text>
        {parts.length > 0 && (
          <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>
            {parts.join(' · ')}
          </Text>
        )}
      </View>
      {task.startTime && !task.done ? <View style={[styles.timeDot, { backgroundColor: c.accent }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: '600' },
  strike: { textDecorationLine: 'line-through' },
  sub: { fontSize: 13, marginTop: 3 },
  timeDot: { width: 6, height: 6, borderRadius: 3 },
});
