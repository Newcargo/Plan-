import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderEmployees(container) {
  container.innerHTML = `
    <header><h1>${t('nav.employees')}</h1></header>
    <div class="card">
      <form id="emp-form" class="inline-form">
        <input type="hidden" id="f-id">
        <div class="field">
          <label>${t('employees.fullName')}</label>
          <input type="text" id="f-name" required>
        </div>
        <div class="field">
          <label>${t('employees.team')}</label>
          <select id="f-team"></select>
        </div>
        <div class="field">
          <label>${t('employees.employmentPct')}</label>
          <input type="number" id="f-pensum" min="0" max="1" step="0.01" value="1.00" required>
        </div>
        <div class="field">
          <label>${t('employees.focusOverride')}</label>
          <input type="number" id="f-focus-override" min="0" max="1" step="0.01" placeholder="${t('employees.focusOverrideHint')}">
        </div>
        <div class="field">
          <label>${t('employees.individualFactor')}</label>
          <input type="number" id="f-indiv-factor" min="0" max="1" step="0.01">
        </div>
        <div class="field">
          <label>${t('employees.individualNote')}</label>
          <input type="text" id="f-indiv-note">
        </div>
        <div class="field checkbox-field">
          <input type="checkbox" id="f-external">
          <label>${t('employees.isExternal')}</label>
        </div>
        <button type="submit" class="btn btn-primary" id="emp-submit-btn">${t('common.add')}</button>
        <button type="button" class="btn btn-secondary" id="emp-cancel-btn" hidden>${t('common.cancel')}</button>
      </form>

      <table>
        <thead><tr>
          <th>${t('employees.fullName')}</th>
          <th>${t('employees.team')}</th>
          <th class="num">${t('employees.employmentPct')}</th>
          <th class="num">${t('employees.effective')}</th>
          <th>${t('employees.hasLogin')}</th>
          <th></th>
        </tr></thead>
        <tbody id="emp-tbody"><tr><td colspan="6" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  let teams = [];
  const teamSelect = document.getElementById('f-team');

  const { data: teamData } = await supabase.from('teams').select('id, name').order('name');
  teams = teamData || [];
  teamSelect.innerHTML = teams.map(tm => `<option value="${tm.id}">${escapeHtml(tm.name)}</option>`).join('');

  const form = document.getElementById('emp-form');
  const cancelBtn = document.getElementById('emp-cancel-btn');
  const submitBtn = document.getElementById('emp-submit-btn');

  cancelBtn.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    document.getElementById('f-id').value = '';
    document.getElementById('f-pensum').value = '1.00';
    submitBtn.textContent = t('common.add');
    cancelBtn.hidden = true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('f-id').value;
    const indivFactor = document.getElementById('f-indiv-factor').value;
    const indivNote = document.getElementById('f-indiv-note').value.trim();

    if (indivFactor && !indivNote) {
      alert(t('employees.individualNote'));
      return;
    }

    const payload = {
      full_name: document.getElementById('f-name').value.trim(),
      team_id: teamSelect.value || null,
      employment_pct: document.getElementById('f-pensum').value,
      focus_factor_override: document.getElementById('f-focus-override').value || null,
      individual_factor: indivFactor || null,
      individual_factor_note: indivFactor ? indivNote : null,
      is_external: document.getElementById('f-external').checked,
    };

    const query = id
      ? supabase.from('employees').update(payload).eq('id', id)
      : supabase.from('employees').insert(payload);

    const { error } = await query;
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    resetForm();
    loadEmployees();
  });

  async function loadEmployees() {
    const tbody = document.getElementById('emp-tbody');
    const { data: emps, error } = await supabase
      .from('employees')
      .select('id, full_name, team_id, employment_pct, focus_factor_override, individual_factor, individual_factor_note, is_external, auth_user_id')
      .order('full_name');

    if (error) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!emps.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('common.none')}</td></tr>`; return; }

    const { data: reductions } = await supabase.from('v_employee_reduction').select('employee_id, effective_reduction_pct');
    const reductionMap = new Map((reductions || []).map(r => [r.employee_id, r.effective_reduction_pct]));
    const teamMap = new Map(teams.map(tm => [tm.id, tm.name]));

    tbody.innerHTML = emps.map(emp => {
      const eff = reductionMap.get(emp.id);
      const effPct = eff !== undefined ? Math.round(Number(eff) * 100) + '%' : '–';
      return `
        <tr data-id="${emp.id}">
          <td>${escapeHtml(emp.full_name)}${emp.is_external ? ` <span class="badge badge-muted">extern</span>` : ''}</td>
          <td>${escapeHtml(teamMap.get(emp.team_id) || '–')}</td>
          <td class="num mono">${Number(emp.employment_pct).toFixed(2)}</td>
          <td class="num mono">${effPct}</td>
          <td>${emp.auth_user_id
            ? `<span class="badge badge-success">${t('employees.hasLogin')}</span>`
            : `<span class="badge badge-muted">${t('employees.noLogin')}</span>`}</td>
          <td class="row-actions">
            <button class="icon-btn edit-btn">${t('common.edit')}</button>
            <button class="icon-btn delete-btn">${t('common.delete')}</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const emp = emps.find(e => e.id === id);
        document.getElementById('f-id').value = emp.id;
        document.getElementById('f-name').value = emp.full_name;
        teamSelect.value = emp.team_id || '';
        document.getElementById('f-pensum').value = emp.employment_pct;
        document.getElementById('f-focus-override').value = emp.focus_factor_override ?? '';
        document.getElementById('f-indiv-factor').value = emp.individual_factor ?? '';
        document.getElementById('f-indiv-note').value = emp.individual_factor_note ?? '';
        document.getElementById('f-external').checked = emp.is_external;
        submitBtn.textContent = t('common.save');
        cancelBtn.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadEmployees();
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  loadEmployees();
}
