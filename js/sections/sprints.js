import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderSprints(container) {
  container.innerHTML = `
    <header><h1>${t('sprints.title')}</h1></header>

    <div class="card">
      <form id="pi-form" class="inline-form">
        <div class="field">
          <label>${t('sprints.piName')}</label>
          <input type="text" id="f-pi-name" placeholder="PI 2026.2" required>
        </div>
        <button type="submit" class="btn btn-primary">${t('sprints.addPi')}</button>
      </form>

      <div class="field">
        <label>${t('sprints.piName')}</label>
        <select id="pi-select"></select>
      </div>
    </div>

    <div class="card">
      <form id="sprint-form" class="inline-form">
        <div class="field">
          <label>${t('sprints.sprintNr')}</label>
          <input type="number" id="f-sprint-nr" min="1" required>
        </div>
        <div class="field">
          <label>${t('sprints.start')}</label>
          <input type="date" id="f-sprint-start" required>
        </div>
        <div class="field">
          <label>${t('sprints.end')}</label>
          <input type="date" id="f-sprint-end" required>
        </div>
        <button type="submit" class="btn btn-primary">${t('sprints.addSprint')}</button>
      </form>
      <table>
        <thead><tr>
          <th>${t('sprints.sprintNr')}</th><th>${t('sprints.start')}</th><th>${t('sprints.end')}</th><th>${t('sprints.closed')}</th><th></th>
        </tr></thead>
        <tbody id="sprint-tbody"><tr><td colspan="5" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  const piSelect = document.getElementById('pi-select');

  document.getElementById('pi-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('f-pi-name').value.trim();
    const { error } = await supabase.from('program_increments').insert({ name });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    await loadPis(name);
  });

  piSelect.addEventListener('change', loadSprints);

  document.getElementById('sprint-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!piSelect.value) return;
    const payload = {
      pi_id: piSelect.value,
      sprint_number: document.getElementById('f-sprint-nr').value,
      start_date: document.getElementById('f-sprint-start').value,
      end_date: document.getElementById('f-sprint-end').value,
    };
    const { error } = await supabase.from('sprints').insert(payload);
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    loadSprints();
  });

  async function loadPis(selectName) {
    const { data, error } = await supabase.from('program_increments').select('*').order('created_at', { ascending: false });
    if (error || !data) return;
    piSelect.innerHTML = data.map(pi => `<option value="${pi.id}">${escapeHtml(pi.name)}</option>`).join('');
    if (selectName) {
      const match = data.find(pi => pi.name === selectName);
      if (match) piSelect.value = match.id;
    }
    loadSprints();
  }

  async function loadSprints() {
    const tbody = document.getElementById('sprint-tbody');
    if (!piSelect.value) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.none')}</td></tr>`; return; }

    const { data, error } = await supabase.from('sprints').select('*').eq('pi_id', piSelect.value).order('sprint_number');
    if (error) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(s => `
      <tr data-id="${s.id}">
        <td class="mono">${s.sprint_number}</td>
        <td class="mono">${s.start_date}</td>
        <td class="mono">${s.end_date}</td>
        <td><input type="checkbox" class="closed-toggle" ${s.is_closed ? 'checked' : ''}></td>
        <td class="row-actions"><button class="icon-btn delete-btn">${t('common.delete')}</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.closed-toggle').forEach(cb => {
      cb.addEventListener('change', async () => {
        const id = cb.closest('tr').dataset.id;
        const { error } = await supabase.from('sprints').update({ is_closed: cb.checked }).eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = !cb.checked; }
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('sprints').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadSprints();
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  loadPis();
}
