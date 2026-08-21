import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_EDIT, ICON_DELETE, iconButton } from '../icons.js';

export async function renderSprints(container) {
  container.innerHTML = `
    <header><h1>${t('sprints.title')}</h1></header>

    <div class="card">
      <div class="form-panel-title">${t('sprints.addPi')}</div>
      <form id="pi-form">
        <div class="form-grid">
          <label>${t('sprints.piName')}</label>
          <input type="text" id="f-pi-name" placeholder="PI 2026.2" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${t('sprints.addPi')}</button>
        </div>
      </form>

      <div class="form-grid" style="margin-top:0.5rem;">
        <label>${t('sprints.piName')}</label>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <select id="pi-select" style="flex:1;"></select>
          ${iconButton(ICON_EDIT, t('common.edit'), 'pi-rename-btn')}
          ${iconButton(ICON_DELETE, t('common.delete'), 'pi-delete-btn')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="form-panel-title" id="sprint-form-title">${t('sprints.addSprint')}</div>
      <form id="sprint-form">
        <input type="hidden" id="f-sprint-id">
        <div class="form-grid">
          <label>${t('sprints.sprintNr')}</label>
          <input type="number" id="f-sprint-nr" min="1" required class="narrow">

          <label>${t('common.name')}</label>
          <input type="text" id="f-sprint-name" placeholder="Sprint 1">

          <label>${t('sprints.start')}</label>
          <input type="date" id="f-sprint-start" required class="narrow">

          <label>${t('sprints.end')}</label>
          <input type="date" id="f-sprint-end" required class="narrow">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="sprint-cancel-btn" hidden>${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary" id="sprint-submit-btn">${t('sprints.addSprint')}</button>
        </div>
      </form>
      <table>
        <thead><tr>
          <th>${t('sprints.sprintNr')}</th><th>${t('common.name')}</th><th>${t('sprints.start')}</th><th>${t('sprints.end')}</th><th>${t('sprints.closed')}</th><th></th>
        </tr></thead>
        <tbody id="sprint-tbody"><tr><td colspan="6" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  const piSelect = document.getElementById('pi-select');
  const sprintForm = document.getElementById('sprint-form');
  const submitBtn = document.getElementById('sprint-submit-btn');
  const cancelBtn = document.getElementById('sprint-cancel-btn');

  document.getElementById('pi-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('f-pi-name').value.trim();
    const { error } = await supabase.from('program_increments').insert({ name });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    await loadPis(name);
  });

  document.getElementById('pi-rename-btn').addEventListener('click', async () => {
    if (!piSelect.value) return;
    const current = piSelect.options[piSelect.selectedIndex].textContent;
    const newName = prompt(t('sprints.piName'), current);
    if (newName === null || !newName.trim()) return;
    // name traegt einen unique-Constraint, aber ist an keiner Stelle als Fremdschluessel genutzt -
    // umbenennen ist jederzeit gefahrlos moeglich.
    const { error } = await supabase.from('program_increments').update({ name: newName.trim() }).eq('id', piSelect.value);
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    await loadPis(newName.trim());
  });

  document.getElementById('pi-delete-btn').addEventListener('click', async () => {
    if (!piSelect.value) return;
    if (!confirm(t('common.confirmDelete'))) return;
    const { error } = await supabase.from('program_increments').delete().eq('id', piSelect.value);
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    await loadPis();
  });

  piSelect.addEventListener('change', loadSprints);
  cancelBtn.addEventListener('click', resetSprintForm);

  function resetSprintForm() {
    sprintForm.reset();
    document.getElementById('f-sprint-id').value = '';
    submitBtn.textContent = t('sprints.addSprint');
    document.getElementById('sprint-form-title').textContent = t('sprints.addSprint');
    cancelBtn.hidden = true;
  }

  sprintForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!piSelect.value) return;
    const id = document.getElementById('f-sprint-id').value;
    const payload = {
      pi_id: piSelect.value,
      sprint_number: document.getElementById('f-sprint-nr').value,
      name: document.getElementById('f-sprint-name').value.trim() || null,
      start_date: document.getElementById('f-sprint-start').value,
      end_date: document.getElementById('f-sprint-end').value,
    };
    const query = id
      ? supabase.from('sprints').update(payload).eq('id', id)
      : supabase.from('sprints').insert(payload);
    const { error } = await query;
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    resetSprintForm();
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
    resetSprintForm();
    const tbody = document.getElementById('sprint-tbody');
    if (!piSelect.value) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('common.none')}</td></tr>`; return; }

    const { data, error } = await supabase.from('sprints').select('*').eq('pi_id', piSelect.value).order('sprint_number');
    if (error) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(s => `
      <tr data-id="${s.id}">
        <td class="mono">${s.sprint_number}</td>
        <td>${escapeHtml(s.name || '')}</td>
        <td class="mono">${s.start_date}</td>
        <td class="mono">${s.end_date}</td>
        <td><input type="checkbox" class="closed-toggle" ${s.is_closed ? 'checked' : ''}></td>
        <td class="row-actions">
          ${iconButton(ICON_EDIT, t('common.edit'), 'edit-btn')}
          ${iconButton(ICON_DELETE, t('common.delete'), 'delete-btn')}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.closed-toggle').forEach(cb => {
      cb.addEventListener('change', async () => {
        const id = cb.closest('tr').dataset.id;
        const { error } = await supabase.from('sprints').update({ is_closed: cb.checked }).eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = !cb.checked; }
      });
    });

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const s = data.find(x => x.id === id);
        document.getElementById('f-sprint-id').value = s.id;
        document.getElementById('f-sprint-nr').value = s.sprint_number;
        document.getElementById('f-sprint-name').value = s.name || '';
        document.getElementById('f-sprint-start').value = s.start_date;
        document.getElementById('f-sprint-end').value = s.end_date;
        submitBtn.textContent = t('common.save');
        document.getElementById('sprint-form-title').textContent = t('common.edit');
        cancelBtn.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
