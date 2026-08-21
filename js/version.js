// Zentrale Versionsverwaltung.
// Schema: MAJOR.MINOR.PATCH
//   MAJOR  -> nur auf ausdruecklichen Wunsch von Andrei erhoehen
//   MINOR  -> neue Funktionen
//   PATCH  -> Fehlerbehebungen / kleine Korrekturen
//
// Bei jeder Aenderung: APP_VERSION anpassen UND einen neuen Eintrag oben in CHANGELOG ergaenzen.

export const APP_VERSION = '1.7.0';

export const CHANGELOG = [
  {
    version: '1.7.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Rollen & Zugriff: neue Übersichtskarte "Was dürfen die Rollen?" mit vollständiger Beschreibung pro Rolle',
        'Admin-Rolle zeigt automatisch "Beinhaltet auch: ..." für die Rollen, die sie mit abdeckt',
        'Rollen-Beschreibungen zentral in js/roleDefinitions.js ausgelagert – eine Änderung dort aktualisiert Tooltip und Übersichtskarte gleichzeitig',
      ],
      en: [
        'Roles & access: new overview card "What can each role do?" with a full description per role',
        'Admin role automatically shows "Also includes: ..." for the roles it covers',
        'Role descriptions centralized in js/roleDefinitions.js – one change there updates both the tooltip and the overview card',
      ],
    },
  },
  {
    version: '1.6.0',
    date: '2026-08-21',
    changes: {
      de: [
        'E-Mail-Adresse nachträglich änderbar: im ausgeklappten Bereich bei Rollen & Zugriff, aktualisiert Login (Supabase Auth) und Stammdaten gleichzeitig',
      ],
      en: [
        'Email address can now be changed later: in the expanded panel under roles & access, updates both the login (Supabase Auth) and the employee record',
      ],
    },
  },
  {
    version: '1.5.0',
    date: '2026-08-21',
    changes: {
      de: [
        'CORS-Fehler beim Login-Erstellen behoben (Edge Function "admin-users" serverseitig korrigiert)',
        'Alphabetische Sortierung (klickbare Spaltenköpfe mit Pfeil) in allen Listen: Teams, Mitarbeiter, Feiertage, Sperrzeiten, PI & Sprints, Rollen & Zugriff',
        'Rollen & Zugriff komplett neu gestaltet: ausklappbare Zeilen statt Checkbox-Raster, E-Mail-Adresse jetzt direkt sichtbar',
      ],
      en: [
        'Fixed CORS error when creating a login (server-side fix in the "admin-users" Edge Function)',
        'Alphabetical sorting (clickable column headers with arrow) added to all lists: teams, employees, holidays, blocked periods, PI & sprints, roles & access',
        'Roles & access redesigned: expandable rows instead of a checkbox grid, email address now visible directly',
      ],
    },
  },
  {
    version: '1.4.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Info-Icons neben Feldern hinzugefügt, die bei Hover/Fokus erklären, was das jeweilige Feld bewirkt',
        'Betrifft: Teams, Mitarbeiter, Feiertage, Sperrzeiten, PI & Sprints, Konfidenzband, Einstellungen, Rollen & Zugriff (inkl. Rollen-Spaltenköpfe)',
        'Wiederverwendbare Komponente (fieldLabel/infoIcon), damit künftige Felder das Muster einfach übernehmen können',
      ],
      en: [
        'Added info icons next to fields that explain what the field does on hover/focus',
        'Applies to: teams, employees, holidays, blocked periods, PI & sprints, confidence band, settings, roles & access (incl. role column headers)',
        'Reusable component (fieldLabel/infoIcon) so future fields can adopt the pattern easily',
      ],
    },
  },
  {
    version: '1.3.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Einheitliches Formular-Design auf allen Seiten: Label links, Feld rechts (zweispaltig)',
        'Betrifft: Teams, Mitarbeiter, Feiertage, Sperrzeiten, PI & Sprints, Konfidenzband, Einstellungen, Rollen & Zugriff',
        'Formulartitel wechselt automatisch zwischen "Hinzufügen" und "Bearbeiten"',
      ],
      en: [
        'Unified form design across all pages: label left, field right (two-column)',
        'Applies to: teams, employees, holidays, blocked periods, PI & sprints, confidence band, settings, roles & access',
        'Form title automatically switches between "Add" and "Edit"',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Favicon hinzugefügt (im Browser-Tab sichtbar)',
        'Versionierung eingeführt (Haupt.Neben.Fehlerkorrektur)',
        'Change-Log-Ansicht im Admin-Bereich ergänzt',
      ],
      en: [
        'Added favicon (visible in the browser tab)',
        'Introduced versioning (major.minor.patch)',
        'Added change log view in the admin area',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-08-20',
    changes: {
      de: [
        'Bearbeiten-/Löschen-Icons statt Text in allen Tabellen',
        'Feiertage & Sperrzeiten: Sortierung Z-A, vergangene Einträge grau dargestellt',
        'PI- und Sprint-Namen frei editierbar (Sprint-Position bleibt struktureller Schlüssel)',
        'Rollen & Zugriff: Login-Erstellung (E-Mail + Startpasswort) über sichere Edge Function',
        'Rollen & Zugriff: Passwort-Reset für bestehende Accounts',
        'Rollen & Zugriff: Accounts sperren/entsperren ohne Löschen, inkl. Sperr-Meldung beim Login',
      ],
      en: [
        'Edit/delete icons instead of text in all tables',
        'Holidays & blocked periods: sorted Z-A, past entries greyed out',
        'PI and sprint names freely editable (sprint position stays the structural key)',
        'Roles & access: login creation (email + starting password) via secure Edge Function',
        'Roles & access: password reset for existing accounts',
        'Roles & access: block/unblock accounts without deleting, with block message on login',
      ],
    },
  },
  {
    version: '1.0.1',
    date: '2026-08-20',
    changes: {
      de: [
        'Fehlerbehebung: Login-Seite blieb wegen CSS-Konflikt (hidden-Attribut vs. display:flex) sichtbar',
        'Barrierefreiheit: Label-Zuordnung im Login-Formular korrigiert',
      ],
      en: [
        'Bug fix: login page stayed visible due to a CSS conflict (hidden attribute vs. display:flex)',
        'Accessibility: fixed label association in the login form',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-08-20',
    changes: {
      de: [
        'Erste Version des Admin-Bereichs: Teams, Mitarbeiter, Feiertage, Sperrzeiten, PI & Sprints, Konfidenzband, Einstellungen, Rollen & Zugriff',
        'Login mit Admin-Rollen-Prüfung',
        'Datenimport aus Excel: 4 Teams, 18 Mitarbeiter, Feiertage 2026, PI 2026.1 mit 5 Sprints',
      ],
      en: [
        'First version of the admin area: teams, employees, holidays, blocked periods, PI & sprints, confidence band, settings, roles & access',
        'Login with admin role check',
        'Data import from Excel: 4 teams, 18 employees, 2026 holidays, PI 2026.1 with 5 sprints',
      ],
    },
  },
];
