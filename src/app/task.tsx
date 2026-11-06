import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MonthCalendar } from '@/components/MonthCalendar';
import { PickerField } from '@/components/PickerField';
import { Button, Card, Chip } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { addDays, dayCount, formatRange, fromKey, todayKey } from '@/lib/dates';
import { addTask, deleteTask, TaskInput, updateTask, useStore } from '@/lib/store';

/** Create (optionally with ?date=) or edit (?id=) a task. Date, duration and time are optional. */
export default function TaskScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { tasks } = useStore();
  const existing = params.id ? tasks.find((t) => t.id === params.id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [start, setStart] = useState<string | undefined>(existing ? existing.startDate : params.date);
  const [end, setEnd] = useState<string | undefined>(existing?.endDate);
  const [timeOn, setTimeOn] = useState(!!existing?.startTime);
  const [startTime, setStartTime] = useState(existing?.startTime ?? '09:00');
  const [endOn, setEndOn] = useState(!!existing?.endTime);
  const [endTime, setEndTime] = useState(existing?.endTime ?? '10:00');
  const [ym, setYm] = useState(() => {
    const d = start ? fromKey(start) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const hasDate = !!start;

  const toggleDate = (on: boolean) => {
    if (on) {
      const s = params.date ?? todayKey();
      setStart(s);
      const d = fromKey(s);
      setYm({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      setStart(undefined);
      setEnd(undefined);
    }
  };

  // Tap a day: first tap sets the start, a later day sets the end, anything else restarts.
  const pressDay = (day: string) => {
    if (!start || end || day < start) {
      setStart(day);
      setEnd(undefined);
    } else if (day === start) {
      setEnd(undefined);
    } else {
      setEnd(day);
    }
  };

  const setDuration = (days: number) => {
    if (!start) return;
    setEnd(days > 1 ? addDays(start, days - 1) : undefined);
  };
  const duration = start ? dayCount(start, end ?? start) : 0;

  const save = () => {
    const t = title.trim();
    if (!t) return;
    const input: TaskInput = {
      title: t,
      note: note.trim() || undefined,
      startDate: start,
      endDate: start && end && end > start ? end : undefined,
      startTime: start && timeOn ? startTime : undefined,
      endTime: start && timeOn && endOn ? endTime : undefined,
    };
    if (existing) updateTask(existing.id, input);
    else addTask(input);
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Usunąć zadanie?', existing.title, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteTask(existing.id);
        },
      },
    ]);
  };

  const timeInvalid = timeOn && endOn && endTime <= startTime && !end;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          autoFocus={!existing}
          value={title}
          onChangeText={setTitle}
          placeholder="Co trzeba zrobić?"
          placeholderTextColor={c.muted}
          style={[styles.title, { color: c.text }]}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Notatka (opcjonalnie)"
          placeholderTextColor={c.muted}
          multiline
          style={[styles.note, { color: c.text, borderColor: c.border }]}
        />

        <Card style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: c.text }]}>Termin</Text>
              <Text style={{ color: c.muted, marginTop: 2 }}>
                {start
                  ? `${formatRange(start, end)}${duration > 1 ? ` · ${duration} dni` : ''}`
                  : 'Bez daty — trafi do „Ogólne”'}
              </Text>
            </View>
            <Switch value={hasDate} onValueChange={toggleDate} trackColor={{ true: c.accent }} />
          </View>

          {hasDate && (
            <>
              <MonthCalendar
                year={ym.year}
                month={ym.month}
                onChangeMonth={(year, month) => setYm({ year, month })}
                onPressDay={pressDay}
                range={{ start, end }}
              />
              <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center' }}>
                Dotknij dnia początku, potem dnia końca, aby ustawić czas trwania.
              </Text>
              <View style={styles.chips}>
                {[1, 2, 3, 7].map((d) => (
                  <Chip key={d} label={d === 1 ? '1 dzień' : d === 7 ? 'tydzień' : `${d} dni`} active={duration === d} onPress={() => setDuration(d)} />
                ))}
              </View>
            </>
          )}
        </Card>

        {hasDate && (
          <Card style={styles.section}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: c.text, flex: 1 }]}>Godzina</Text>
              <Switch value={timeOn} onValueChange={setTimeOn} trackColor={{ true: c.accent }} />
            </View>
            {timeOn && (
              <>
                <View style={styles.row}>
                  <Text style={{ color: c.muted, flex: 1 }}>Od</Text>
                  <PickerField mode="time" value={startTime} onChange={setStartTime} />
                </View>
                <View style={styles.row}>
                  <Text style={{ color: c.muted, flex: 1 }}>Do (opcjonalnie)</Text>
                  {endOn && <PickerField mode="time" value={endTime} onChange={setEndTime} />}
                  <Switch value={endOn} onValueChange={setEndOn} trackColor={{ true: c.accent }} style={{ marginLeft: 10 }} />
                </View>
                {timeInvalid && <Text style={{ color: c.danger }}>Godzina końca musi być po godzinie początku.</Text>}
              </>
            )}
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderColor: c.border }]}>
        {existing && <Button label="Usuń" kind="danger" onPress={remove} />}
        <Button
          label={existing ? 'Zapisz' : 'Dodaj zadanie'}
          onPress={save}
          disabled={!title.trim() || !!timeInvalid}
          style={{ flex: 1 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', paddingVertical: 8 },
  note: { fontSize: 16, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8, minHeight: 44 },
  section: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
