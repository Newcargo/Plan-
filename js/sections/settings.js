import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { fieldLabel } from '../icons.js';

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
      </div>
      <div class="form-actions" style="justify-content:flex-start;align-items:center;">
        <button id="save-btn" class="btn btn-primary">${t('common.save')}</button>
        <span id="save-msg" style="color:var(--success);font-size:0.85rem;"></span>
      </div>
    </div>
  `;

  const { data } = await supabase.from('app_config').select('*');
  const map = new Map((data || []).map(c => [c.key, c.value]));
  document.getElementById('f-window').value = map.get('velocity_rolling_window') ?? 3;
  document.getElementById('f-sprintcount').value = map.get('default_pi_sprint_count') ?? 5;
  document.getElementById('f-blocked-contact').value = map.get('blocked_contact_name') ?? 'Admin';

  document.getElementById('save-btn').addEventListener('click', async () => {
    const windowVal = Number(document.getElementById('f-window').value);
    const sprintCountVal = Number(document.getElementById('f-sprintcount').value);
    const contactName = document.getElementById('f-blocked-contact').value.trim() || 'Admin';

    const { error: e1 } = await supabase.from('app_config').upsert(
      { key: 'velocity_rolling_window', value: windowVal }, { onConflict: 'key' }
    );
    const { error: e2 } = await supabase.from('app_config').upsert(
      { key: 'default_pi_sprint_count', value: sprintCountVal }, { onConflict: 'key' }
    );
    const { error: e3 } = await supabase.from('app_config').upsert(
      { key: 'blocked_contact_name', value: contactName }, { onConflict: 'key' }
    );

    const msg = document.getElementById('save-msg');
    if (e1 || e2 || e3) {
      msg.style.color = 'var(--danger)';
      msg.textContent = t('common.error');
    } else {
      msg.style.color = 'var(--success)';
      msg.textContent = t('common.saved');
      setTimeout(() => { msg.textContent = ''; }, 2500);
    }
  });
}
