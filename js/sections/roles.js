import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

const ALL_ROLES = ['mitarbeiter', 'stufe2_genehmiger', 'people_pool_manager', 'admin'];

export async function renderRoles(container) {
  container.innerHTML = `
    <header>
      <h1>${t('roles.title')}</h1>
      <p>${t('roles.subtitle')}</p>
    </header>
    <div class="card">
      <table>
        <thead><tr>
          <th>${t('employees.fullName')}</th>
          <th>${t('employees.hasLogin')}</th>
          ${ALL_ROLES.map(r => `<th>${t('roles.' + r)}</th>`).join('')}
        </tr></thead>
        <tbody id="roles-tbody"><tr><td colspan="${2 + ALL_ROLES.length}" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  async function load() {
    const tbody = document.getElementById('roles-tbody');
    const { data: emps, error: empErr } = await supabase
      .from('employees').select('id, full_name, auth_user_id').order('full_name');
    const { data: roleRows, error: roleErr } = await supabase
      .from('user_roles').select('user_id, role');

    if (empErr || roleErr) {
      tbody.innerHTML = `<tr><td colspan="${2 + ALL_ROLES.length}" class="empty-state">${t('common.error')}</td></tr>`;
      return;
    }
    if (!emps.length) {
      tbody.innerHTML = `<tr><td colspan="${2 + ALL_ROLES.length}" class="empty-state">${t('common.none')}</td></tr>`;
      return;
    }

    const roleMap = new Map(); // employee_id -> Set(roles)
    (roleRows || []).forEach(r => {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, new Set());
      roleMap.get(r.user_id).add(r.role);
    });

    tbody.innerHTML = emps.map(emp => {
      const roles = roleMap.get(emp.id) || new Set();
      return `
        <tr data-id="${emp.id}">
          <td>${escapeHtml(emp.full_name)}</td>
          <td>${emp.auth_user_id
            ? `<span class="badge badge-success">${t('employees.hasLogin')}</span>`
            : `<span class="badge badge-muted">${t('employees.noLogin')}</span>`}</td>
          ${ALL_ROLES.map(r => `
            <td><input type="checkbox" class="role-checkbox" data-role="${r}" ${roles.has(r) ? 'checked' : ''}></td>
          `).join('')}
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.role-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        const employeeId = cb.closest('tr').dataset.id;
        const role = cb.dataset.role;
        if (cb.checked) {
          const { error } = await supabase.from('user_roles').insert({ user_id: employeeId, role });
          if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = false; }
        } else {
          const { error } = await supabase.from('user_roles').delete().eq('user_id', employeeId).eq('role', role);
          if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = true; }
        }
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
