# Plan Rodzinki 🌸

Rodzinny plan lekcji, odbiorów ze szkoły i zajęć dodatkowych. Aplikacja PWA —
działa offline, instaluje się na telefonie jak zwykła apka, a wszystkie dane
trzyma **wyłącznie lokalnie** (localStorage). Zero kont, zero serwera, zero chmury.

**Aplikacja:** https://neo-serwis.github.io/plan-rodzinki/

## Co potrafi

- **Dziś** — oś dnia: wyjazd do szkoły, kto o której kończy, odliczanie do
  najbliższego wydarzenia, plan odbioru i zajęcia popołudniowe.
- **Jak odebrać?** — automatyczne warianty: *1 kurs* (wszyscy razem) albo
  *2 kursy*, z wyliczonym czekaniem na świetlicy i czekaniem rodzica; wybór
  zapamiętywany osobno dla każdego dnia tygodnia.
- **Tydzień** — graficzny grafik (paski czasu każdej osoby, linia końca pracy
  rodzica 🏁, bloki zajęć, linia „teraz") + podsumowanie logistyki każdego dnia.
- **Plan** — pełna edycja: osoby (imię, emoji, kolor), godziny końca lekcji
  Pn–Pt z notatkami, zajęcia dodatkowe (dzień, godziny, dojazd, przypomnienie),
  własne przypomnienia (jednorazowe lub cykliczne).
- **Zmiany na jeden dzień** — nadpisanie godziny, nieobecność, odwołane zajęcia,
  notatka dnia — bez ruszania stałego planu.
- **Przypomnienia** — konfigurowalne (ile minut wcześniej, o kim, o czym);
  działają, gdy aplikacja jest uruchomiona.
- **9 motywów** — Różany, Lawenda, Mięta, Zachód, Jasny, Ciemny, Stal, Nord, Dracula.
- **Kopia zapasowa** — eksport/import JSON (przeniesienie planu na drugi telefon).
- **Udostępnianie** — wysyłka planu dnia jednym przyciskiem (np. SMS-em drugiemu rodzicowi).

## Instalacja na telefonie

- **Android (Chrome):** otwórz link → baner „Zainstaluj" albo menu ⋮ → *Dodaj do
  ekranu głównego*.
- **iPhone (Safari):** Udostępnij ⎋ → *Do ekranu początkowego*.

## Dane

Całość w `localStorage` przeglądarki/aplikacji. Każdy telefon ma swoją kopię —
plan przenosi się przez Eksport → Import (Więcej → Dane).

## Rozwój

Czysty HTML/CSS/JS w jednym pliku `index.html` + `sw.js` (offline) +
`manifest.json`. Bez zależności i bez builda.

```bash
python -m http.server 8766
```

Zasada wydań: każda zmiana podbija `APP_VERSION`, `BUILD` (index.html)
i `CACHE` (sw.js) w jednym commicie.
