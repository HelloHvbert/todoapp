# Todo

Aplikacja mobilna (Expo SDK 58 / React Native, Expo Router) do zadań i list zakupów. Dane w SQLite na telefonie, z automatyczną kopią na Google Drive po zalogowaniu.

## Zakładki

- **Dziś** (domyślna) — zadania na dzisiejszy dzień (również wielodniowe, z oznaczeniem „dzień 2/3”),
  sekcja **Zaległe** z niezrobionymi zadaniami z przeszłości, listy zakupów zaplanowane na dziś
  i szybkie dodawanie zadania jednym polem.
- **Kalendarz** — widok miesiąca (od poniedziałku) z kropkami przy dniach, w których coś jest:
  fioletowa = zadania do zrobienia, szara = wszystko zrobione, zielona = lista zakupów.
  Dotknij dnia, aby zobaczyć jego zadania; **+** dodaje zadanie na wybrany dzień.
- **Ogólne** — zadania bez daty.
- **Zakupy** — listy zakupów z tytułem i (opcjonalną) datą. Odhaczasz produkty, a po
  **Zalicz listę** podajesz końcową kwotę z paragonu. Zaliczone listy pokazują cenę, a nagłówek
  sumuje wydatki z bieżącego miesiąca. Listę można otworzyć ponownie.
  - **Ilości:** wpisz ilość z jednostką na początku lub końcu: `Mleko 2l`, `2 kg ziemniaki`, `Szynka 30 dag`,
    `Jajka 10`, `Masło x2`, `Woda 1,5l`. Jednostki: szt., kg, dag/dkg, g, l, ml, op., paczka, puszka, butelka, pęczek.
    Dodanie tego samego produktu z tą samą jednostką zwiększa ilość (`mleko 1l` do `Mleko 2 l` → `3 l`).
    Dotknij produktu, aby zmienić nazwę, ilość (−/+) lub jednostkę.

## Zadania

Tytuł jest jedynym wymaganym polem. Opcjonalnie:

- **Termin** — jeden dzień albo zakres (dotknij dnia początku, potem końca, lub wybierz 1 dzień / 2 dni / 3 dni / tydzień).
  Bez terminu zadanie trafia do „Ogólne”.
- **Godzina** — od, opcjonalnie do.
- notatka.

Dotknij zadania, aby je edytować lub usunąć; kółko po lewej odhacza je.

## Zapis danych i kopia na Google Drive

- Dane są w bazie **SQLite** na telefonie (`expo-sqlite`, plik `todo.db`) — każda zmiana zapisuje się od razu, bez internetu.
  Dane z pierwszej wersji aplikacji (AsyncStorage) przenoszą się automatycznie przy pierwszym uruchomieniu.
- Ikona ☁️ na ekranie **Dziś** → **Kopia zapasowa** → *Zaloguj przez Google*. Aplikacja zapisuje kopię (`todo-backup.json`)
  w ukrytym folderze aplikacji na Dysku Google (zakres `drive.appdata` — aplikacja nie widzi innych Twoich plików).
- Automatyczna kopia: ok. 15 s po każdej zmianie i przy wyjściu z aplikacji. Kropka przy ☁️: zielona = aktualna kopia,
  pomarańczowa = są niewysłane zmiany, czerwona = błąd.
- Nowy telefon: zaloguj się tym samym kontem — jeśli telefon jest pusty, dane wracają same; jeśli nie, aplikacja zapyta, którą wersję zachować.

### Jednorazowa konfiguracja Google Cloud (wymagana do logowania)

Bez tego logowanie kończy się błędem `DEVELOPER_ERROR`.

1. Wejdź na <https://console.cloud.google.com/>, utwórz projekt (np. „Todo”).
2. **APIs & Services → Library** → wyszukaj **Google Drive API** → *Enable*.
3. **Google Auth Platform → Branding / OAuth consent screen**: typ **External**, nazwa aplikacji, Twój e-mail. W **Audience**
   zostaw status *Testing* i dodaj swój adres Gmail w **Test users**. W **Data access** dodaj zakres
   `https://www.googleapis.com/auth/drive.appdata`.
4. **Clients → Create client → Android**:
   - Package name: `com.hellohvbert.todoapp`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
     (klucz debug, którym GitHub Actions podpisuje APK — ten sam przy każdym buildzie).
5. Gotowe — zainstaluj APK i zaloguj się. Zmiany w Google Cloud mogą potrzebować kilku minut.

Jeśli mimo to pojawia się `DEVELOPER_ERROR`, utwórz dodatkowo klienta typu **Web application** i wpisz jego Client ID
w `app.json` → `expo.extra.googleWebClientId`, potem zbuduj APK ponownie.
Przy podpisywaniu innym kluczem (np. EAS) dodaj jego SHA-1 jako kolejnego klienta Android.
Logowanie nie działa w Expo Go — tylko w APK / development buildzie. Na iOS trzeba dodatkowo klienta iOS i plugin
`@react-native-google-signin/google-signin` z `iosUrlScheme` w `app.json`.

## Uruchomienie

```bash
npm install
npx expo start
```

Wybór godziny/daty korzysta z `@react-native-community/datetimepicker` (jest w Expo Go).

### Gotowy plik .apk

Każdy push buduje APK w GitHub Actions (`.github/workflows/android-apk.yml`): **Actions → Android APK →
ostatni przebieg → artefakt `todoapp-apk`**. APK jest podpisany kluczem debug — do prywatnego użytku.
Albo w chmurze EAS: `npx eas-cli@latest build -p android --profile preview`.

## Skrypty

```bash
npm test            # testy logiki dat, kalendarza i cen
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

## Struktura

- `src/app/(tabs)/` — zakładki: `index` (Dziś), `calendar`, `general`, `shopping`
- `src/app/task.tsx` — formularz dodawania/edycji zadania (modal)
- `src/app/shopping/[id].tsx` — szczegóły listy zakupów, zaliczanie z ceną
- `src/app/backup.tsx` — logowanie Google i kopia zapasowa
- `src/lib/db.ts` — baza SQLite (`db.web.ts` — podgląd w przeglądarce)
- `src/lib/store.ts` — stan aplikacji, `backup.ts` + `drive.ts` — kopia na Dysku Google
- `src/lib/` — też model danych i daty
- `src/components/` — kalendarz miesięczny, wiersze zadań/list, pola wyboru daty i godziny
