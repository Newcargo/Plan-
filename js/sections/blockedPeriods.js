import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_DELETE, iconButton, fieldLabel } from '../icons.js';
import { createSortState, sortableHeader, wireSortHeaders, sortArray } from '../sortable.js';
import { formatDate } from '../dateFormat.js';

export async function renderBlocked(container) {
  const sortState = createSortState('start_date', false);
  let bpData = [];

  container.innerHTML = `
    <header><h1>${t('nav.blocked')}</h1></header>
    <div class="card">
      <div class="form-panel-title">${t('common.add')}</div>
      <form id="bp-form">
        <div class="form-grid">
          <label>${t('blocked.start')}</label>
          <input type="date" id="f-start" required class="narrow">

          <label>${t('blocked.end')}</label>
          <input type="date" id="f-end" required class="narrow">

          ${fieldLabel(t('blocked.label'), 'Grund der Sperrzeit, z. B. "Betriebsferien" oder "Wartungsfenster".')}
          <input type="text" id="f-label" required>

          ${fieldLabel(t('blocked.capacityImpact'), 'Aktiv: wirkt wie eine Firmenschliessung und wird von der verfügbaren Kapazität abgezogen. Inaktiv: dient nur als Genehmigungshinweis im Urlaubskalender, ohne die Kapazität zu verändern.')}
          <input type="checkbox" id="f-impact" checked>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${t('common.add')}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <table>
        <thead><tr id="bp-thead-row"></tr></thead>
        <tbody id="bp-tbody"><tr><td colspan="5" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  function wireHead() {
    const row = document.getElementById('bp-thead-row');
    row.innerHTML = `
      ${sortableHeader(t('blocked.start'), 'start_date', sortState)}
      ${sortableHeader(t('blocked.end'), 'end_date', sortState)}
      ${sortableHeader(t('blocked.label'), 'label', sortState)}
      <th>${t('blocked.capacityImpact')}</th><th></th>
    `;
    wireSortHeaders(row, sortState, () => { renderRows(); wireHead(); });
  }
  wireHead();

  document.getElementById('bp-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      start_date: document.getElementById('f-start').value,
      end_date: document.getElementById('f-end').value,
      label: document.getElementById('f-label').value.trim(),
      capacity_impact: document.getElementById('f-impact').checked,
    };
    const { error } = await supabase.from('blocked_periods').insert(payload);
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    document.getElementById('f-impact').checked = true;
    load();
  });

  async function load() {
    const tbody = document.getElementById('bp-tbody');
    const { data, error } = await supabase.from('blocked_periods').select('*');
    if (error) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.error')}</td></tr>`; return; }
    bpData = data || [];
    renderRows();
  }

  function renderRows() {
    const tbody = document.getElementById('bp-tbody');
    if (!bpData.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.none')}</td></tr>`; return; }

    sortArray(bpData, sortState);
    const today = new Date().toISOString().slice(0, 10);

    tbody.innerHTML = bpData.map(bp => {
      const isPast = bp.end_date < today;
      return `
        <tr data-id="${bp.id}" class="${isPast ? 'row-past' : ''}">
          <td class="mono">${formatDate(bp.start_date)}</td>
          <td class="mono">${formatDate(bp.end_date)}</td>
          <td>${escapeHtml(bp.label)}</td>
          <td>${bp.capacity_impact
            ? `<span class="badge badge-danger">ja</span>`
            : `<span class="badge badge-muted">nein</span>`}</td>
          <td class="row-actions">${iconButton(ICON_DELETE, t('common.delete'), 'delete-btn')}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('blocked_periods').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        load();
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  load();
}
