import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'super_admin' | 'staff' | 'organizer';
  orgId: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<User | null> {
  try {
    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_email: credentials.email,
      p_password: credentials.password,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const user = data[0];

    await supabase.rpc('update_last_login', {
      p_user_id: user.user_id,
    });

    return {
      id: user.user_id,
      email: user.user_email,
      name: user.user_name,
      role: user.user_role,
      orgId: user.org_id,
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_admin_password', {
      p_user_id: userId,
      p_new_password: newPassword,
    });

    return !error;
  } catch (error) {
    console.error('Update password error:', error);
    return false;
  }
}

export function saveCredentials(email: string, password: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('timepulse_saved_email', email);
  }
}

export function getSavedCredentials(): LoginCredentials | null {
  return null;
}

export function clearSavedCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('timepulse_saved_email');
    localStorage.removeItem('timepulse_saved_password');
  }
}
