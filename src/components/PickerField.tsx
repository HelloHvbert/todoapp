import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/constants/theme';
import { dateToTime, formatLong, fromKey, timeToDate, toKey } from '@/lib/dates';

type Props = {
  mode: 'time' | 'date';
  /** "HH:MM" for time, "YYYY-MM-DD" for date. */
  value: string;
  onChange: (value: string) => void;
};

/** Native date/time field: dialog on Android, compact picker on iOS, text input on web. */
export function PickerField({ mode, value, onChange }: Props) {
  const c = useColors();
  const asDate = mode === 'time' ? timeToDate(value) : fromKey(value);
  const emit = (d: Date) => onChange(mode === 'time' ? dateToTime(d) : toKey(d));

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={asDate}
        mode={mode}
        display="compact"
        locale="pl-PL"
        accentColor={c.accent}
        onValueChange={(_, d) => emit(d)}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={mode === 'time' ? 'GG:MM' : 'RRRR-MM-DD'}
        placeholderTextColor={c.muted}
        style={[styles.field, styles.fieldText, { borderColor: c.border, color: c.text }]}
      />
    );
  }

  return (
    <Pressable
      onPress={() =>
        DateTimePickerAndroid.open({
          value: asDate,
          mode,
          is24Hour: true,
          onValueChange: (_, d) => emit(d),
        })
      }
      style={[styles.field, { borderColor: c.border, backgroundColor: c.bg }]}>
      <View>
        <Text style={[styles.fieldText, { color: c.text }]}>{mode === 'time' ? value : formatLong(value)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, minWidth: 80, alignItems: 'center' },
  fieldText: { fontSize: 16, fontWeight: '600' },
});
