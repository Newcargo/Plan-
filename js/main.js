import { supabase } from './supabaseClient.js';
import { getCurrentAdminEmployee, signIn, signOut } from './auth.js';
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
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const mainContent = document.getElementById('main-content');

function setActiveNav(route) {
  document.querySelectorAll('.nav-item[data-route]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
}

async function navigate(route) {
  setActiveNav(route);
  const renderFn = routes[route] || routes.dashboard;
  await renderFn(mainContent);
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
      const active = document.querySelector('.nav-item.active');
      navigate(active ? active.dataset.route : 'dashboard');
    });
  });
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
  applyTranslations();
  await navigate('dashboard');
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await signIn(email, password);
  if (error) { showLogin(t('login.error')); return; }

  const employee = await getCurrentAdminEmployee();
  if (!employee) {
    await supabase.auth.signOut();
    showLogin(t('login.noaccess'));
    return;
  }

  await showApp();
});

// Beim Laden pruefen, ob bereits eine gueltige Admin-Session besteht
(async function init() {
  applyTranslations();
  const employee = await getCurrentAdminEmployee();
  if (employee) {
    await showApp();
  } else {
    showLogin();
  }
})();
