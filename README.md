Urlaub & Kapazität – Admin Dashboard
Erste Ausbaustufe der App: Admin-Bereich für Stammdaten (Teams, Mitarbeiter, Feiertage,
Sperrzeiten, PI/Sprints, Konfidenzband, Einstellungen, Rollen). Punkt 1 (Mitarbeiter-Kalender)
und Punkt 2 (Kapazitäts-Dashboard für alle) folgen als nächste Ausbaustufe.
1. Auf GitHub Pages veröffentlichen
Neues GitHub-Repo erstellen (z. B. `urlaub-kapazitaet-app`).
Inhalt dieses Ordners (`admin/`, `README.md`) in das Repo pushen.
In den Repo-Einstellungen: Settings → Pages → Source: Deploy from branch,
Branch `main`, Ordner `/ (root)`.
Nach ein paar Minuten ist die App erreichbar unter
`https://<dein-username>.github.io/urlaub-kapazitaet-app/admin/`.
Kein Build-Schritt nötig – reines HTML/CSS/JS mit ES-Modulen, direkt aus dem Browser lauffähig.
2. Ersten Admin-Zugang einrichten (einmalig)
Die App kann Accounts nicht selbst erstellen (bewusst so, damit nur ihr als Admin Zugänge vergebt).
Für den allerersten Admin-Zugang:
Im Supabase-Dashboard →
Authentication → Users → Add user → E-Mail + Passwort setzen (z. B. deine RUAG-Adresse).
Im Supabase-Dashboard → SQL Editor → folgendes ausführen, mit deinem eigenen Namen/E-Mail:
```sql
   -- Mitarbeiter-Stammdatensatz für dich anlegen (falls noch nicht vorhanden)
   insert into employees (full_name, email, auth_user_id)
   select 'Andrei Sicoe', 'DEINE-EMAIL@ruag.ch', id
   from auth.users where email = 'DEINE-EMAIL@ruag.ch';

   -- Admin-Rolle zuweisen
   insert into user_roles (user_id, role)
   select id, 'admin' from employees where email = 'DEINE-EMAIL@ruag.ch';
   ```
Danach in der App unter js/config.js einloggen mit genau dieser E-Mail/Passwort.
Für alle weiteren Kollegen läuft das komfortabler: Account im Supabase-Dashboard anlegen,
dann in der App unter Mitarbeiter den Datensatz bearbeiten – das Verknüpfen mit dem Login
holen wir in der nächsten Ausbaustufe direkt ins Interface (aktuell noch ein manueller
SQL-Schritt, analog zu oben, mit der jeweiligen employee_id).
3. Projektstruktur
```
admin/
  index.html              Login + App-Shell
  css/styles.css           Design-Tokens & Layout
  js/config.js              Supabase-URL/Key
  js/supabaseClient.js       Supabase-Client
  js/i18n.js                  DE/EN-Wörterbuch
  js/auth.js                   Login/Logout/Admin-Check
  js/main.js                    Router & Navigation
  js/sections/
    dashboard.js                 Kapazitäts-Übersicht
    teams.js                      Teams-Verwaltung
    employees.js                   Mitarbeiter-Verwaltung
    holidays.js                     Feiertage
    blockedPeriods.js                Sperrzeiten
    sprints.js                        PI & Sprints
    confidenceBands.js                 Konfidenzband
    settings.js                         Rolling-Fenster etc.
    roles.js                             Rollen-Zuweisung
```
4. Datenbank
Supabase-Projekt: `Urlaub-Kapazitaet-Duebendorf` (eu-central-1, Free-Tier, CHF 0/Monat).
15 Tabellen, RLS überall aktiv. Bereits importiert: 4 Teams, 18 Mitarbeiter, 12 Feiertage 2026,
PI 2026.1 mit 5 Sprints (aus deinem Excel übernommen).
5. Nächste Schritte (noch nicht gebaut)
Mitarbeiter-Kalender mit Statusmaschine (Gelb/Blau/Rot/Grün), mailto-Integration für
externe Kollegen
Team-Kapazitäts-Dashboard für alle (SP/PT-Prognose, Konfidenzband-Anzeige)
In-App-Benachrichtigungen (Tabelle existiert bereits, UI fehlt noch)
