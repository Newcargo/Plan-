import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_EDIT, ICON_DELETE, iconButton } from '../icons.js';

export async function renderBands(container) {
  container.innerHTML = `
    <header>
      <h1>${t('bands.title')}</h1>
      <p>${t('bands.subtitle')}</p>
    </header>
    <div class="card">
      <form id="band-form" class="inline-form">
        <div class="field">
          <label>${t('bands.position')}</label>
          <input type="number" id="f-pos" min="1" required>
        </div>
        <div class="field">
          <label>${t('bands.lower')}</label>
          <input type="number" id="f-lower" min="0" max="1" step="0.01" required>
        </div>
        <div class="field">
          <label>${t('bands.upper')}</label>
          <input type="number" id="f-upper" min="0" max="1" step="0.01" required>
        </div>
        <button type="submit" class="btn btn-primary">${t('common.save')}</button>
      </form>
      <table>
        <thead><tr>
          <th>${t('bands.position')}</th><th class="num">${t('bands.lower')}</th><th class="num">${t('bands.upper')}</th><th></th>
        </tr></thead>
        <tbody id="band-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  document.getElementById('band-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      sprint_position: document.getElementById('f-pos').value,
      lower_pct: document.getElementById('f-lower').value,
      upper_pct: document.getElementById('f-upper').value,
    };
    // upsert: Position ist Primary Key -> bestehender Eintrag wird ueberschrieben
    const { error } = await supabase.from('confidence_bands').upsert(payload, { onConflict: 'sprint_position' });
    if (error) { alert(t('common.error') + '\n' + error.message); return; }
    e.target.reset();
    load();
  });

  async function load() {
    const tbody = document.getElementById('band-tbody');
    const { data, error } = await supabase.from('confidence_bands').select('*').order('sprint_position');
    if (error) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`; return; }
    if (!data.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = data.map(b => `
      <tr data-pos="${b.sprint_position}">
        <td class="mono">${b.sprint_position}</td>
        <td class="num mono">${Math.round(Number(b.lower_pct) * 100)}%</td>
        <td class="num mono">${Math.round(Number(b.upper_pct) * 100)}%</td>
        <td class="row-actions">
          ${iconButton(ICON_EDIT, t('common.edit'), 'edit-btn')}
          ${iconButton(ICON_DELETE, t('common.delete'), 'delete-btn')}
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const b = data.find(x => String(x.sprint_position) === row.dataset.pos);
        document.getElementById('f-pos').value = b.sprint_position;
        document.getElementById('f-lower').value = b.lower_pct;
        document.getElementById('f-upper').value = b.upper_pct;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('common.confirmDelete'))) return;
        const pos = btn.closest('tr').dataset.pos;
        const { error } = await supabase.from('confidence_bands').delete().eq('sprint_position', pos);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        load();
      });
    });
  }

  load();
}
