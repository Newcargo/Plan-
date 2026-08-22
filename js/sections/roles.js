import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_KEY, iconButton, fieldLabel } from '../icons.js';
import { createSortState, sortableHeader, wireSortHeaders, sortArray } from '../sortable.js';
import { ROLE_DEFINITIONS, ALL_ROLE_KEYS as ALL_ROLES, getIncludedLabels } from '../roleDefinitions.js';

// Ruft die admin-users Edge Function auf und liest bei einem Fehler die echte Meldung
// aus dem Response-Body ("error"-Feld), statt der generischen supabase-js-Meldung
// ("Edge Function returned a non-2xx status code").
async function invokeAdminUsers(body) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let message = error.message;
    try {
      if (error.context && typeof error.context.json === 'function') {
        const body = await error.context.json();
        if (body && body.error) message = body.error;
      }
    } catch (_) { /* Fallback bleibt die generische Meldung */ }
    return { data: null, error: message };
  }

  if (data && data.error) return { data, error: data.error };
  return { data, error: null };
}

export async function renderRoles(container) {
  const sortState = createSortState('full_name', true);
  let rolesData = [];
  let roleMapGlobal = new Map();
  const expandedIds = new Set();

  container.innerHTML = `
    <header>
      <h1>${t('roles.title')}</h1>
      <p>${t('roles.subtitle')}</p>
    </header>

    <div class="card">
      <div class="form-panel-title">Was dürfen die Rollen?</div>
      <p class="empty-state" style="padding-top:0;">Hinweis: Die Stammdaten-Rechte (Teams, Mitarbeiter, Feiertage usw.) für Admin sind bereits aktiv. Die feineren Unterschiede zwischen Stufe-2-Genehmiger und People Pool Manager greifen vollständig, sobald der Urlaubskalender selbst gebaut ist.</p>
      <div style="display:flex; flex-direction:column; gap:0.9rem;">
        ${ALL_ROLES.map(r => {
          const def = ROLE_DEFINITIONS[r];
          const included = getIncludedLabels(r);
          return `
            <div style="border:1px solid var(--border); border-radius:8px; padding:0.85rem 1rem;">
              <div style="font-weight:600; font-size:0.9rem; color:var(--text); margin-bottom:0.3rem;">${escapeHtml(def.label)}</div>
              <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">${escapeHtml(def.description)}</div>
              ${included.length ? `<div style="font-size:0.8rem; color:var(--accent); margin-top:0.5rem;">Beinhaltet auch: ${included.map(escapeHtml).join(', ')}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="form-panel-title">${t('roles.addLoginTitle')}</div>
      <form id="create-login-form">
        <div class="form-grid">
          ${fieldLabel(t('roles.employee'), 'Nur Mitarbeiter ohne bestehenden App-Zugang werden hier angezeigt.')}
          <select id="f-employee" required></select>

          ${fieldLabel(t('roles.email'), 'Login-E-Mail-Adresse. Wird mit dem Supabase-Auth-Account verknüpft und ist danach die Anmelde-Adresse.')}
          <input type="email" id="f-email" required>

          ${fieldLabel(t('roles.defaultPassword'), t('roles.defaultPasswordHint'))}
          <input type="text" id="f-password" minlength="8" required>
        </div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button type="submit" class="btn btn-primary">${t('roles.createLogin')}</button>
        </div>
      </form>
      <p id="create-login-msg" class="error-text" hidden></p>
    </div>

    <div class="card">
      <div class="role-list-header" id="role-list-header"></div>
      <div id="role-list"></div>
    </div>
  `;

  function wireHead() {
    const header = document.getElementById('role-list-header');
    header.innerHTML = `
      <span style="width:12px;"></span>
      ${sortableHeader(t('employees.fullName'), 'full_name', sortState, 'span')}
      <span style="flex:0 0 220px;">${t('roles.email') || 'E-Mail'}</span>
      <span style="flex:0 0 110px;">${t('employees.hasLogin')}</span>
      <span style="flex:1;">${ALL_ROLES.map(r => t('roles.' + r)).join(' / ')}</span>
    `;
    wireSortHeaders(header, sortState, () => { renderRows(); });
  }
  wireHead();

  document.getElementById('create-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('create-login-msg');
    msg.hidden = true;

    const employee_id = document.getElementById('f-employee').value;
    const email = document.getElementById('f-email').value.trim();
    const password = document.getElementById('f-password').value;

    if (!employee_id) return;

    const { data, error } = await invokeAdminUsers({ action: 'create_login', employee_id, email, password });

    if (error) {
      msg.textContent = error;
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
    const list = document.getElementById('role-list');
    const { data: emps, error: empErr } = await supabase
      .from('employees').select('id, full_name, email, auth_user_id, is_blocked');
    const { data: roleRows, error: roleErr } = await supabase
      .from('user_roles').select('user_id, role');

    if (empErr || roleErr) {
      list.innerHTML = `<p class="empty-state">${t('common.error')}</p>`;
      return;
    }

    roleMapGlobal = new Map();
    (roleRows || []).forEach(r => {
      if (!roleMapGlobal.has(r.user_id)) roleMapGlobal.set(r.user_id, new Set());
      roleMapGlobal.get(r.user_id).add(r.role);
    });

    rolesData = emps || [];
    renderRows();
  }

  function renderRows() {
    const list = document.getElementById('role-list');
    if (!rolesData.length) { list.innerHTML = `<p class="empty-state">${t('common.none')}</p>`; return; }

    sortArray(rolesData, sortState);

    list.innerHTML = rolesData.map(emp => {
      const roles = roleMapGlobal.get(emp.id) || new Set();
      const roleLabels = ALL_ROLES.filter(r => roles.has(r)).map(r => t('roles.' + r));
      const summary = roleLabels.length ? roleLabels.join(', ') : '–';
      const isExpanded = expandedIds.has(emp.id);

      const headerRow = `
        <div class="role-row-header" data-id="${emp.id}">
          <span class="role-chevron">${isExpanded ? '▾' : '▸'}</span>
          <span class="role-name">${escapeHtml(emp.full_name)}</span>
          <span class="role-email">${emp.email ? escapeHtml(emp.email) : '–'}</span>
          <span>${emp.auth_user_id
            ? `<span class="badge badge-success">${t('employees.hasLogin')}</span>`
            : `<span class="badge badge-muted">${t('employees.noLogin')}</span>`}${emp.is_blocked ? ` <span class="badge badge-danger">${t('roles.blocked')}</span>` : ''}</span>
          <span class="role-summary">${escapeHtml(summary)}</span>
        </div>
      `;

      const detailPanel = isExpanded ? `
        <div class="role-detail-panel" data-detail-id="${emp.id}">
          ${emp.auth_user_id ? `
            <div style="margin-bottom:0.85rem;">
              ${fieldLabel(t('roles.email'), 'Ändert die Login-E-Mail direkt im Supabase-Auth-Account. Der Kollege meldet sich danach mit der neuen Adresse an.')}
              <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.35rem;">
                <input type="email" class="email-edit-input" value="${escapeHtml(emp.email || '')}" style="flex:1;padding:0.5rem 0.65rem;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;">
                <button type="button" class="btn btn-secondary email-save-btn">${t('common.save')}</button>
              </div>
            </div>
          ` : ''}
          <div class="role-detail-checks">
            ${ALL_ROLES.map(r => `
              <label title="${escapeHtml(ROLE_DEFINITIONS[r].description)}">
                <input type="checkbox" class="role-checkbox" data-role="${r}" ${roles.has(r) ? 'checked' : ''}>
                ${t('roles.' + r)}
              </label>
            `).join('')}
          </div>
          <div class="role-detail-footer">
            <label title="${escapeHtml(t('roles.blockedHint'))}">
              <input type="checkbox" class="blocked-checkbox" ${emp.is_blocked ? 'checked' : ''} ${!emp.auth_user_id ? 'disabled' : ''}>
              ${t('roles.blocked')}
            </label>
            ${emp.auth_user_id ? `<button type="button" class="btn btn-secondary reset-pw-btn">${t('roles.resetPassword')}</button>` : ''}
          </div>
        </div>
      ` : '';

      return headerRow + detailPanel;
    }).join('');

    list.querySelectorAll('.role-row-header').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        if (expandedIds.has(id)) expandedIds.delete(id); else expandedIds.add(id);
        renderRows();
      });
    });

    list.querySelectorAll('.role-detail-panel').forEach(panel => {
      const employeeId = panel.dataset.detailId;

      panel.querySelectorAll('.role-checkbox').forEach(cb => {
        cb.addEventListener('click', e => e.stopPropagation());
        cb.addEventListener('change', async () => {
          const role = cb.dataset.role;
          if (cb.checked) {
            const { error } = await supabase.from('user_roles').insert({ user_id: employeeId, role });
            if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = false; }
          } else {
            const { error } = await supabase.from('user_roles').delete().eq('user_id', employeeId).eq('role', role);
            if (error) { alert(t('common.error') + '\n' + error.message); cb.checked = true; }
          }
          if (!roleMapGlobal.has(employeeId)) roleMapGlobal.set(employeeId, new Set());
          if (cb.checked) roleMapGlobal.get(employeeId).add(cb.dataset.role);
          else roleMapGlobal.get(employeeId).delete(cb.dataset.role);
        });
      });

      const blockedCb = panel.querySelector('.blocked-checkbox');
      if (blockedCb) {
        blockedCb.addEventListener('click', e => e.stopPropagation());
        blockedCb.addEventListener('change', async () => {
          const { error } = await supabase.from('employees').update({ is_blocked: blockedCb.checked }).eq('id', employeeId);
          if (error) { alert(t('common.error') + '\n' + error.message); blockedCb.checked = !blockedCb.checked; return; }
          const emp = rolesData.find(e => e.id === employeeId);
          if (emp) emp.is_blocked = blockedCb.checked;
          renderRows();
        });
      }

      const resetBtn = panel.querySelector('.reset-pw-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', async e => {
          e.stopPropagation();
          const newPassword = prompt(t('roles.resetPasswordPrompt'));
          if (!newPassword) return;
          if (newPassword.length < 8) { alert(t('roles.defaultPasswordHint')); return; }

          const emp = rolesData.find(x => x.id === employeeId);
          const { error } = await invokeAdminUsers({ action: 'reset_password', auth_user_id: emp.auth_user_id, password: newPassword });

          if (error) {
            alert(error);
            return;
          }
          alert(t('common.saved'));
        });
      }

      const emailInput = panel.querySelector('.email-edit-input');
      const emailSaveBtn = panel.querySelector('.email-save-btn');
      if (emailInput) emailInput.addEventListener('click', e => e.stopPropagation());
      if (emailSaveBtn) {
        emailSaveBtn.addEventListener('click', async e => {
          e.stopPropagation();
          const newEmail = emailInput.value.trim();
          const emp = rolesData.find(x => x.id === employeeId);
          if (!newEmail || newEmail === emp.email) return;

          const { error } = await invokeAdminUsers({ action: 'update_email', employee_id: employeeId, auth_user_id: emp.auth_user_id, email: newEmail });

          if (error) {
            alert(error);
            return;
          }
          emp.email = newEmail;
          alert(t('common.saved'));
          renderRows();
        });
      }

      panel.addEventListener('click', e => e.stopPropagation());
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  await loadEmployeeSelect();
  await load();
}
