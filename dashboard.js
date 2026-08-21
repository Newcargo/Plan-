import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <header>
      <h1>${t('dashboard.title')}</h1>
      <p>${t('dashboard.subtitle')}</p>
    </header>
    <div id="dash-cards" class="grid-cards">
      <p class="empty-state">${t('common.loading')}</p>
    </div>
  `;

  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .select('id, name, focus_factor, unplanned_buffer')
    .order('name');

  const { data: employees, error: empErr } = await supabase
    .from('v_employee_reduction')
    .select('employee_id, team_name, effective_reduction_pct');

  const cardsEl = document.getElementById('dash-cards');
  if (teamsErr || empErr || !teams) {
    cardsEl.innerHTML = `<p class="empty-state">${t('common.error')}</p>`;
    return;
  }

  if (teams.length === 0) {
    cardsEl.innerHTML = `<p class="empty-state">${t('common.none')}</p>`;
    return;
  }

  cardsEl.innerHTML = teams.map(team => {
    const members = (employees || []).filter(e => e.team_name === team.name);
    const avg = members.length
      ? members.reduce((sum, e) => sum + Number(e.effective_reduction_pct), 0) / members.length
      : (Number(team.focus_factor) * (1 - Number(team.unplanned_buffer)));
    const pct = Math.round(avg * 100);

    return `
      <div class="team-card">
        <h3>${escapeHtml(team.name)}</h3>
        <div class="capacity-gauge">
          <div class="track">
            <div class="seg-focus" style="width:${pct}%"></div>
          </div>
          <div class="value">${pct}%</div>
        </div>
        <div class="meta">${members.length} · ø ${t('employees.effective').toLowerCase()}</div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
