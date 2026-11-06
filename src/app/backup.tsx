import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Card, SectionTitle } from '@/components/ui';
import { useColors } from '@/constants/theme';
import {
  backupNow,
  restoreFromDrive,
  setAutoBackup,
  signIn,
  signOut,
  useBackupStatus,
} from '@/lib/backup';
import { plural } from '@/lib/dates';
import { isEmpty, useStore } from '@/lib/store';

function when(ts: number | null): string {
  if (!ts) return 'jeszcze nie';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return sameDay ? `dziś, ${time}` : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${time}`;
}

export default function BackupScreen() {
  const c = useColors();
  const s = useBackupStatus();
  const { tasks, lists } = useStore();
  const [info, setInfo] = useState<string | null>(null);

  const connect = async () => {
    setInfo(null);
    const res = await signIn();
    if (res.cancelled) return;
    if (!res.remote) {
      if (await backupNow()) setInfo('Utworzono pierwszą kopię na Dysku Google.');
      setAutoBackup(true);
      return;
    }
    if (isEmpty()) {
      if (await restoreFromDrive()) setInfo('Przywrócono dane z Dysku Google.');
      setAutoBackup(true);
      return;
    }
    const date = when(Date.parse(res.remote.modifiedTime));
    Alert.alert(
      'Na Dysku jest już kopia',
      `Kopia z ${date}. Na tym telefonie też są dane. Którą wersję zachować?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Z Dysku',
          onPress: async () => {
            if (await restoreFromDrive()) setInfo('Przywrócono dane z Dysku Google.');
            setAutoBackup(true);
          },
        },
        {
          text: 'Z telefonu',
          onPress: async () => {
            if (await backupNow()) setInfo('Kopia na Dysku została zastąpiona danymi z telefonu.');
            setAutoBackup(true);
          },
        },
      ],
    );
  };

  const restore = () =>
    Alert.alert('Przywrócić z Dysku?', 'Obecne zadania i listy na tym telefonie zostaną zastąpione kopią z Dysku Google.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Przywróć',
        style: 'destructive',
        onPress: async () => {
          if (await restoreFromDrive()) setInfo('Przywrócono dane z Dysku Google.');
        },
      },
    ]);

  const logout = () =>
    Alert.alert('Wylogować?', 'Automatyczna kopia zostanie wyłączona. Dane na telefonie i kopia na Dysku zostają.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: () => signOut() },
    ]);

  const busyLabel = { signin: 'Logowanie…', backup: 'Wysyłanie kopii…', restore: 'Przywracanie…' };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content}>
      <Text style={[styles.lead, { color: c.muted }]}>
        Dane są zapisywane w bazie SQLite na telefonie. Po zalogowaniu kontem Google aplikacja robi też kopię w ukrytym
        folderze aplikacji na Twoim Dysku Google — nie widać go w plikach i nie zajmuje miejsca w widoku Dysku.
      </Text>

      <Card style={styles.card}>
        <Row label="Na telefonie" value={`${plural(tasks.length, 'zadanie', 'zadania', 'zadań')} · ${plural(lists.length, 'lista', 'listy', 'list')} zakupów`} />
        {s.email ? (
          <>
            <Row label="Konto Google" value={s.email} />
            <Row label="Ostatnia kopia" value={s.dirty ? `${when(s.lastBackupAt)} (są nowe zmiany)` : when(s.lastBackupAt)} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: c.text }]}>Automatyczna kopia</Text>
                <Text style={{ color: c.muted, fontSize: 13 }}>Kilkanaście sekund po każdej zmianie</Text>
              </View>
              <Switch value={s.autoBackup} onValueChange={setAutoBackup} trackColor={{ true: c.accent }} />
            </View>
          </>
        ) : null}
      </Card>

      {s.busy && (
        <View style={styles.busy}>
          <ActivityIndicator color={c.accent} />
          <Text style={{ color: c.muted }}>{busyLabel[s.busy]}</Text>
        </View>
      )}
      {s.error && <Text style={[styles.msg, { color: c.danger }]}>{s.error}</Text>}
      {info && !s.error && <Text style={[styles.msg, { color: c.shop }]}>{info}</Text>}

      {s.email ? (
        <View style={styles.actions}>
          <Button label="Zrób kopię teraz" onPress={() => backupNow().then((ok) => ok && setInfo('Kopia zapisana.'))} disabled={!!s.busy} />
          <Button label="Przywróć z Dysku" kind="secondary" onPress={restore} disabled={!!s.busy} />
          <Button label="Wyloguj" kind="danger" onPress={logout} disabled={!!s.busy} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Zaloguj przez Google" onPress={connect} disabled={!!s.busy || !s.available} />
          {!s.available && (
            <Text style={{ color: c.muted, textAlign: 'center' }}>
              Logowanie Google działa w zainstalowanej aplikacji (APK), nie w Expo Go ani w przeglądarce.
            </Text>
          )}
        </View>
      )}

      <SectionTitle>Jak to działa</SectionTitle>
      <Text style={{ color: c.muted, lineHeight: 20 }}>
        • Każda zmiana zapisuje się od razu w telefonie — internet nie jest potrzebny.{'\n'}• Przy włączonej automatycznej
        kopii zmiany trafiają na Dysk kilkanaście sekund później albo gdy wychodzisz z aplikacji.{'\n'}• Na nowym telefonie
        zaloguj się tym samym kontem — dane wrócą automatycznie.{'\n'}• Na Dysku trzymana jest jedna, zawsze najnowsza kopia.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: c.text, flex: 1 }]}>{label}</Text>
      <Text style={{ color: c.muted, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  lead: { fontSize: 15, lineHeight: 21, marginBottom: 16 },
  card: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, justifyContent: 'center' },
  msg: { marginTop: 16, textAlign: 'center', fontSize: 15 },
  actions: { gap: 10, marginTop: 20 },
});
