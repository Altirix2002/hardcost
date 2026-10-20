# SubPulse – Offene Punkte & Ideen

Stand: 20.10.2026. Erledigte Punkte abhaken (`[x]`) oder entfernen, neue unten ergänzen.

## Offene Punkte

- [ ] **Am echten Handy testen:** Tab-Wechsel ohne Sprung, Flüssigkeit der Animationen, Pinch-Zoom im Logo-Editor.
- [ ] **Bug „Fenster bleibt nach Hinzufügen offen“ beobachten:** Nie direkt reproduziert. Abgesichert durch Tastatur-Schliessen vor dem Speichern, Fehlermeldung und Fallback-Timer im `Modal` (0,9 s). Falls es wieder auftritt: notieren, was direkt davor passiert ist.
- [ ] **Logo-Suche hängt an Gratis-Diensten** (Simple Icons, Clearbit Autocomplete, Favicone – siehe `src/services/logoSearch.ts`). Können ohne Vorwarnung wegfallen; Favicone liefert für unbekannte Domains teils ein graues Platzhalter-Icon.
- [ ] **Eigene Zahlungsarten** werden aus gespeicherten Abos abgeleitet (`getPaymentMethodSuggestions`). Wird das letzte Abo mit einer Zahlungsart gelöscht, verschwindet auch der Vorschlag.
- [ ] **Datumsfelder** zeigen im Desktop-Browser teils ein Komma vor dem Datum („,20.10.2026“) – Browser-Darstellung, unschön.

## Vorschläge

### Wichtig
1. [ ] **Erinnerungen per Push** – „Netflix wird morgen abgebucht“, „Kündigungsfrist läuft in 3 Tagen ab“. Ohne Server nur eingeschränkt (beim Öffnen der App); zuverlässig bräuchte es einen kleinen Server.
2. [ ] **Testphasen/Gratis-Abos** – „Testphase endet am …“ mit Warnung davor.
3. [ ] **Gekündigt-Status** – Kündigungsdatum („läuft noch bis 30.11.“), zählt bis zum Ende mit.
4. [x] **Suche in der Abo-Liste** – erledigt in Meilenstein 6.

### Nützlich
5. [ ] **Wischgesten** – Karten wischen zum Löschen/Pausieren, zwischen Tabs wischen.
6. [ ] **Abo duplizieren**.
7. [x] **Geteilte Abos** – erledigt in Meilenstein 5 (gleichmässig auf X Personen oder fester Betrag).
8. [ ] **Kalenderansicht der Abbuchungen** (Monatsraster) als Ergänzung zur Liste.
9. [ ] **Budget/Limit pro Monat** mit Warnung.
10. [ ] **Kalender-Export (.ics)** – Abbuchungen und Fristen in Google-/Apple-Kalender.

### Feinschliff
11. [ ] **Haptisches Feedback** (Vibration) beim Speichern/Löschen auf Android.
12. [ ] **Backup-Erinnerung** – „Letztes Backup vor 30 Tagen“.
13. [ ] **Leere Statistik verbessern** – Hinweis oder 12-Monats-Prognose bei wenigen Abos.

**Empfehlung für die nächste Runde:** 2 + 3 + 10 (ohne Server machbar, spart im Alltag am meisten Geld).

## Erledigt

- [x] **Meilenstein 6:** Live-Suche, Mindestlaufzeit (Kündigungsradar erst zum Ende der Bindung), „Bisher insgesamt bezahlt“ aus echten Abbuchungen inkl. Pausen-Ersparnis, Zombie-Abo-Hinweis mit Schnellaktionen

- [x] **Meilenstein 5:** Kosten-Splitting, Schlummer-Modus (Pausen mit Historie, automatisches Weiterlaufen), Preiserhöhungs-Radar, Auswertung nach Zahlungsart, Kategorie-Prozente ergeben jetzt exakt 100 %

- [x] Tab-Sprung (horizontaler Überlauf → Zoom in mobilem Chrome), ruckelnde Animationen, Glas-Blur-Fehler
- [x] Neues Logo im Header, Logo-Editor (Zuschneiden für Kreis/Squircle), Logo-Suche
- [x] 57 Kategoriefarben, Kategorien-Verwaltung in den Einstellungen
- [x] Eigene Zahlungsarten als Vorschläge, Liste „Nächste Abbuchungen“
