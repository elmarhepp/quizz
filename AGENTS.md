# AGENTS.md – Hinweise für KI-Agenten

Dieses Dokument beschreibt die Projektstruktur und Konventionen für KI-Agenten (z.B. Claude Code),
die an diesem Projekt arbeiten.

## Projekt-Überblick

QuizZZ ist eine Quiz-Website für 1–5 Spieler.
- **Framework**: Vue 3 mit `<script setup>` und Composition API
- **Sprache**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 (Vite-Plugin, kein `tailwind.config.js`)
- **State**: Pinia Store in `src/stores/quiz.ts`
- **Routing**: Vue Router in `src/router/index.ts`
- **Fragen-API**: Open Trivia Database (opentdb.com)

## Wichtige Befehle

```bash
npm run dev      # Dev-Server starten
npm run build    # Typcheck + Produktions-Build (vue-tsc && vite build)
npm run preview  # Produktion-Build lokal testen
```

Vor dem Abschliessen einer Aufgabe immer `npm run build` ausführen, um TypeScript-Fehler zu prüfen.

## Dateistruktur

```
src/
├── types/index.ts        – Alle gemeinsamen TypeScript-Interfaces
│                           (Player, Question, QuizSettings, GamePhase)
├── stores/quiz.ts        – Einziger Pinia Store; enthält gesamte Spiellogik,
│                           API-Call, Timer-Logik, Punkte-Zählung
├── router/index.ts       – Drei Routen: / | /spiel | /ergebnis
└── views/
    ├── HomeView.vue      – Spieler-Setup (Namen, Kategorie, Schwierigkeit, Fragenanzahl)
    ├── GameView.vue      – Aktives Spiel (Frage, Antworten, Timer, Punktestand)
    └── ResultView.vue    – Rangliste, Statistiken, Neustart
```

## Konventionen

- **Komponenten**: Vue 3 SFC mit `<script setup lang="ts">`, keine Options API
- **Styling**: Ausschliesslich Tailwind-Utility-Klassen, kein `<style scoped>` ausser für Animationen
- **State**: Nur über den Pinia Store (`useQuizStore`), kein lokaler State für spielrelevante Daten
- **Typen**: Alle Interfaces in `src/types/index.ts` definieren, nicht inline
- **Deutsch**: UI-Texte, Kommentare und Fehlermeldungen auf Deutsch

## Tailwind CSS v4 Besonderheiten

Tailwind v4 benötigt **keinen** `tailwind.config.js`.
Konfiguration läuft über das Vite-Plugin in `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite'
plugins: [vue(), tailwindcss()]
```

CSS-Import in `src/style.css`:
```css
@import "tailwindcss";
```

## Bekannte Einschränkungen

- Die OpenTDB-API hat ein Rate-Limit; bei zu vielen Anfragen kurz warten
- Fragen sind überwiegend auf Englisch; Deutsch ist nur begrenzt verfügbar
- Bei Schwierigkeit `easy` + spezifischer Kategorie kann die Fragenanzahl limitiert sein
  → API gibt dann `response_code: 1` zurück (wird als Fehlermeldung angezeigt)
