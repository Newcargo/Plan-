import { supabase } from './supabaseClient.js';

// Ergebnis-Status fuer den Login-Versuch:
// 'admin'    -> employee-Objekt zurueckgegeben, Zugriff erlaubt
// 'blocked'  -> Account existiert, ist aber gesperrt (contactName enthaelt die Admin-Kontaktperson)
// 'no-admin' -> eingeloggt, aber keine Admin-Rolle
// 'none'     -> kein Auth-User / keine verknuepfte employees-Zeile
export async function checkAccess() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'none' };

  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, full_name, email, auth_user_id, is_blocked')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (empErr || !employee) return { status: 'none' };

  if (employee.is_blocked) {
    const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'blocked_contact_name').maybeSingle();
    const contactName = (cfg && cfg.value) ? cfg.value : 'Admin';
    return { status: 'blocked', contactName };
  }

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', employee.id);

  if (rolesErr) return { status: 'none' };

  const isAdmin = (roles || []).some(r => r.role === 'admin');
  if (!isAdmin) return { status: 'no-admin' };

  return { status: 'admin', employee };
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
