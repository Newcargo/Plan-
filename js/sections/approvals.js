import { supabase } from '../supabaseClient.js';
import { t } from '../i18n.js';
import { formatDate } from '../dateFormat.js';

export async function renderApprovals(container, context) {
  const roles = (context && context.roles) || new Set();
  const canApprove = roles.has('stufe2_genehmiger') || roles.has('admin');
  const canForward = roles.has('people_pool_manager') || roles.has('admin');

  container.innerHTML = `
    <header><h1>${t('approvals.title')}</h1></header>

    ${canApprove ? `
      <div class="card">
        <div class="form-panel-title">${t('approvals.pendingTitle')}</div>
        <table>
          <thead><tr>
            <th>${t('approvals.employee')}</th>
            <th>${t('myLeave.period')}</th>
            <th></th>
          </tr></thead>
          <tbody id="pending-tbody"><tr><td colspan="3" class="empty-state">${t('common.loading')}</td></tr></tbody>
        </table>
      </div>
    ` : ''}

    ${canForward ? `
      <div class="card">
        <div class="form-panel-title">${t('approvals.forwardTitle')}</div>
        <p class="empty-state" style="padding-top:0;">${t('approvals.forwardHint')}</p>
        <table>
          <thead><tr>
            <th>${t('approvals.employee')}</th>
            <th>${t('myLeave.period')}</th>
            <th></th>
          </tr></thead>
          <tbody id="forward-tbody"><tr><td colspan="3" class="empty-state">${t('common.loading')}</td></tr></tbody>
        </table>
      </div>
    ` : ''}

    <div class="card">
      <div class="form-panel-title">${t('approvals.historyTitle')}</div>
      <table>
        <thead><tr>
          <th>${t('approvals.employee')}</th>
          <th>${t('myLeave.period')}</th>
          <th>${t('myLeave.statusCol')}</th>
          <th>${t('myLeave.comment')}</th>
        </tr></thead>
        <tbody id="history-tbody"><tr><td colspan="4" class="empty-state">${t('common.loading')}</td></tr></tbody>
      </table>
    </div>
  `;

  const STATUS_META = {
    beantragt: { label: t('myLeave.status.beantragt'), cls: 'badge-warn' },
    genehmigt_projekt: { label: t('myLeave.status.genehmigt_projekt'), cls: 'badge-info' },
    abgelehnt: { label: t('myLeave.status.abgelehnt'), cls: 'badge-danger' },
    bei_ruag_office: { label: t('myLeave.status.bei_ruag_office'), cls: 'badge-info' },
    final_gebucht: { label: t('myLeave.status.final_gebucht'), cls: 'badge-success' },
    stornierungsantrag: { label: t('myLeave.status.stornierungsantrag'), cls: 'badge-muted' },
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  async function loadAll() {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, status, comment_stufe2, employee_id, employees!leave_requests_employee_id_fkey(full_name, is_external)')
      .order('start_date', { ascending: false });

    if (error) {
      ['pending-tbody', 'forward-tbody', 'history-tbody'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.error')}</td></tr>`;
      });
      return;
    }

    const all = data || [];

    if (canApprove) renderPending(all.filter(r => r.status === 'beantragt'));
    if (canForward) renderForward(all.filter(r => r.status === 'genehmigt_projekt' && r.employees && r.employees.is_external));
    renderHistory(all);
  }

  function renderPending(rows) {
    const tbody = document.getElementById('pending-tbody');
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="3" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = rows.map(r => `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.employees?.full_name || '–')}</td>
        <td class="mono">${formatDate(r.start_date)} – ${formatDate(r.end_date)}</td>
        <td class="row-actions">
          <button type="button" class="btn btn-secondary approve-btn">${t('approvals.approve')}</button>
          <button type="button" class="btn btn-danger reject-btn">${t('approvals.reject')}</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        const comment = prompt(t('approvals.approveCommentPrompt')) || null;
        const { error } = await supabase.from('leave_requests').update({
          status: 'genehmigt_projekt',
          comment_stufe2: comment,
          approved_at: new Date().toISOString(),
        }).eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadAll();
      });
    });

    tbody.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('tr').dataset.id;
        let comment = prompt(t('approvals.rejectCommentPrompt'));
        while (comment !== null && !comment.trim()) {
          comment = prompt(t('approvals.rejectCommentRequired'));
        }
        if (comment === null) return;
        const { error } = await supabase.from('leave_requests').update({
          status: 'abgelehnt',
          comment_stufe2: comment.trim(),
        }).eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadAll();
      });
    });
  }

  function renderForward(rows) {
    const tbody = document.getElementById('forward-tbody');
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="3" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = rows.map(r => `
      <tr data-id="${r.id}">
        <td>${escapeHtml(r.employees?.full_name || '–')}</td>
        <td class="mono">${formatDate(r.start_date)} – ${formatDate(r.end_date)}</td>
        <td class="row-actions"><button type="button" class="btn btn-secondary forward-btn">${t('approvals.markForwarded')}</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.forward-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('approvals.markForwardedConfirm'))) return;
        const id = btn.closest('tr').dataset.id;
        const { error } = await supabase.from('leave_requests').update({ status: 'bei_ruag_office' }).eq('id', id);
        if (error) { alert(t('common.error') + '\n' + error.message); return; }
        loadAll();
      });
    });
  }

  function renderHistory(rows) {
    const tbody = document.getElementById('history-tbody');
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-state">${t('common.none')}</td></tr>`; return; }

    tbody.innerHTML = rows.map(r => {
      const meta = STATUS_META[r.status] || { label: r.status, cls: 'badge-muted' };
      return `
        <tr>
          <td>${escapeHtml(r.employees?.full_name || '–')}</td>
          <td class="mono">${formatDate(r.start_date)} – ${formatDate(r.end_date)}</td>
          <td><span class="badge ${meta.cls}">${meta.label}</span></td>
          <td>${escapeHtml(r.comment_stufe2 || '')}</td>
        </tr>
      `;
    }).join('');
  }

  loadAll();
}
