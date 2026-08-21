import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderSettings(container) {
  container.innerHTML = `
    <header><h1>${t('settings.title')}</h1></header>
    <div class="card">
      <div class="field">
        <label>${t('settings.rollingWindow')}</label>
        <input type="number" id="f-window" min="1" step="1">
      </div>
      <div class="field">
        <label>${t('settings.defaultSprintCount')}</label>
        <input type="number" id="f-sprintcount" min="1" step="1">
      </div>
      <button id="save-btn" class="btn btn-primary">${t('common.save')}</button>
      <span id="save-msg" style="margin-left:0.75rem;color:var(--success);font-size:0.85rem;"></span>
    </div>
  `;

  const { data } = await supabase.from('app_config').select('*');
  const map = new Map((data || []).map(c => [c.key, c.value]));
  document.getElementById('f-window').value = map.get('velocity_rolling_window') ?? 3;
  document.getElementById('f-sprintcount').value = map.get('default_pi_sprint_count') ?? 5;

  document.getElementById('save-btn').addEventListener('click', async () => {
    const windowVal = Number(document.getElementById('f-window').value);
    const sprintCountVal = Number(document.getElementById('f-sprintcount').value);

    const { error: e1 } = await supabase.from('app_config').upsert(
      { key: 'velocity_rolling_window', value: windowVal }, { onConflict: 'key' }
    );
    const { error: e2 } = await supabase.from('app_config').upsert(
      { key: 'default_pi_sprint_count', value: sprintCountVal }, { onConflict: 'key' }
    );

    const msg = document.getElementById('save-msg');
    if (e1 || e2) {
      msg.style.color = 'var(--danger)';
      msg.textContent = t('common.error');
    } else {
      msg.style.color = 'var(--success)';
      msg.textContent = t('common.saved');
      setTimeout(() => { msg.textContent = ''; }, 2500);
    }
  });
}
