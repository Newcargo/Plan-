import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { fieldLabel, ICON_EDIT, ICON_DELETE, iconButton } from '../icons.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <header><h1>${t('settings.title')}</h1></header>
    <div class="card">
      <div class="form-panel-title">${t('settings.title')}</div>
      <div class="form-grid">
        ${fieldLabel(t('settings.rollingWindow'), 'Anzahl der letzten abgeschlossenen Sprints, aus denen der SP/PT-Durchschnitt (Velocity) für die Prognose berechnet wird.')}
        <input type="number" id="f-window" min="1" step="1" class="narrow">

        ${fieldLabel(t('settings.defaultSprintCount'), 'Standardwert für die Anzahl Sprints bei einer neuen PI, z. B. 5.')}
        <input type="number" id="f-sprintcount" min="1" step="1" class="narrow">

        ${fieldLabel(t('roles.blocked') + ' – Kontaktperson (Name, keine E-Mail)', 'Name, der gesperrten Mitarbeitenden beim Login-Versuch angezeigt wird, an wen sie sich wenden sollen. Bewusst nur ein Name, keine E-Mail-Adresse.')}
        <input type="text" id="f-blocked-contact">

        ${fieldLabel(t('settings.ppmEmail'), 'E-Mail-Adresse des People Pool Managers. Wird als Empfänger im vorausgefüllten Mail-Entwurf für externe Kollegen verwendet.')}
        <input type="email" id="f-ppm-email">
      </div>
      <div class="form-actions" style="justify-content:flex-start;align-items:center;">
        <button id="save-btn" class="btn btn-primary">${t('common.save')}</button>
        <span id="save-msg" style="color:var(--success);font-size:0.85rem;"></span>
      </div>
    </div>

    <div class="card">
      <div class="form-panel-title">${t('settings.jobDescriptions')}</div>
      <form id="jd-form">
        <div class="form-grid">
          ${fieldLabel(t('settings.jobDescriptionName'), 'Wird bei Mitarbeitern als Auswahl-Dropdown angeboten.')}
          <input type="text" id="f-jd-name" required placeholder="z. B. Software-Entwickler">
        </div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button type="submit" class="btn btn-primary">${t('common.add')}</button>
        </div>
      </form>
      <table>
        <thead><tr><th>${t('common.name')}</th><th></th></tr></thead>
        <tbody id="jd-tbody"><tr><td colspan="2" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  const { data } = await supabase.from('app_config').select('*');
  const map = new Map((data || []).map(c => [c.key, c.value]));
  document.getElementById('f-window').value = map.get('velocity_rolling_window') ?? 3;
  document.getElementById('f-sprintcount').value = map.get('default_pi_sprint_count') ?? 5;
  document.getElementById('f-blocked-contact').value = map.get('blocked_contact_name') ?? 'Admin';
  document.getElementById('f-ppm-email').value = map.get('people_pool_manager_email') ?? '';

  document.getElementById('save-btn').addEventListener('click', async () => {
    const windowVal = Number(document.getElementById('f-window').value);
    const sprintCountVal = Number(document.getElementById('f-sprintcount').value);
    const contactName = document.getElementById('f-blocked-contact').value.trim() || 'Admin';
    const ppmEmail = document.getElementById('f-ppm-email').value.trim();

    const { error: e1 } = await supabase.from('app_config').upsert(
      { key: 'velocity_rolling_window', value: windowVal }, { onConflict: 'key' }
    );
    const { error: e2 } = await supabase.from('app_config').upsert(
      { key: 'default_pi_sprint_count', value: sprintCountVal }, { onConflict: 'key' }
    );
    const { error: e3 } = await supabase.from('app_config').upsert(
      { key: 'blocked_contact_name', value: contactName }, { onConflict: 'key' }
    );
    const { error: e4 } = await supabase.from('app_config').upsert(
      { key: 'people_pool_manager_email', value: ppmEmail }, { onConflict: 'key' }
    );

    const msg = document.getElementById('save-msg');
    if (e1 || e2 || e3 || e4) {
      msg.style.color = 'var(--danger)';
      msg.textContent = t('common.error');
    } else {
      msg.style.color = 'var(--success)';
      msg.textContent = t('common.saved');
      setTimeout(() => { msg.textContent = ''; }, 2500);
    }
  });

  document.getElementById('jd-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('f-jd-name').value.trim();
    const { error } = await supabase.from('job_descriptions').insert({ name });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    loadJobDescriptions();
  });

  async function loadJobDescriptions() {
    const tbody = document.getElementById('jd-tbody');
    const { data: jds, error } = await supabase.from('job_descriptions').select('*').order('name');
    if (error) { tbody.innerHTML = `<tr><td colspan="2" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!jds.length) { tbody.innerHTML = `<tr><td colspan="2" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = jds.map(jd => `
      <tr data-id="${jd.id}">
        <td>${escapeHtml(jd.name)}</td>
        <td class="row-actions">
          ${iconButton(ICON_EDIT, t('common.edit'), 'jd-edit-btn')}
          ${iconButton(ICON_DELETE, t('common.delete'), 'jd-delete-btn')}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.jd-edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const jd = jds.find(x => x.id === row.dataset.id);
        const newName = prompt(t('settings.jobDescriptionName'), jd.name);
        if (newName === null || !newName.trim()) return;
        const { error } = await supabase.from('job_descriptions').update({ name: newName.trim() }).eq('id', jd.id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadJobDescriptions();
      });
    });

    tbody.querySelectorAll('.jd-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('job_descriptions').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadJobDescriptions();
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  loadJobDescriptions();
}
