// Kleine, wiederverwendbare Icons fuer Tabellen-Aktionen. Als Inline-SVG statt Icon-Font,
// damit keine zusaetzliche Abhaengigkeit noetig ist. currentColor uebernimmt die Textfarbe des Buttons.

export const ICON_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;

export const ICON_DELETE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>`;

export const ICON_KEY = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="M21 2l-9.6 9.6"></path><path d="M15.5 7.5l3 3L22 7l-3-3"></path></svg>`;

export const ICON_LOCK = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;

function escapeAttr(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// Info-Icon mit Tooltip. Direkt neben ein Label setzen, um zu erklaeren, was das Feld bewirkt.
// Nutzung: `${fieldLabel(t('teams.name'), 'Erklaerungstext')}` anstelle von `<label>${t('teams.name')}</label>`
export function infoIcon(tooltip) {
  const safe = escapeAttr(tooltip);
  return `<span class="info-icon" tabindex="0" role="button" aria-label="Info: ${safe}">i<span class="tooltip-bubble" role="tooltip">${safe}</span></span>`;
}

export function fieldLabel(text, tooltip) {
  return `<label class="field-label">${text}${tooltip ? infoIcon(tooltip) : ''}</label>`;
}

export function iconButton(icon, label, extraClass = '') {
  return `<button type="button" class="icon-btn ${extraClass}" title="${label}" aria-label="${label}">${icon}</button>`;
}
