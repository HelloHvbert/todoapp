import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/constants/theme';
import { ShoppingItem } from '@/lib/model';
import { formatNumber, stepFor, UNITS } from '@/lib/quantity';
import { Button, Chip } from './ui';

type Props = {
  item: ShoppingItem | null;
  onClose: () => void;
  onSave: (patch: Partial<ShoppingItem>) => void;
  onDelete: () => void;
};

/** Bottom sheet for a shopping item: name, quantity (−/+) and unit. */
export function ItemEditor({ item, onClose, onSave, onDelete }: Props) {
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {item && <Form key={item.id} item={item} onSave={onSave} onDelete={onDelete} />}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Form({ item, onSave, onDelete }: Omit<Props, 'item' | 'onClose'> & { item: ShoppingItem }) {
  const c = useColors();
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty != null ? formatNumber(item.qty) : '');
  const [unit, setUnit] = useState<string | undefined>(item.qty != null ? (item.unit ?? 'szt.') : undefined);

  const num = qty.trim() ? Number(qty.replace(',', '.')) : null;
  const qtyInvalid = num != null && !(num > 0);

  const bump = (dir: 1 | -1) => {
    const u = unit ?? 'szt.';
    const step = stepFor(u);
    const next = Math.max(step, Math.round(((num ?? 0) + dir * step) * 1000) / 1000);
    setQty(formatNumber(next));
    setUnit(u);
  };

  const save = () => {
    if (!name.trim() || qtyInvalid) return;
    onSave({
      name: name.trim(),
      qty: num ?? undefined,
      unit: num != null ? (unit ?? 'szt.') : undefined,
    });
  };

  return (
    <View style={[styles.sheet, { backgroundColor: c.card }]}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nazwa produktu"
        placeholderTextColor={c.muted}
        style={[styles.name, { color: c.text, borderColor: c.border }]}
      />

      <Text style={[styles.label, { color: c.muted }]}>Ilość</Text>
      <View style={styles.qtyRow}>
        <Pressable onPress={() => bump(-1)} style={[styles.step, { borderColor: c.border }]} accessibilityLabel="Mniej">
          <Text style={[styles.stepText, { color: c.text }]}>−</Text>
        </Pressable>
        <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={c.muted}
          style={[styles.qty, { color: c.text, borderColor: qtyInvalid ? c.danger : c.border }]}
        />
        <Pressable onPress={() => bump(1)} style={[styles.step, { borderColor: c.border }]} accessibilityLabel="Więcej">
          <Text style={[styles.stepText, { color: c.text }]}>+</Text>
        </Pressable>
        {qty !== '' && (
          <Pressable onPress={() => setQty('')} hitSlop={8}>
            <Text style={{ color: c.muted }}>wyczyść</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.label, { color: c.muted }]}>Jednostka</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.units}>
        {UNITS.map((u) => (
          <Chip
            key={u}
            label={u}
            color={c.shop}
            active={num != null && (unit ?? 'szt.') === u}
            onPress={() => {
              setUnit(u);
              if (num == null) setQty('1');
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Button label="Usuń" kind="danger" onPress={onDelete} />
        <Button label="Zapisz" kind="shop" onPress={save} disabled={!name.trim() || qtyInvalid} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 32, gap: 10 },
  name: { fontSize: 20, fontWeight: '700', borderBottomWidth: 1, paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 24, fontWeight: '600', lineHeight: 26 },
  qty: {
    width: 90,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  units: { gap: 8, paddingVertical: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
