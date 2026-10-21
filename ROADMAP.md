# HardCost – Offene Punkte & Ideen

Stand: 21.10.2026. Erledigte Punkte abhaken (`[x]`) oder entfernen, neue unten ergänzen.

## Offene Punkte

- [ ] **Meilenstein 9 am Handy testen:** neue App unter https://altirix2002.github.io/hardcost/ installieren (alte SubPulse-App löschen), Daten ziehen automatisch mit; besonders neuer Plus-Knopf-Morph, Karten-Drehung, Karten-Farben, Tab «Abos», Wischen bis zum Löschen, Anordnen per Finger und Geräte-Sync mit echter Kamera prüfen.
- [ ] **sharp-Sicherheitswarnung** (npm audit, hoch): betrifft nur das Icon-Skript `npm run icons`, nicht die App. Fix braucht sharp 0.35 (Breaking Change) – beim nächsten Icon-Update mitnehmen.
- [ ] **Geräte-Sync ersetzt** den Stand des Empfängers komplett. Echtes Zusammenführen (beidseitig geänderte Abos) bräuchte einen Änderungszeitstempel pro Abo.
- [ ] **Logo-Suche:** Brandfetch ist jetzt erste Quelle (Client-ID im Code). Clearbit Autocomplete (HubSpot) kann jederzeit wegfallen – dann bleiben Brandfetch, Simple Icons und Favicone.

## Vorschläge

### Wichtig
1. [ ] **Erinnerungen per Push** – „Netflix wird morgen abgebucht“, „Kündigungsfrist läuft in 3 Tagen ab“. Ohne Server nur eingeschränkt (beim Öffnen der App); zuverlässig bräuchte es einen kleinen Server.

### Nützlich
2. [ ] **Kalender-Export (.ics)** – Abbuchungen und Fristen in Google-/Apple-Kalender. (Zurzeit nicht gebraucht.)

### Ideen für später
3. [ ] **Pausen-Historie anzeigen** – Liste vergangener Pausen im Abo (Daten sind schon vorhanden).

## Erledigt

- [x] **Meilenstein 9 (HardCost):**
  - [x] **9a Rebranding HardCost:** Name, neues Icon, Markenverlauf (Plus-Knopf, aktiver Tab, Hauptknöpfe), Datenbank-Umzug `subpulse` → `hardcost`, alte Backups weiter importierbar, Repo heisst `hardcost` (neue URL – App am Handy neu installieren)
  - [x] **9b Anschlusslaufzeit:** feste Verlängerung um X Monate oder flexibel kündbar, Frist in Tagen oder Monaten, «nur auf Monatsende»; Radar zeigt «sonst +12 Mt.», Karte «Laufzeit bis …». Fristen rechnen jetzt ab dem letzten Vertragstag (einen Tag früher als bisher bei Tagesfristen). Neue Felder sind optional – keine DB-Migration nötig, alte Backups gültig
  - [x] **9c Finanz-Wächter:** Bezahlkarten in den Einstellungen (Typ normal/virtuell/Einweg, gültig bis MM/JJ, letzte 4 Ziffern), Karten-Radar (30 Tage vor Ablauf; Einweg-/virtuelle Karten 7 Tage vor jeder Abbuchung), Karten-Badge auf dem Abo; Monatslimit je Kategorie mit Ampel 80/95/100 % und rotem Alarm, Übersicht in Statistiken; Fixkosten-Quote mit einstellbarer Ampel (Standard 10/20 %)
  - [x] **9d Abo-Friedhof:** eigener Tab (nur wirklich beendete Abos; auslaufende bleiben in der Übersicht), Spar-Tracker seit Kündigung, 1-Klick-Reaktivieren mit Rückgängig (Lücke wird als Pause eingetragen, damit «Bisher bezahlt» stimmt); Tab-Leiste am Handy und bis 1024 px kompakt (inaktive Tabs nur als Symbol)
  - [x] **9e Karten & Logos:** Brandfetch als erste Logo-Quelle (offizielle Logos per Hotlink, offline zwischengespeichert; danach Simple Icons, Favicons, Initialen); Markenfarben aus dem Logo (Glow + Akzentlinie, schwarze Logos bleiben schwarz); Antippen dreht Karte/Kachel um (Rückseite mit Vertragsdaten, gleiche Höhe), Zahnrad oben links öffnet die Einstellungen; Ruhemodus für Pausierte (entsättigt, atmender Rand); Wischgeste mit Farbfüllung im Spalt, Gummiband und Durchwischen-zum-Löschen
  - [x] **9f Freies Sortieren:** Sortierung «Eigene Reihenfolge» (gemerkt), Knopf «Anordnen» → Karten wackeln und lassen sich per Maus, Finger (kurz halten) oder Tastatur verschieben (dnd-kit); gleiche Reihenfolge in Liste und Kacheln, gespeichert am Abo (auch im Backup), gefilterte Ansichten tauschen nur untereinander
  - [x] **9g Morph & Liquid-Fill:** Plus-Knopf morpht jetzt auch am Handy ins Formular und zurück (Ecken als Motion-Wert, Inhalt erscheint ab ~230 ms gestaffelt; im Production-Build gemessen: kein langsamer Frame); Budgets als Liquid-Fill-Kugeln (Monatsbudget, Kategorie-Budgets, Budget-Alarm) mit Wellen, Ampelfarben, pausiert ausserhalb des Bildschirms
  - [x] **9i Handy-Feedback:** Plus-Knopf-Morph neu ohne Shared-Layout (Fenster wächst per clip-path aus dem gemessenen Knopf, Knopf-Look blendet ins Glas, beim Schliessen zurück genau auf den Knopf – kein Flug von oben, kein grauer Blur-Blitz, erstes Öffnen ohne Verzögerung); Kartendrehung genau einmal 180° hin und zurück (ohne Nachfedern); ganze Karte in abgedunkelter Markenfarbe bzw. Farbe des Initialen-Logos; neuer Tab «Abos» nur mit der Abo-Liste (gleiche Filter und Ansicht)
  - [x] **9h Geräte-Sync:** Einstellungen → Geräte-Sync: zwei QR-Codes tauschen (oder Code kopieren/einfügen, z.B. PC ohne Webcam), dann gehen Abos, Kategorien, Einstellungen und Dokumente als ZIP direkt per WebRTC (verschlüsselt) aufs andere Gerät; Empfänger bestätigt vor dem Ersetzen. Kompakter Code (~190 Zeichen statt ~650 SDP), STUN von Google nur zur Adressfindung

- [x] Kachel-Ansicht am Handy getestet – funktioniert

- [x] Übersicht ohne Sprünge (am Handy bestätigt)
- [x] **Kachel-Ansicht** der Abos (3/4/5 pro Reihe, Status-Symbol, gemerkte Wahl), Überblenden Liste ↔ Kacheln; Scroll-Verankerung in Abo-Liste, Radar und Backup-Hinweis abgeschaltet (verursachte 60-px-Sprünge ganz unten); Sprung-Tests beider Ansichten im Production-Build

- [x] Wisch-Knöpfe reagieren sofort (am Handy bestätigt)
- [x] Kacheln „Aktive Abos“/„Nächste Abbuchung“ rollen statt durch Zwischenwerte zu zählen; Radar und Backup-Hinweis tragen ihren Abstand selbst (kein 24-px-Sprung); sanftere, gestaffelte Ein-/Ausklapp-Animation; komplette Übersicht per Bild-für-Bild-Messung im Production-Build geprüft

- [x] Weiteres Springen beim Löschen behoben: Radar-Einträge, Wechsel zur Leer-Ansicht und „Keine Treffer“ klappen weich; Backup-Erinnerung verschwindet nicht mehr mitten beim Löschen; Kennzahl-Karten ändern ihre Höhe nicht
- [x] Wisch-Knöpfe reagieren sofort (lösen beim Loslassen des Fingers aus, nicht erst beim Klick, den Chrome nach einem Wischer verschluckt)

- [x] Am Handy getestet: Tab-Wischen, Wechsel Liste ↔ Kalender
- [x] Ruckeln beim Löschen behoben: Karten klappen weich zusammen statt aus dem Fluss zu springen (kein Scroll-Sprung mehr am Seitenende)

- [x] Am Handy getestet: Face ID automatisch, Wisch-Knöpfe, Datumsfelder, Kalender
- [x] „Inaktiv“ heisst jetzt „Gekündigt · beendet am …“ (Migration übernimmt das Enddatum alter inaktiver Abos), Filter „Gekündigt“, Logo-Kürzel ohne Satzzeichen

- [x] **Runde nach Handy-Test:** Wisch-Knöpfe erscheinen erst beim vollen Wischen, Face ID startet automatisch, PIN-Warnhinweis, eigenes Datumsfeld (kein Komma mehr), eigene Zahlungsarten bleiben gespeichert, ZIP-Backup inkl. Dokumente, Gratis-Testphasen & Gratis-Abos, Gekündigt-Status („läuft noch bis“), Abo kopieren, zwischen Tabs wischen, Kalenderansicht der Abbuchungen, Monatsbudget, Backup-Erinnerung, 12-Monats-Prognose
- [x] Am Handy getestet: Tab-Wechsel, Wischgeste, Face ID / Fingerabdruck
- [x] Bug „Fenster bleibt nach Hinzufügen offen“ behoben
- [x] Haptisches Feedback (nur Android; iOS-Safari unterstützt keine Vibration)
- [x] Suche in der Abo-Liste, Geteilte Abos

- [x] **Meilenstein 8:** Lichtkanten & Licht-Spot auf Glaskarten, Alarm-Glow, Wischgeste (Pausieren/Löschen mit Rückgängig), Plus-Knopf-Morph (Desktop), nachrutschende Karten, Zahlen-Ticker in allen Kennzahlen, Dynamic-Island-Meldungen, Vibration
- [x] **Meilenstein 7:** Lokale Dokumenten-Ablage (PDF/JPG/PNG, Vorschau), App-Sperre mit PIN + Face ID/Fingerabdruck (WebAuthn), Spar-Simulator, „SubPulse Wrapped“-Jahresrückblick
- [x] **Meilenstein 6:** Live-Suche, Mindestlaufzeit (Kündigungsradar erst zum Ende der Bindung), „Bisher insgesamt bezahlt“ aus echten Abbuchungen inkl. Pausen-Ersparnis, Zombie-Abo-Hinweis mit Schnellaktionen
- [x] **Meilenstein 5:** Kosten-Splitting, Schlummer-Modus (Pausen mit Historie, automatisches Weiterlaufen), Preiserhöhungs-Radar, Auswertung nach Zahlungsart, Kategorie-Prozente ergeben jetzt exakt 100 %

- [x] Tab-Sprung (horizontaler Überlauf → Zoom in mobilem Chrome), ruckelnde Animationen, Glas-Blur-Fehler
- [x] Neues Logo im Header, Logo-Editor (Zuschneiden für Kreis/Squircle), Logo-Suche
- [x] 57 Kategoriefarben, Kategorien-Verwaltung in den Einstellungen
- [x] Eigene Zahlungsarten als Vorschläge, Liste „Nächste Abbuchungen“
