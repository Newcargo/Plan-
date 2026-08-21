import { t, getLang } from '../i18n.js';
import { CHANGELOG } from '../version.js';

export async function renderChangelog(container) {
  const lang = getLang();

  container.innerHTML = `
    <header><h1>${t('changelog.title')}</h1></header>
    <div class="card">
      ${CHANGELOG.map((entry, idx) => `
        <div class="changelog-entry">
          <div class="changelog-head">
            <span class="badge ${idx === 0 ? 'badge-success' : 'badge-muted'} mono">v${entry.version}</span>
            <span class="changelog-date mono">${entry.date}</span>
          </div>
          <ul>
            ${(entry.changes[lang] || entry.changes.de).map(c => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
