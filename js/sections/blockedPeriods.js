import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderBlocked(container) {
  container.innerHTML = `
    <header><h1>${t('nav.blocked')}</h1></header>
    <div class="card">
      <form id="bp-form" class="inline-form">
        <div class="field">
          <label>${t('blocked.start')}</label>
          <input type="date" id="f-start" required>
        </div>
        <div class="field">
          <label>${t('blocked.end')}</label>
          <input type="date" id="f-end" required>
        </div>
        <div class="field">
          <label>${t('blocked.label')}</label>
          <input type="text" id="f-label" required>
        </div>
        <div class="field checkbox-field">
          <input type="checkbox" id="f-impact" checked>
          <label>${t('blocked.capacityImpact')}</label>
        </div>
        <button type="submit" class="btn btn-primary">${t('common.add')}</button>
      </form>
      <p class="empty-state" style="padding-top:0">${t('blocked.capacityImpactHint')}</p>
      <table>
        <thead><tr>
          <th>${t('blocked.start')}</th><th>${t('blocked.end')}</th><th>${t('blocked.label')}</th><th>${t('blocked.capacityImpact')}</th><th></th>
        </tr></thead>
        <tbody id="bp-tbody"><tr><td colspan="5" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

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
    const { data, error } = await supabase.from('blocked_periods').select('*').order('start_date');
    if (error) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(bp => `
      <tr data-id="${bp.id}">
        <td class="mono">${bp.start_date}</td>
        <td class="mono">${bp.end_date}</td>
        <td>${escapeHtml(bp.label)}</td>
        <td>${bp.capacity_impact
          ? `<span class="badge badge-danger">ja</span>`
          : `<span class="badge badge-muted">nein</span>`}</td>
        <td class="row-actions"><button class="icon-btn delete-btn">${t('common.delete')}</button></td>
      </tr>
    `).join('');

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
