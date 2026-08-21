import { supabase } from './supabaseClient.js';

// Prueft, ob der aktuell eingeloggte Auth-User in employees verknuepft ist
// und die Rolle 'admin' hat. Gibt das employees-Record zurueck oder null.
export async function getCurrentAdminEmployee() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, full_name, email, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (empErr || !employee) return null;

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', employee.id);

  if (rolesErr) return null;

  const isAdmin = (roles || []).some(r => r.role === 'admin');
  if (!isAdmin) return null;

  return employee;
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
