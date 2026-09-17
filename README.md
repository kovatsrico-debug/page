# kord.at — Redesign

Statische, framework-freie Neugestaltung der KoRd-Website mit klarer
Drei-Wege-Navigation ab der Startseite:

1. **Endkunde** → Hero-PLZ-Eingabe → `/haendlersuche/` (regionaler Fachpartner)
2. **Produktinteresse** → `/produkte/` → von dort weiter zu Händlersuche oder Partneranfrage
3. **Potenzieller Handelspartner (Lead)** → `/haendler-werden/` (mehrstufiger Funnel)

## Struktur

```
/index.html              Startseite mit 3-Wege-Hero, News-Teaser, Produkt-Teaser, USPs
/produkte/                Produktübersicht (Fenster, Türen, Plissee, Pollenschutz, Sonderanfertigung)
/haendlersuche/            PLZ-basierte Händlersuche + interaktive Bundesland-Netzwerkkarte
/haendler-werden/          4-stufiger Lead-Funnel für neue Handelspartner
/aktuelles/                Vollständige News-Liste (Quelle für die Startseiten-Teaser)
/impressum/, /datenschutz/ Rechtliche Platzhalterseiten
/assets/css/style.css      Design-System (Tokens, Komponenten, Light/Dark)
/assets/js/main.js         Navigation, Theme-Toggle, Scroll-Reveal, Hero-PLZ-Formular
/assets/js/haendlersuche.js  PLZ→Bundesland-Zuordnung, Nachbarregionen, Kartensteuerung
/assets/js/leadfunnel.js    Formular-Logik des Partner-Funnels (Validierung, Zusammenfassung, Versand)
/assets/data/haendler.json  Händlerdaten (aktuell Platzhalter, siehe unten)
```

## Wichtig vor dem Go-Live

### 1. Echte Händlerdaten einpflegen
`assets/data/haendler.json` enthält **Platzhalter** (ein Beispielhändler pro
Bundesland). Ersetzen Sie Name, Adresse, Telefon und E-Mail durch die echten
Vertriebspartner. Die Struktur (ein Eintrag pro `bundeslandKey`) kann beibehalten
werden; sollen mehrere Händler pro Bundesland angezeigt werden, muss
`haendlersuche.js` (`dealersByBl`) auf Arrays statt Einzelobjekte umgestellt werden.

Die Zuordnung PLZ → Bundesland erfolgt aktuell über eine Heuristik anhand der
ersten ein bis zwei Ziffern der PLZ (siehe `classifyPlz()` in
`haendlersuche.js`). Das deckt die reale österreichische PLZ-Systematik
(inkl. Sonderfall Vorarlberg 67xx–69xx und Osttirol 99xx) ausreichend genau ab,
ersetzt aber keine echte Geokoordinaten-/Umkreissuche.

### 2. Lead-Funnel an echtes Backend anbinden
Aktuell sendet `haendler-werden/` die Anfrage per `mailto:`-Link an
`partner@kord.at` (bitte reale Zieladresse bestätigen) und zeigt zusätzlich den
vollständigen Text zum manuellen Kopieren an (Fallback ohne E-Mail-Programm).
Für eine robuste Lead-Erfassung (CRM, Marketing-Tool, Datenbank) den Absende-Handler
in `assets/js/leadfunnel.js` (`submitBtn.addEventListener(...)`) um einen
`fetch()`-Aufruf an den gewünschten Endpunkt erweitern.

### 3. Rechtliche Seiten
`impressum/` und `datenschutz/` enthalten Platzhaltertexte und benötigen vor
Veröffentlichung eine rechtliche Prüfung sowie die echten Firmenbuch-/UID-Daten.

### 4. Lokal testen
Da `haendlersuche.js` die Händlerdaten per `fetch()` lädt, muss die Seite über
einen lokalen Server aufgerufen werden (nicht per `file://`), z. B.:

```
python3 -m http.server 8000
```

und anschließend `http://localhost:8000` öffnen.

## Design-System

Farb-, Typografie- und Spacing-Tokens liegen als CSS-Custom-Properties in
`assets/css/style.css` (`:root`). Die aktuelle Palette (Salbeigrün + Amber auf
warmem Off-White, mit Dark-Mode-Variante) ist ein gestalterischer Vorschlag und
sollte bei Bedarf an bestehende KoRd-Markenfarben/Logo angepasst werden.
