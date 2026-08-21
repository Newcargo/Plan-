import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_DELETE, iconButton, fieldLabel } from '../icons.js';
import { createSortState, sortableHeader, wireSortHeaders, sortArray } from '../sortable.js';
import { formatDate } from '../dateFormat.js';

export async function renderHolidays(container) {
  // Standard: Datum Z-A (neueste/zukuenftigste zuerst), per Klick auf Spaltenkopf umschaltbar
  const sortState = createSortState('date', false);
  let holidaysData = [];

  container.innerHTML = `
    <header><h1>${t('nav.holidays')}</h1></header>
    <div class="card">
      <div class="form-panel-title">${t('common.add')}</div>
      <form id="hol-form">
        <div class="form-grid">
          ${fieldLabel(t('holidays.date'), 'Datum des Feiertags. Wird bei der Kapazitätsberechnung automatisch als Nicht-Arbeitstag berücksichtigt.')}
          <input type="date" id="f-date" required class="narrow">

          <label>${t('holidays.name')}</label>
          <input type="text" id="f-name" required>

          ${fieldLabel(t('holidays.note'), 'Optionale Zusatzinfo, z. B. "Fällt auf einen Samstag".')}
          <input type="text" id="f-note">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${t('common.add')}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <table>
        <thead><tr id="hol-thead-row"></tr></thead>
        <tbody id="hol-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  function wireHead() {
    const row = document.getElementById('hol-thead-row');
    row.innerHTML = `
      ${sortableHeader(t('holidays.date'), 'date', sortState)}
      ${sortableHeader(t('holidays.name'), 'name', sortState)}
      <th>${t('holidays.note')}</th><th></th>
    `;
    wireSortHeaders(row, sortState, () => { renderRows(); wireHead(); });
  }
  wireHead();

  document.getElementById('hol-form').addEventListener('submit', async e => {
    e.preventDefault();
    const date = document.getElementById('f-date').value;
    const name = document.getElementById('f-name').value.trim();
    const note = document.getElementById('f-note').value.trim() || null;
    const { error } = await supabase.from('holidays').insert({ date, name, note });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    load();
  });

  async function load() {
    const tbody = document.getElementById('hol-tbody');
    const { data, error } = await supabase.from('holidays').select('*');
    if (error) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`; return; }
    holidaysData = data || [];
    renderRows();
  }

  function renderRows() {
    const tbody = document.getElementById('hol-tbody');
    if (!holidaysData.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    sortArray(holidaysData, sortState);
    const today = new Date().toISOString().slice(0, 10);

    tbody.innerHTML = holidaysData.map(h => {
      const isPast = h.date < today;
      return `
        <tr data-id="${h.id}" class="${isPast ? 'row-past' : ''}">
          <td class="mono">${formatDate(h.date)}</td>
          <td>${escapeHtml(h.name)}</td>
          <td>${escapeHtml(h.note || '')}</td>
          <td class="row-actions">${iconButton(ICON_DELETE, t('common.delete'), 'delete-btn')}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('holidays').delete().eq('id', id);
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
