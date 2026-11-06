import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerField } from '@/components/PickerField';
import { QuickAdd } from '@/components/QuickAdd';
import { Button, Card, Checkbox, Empty, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { formatLong, formatPrice, parsePrice, todayKey } from '@/lib/dates';
import { listProgress } from '@/lib/model';
import {
  addItem,
  completeList,
  deleteItem,
  deleteList,
  reopenList,
  toggleItem,
  updateList,
  useStore,
} from '@/lib/store';

export default function ShoppingListScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, loaded } = useStore();
  const list = lists.find((l) => l.id === id);
  const [priceOpen, setPriceOpen] = useState(false);
  const [price, setPrice] = useState('');

  if (!list) {
    return <View style={{ flex: 1, backgroundColor: c.bg }}>{loaded && <Empty title="Lista nie istnieje" />}</View>;
  }

  const completed = list.completedAt != null;
  const { done, total } = listProgress(list);
  const parsed = parsePrice(price);

  const remove = () =>
    Alert.alert('Usunąć listę?', `„${list.title}” zostanie usunięta.`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteList(list.id);
        },
      },
    ]);

  const finish = () => {
    if (parsed == null) return;
    completeList(list.id, parsed);
    setPriceOpen(false);
    setPrice('');
  };

  const sorted = [...list.items].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Stack.Screen
        options={{
          title: list.title,
          headerRight: () => (
            <Pressable onPress={remove} hitSlop={10}>
              <Text style={{ color: c.danger, fontWeight: '600', fontSize: 16 }}>Usuń</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={list.title}
          onChangeText={(title) => updateList(list.id, { title })}
          editable={!completed}
          style={[styles.title, { color: c.text }]}
        />
        <View style={styles.metaRow}>
          {list.date ? (
            completed ? (
              <Text style={{ color: c.muted }}>{formatLong(list.date)}</Text>
            ) : (
              <>
                <PickerField mode="date" value={list.date} onChange={(date) => updateList(list.id, { date })} />
                <Pressable onPress={() => updateList(list.id, { date: undefined })} hitSlop={8}>
                  <Text style={{ color: c.muted }}>usuń datę</Text>
                </Pressable>
              </>
            )
          ) : (
            !completed && (
              <Pressable onPress={() => updateList(list.id, { date: todayKey() })} hitSlop={8}>
                <Text style={{ color: c.shop, fontWeight: '600' }}>+ dodaj datę</Text>
              </Pressable>
            )
          )}
        </View>

        {completed && (
          <Card style={[styles.summary, { backgroundColor: c.shopSoft, borderColor: c.shop }]}>
            <Text style={{ color: c.text, fontSize: 14 }}>Zakupy zaliczone · zapłacono</Text>
            <Text style={[styles.summaryPrice, { color: c.shop }]}>{formatPrice(list.finalPrice ?? 0)}</Text>
            <Text style={{ color: c.muted, fontSize: 13 }}>
              {new Date(list.completedAt!).toLocaleDateString('pl-PL')} · {done}/{total} produktów
            </Text>
          </Card>
        )}

        {!completed && (
          <View style={{ marginTop: 16 }}>
            <QuickAdd placeholder="Dodaj produkt…" onSubmit={(name) => addItem(list.id, name)} color={c.shop} />
          </View>
        )}

        <SectionTitle>
          Produkty · {done}/{total}
        </SectionTitle>
        {total ? (
          <Card>
            {sorted.map((item) => (
              <View key={item.id} style={[styles.item, { borderColor: c.border }]}>
                <Checkbox checked={item.done} color={c.shop} onPress={() => !completed && toggleItem(list.id, item.id)} />
                <Text
                  style={[
                    styles.itemText,
                    { color: item.done ? c.muted : c.text },
                    item.done && { textDecorationLine: 'line-through' },
                  ]}>
                  {item.name}
                </Text>
                {!completed && (
                  <Pressable onPress={() => deleteItem(list.id, item.id)} hitSlop={10} accessibilityLabel="Usuń produkt">
                    <Text style={{ color: c.muted, fontSize: 18 }}>✕</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </Card>
        ) : (
          <Empty title="Lista jest pusta" hint="Wpisz produkt powyżej i zatwierdź." />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderColor: c.border, backgroundColor: c.bg }]}>
        {completed ? (
          <Button label="Otwórz ponownie" kind="secondary" onPress={() => reopenList(list.id)} />
        ) : (
          <Button label="Zalicz listę" kind="shop" onPress={() => setPriceOpen(true)} />
        )}
      </View>

      <Modal visible={priceOpen} transparent animationType="fade" onRequestClose={() => setPriceOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.backdrop}>
          <View style={[styles.dialog, { backgroundColor: c.card }]}>
            <Text style={[styles.dialogTitle, { color: c.text }]}>Ile wyszło za zakupy?</Text>
            <Text style={{ color: c.muted }}>
              {done < total ? `Odhaczono ${done} z ${total} produktów. ` : ''}Podaj końcową kwotę z paragonu.
            </Text>
            <View style={[styles.priceRow, { borderColor: parsed == null && price ? c.danger : c.shop }]}>
              <TextInput
                autoFocus
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor={c.muted}
                onSubmitEditing={finish}
                style={[styles.priceInput, { color: c.text }]}
              />
              <Text style={{ color: c.muted, fontSize: 22, fontWeight: '600' }}>zł</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="Anuluj" kind="secondary" onPress={() => setPriceOpen(false)} style={{ flex: 1 }} />
              <Button label="Zalicz" kind="shop" onPress={finish} disabled={parsed == null} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', paddingVertical: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6, minHeight: 36 },
  summary: { padding: 16, marginTop: 16, gap: 4, borderWidth: 1 },
  summaryPrice: { fontSize: 32, fontWeight: '800' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  itemText: { flex: 1, fontSize: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 20, padding: 20, gap: 14 },
  dialogTitle: { fontSize: 20, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, gap: 8 },
  priceInput: { flex: 1, minWidth: 0, fontSize: 32, fontWeight: '700', paddingVertical: 8 },
});
