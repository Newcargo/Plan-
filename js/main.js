import { supabase } from './supabaseClient.js';
import { checkAccess, signIn, signOut } from './auth.js';
import { t, getLang, setLang, applyTranslations } from './i18n.js';

import { renderDashboard } from './sections/dashboard.js';
import { renderTeams } from './sections/teams.js';
import { renderEmployees } from './sections/employees.js';
import { renderHolidays } from './sections/holidays.js';
import { renderBlocked } from './sections/blockedPeriods.js';
import { renderSprints } from './sections/sprints.js';
import { renderBands } from './sections/confidenceBands.js';
import { renderSettings } from './sections/settings.js';
import { renderRoles } from './sections/roles.js';
import { renderChangelog } from './sections/changelog.js';
import { renderMyLeave } from './sections/myLeave.js';
import { renderApprovals } from './sections/approvals.js';
import { APP_VERSION } from './version.js';
import { ROLE_DEFINITIONS, ALL_ROLE_KEYS } from './roleDefinitions.js';

const routes = {
  dashboard: renderDashboard,
  teams: renderTeams,
  employees: renderEmployees,
  holidays: renderHolidays,
  blocked: renderBlocked,
  sprints: renderSprints,
  bands: renderBands,
  settings: renderSettings,
  roles: renderRoles,
  changelog: renderChangelog,
  'my-leave': renderMyLeave,
  approvals: renderApprovals,
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const mainContent = document.getElementById('main-content');

let currentRoles = new Set();
let currentEmployee = null;

function setActiveNav(route) {
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
}

async function navigate(route) {
  setActiveNav(route);
  const renderFn = routes[route] || routes['my-leave'];
  await renderFn(mainContent, { employee: currentEmployee, roles: currentRoles });
}

function applyRoleVisibility() {
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    const requires = btn.dataset.requires;
    const requiresAny = btn.dataset.requiresAny;

    if (requires) {
      btn.hidden = !currentRoles.has(requires);
    } else if (requiresAny) {
      const options = requiresAny.split(',');
      btn.hidden = !options.some(r => currentRoles.has(r));
    } else {
      btn.hidden = false;
    }
  });
}

function setupNav() {
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    showLogin();
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLang());
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === btn.dataset.lang));
      renderSidebarUser();
      const active = document.querySelector('.nav-item.active');
      navigate(active ? active.dataset.route : defaultRoute());
    });
  });
}

function defaultRoute() {
  return currentRoles.has('admin') ? 'dashboard' : 'my-leave';
}

function showLogin(message) {
  appShell.hidden = true;
  loginScreen.hidden = false;
  const errEl = document.getElementById('login-error');
  if (message) { errEl.textContent = message; errEl.hidden = false; } else { errEl.hidden = true; }
}

async function showApp() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  setupNav();
  applyRoleVisibility();
  applyTranslations();
  document.getElementById('sidebar-version').textContent = 'v' + APP_VERSION;
  renderSidebarUser();
  await navigate(defaultRoute());
}

function renderSidebarUser() {
  const el = document.getElementById('sidebar-user');
  if (!currentEmployee) { el.innerHTML = ''; return; }

  const roleLabels = ALL_ROLE_KEYS.filter(r => currentRoles.has(r)).map(r => ROLE_DEFINITIONS[r].label);
  const roleText = roleLabels.length ? roleLabels.join(', ') : t('roles.mitarbeiter');

  el.innerHTML = `
    <div class="sidebar-user-name">${escapeHtml(currentEmployee.full_name)}</div>
    <div class="sidebar-user-role">${escapeHtml(roleText)}</div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await signIn(email, password);
  if (error) { showLogin(t('login.error')); return; }

  await handleAccessResult();
});

async function handleAccessResult() {
  const result = await checkAccess();

  if (result.status === 'ok') {
    currentEmployee = result.employee;
    currentRoles = result.roles;
    await showApp();
    return;
  }

  // Fuer alle anderen Faelle: Session sofort wieder beenden, kein Zugriff gewaehrt
  await supabase.auth.signOut();

  if (result.status === 'blocked') {
    showLogin(t('login.blocked').replace('{name}', result.contactName));
  } else {
    showLogin();
  }
}

// Beim Laden pruefen, ob bereits eine gueltige Session besteht
(async function init() {
  applyTranslations();
  await handleAccessResult();
})();
