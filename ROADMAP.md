# HardCost – Offene Punkte & Ideen

Stand: 21.10.2026. Erledigte Punkte abhaken (`[x]`) oder entfernen, neue unten ergänzen.

## Offene Punkte

- [ ] **Logo-Suche hängt an Gratis-Diensten** (Simple Icons, Clearbit Autocomplete, Favicone – siehe `src/services/logoSearch.ts`). Stand 20.10.2026 antworten alle noch. Clearbit Autocomplete gehört zu HubSpot: Das Logo-Feld liefert seit Sept. 2025 nichts mehr (wir nutzen dort nur Name + Domain), der Dienst kann ganz wegfallen. Empfehlung: Wechsel auf **Brandfetch** (Brand Search + Logo, gratis mit Client-ID, ohne Namensnennung, 500k Abrufe/Monat) – braucht ein kostenloses Konto des Nutzers. Ausweich-Lösung ohne Konto: Google-Favicon-Dienst als Fallback.

## Vorschläge

### Wichtig
1. [ ] **Erinnerungen per Push** – „Netflix wird morgen abgebucht“, „Kündigungsfrist läuft in 3 Tagen ab“. Ohne Server nur eingeschränkt (beim Öffnen der App); zuverlässig bräuchte es einen kleinen Server.

### Nützlich
2. [ ] **Kalender-Export (.ics)** – Abbuchungen und Fristen in Google-/Apple-Kalender. (Zurzeit nicht gebraucht.)

### Ideen für später
3. [ ] **Pausen-Historie anzeigen** – Liste vergangener Pausen im Abo (Daten sind schon vorhanden).
4. [ ] **Budget pro Kategorie** zusätzlich zum Gesamtbudget.

## Meilenstein 9 (in Arbeit)

- [x] **9a Rebranding HardCost:** Name, neues Icon, Markenverlauf (Plus-Knopf, aktiver Tab, Hauptknöpfe), Datenbank-Umzug `subpulse` → `hardcost`, alte Backups weiter importierbar, Repo heisst `hardcost` (neue URL – App am Handy neu installieren)
- [x] **9b Anschlusslaufzeit:** feste Verlängerung um X Monate oder flexibel kündbar, Frist in Tagen oder Monaten, «nur auf Monatsende»; Radar zeigt «sonst +12 Mt.», Karte «Laufzeit bis …». Fristen rechnen jetzt ab dem letzten Vertragstag (einen Tag früher als bisher bei Tagesfristen). Neue Felder sind optional – keine DB-Migration nötig, alte Backups gültig
- [ ] 9c Bezahlkarten-Radar, Kategorie-Budgets, Fixkosten-Quote, Einweg-/virtuelle Karten
- [ ] 9d Abo-Friedhof (eigener Tab, Spar-Tracker, Reaktivieren)
- [ ] 9e Karten: Drehung, Einstellungs-Knopf, Ruhemodus, Markenfarbe, Wischgeste
- [ ] 9f Freies Sortieren (Liste & Kacheln)
- [ ] 9g Plus-Knopf-Morph am Handy, Liquid-Fill
- [ ] 9h Geräte-Sync per WebRTC & QR

## Erledigt

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
