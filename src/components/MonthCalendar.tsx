import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';
import { MONTHS, monthGrid, todayKey, WEEKDAYS_SHORT } from '@/lib/dates';
import { DayMarks } from '@/lib/model';

type Props = {
  year: number;
  month: number;
  onChangeMonth: (year: number, month: number) => void;
  onPressDay: (day: string) => void;
  /** Single highlighted day. */
  selected?: string;
  /** Highlighted range (inclusive), used by the task date picker. */
  range?: { start?: string; end?: string };
  marks?: Map<string, DayMarks>;
};

export const MonthCalendar = memo(function MonthCalendar({
  year,
  month,
  onChangeMonth,
  onPressDay,
  selected,
  range,
  marks,
}: Props) {
  const c = useColors();
  const today = todayKey();
  const days = monthGrid(year, month);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onChangeMonth(d.getFullYear(), d.getMonth());
  };
  const rStart = range?.start;
  const rEnd = range?.end ?? range?.start;

  return (
    <View>
      <View style={styles.nav}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} style={styles.arrow} accessibilityLabel="Poprzedni miesiąc">
          <Text style={[styles.arrowText, { color: c.accent }]}>‹</Text>
        </Pressable>
        <Text style={[styles.month, { color: c.text }]}>
          {MONTHS[month][0].toUpperCase() + MONTHS[month].slice(1)} {year}
        </Text>
        <Pressable onPress={() => shift(1)} hitSlop={12} style={styles.arrow} accessibilityLabel="Następny miesiąc">
          <Text style={[styles.arrowText, { color: c.accent }]}>›</Text>
        </Pressable>
      </View>
      <View style={styles.week}>
        {WEEKDAYS_SHORT.map((w, i) => (
          <Text key={w} style={[styles.weekday, { color: i >= 5 ? c.danger : c.muted }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day, i) => {
          const inMonth = day.startsWith(monthPrefix);
          const isToday = day === today;
          const isSel = day === selected || day === rStart || day === rEnd;
          const inRange = !!rStart && !!rEnd && day > rStart && day < rEnd;
          const m = marks?.get(day);
          const weekend = i % 7 >= 5;
          return (
            <Pressable key={day} onPress={() => onPressDay(day)} style={styles.cell}>
              <View
                style={[
                  styles.dayCircle,
                  inRange && { backgroundColor: c.accentSoft, borderRadius: 8 },
                  isToday && !isSel && { borderWidth: 1.5, borderColor: c.accent },
                  isSel && { backgroundColor: c.accent },
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    { color: isSel ? c.onAccent : weekend ? c.danger : c.text },
                    !inMonth && { opacity: 0.3 },
                    (isToday || isSel) && { fontWeight: '800' },
                  ]}>
                  {Number(day.slice(8))}
                </Text>
              </View>
              <View style={styles.dots}>
                {m && m.tasks > m.done && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
                {m && m.tasks > 0 && m.tasks === m.done && <View style={[styles.dot, { backgroundColor: c.muted }]} />}
                {m && m.shopping > 0 && <View style={[styles.dot, { backgroundColor: c.shop }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  arrow: { paddingHorizontal: 12, paddingVertical: 4 },
  arrowText: { fontSize: 30, fontWeight: '500', lineHeight: 32 },
  month: { fontSize: 18, fontWeight: '700' },
  week: { flexDirection: 'row', marginTop: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
