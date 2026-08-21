// Zentrale Definition aller Rollen: Beschreibung + welche anderen Rollen eine Rolle "beinhaltet".
// Einzige Stelle, die bei Rollen-Änderungen angepasst werden muss - Tooltip und die ausführliche
// Beschreibung auf der Rollen & Zugriff-Seite lesen beide von hier.

export const ROLE_DEFINITIONS = {
  mitarbeiter: {
    label: 'Mitarbeiter',
    description: 'Kann eigene Urlaubsanträge stellen, den Genehmigungsstatus verfolgen und bei bereits final gebuchten Tagen eine Änderung beantragen.',
    includes: [],
  },
  stufe2_genehmiger: {
    label: 'Stufe-2-Genehmiger',
    description: 'Kann Urlaubsanträge aller Mitarbeiter einsehen sowie genehmigen oder ablehnen (Stufe 2 des Workflows), inkl. Kommentar an den Antragsteller.',
    includes: [],
  },
  people_pool_manager: {
    label: 'People Pool Manager',
    description: 'Wird informiert, sobald ein externer Kollege ohne Fiori-SAP-Zugang die Genehmigung der Projektleitung erhalten hat, und markiert den Status als an RUAG Office gemeldet.',
    includes: [],
  },
  admin: {
    label: 'Admin',
    description: 'Voller Zugriff auf alle Stammdaten (Teams, Mitarbeiter, Feiertage, Sperrzeiten, PI & Sprints, Konfidenzband, Einstellungen) sowie auf die Rollen- und Zugriffsverwaltung selbst.',
    includes: ['mitarbeiter', 'stufe2_genehmiger', 'people_pool_manager'],
  },
};

export const ALL_ROLE_KEYS = ['mitarbeiter', 'stufe2_genehmiger', 'people_pool_manager', 'admin'];

// Loest "includes" transitiv auf (falls kuenftig verschachtelte Rollen entstehen) und gibt
// eine deduplizierte Liste der eingeschlossenen Rollen-Labels zurueck.
export function getIncludedLabels(roleKey) {
  const seen = new Set();
  function walk(key) {
    const def = ROLE_DEFINITIONS[key];
    if (!def) return;
    (def.includes || []).forEach(inc => {
      if (!seen.has(inc)) {
        seen.add(inc);
        walk(inc);
      }
    });
  }
  walk(roleKey);
  return [...seen].map(key => ROLE_DEFINITIONS[key]?.label || key);
}
