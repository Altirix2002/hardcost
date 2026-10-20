# SubPulse – Offene Punkte & Ideen

Stand: 20.10.2026. Erledigte Punkte abhaken (`[x]`) oder entfernen, neue unten ergänzen.

## Offene Punkte

- [ ] **Logo-Suche hängt an Gratis-Diensten** (Simple Icons, Clearbit Autocomplete, Favicone – siehe `src/services/logoSearch.ts`). Stand 20.10.2026 antworten alle noch. Clearbit Autocomplete gehört zu HubSpot: Das Logo-Feld liefert seit Sept. 2025 nichts mehr (wir nutzen dort nur Name + Domain), der Dienst kann ganz wegfallen. Empfehlung: Wechsel auf **Brandfetch** (Brand Search + Logo, gratis mit Client-ID, ohne Namensnennung, 500k Abrufe/Monat) – braucht ein kostenloses Konto des Nutzers. Ausweich-Lösung ohne Konto: Google-Favicon-Dienst als Fallback.
- [ ] **Am echten Handy testen (neu):** Face ID startet automatisch, Wisch-Knöpfe erst beim vollen Wischen, Tab-Wischen, Datumsfelder (eigener Datums-Wähler), Kalenderansicht.

## Vorschläge

### Wichtig
1. [ ] **Erinnerungen per Push** – „Netflix wird morgen abgebucht“, „Kündigungsfrist läuft in 3 Tagen ab“. Ohne Server nur eingeschränkt (beim Öffnen der App); zuverlässig bräuchte es einen kleinen Server.

### Nützlich
2. [ ] **Kalender-Export (.ics)** – Abbuchungen und Fristen in Google-/Apple-Kalender. (Zurzeit nicht gebraucht.)

### Ideen für später
3. [ ] **Pausen-Historie anzeigen** – Liste vergangener Pausen im Abo (Daten sind schon vorhanden).
4. [ ] **Budget pro Kategorie** zusätzlich zum Gesamtbudget.

## Erledigt

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
