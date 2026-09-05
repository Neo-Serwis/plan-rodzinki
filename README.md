# Plan Rodzinki 🌸

Rodzinne centrum dowodzenia: plan lekcji i odbiorów ze szkoły, zajęcia dodatkowe, lista
zakupów, notatnik i prywatny kalendarz cyklu. Aplikacja PWA — działa offline, instaluje
się na telefonie jak zwykła apka, a wszystkie dane trzyma **wyłącznie lokalnie**
(localStorage). Zero kont, zero serwera, zero chmury.

**Aplikacja:** https://neo-serwis.github.io/plan-rodzinki/

## Co potrafi

- **Dziś** — oś dnia: wyjazd do szkoły, kto o której kończy, odliczanie do najbliższego
  wydarzenia, plan odbioru, zajęcia popołudniowe; skróty do zakupów, notatek i cyklu.
- **Jak odebrać?** — automatyczne warianty: *1×* (wszyscy razem) albo *2×*, z wyliczonym
  czekaniem na świetlicy i czekaniem rodzica; wybór zapamiętywany per dzień tygodnia;
  własna nazwa „kursu"; przy dziecku pole **„powrót"** (koleżanka, „wraca sam", autobus…).
- **Tydzień** — graficzny grafik (paski czasu, linia końca pracy rodzica 🏁, bloki zajęć,
  linia „teraz") + podsumowanie logistyki każdego dnia; swipe między tygodniami.
- **Zakupy** — lista, która sama układa się według działów sklepu (polski słownik +
  uczenie się z wpisów), podpowiedzi najczęściej kupowanych, wiele list, „2x jajka",
  wklejanie listy z SMS-a, udostępnianie, cofanie usunięć, pozycje stałe ⭐.
- **Notatki** — kolorowe karty, przypinanie, notatka-lista z odhaczaniem, szukajka,
  autosave, cofnij po usunięciu, udostępnianie.
- **Mój cykl** (w Więcej) — kalendarz miesiąca z okresem, przewidywanym okresem, dniami
  płodnymi i owulacją; dzień cyklu i faza z podpowiedzią; objawy/nastrój/notatka na dzień;
  statystyki (średni cykl, regularność); dyskretne przypomnienia; PIN; ukrywanie panelu.
- **Lekcje dzieci** (w Więcej) — plan lekcji każdego dziecka na wspólnych dzwonkach
  szkoły (kolorowe przedmioty), sprawdziany / kartkówki / „przynieść strój" / wycieczki
  z datą, karta „Lekcje dziś" na Dziś z zapowiedzią spraw na jutro, przypomnienie
  wieczorem dzień wcześniej, przepisanie końca lekcji do planu odbioru jednym tapem.
- **Uroda i wizyty** (w Więcej) — paznokcie, fryzjer, kosmetyczka, brwi, masaż, lekarz:
  odliczanie, wizyty na osi dnia i w tygodniu, historia i „Twój rytm", podpowiedź „pora
  umówić" na podstawie Twoich odstępów, przypomnienia przed wizytą i dzień wcześniej.
- **Plan odbiorów** (w Więcej) — pełna edycja osób, godzin Pn–Pt, zajęć, przypomnień.
- **Zmiany na jeden dzień** — nadpisanie godziny, nieobecność, odwołane zajęcia, inny
  odbiór, notatka dnia — bez ruszania stałego planu.
- **Przypomnienia** — konfigurowalne (ile minut wcześniej, o kim, o czym); działają,
  gdy aplikacja jest uruchomiona.
- **9 motywów** — Różany, Lawenda, Mięta, Zachód, Jasny, Ciemny, Stal, Nord, Dracula.
- **Kopie bezpieczeństwa** — automatyczne migawki (codziennie, przed aktualizacją, przed
  każdą groźną operacją), przywracanie jednym tapem, eksport/import pliku JSON.
- **Nawigacja po ludzku** — Wstecz cofa po Twoich śladach (inny dzień → dziś → wyjście),
  podwójne Wstecz na starcie zamiast wypadnięcia z apki, pamięć ostatniego ekranu.

## Instalacja na telefonie

- **Android (Chrome):** otwórz link → baner „Zainstaluj" albo menu ⋮ → *Dodaj do
  ekranu głównego*.
- **iPhone (Safari):** Udostępnij ⎋ → *Do ekranu początkowego*.

## Dane i aktualizacje

Całość w `localStorage`. Aktualizacja aplikacji podmienia wyłącznie kod (cache Service
Workera) — dane pozostają nietknięte. Dodatkowo aplikacja prosi system o trwałe
przechowywanie (`navigator.storage.persist`) i trzyma do 7 migawek danych. Przenoszenie
na drugi telefon: Więcej → Dane → Plik kopii → Wczytaj.

## Rozwój

`index.html` (rdzeń) + moduły `zakupy.js`, `notatki.js`, `cykl.js`, `lekcje.js`,
`uroda.js` + `sw.js` (offline) + `manifest.json`. Bez zależności i bez builda.
Przed każdym wydaniem: kopia źródeł w `..\archiwum\` i tag `prev` w git
(rollback: `git checkout prev -- . && git commit && git push`).

```bash
python -m http.server 8766
```

Zasada wydań: każda zmiana podbija `APP_VERSION`, `BUILD` (index.html) i `CACHE`
(sw.js — precache obejmuje też pliki modułów) w jednym commicie.
