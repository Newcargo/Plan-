import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderTeams(container) {
  container.innerHTML = `
    <header><h1>${t('nav.teams')}</h1></header>
    <div class="card">
      <form id="team-form" class="inline-form">
        <div class="field">
          <label>${t('teams.name')}</label>
          <input type="text" id="f-name" required>
        </div>
        <div class="field">
          <label>${t('teams.focus')}</label>
          <input type="number" id="f-focus" min="0" max="1" step="0.01" value="0.8" required>
        </div>
        <div class="field">
          <label>${t('teams.buffer')}</label>
          <input type="number" id="f-buffer" min="0" max="1" step="0.01" value="0" required>
        </div>
        <button type="submit" class="btn btn-primary">${t('common.add')}</button>
      </form>
      <table>
        <thead><tr>
          <th>${t('teams.name')}</th>
          <th class="num">${t('teams.focus')}</th>
          <th class="num">${t('teams.buffer')}</th>
          <th></th>
        </tr></thead>
        <tbody id="teams-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  document.getElementById('team-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('f-name').value.trim();
    const focus_factor = document.getElementById('f-focus').value;
    const unplanned_buffer = document.getElementById('f-buffer').value;
    const { error } = await supabase.from('teams').insert({ name, focus_factor, unplanned_buffer });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    document.getElementById('f-focus').value = '0.8';
    document.getElementById('f-buffer').value = '0';
    loadTeams();
  });

  async function loadTeams() {
    const tbody = document.getElementById('teams-tbody');
    const { data, error } = await supabase.from('teams').select('*').order('name');
    if (error) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(team => `
      <tr data-id="${team.id}">
        <td>${escapeHtml(team.name)}</td>
        <td class="num mono">${Number(team.focus_factor).toFixed(2)}</td>
        <td class="num mono">${Number(team.unplanned_buffer).toFixed(2)}</td>
        <td class="row-actions">
          <button class="icon-btn edit-btn">${t('common.edit')}</button>
          <button class="icon-btn delete-btn">${t('common.delete')}</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('teams').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadTeams();
      });
    });

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const team = data.find(t2 => t2.id === row.dataset.id);
        const newFocus = prompt(t('teams.focus'), team.focus_factor);
        if (newFocus === null) return;
        const newBuffer = prompt(t('teams.buffer'), team.unplanned_buffer);
        if (newBuffer === null) return;
        supabase.from('teams').update({ focus_factor: newFocus, unplanned_buffer: newBuffer })
          .eq('id', team.id).then(({ error }) => {
            if (error) { alert(t('common.error') + '\n' + error.message); return; }
            loadTeams();
          });
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  loadTeams();
}
