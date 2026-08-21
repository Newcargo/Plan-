import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderHolidays(container) {
  container.innerHTML = `
    <header><h1>${t('nav.holidays')}</h1></header>
    <div class="card">
      <form id="hol-form" class="inline-form">
        <div class="field">
          <label>${t('holidays.date')}</label>
          <input type="date" id="f-date" required>
        </div>
        <div class="field">
          <label>${t('holidays.name')}</label>
          <input type="text" id="f-name" required>
        </div>
        <div class="field">
          <label>${t('holidays.note')}</label>
          <input type="text" id="f-note">
        </div>
        <button type="submit" class="btn btn-primary">${t('common.add')}</button>
      </form>
      <table>
        <thead><tr>
          <th>${t('holidays.date')}</th><th>${t('holidays.name')}</th><th>${t('holidays.note')}</th><th></th>
        </tr></thead>
        <tbody id="hol-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

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
    const { data, error } = await supabase.from('holidays').select('*').order('date');
    if (error) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(h => `
      <tr data-id="${h.id}">
        <td class="mono">${h.date}</td>
        <td>${escapeHtml(h.name)}</td>
        <td>${escapeHtml(h.note || '')}</td>
        <td class="row-actions"><button class="icon-btn delete-btn">${t('common.delete')}</button></td>
      </tr>
    `).join('');

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
