import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_KEY, iconButton } from '../icons.js';

const ALL_ROLES = ['mitarbeiter', 'stufe2_genehmiger', 'people_pool_manager', 'admin'];

export async function renderRoles(container) {
  container.innerHTML = `
    <header>
      <h1>${t('roles.title')}</h1>
      <p>${t('roles.subtitle')}</p>
    </header>

    <div class="card">
      <div class="form-panel-title">${t('roles.addLoginTitle')}</div>
      <form id="create-login-form">
        <div class="form-grid">
          <label>${t('roles.employee')}</label>
          <select id="f-employee" required></select>

          <label>${t('roles.email')}</label>
          <input type="email" id="f-email" required>

          <label>${t('roles.defaultPassword')}</label>
          <input type="text" id="f-password" minlength="8" required>
          <div class="hint-row">${t('roles.defaultPasswordHint')}</div>
        </div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button type="submit" class="btn btn-primary">${t('roles.createLogin')}</button>
        </div>
      </form>
      <p id="create-login-msg" class="error-text" hidden></p>
    </div>

    <div class="card">
      <table>
        <thead><tr>
          <th>${t('employees.fullName')}</th>
          <th>${t('employees.hasLogin')}</th>
          ${ALL_ROLES.map(r => `<th>${t('roles.' + r)}</th>`).join('')}
          <th>${t('roles.blocked')}</th>
          <th></th>
        </tr></thead>
        <tbody id="roles-tbody"><tr><td colspan="${3 + ALL_ROLES.length}" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
      <p class="empty-state" style="padding-top:0.75rem;">${t('roles.blockedHint')}</p>
    </div>
  `;

  await loadEmployeeSelect();
  await load();

  document.getElementById('create-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('create-login-msg');
    msg.hidden = true;

    const employee_id = document.getElementById('f-employee').value;
    const email = document.getElementById('f-email').value.trim();
    const password = document.getElementById('f-password').value;

    if (!employee_id) return;

    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create_login', employee_id, email, password },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || (data && data.error)) {
      msg.textContent = (data && data.error) || error.message || t('common.error');
      msg.hidden = false;
      return;
    }

    e.target.reset();
    await loadEmployeeSelect();
    await load();
  });

  async function loadEmployeeSelect() {
    const select = document.getElementById('f-employee');
    const { data } = await supabase.from('employees').select('id, full_name, auth_user_id').order('full_name');
    const withoutLogin = (data || []).filter(e => !e.auth_user_id);
    if (!withoutLogin.length) {
      select.innerHTML = `<option value="">${t('roles.noEmployeesWithoutLogin')}</option>`;
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML = withoutLogin.map(e => `<option value="${e.id}">${escapeHtml(e.full_name)}</option>`).join('');
  }

  async function load() {
    const tbody = document.getElementById('roles-tbody');
    const { data: emps, error: empErr } = await supabase
      .from('employees').select('id, full_name, auth_user_id, is_blocked').order('full_name');
    const { data: roleRows, error: roleErr } = await supabase
      .from('user_roles').select('user_id, role');

    if (empErr || roleErr) {
      tbody.innerHTML = `<tr><td colspan="${3 + ALL_ROLES.length}" class="empty-state">${t('common.error')}</td></tr>`;
      return;
    }
    if (!emps.length) {
      tbody.innerHTML = `<tr><td colspan="${3 + ALL_ROLES.length}" class="empty-state">${t('common.none')}</td></tr>`;
      return;
    }

    const roleMap = new Map();
    (roleRows || []).forEach(r => {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, new Set());
      roleMap.get(r.user_id).add(r.role);
    });

    tbody.innerHTML = emps.map(emp => {
      const roles = roleMap.get(emp.id) || new Set();
      return `
        <tr data-id="${emp.id}" data-auth-id="${emp.auth_user_id || ''}">
          <td>${escapeHtml(emp.full_name)}</td>
          <td>${emp.auth_user_id
            ? `<span class="badge badge-success">${t('employees.hasLogin')}</span>`
            : `<span class="badge badge-muted">${t('employees.noLogin')}</span>`}</td>
          ${ALL_ROLES.map(r => `
            <td><input type="checkbox" class="role-checkbox" data-role="${r}" ${roles.has(r) ? 'checked' : ''}></td>
          `).join('')}
          <td><input type="checkbox" class="blocked-checkbox" ${emp.is_blocked ? 'checked' : ''} ${!emp.auth_user_id ? 'disabled' : ''}></td>
          <td class="row-actions">
            ${emp.auth_user_id ? iconButton(ICON_KEY, t('roles.resetPassword'), 'reset-pw-btn') : ''}
          </td>
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

    tbody.querySelectorAll('.blocked-checkbox').forEach(cb => {
      cb.addEventListener('change', async () => {
        const employeeId = cb.closest('tr').dataset.id;
        const { error } = await supabase.from('employees').update({ is_blocked: cb.checked }).eq('id', employeeId);
        if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = !cb.checked; }
      });
    });

    tbody.querySelectorAll('.reset-pw-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const authUserId = row.dataset.authId;
        const newPassword = prompt(t('roles.resetPasswordPrompt'));
        if (!newPassword) return;
        if (newPassword.length < 8) { alert(t('roles.defaultPasswordHint')); return; }

        const { data: { session } } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke('admin-users', {
          body: { action: 'reset_password', auth_user_id: authUserId, password: newPassword },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (error || (data && data.error)) {
          alert((data && data.error) || error.message || t('common.error'));
          return;
        }
        alert(t('common.saved'));
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }
}
