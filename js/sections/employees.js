import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_EDIT, ICON_DELETE, iconButton, fieldLabel } from '../icons.js';
import { createSortState, sortableHeader, wireSortHeaders, sortArray } from '../sortable.js';

export async function renderEmployees(container) {
  const sortState = createSortState('full_name', true);
  container.innerHTML = `
    <header><h1>${t('nav.employees')}</h1></header>
    <div class="card">
      <div class="form-panel-title" id="emp-form-title">${t('common.add')}</div>
      <form id="emp-form">
        <input type="hidden" id="f-id">
        <div class="form-grid">
          <label>${t('employees.fullName')}</label>
          <input type="text" id="f-name" required>

          ${fieldLabel(t('employees.team'), 'Team-Zuordnung bestimmt den Standard-Fokusfaktor und Team-Puffer für die Kapazitätsberechnung dieser Person.')}
          <select id="f-team"></select>

          ${fieldLabel(t('employees.jobDescription'), 'Funktionsbezeichnung, wird unter Einstellungen als Liste verwaltet.')}
          <select id="f-jobdesc"><option value="">–</option></select>

          ${fieldLabel(t('employees.employmentPct'), 'Beschäftigungsgrad (0–1), z. B. 0.8 für 80%. Fliesst direkt in die Kapazitätsberechnung ein.')}
          <input type="number" id="f-pensum" min="0" max="1" step="0.01" value="1.00" required class="narrow">

          <div class="divider"></div>

          ${fieldLabel(t('employees.focusOverride'), 'Überschreibt den Team-Fokusfaktor nur für diese Person. Leer lassen, um den Team-Standard zu verwenden.')}
          <input type="number" id="f-focus-override" min="0" max="1" step="0.01">

          ${fieldLabel(t('employees.individualFactor'), 'Zusätzlicher persönlicher Reduktionsfaktor (0–1), z. B. bei Sonderaufgaben. Multipliziert sich mit dem Fokusfaktor.')}
          <input type="number" id="f-indiv-factor" min="0" max="1" step="0.01">

          ${fieldLabel(t('employees.individualNote'), 'Pflichtfeld, sobald ein individueller Zusatzfaktor gesetzt ist – dokumentiert nachvollziehbar, warum.')}
          <input type="text" id="f-indiv-note">

          <div class="divider"></div>

          ${fieldLabel(t('employees.isExternal'), 'Mitarbeiter ohne Fiori-SAP-Zugang. Ihr Urlaub-Genehmigungsprozess läuft über den People Pool Manager statt über Fiori-SAP.')}
          <input type="checkbox" id="f-external">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="emp-cancel-btn" hidden>${t('common.cancel')}</button>
          <button type="submit" class="btn btn-primary" id="emp-submit-btn">${t('common.add')}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <table>
        <thead><tr id="emp-thead-row">
          ${sortableHeader(t('employees.fullName'), 'full_name', sortState)}
          ${sortableHeader(t('employees.team'), 'team_name', sortState)}
          <th>${t('employees.jobDescription')}</th>
          <th class="num">${t('employees.employmentPct')}</th>
          <th class="num">${t('employees.effective')}</th>
          <th>${t('employees.hasLogin')}</th>
          <th></th>
        </tr></thead>
        <tbody id="emp-tbody"><tr><td colspan="7" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  let teams = [];
  const teamSelect = document.getElementById('f-team');
  const jobDescSelect = document.getElementById('f-jobdesc');

  const { data: teamData } = await supabase.from('teams').select('id, name').order('name');
  teams = teamData || [];
  teamSelect.innerHTML = teams.map(tm => `<option value="${tm.id}">${escapeHtml(tm.name)}</option>`).join('');

  const { data: jdData } = await supabase.from('job_descriptions').select('id, name').order('name');
  const jobDescriptions = jdData || [];
  jobDescSelect.innerHTML = '<option value="">–</option>' + jobDescriptions.map(jd => `<option value="${jd.id}">${escapeHtml(jd.name)}</option>`).join('');

  const form = document.getElementById('emp-form');
  const cancelBtn = document.getElementById('emp-cancel-btn');
  const submitBtn = document.getElementById('emp-submit-btn');

  cancelBtn.addEventListener('click', resetForm);

  function resetForm() {
    form.reset();
    document.getElementById('f-id').value = '';
    document.getElementById('f-pensum').value = '1.00';
    submitBtn.textContent = t('common.add');
    document.getElementById('emp-form-title').textContent = t('common.add');
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
      job_description_id: jobDescSelect.value || null,
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

  let empsData = [];
  let reductionMap = new Map();
  const teamMap = new Map(teams.map(tm => [tm.id, tm.name]));
  const jobDescMap = new Map(jobDescriptions.map(jd => [jd.id, jd.name]));

  function wireHead() {
    const row = document.getElementById('emp-thead-row');
    row.innerHTML = `
      ${sortableHeader(t('employees.fullName'), 'full_name', sortState)}
      ${sortableHeader(t('employees.team'), 'team_name', sortState)}
      <th>${t('employees.jobDescription')}</th>
      <th class="num">${t('employees.employmentPct')}</th>
      <th class="num">${t('employees.effective')}</th>
      <th>${t('employees.hasLogin')}</th>
      <th></th>
    `;
    wireSortHeaders(row, sortState, () => { renderRows(); wireHead(); });
  }
  wireHead();

  async function loadEmployees() {
    const tbody = document.getElementById('emp-tbody');
    const { data: emps, error } = await supabase
      .from('employees')
      .select('id, full_name, team_id, job_description_id, employment_pct, focus_factor_override, individual_factor, individual_factor_note, is_external, auth_user_id');

    if (error) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('common.error')}</td></tr>`; return; }

    const { data: reductions } = await supabase.from('v_employee_reduction').select('employee_id, effective_reduction_pct');
    reductionMap = new Map((reductions || []).map(r => [r.employee_id, r.effective_reduction_pct]));

    empsData = (emps || []).map(emp => ({ ...emp, team_name: teamMap.get(emp.team_id) || '' }));
    renderRows();
  }

  function renderRows() {
    const tbody = document.getElementById('emp-tbody');
    if (!empsData.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('common.none')}</td></tr>`; return; }

    sortArray(empsData, sortState);

    tbody.innerHTML = empsData.map(emp => {
      const eff = reductionMap.get(emp.id);
      const effPct = eff !== undefined ? Math.round(Number(eff) * 100) + '%' : '–';
      return `
        <tr data-id="${emp.id}">
          <td>${escapeHtml(emp.full_name)}${emp.is_external ? ` <span class="badge badge-muted">extern</span>` : ''}</td>
          <td>${escapeHtml(emp.team_name || '–')}</td>
          <td>${escapeHtml(jobDescMap.get(emp.job_description_id) || '–')}</td>
          <td class="num mono">${Number(emp.employment_pct).toFixed(2)}</td>
          <td class="num mono">${effPct}</td>
          <td>${emp.auth_user_id
            ? `<span class="badge badge-success">${t('employees.hasLogin')}</span>`
            : `<span class="badge badge-muted">${t('employees.noLogin')}</span>`}</td>
          <td class="row-actions">
            ${iconButton(ICON_EDIT, t('common.edit'), 'edit-btn')}
            ${iconButton(ICON_DELETE, t('common.delete'), 'delete-btn')}
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('tr').dataset.id;
        const emp = empsData.find(e => e.id === id);
        document.getElementById('f-id').value = emp.id;
        document.getElementById('f-name').value = emp.full_name;
        teamSelect.value = emp.team_id || '';
        jobDescSelect.value = emp.job_description_id || '';
        document.getElementById('f-pensum').value = emp.employment_pct;
        document.getElementById('f-focus-override').value = emp.focus_factor_override ?? '';
        document.getElementById('f-indiv-factor').value = emp.individual_factor ?? '';
        document.getElementById('f-indiv-note').value = emp.individual_factor_note ?? '';
        document.getElementById('f-external').checked = emp.is_external;
        submitBtn.textContent = t('common.save');
        document.getElementById('emp-form-title').textContent = t('common.edit');
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
