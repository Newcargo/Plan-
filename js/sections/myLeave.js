import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { ICON_DELETE, iconButton, fieldLabel } from '../icons.js';
import { formatDate } from '../dateFormat.js';

const STATUS_META = {
  beantragt: { label: 'Beantragt', cls: 'badge-warn' },
  genehmigt_projekt: { label: 'Genehmigt (Projektleitung)', cls: 'badge-info' },
  abgelehnt: { label: 'Abgelehnt', cls: 'badge-danger' },
  bei_ruag_office: { label: 'Bei RUAG Office', cls: 'badge-info' },
  final_gebucht: { label: 'Final gebucht', cls: 'badge-success' },
  stornierungsantrag: { label: 'Änderung beantragt', cls: 'badge-muted' },
};

export async function renderMyLeave(container, context) {
  const employee = context && context.employee;
  if (!employee) {
    container.innerHTML = `<p class="empty-state">${t('common.error')}</p>`;
    return;
  }

  let leaveData = [];

  container.innerHTML = `
    <header><h1>${t('myLeave.title')}</h1></header>

    <div class="card">
      <div class="form-panel-title">${t('myLeave.legendTitle')}</div>
      <div style="display:flex; flex-wrap:wrap; gap:0.6rem 1.2rem;">
        ${Object.entries(STATUS_META).map(([key, meta]) => `
          <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem; color:var(--text-muted);">
            <span class="badge ${meta.cls}">${t('myLeave.status.' + key)}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="form-panel-title">${t('myLeave.newRequestTitle')}</div>
      <form id="leave-form">
        <div class="form-grid">
          ${fieldLabel(t('myLeave.start'), 'Erster Urlaubstag.')}
          <input type="date" id="f-leave-start" required class="narrow">

          ${fieldLabel(t('myLeave.end'), 'Letzter Urlaubstag (inklusive).')}
          <input type="date" id="f-leave-end" required class="narrow">
        </div>
        <div id="leave-warnings" style="margin-bottom:0.75rem;"></div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button type="submit" class="btn btn-primary">${t('myLeave.submit')}</button>
        </div>
      </form>
      <p id="leave-msg" class="error-text" hidden></p>
    </div>

    <div class="card">
      <div class="form-panel-title">${t('myLeave.myRequestsTitle')}</div>
      <table>
        <thead><tr>
          <th>${t('myLeave.period')}</th>
          <th>${t('myLeave.statusCol')}</th>
          <th>${t('myLeave.comment')}</th>
          <th></th>
        </tr></thead>
        <tbody id="leave-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  const startInput = document.getElementById('f-leave-start');
  const endInput = document.getElementById('f-leave-end');
  const warningsBox = document.getElementById('leave-warnings');

  async function checkOverlaps() {
    const start = startInput.value;
    const end = endInput.value;
    warningsBox.innerHTML = '';
    if (!start || !end || start > end) return;

    const { data: holidaysHit } = await supabase.from('holidays').select('date, name').gte('date', start).lte('date', end);
    const { data: blockedHit } = await supabase.from('blocked_periods').select('start_date, end_date, label, capacity_impact').lte('start_date', end).gte('end_date', start);

    let html = '';
    if (blockedHit && blockedHit.length) {
      html += blockedHit.map(bp => `
        <p style="font-size:0.85rem; color:var(--danger); margin:0.2rem 0;">⚠ ${t('myLeave.blockedWarning')
          .replace('{label}', escapeHtml(bp.label))
          .replace('{start}', formatDate(bp.start_date))
          .replace('{end}', formatDate(bp.end_date))}</p>
      `).join('');
    }
    if (holidaysHit && holidaysHit.length) {
      html += `<p style="font-size:0.85rem; color:var(--text-muted); margin:0.2rem 0;">ℹ ${t('myLeave.holidayInfo')
        .replace('{count}', holidaysHit.length)
        .replace('{names}', holidaysHit.map(h => `${escapeHtml(h.name)} (${formatDate(h.date)})`).join(', '))}</p>`;
    }
    warningsBox.innerHTML = html;
  }

  startInput.addEventListener('change', checkOverlaps);
  endInput.addEventListener('change', checkOverlaps);

  document.getElementById('leave-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('leave-msg');
    msg.hidden = true;

    const start = startInput.value;
    const end = endInput.value;
    if (start > end) {
      msg.textContent = t('myLeave.dateOrderError');
      msg.hidden = false;
      return;
    }

    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employee.id,
      start_date: start,
      end_date: end,
    });

    if (error) {
      msg.textContent = error.message;
      msg.hidden = false;
      return;
    }

    e.target.reset();
    warningsBox.innerHTML = '';
    load();
  });

  async function load() {
    const tbody = document.getElementById('leave-tbody');
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, status, comment_stufe2')
      .eq('employee_id', employee.id)
      .order('start_date', { ascending: false });

    if (error) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`; return; }
    leaveData = data || [];
    renderRows();
  }

  function renderRows() {
    const tbody = document.getElementById('leave-tbody');
    if (!leaveData.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = leaveData.map(lr => {
      const meta = STATUS_META[lr.status] || { label: lr.status, cls: 'badge-muted' };
      const canWithdraw = lr.status === 'beantragt';
      return `
        <tr data-id="${lr.id}">
          <td class="mono">${formatDate(lr.start_date)} – ${formatDate(lr.end_date)}</td>
          <td><span class="badge ${meta.cls}">${t('myLeave.status.' + lr.status) || meta.label}</span></td>
          <td>${escapeHtml(lr.comment_stufe2 || '')}</td>
          <td class="row-actions">${canWithdraw ? iconButton(ICON_DELETE, t('myLeave.withdraw'), 'withdraw-btn') : ''}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.withdraw-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('myLeave.withdrawConfirm'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        load();
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
