import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/constants/theme';

/** Single-line "type and press enter" input used by the list screens. */
export function QuickAdd({ placeholder, onSubmit, color }: { placeholder: string; onSubmit: (text: string) => void; color?: string }) {
  const c = useColors();
  const [text, setText] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };
  return (
    <View style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="done"
        style={[styles.input, { color: c.text }]}
      />
      {text.trim() !== '' && (
        <Pressable onPress={submit} hitSlop={8}>
          <Text style={{ color: color ?? c.accent, fontWeight: '700', fontSize: 15 }}>Dodaj</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
});
