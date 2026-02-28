# 🎯 QuizZZ

Ein Quiz-Spiel für 1–5 Spieler, gebaut mit Vue 3, TypeScript und Tailwind CSS.
Fragen werden live von der [Open Trivia Database](https://opentdb.com) geladen.

## Features

- **1–5 Spieler** – Hot-Seat-Modus, ein Gerät für alle
- **17 Kategorien** – Allgemeinwissen, Sport, Musik, Geographie, Geschichte u.v.m.
- **3 Schwierigkeitsstufen** – Leicht, Mittel, Schwer (oder Gemischt)
- **5–20 Fragen** pro Spiel wählbar
- **30-Sekunden-Timer** pro Frage mit Farbwarnung
- **Live-Punktestand** während des Spiels
- **Ergebnisseite** mit Rangliste, Medaillen und Trefferquote

## Tech Stack

| Technologie | Version | Zweck |
|---|---|---|
| Vue 3 | ^3.5 | Frontend Framework |
| TypeScript | ~5.9 | Typsicherheit |
| Vite | ^7.3 | Build Tool |
| Tailwind CSS | ^4.2 | Styling |
| Vue Router | ^4.6 | Routing |
| Pinia | ^3.0 | State Management |

## Voraussetzungen

- Node.js 18+
- npm

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

## Verfügbare Befehle

```bash
npm run dev       # Entwicklungsserver mit Hot Reload
npm run build     # Produktion Build
npm run preview   # Produktion Build lokal vorschauen
```

Oder mit Make:

```bash
make dev          # Entwicklungsserver starten
make build        # Produktion Build
make preview      # Build vorschauen
make install      # Abhängigkeiten installieren
make clean        # dist/ Ordner löschen
```

## Projektstruktur

```
src/
├── main.ts              # App-Einstiegspunkt
├── App.vue              # Root-Komponente
├── style.css            # Globale Styles (Tailwind)
├── types/
│   └── index.ts         # TypeScript-Typen
├── stores/
│   └── quiz.ts          # Pinia Store – gesamte Spiellogik
├── router/
│   └── index.ts         # Vue Router – Routen
└── views/
    ├── HomeView.vue     # Startseite – Spieler & Einstellungen
    ├── GameView.vue     # Spielseite – Fragen & Timer
    └── ResultView.vue   # Ergebnisseite – Rangliste
```

## API

Fragen kommen von der **Open Trivia Database** (kostenlos, kein API-Key nötig):

```
GET https://opentdb.com/api.php?amount=10&category=9&difficulty=easy&type=multiple
```

Antwort-Codes:
- `0` – Erfolg
- `1` – Nicht genug Fragen verfügbar (andere Einstellungen wählen)
