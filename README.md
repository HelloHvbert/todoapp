# Todo

Aplikacja mobilna (Expo SDK 58 / React Native, Expo Router) do zadań i list zakupów. Dane zapisywane lokalnie na telefonie (AsyncStorage).

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

## Zadania

Tytuł jest jedynym wymaganym polem. Opcjonalnie:

- **Termin** — jeden dzień albo zakres (dotknij dnia początku, potem końca, lub wybierz 1 dzień / 2 dni / 3 dni / tydzień).
  Bez terminu zadanie trafia do „Ogólne”.
- **Godzina** — od, opcjonalnie do.
- notatka.

Dotknij zadania, aby je edytować lub usunąć; kółko po lewej odhacza je.

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
- `src/lib/` — model danych, daty, magazyn stanu z zapisem w AsyncStorage
- `src/components/` — kalendarz miesięczny, wiersze zadań/list, pola wyboru daty i godziny
