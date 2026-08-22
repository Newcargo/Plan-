// Zentrale Versionsverwaltung.
// Schema: MAJOR.MINOR.PATCH
//   MAJOR  -> nur auf ausdruecklichen Wunsch von Andrei erhoehen
//   MINOR  -> neue Funktionen
//   PATCH  -> Fehlerbehebungen / kleine Korrekturen
//
// Bei jeder Aenderung: APP_VERSION anpassen UND einen neuen Eintrag oben in CHANGELOG ergaenzen.

export const APP_VERSION = '1.11.0';

export const CHANGELOG = [
  {
    version: '1.11.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Angemeldeter Name + aktuelle Rolle(n) werden jetzt unten in der Seitenleiste angezeigt, auf jeder Seite sichtbar',
      ],
      en: [
        'Signed-in name + current role(s) are now shown at the bottom of the sidebar, visible on every page',
      ],
    },
  },
  {
    version: '1.10.1',
    date: '2026-08-21',
    changes: {
      de: [
        'Fehlerbehebung: Nicht-Admin-Nutzer sahen alle Navigationspunkte (inkl. Admin-Bereiche) – derselbe CSS-Bug-Typ wie beim allerersten Mal (eigene display-Regel überschrieb das hidden-Attribut), diesmal bei .nav-item statt bei der Login-Seite',
        'Globale CSS-Absicherung ergänzt, die diesen Fehlertyp dauerhaft für alle aktuellen und künftigen Elemente ausschliesst',
        'Fehlerbehebung: Beim Login-Erstellen/Passwort-Reset/E-Mail-Ändern erschien die kryptische Meldung "Edge Function returned a non-2xx status code" statt der eigentlichen Fehlermeldung (z. B. "Nur Admin darf Logins verwalten") – Frontend liest jetzt den echten Fehlertext korrekt aus',
      ],
      en: [
        'Bug fix: non-admin users could see every nav item (including admin areas) – same CSS bug class as the very first one (an element\'s own display rule overrode the hidden attribute), this time on .nav-item instead of the login screen',
        'Added a global CSS safeguard that permanently rules out this bug type for all current and future elements',
        'Bug fix: creating a login / resetting a password / changing an email showed the cryptic "Edge Function returned a non-2xx status code" instead of the actual error (e.g. "Only Admin may manage logins") – the frontend now correctly reads the real error text',
      ],
    },
  },
  {
    version: '1.10.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Neuer Bereich "Genehmigungen" für Stufe-2-Genehmiger, People Pool Manager und Admin',
        'Stufe 2: Anträge genehmigen (mit optionalem Kommentar) oder ablehnen (Kommentar Pflicht)',
        'People Pool Manager: externe, bereits von der Projektleitung genehmigte Anträge als "an RUAG Office gemeldet" markieren',
        'Mitarbeiter-Selbstbestätigung: nach Genehmigung kann intern direkt "Final bestätigen" geklickt werden, extern nach RUAG-Office-Meldung',
        'Externe Kollegen erhalten einen vorausgefüllten Mail-Entwurf an den People Pool Manager (Adresse in Einstellungen konfigurierbar)',
        'Phase 2 von 3 des Urlaubskalenders – Änderungs-/Stornoprozess für bereits final gebuchte Tage folgt als Phase 3',
      ],
      en: [
        'New "Approvals" area for level-2 approvers, the People Pool Manager, and Admin',
        'Level 2: approve requests (optional comment) or reject them (comment required)',
        'People Pool Manager: mark external requests already approved by the project lead as "forwarded to RUAG Office"',
        'Employee self-confirmation: internal staff can confirm "final" directly after approval, external staff after the RUAG Office step',
        'External colleagues get a pre-filled email draft to the People Pool Manager (address configurable in settings)',
        'Phase 2 of 3 for the leave calendar – the change/cancellation process for already final-booked days is Phase 3',
      ],
    },
  },
  {
    version: '1.9.1',
    date: '2026-08-21',
    changes: {
      de: [
        'Fehlerbehebung: Urlaubsantrag stellen scheiterte an einer Fremdschlüssel-Verletzung ("leave_status_history_changed_by_fkey")',
        'Ursache: Der Statusänderungs-Trigger nutzte noch die alte Login-ID (auth.uid()) statt der employees-ID – Datenbank-only-Fix, kein Datei-Update nötig',
      ],
      en: [
        'Bug fix: submitting a leave request failed with a foreign key violation ("leave_status_history_changed_by_fkey")',
        'Cause: the status-change trigger still used the old login ID (auth.uid()) instead of the employees ID – database-only fix, no file update needed',
      ],
    },
  },
  {
    version: '1.9.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Neuer Bereich "Mein Urlaub" für alle Kollegen mit App-Zugang (nicht mehr nur Admin)',
        'Login öffnet sich jetzt für jeden nicht gesperrten Mitarbeiter; Navigation passt sich automatisch an die Rolle an',
        'Urlaubsantrag stellen (Start-/Enddatum), mit Warnhinweis bei Überschneidung mit Sperrzeiten und Info bei enthaltenen Feiertagen',
        'Eigene Anträge mit Status-Badge und Kommentar einsehen; Anträge im Status "Beantragt" selbst zurückziehen',
        'Phase 1 von 2 des Urlaubskalenders – Genehmigungs-Workflow (Stufe 2) folgt als nächstes',
      ],
      en: [
        'New "My Leave" area for every colleague with app access (no longer admin-only)',
        'Login now opens for any non-blocked employee; navigation adapts automatically to the role',
        'Submit a leave request (start/end date), with a warning when overlapping blocked periods and info on included holidays',
        'View own requests with status badge and comment; withdraw requests still in "Requested" status',
        'Phase 1 of 2 for the leave calendar – the approval workflow (level 2) is next',
      ],
    },
  },
  {
    version: '1.8.1',
    date: '2026-08-21',
    changes: {
      de: [
        'Kritische Fehlerbehebung: Ein falsch escapter Apostroph in einem Changelog-Text (js/version.js) verursachte einen JavaScript-Syntaxfehler, der den Start der gesamten App verhinderte',
        'Alle Dateien nochmals als echte ES-Module getestet, um ähnliche Fehler auszuschliessen',
      ],
      en: [
        'Critical bug fix: an incorrectly escaped apostrophe in a changelog text (js/version.js) caused a JavaScript syntax error that prevented the entire app from starting',
        'Re-tested all files as real ES modules to rule out similar issues',
      ],
    },
  },
  {
    version: '1.8.0',
    date: '2026-08-21',
    changes: {
      de: [
        'Angezeigte Daten in allen Listen zeigen jetzt Wochentag + Datum, z. B. "Fr 21.08.2026" (Feiertage, Sperrzeiten, PI & Sprints)',
        'Wochentag-Kürzel passt sich der gewählten Sprache an (DE/EN)',
        'Betrifft nur die Anzeige in Tabellen – Datums-Eingabefelder (Kalender-Picker) folgen weiterhin dem Browser-Format',
      ],
      en: [
        'Displayed dates in all lists now show weekday + date, e.g. "Fr 21.08.2026" (holidays, blocked periods, PI & sprints)',
        'Weekday abbreviation follows the selected language (DE/EN)',
        'Only affects table display – date input fields (calendar pickers) still follow the browser\'s own format',
      ],
    },
  },
  {
    version: '1.7.1',
    date: '2026-08-21',
    changes: {
      de: [
        'Fehlerbehebung: Sprints blieben dauerhaft bei "Lädt..." hängen (PI-Umbenennen/-Löschen-Buttons wurden mit falschem Selektor gesucht, Skript brach vorzeitig ab)',
        'Seitentitel "PI & Sprints" (vorher englisch "Program Increments & Sprints") konsistent mit der Navigation',
      ],
      en: [
        'Bug fix: sprints stayed stuck on "Loading..." forever (PI rename/delete buttons were queried with the wrong selector, causing the script to abort early)',
        'Page title "PI & Sprints" (previously English) now consistent with the navigation label',
      ],
    },
  },
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
