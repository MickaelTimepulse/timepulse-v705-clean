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
    console.log('[auth.ts] Attempting login for:', credentials.email);

    // First verify the admin password
    const { data, error } = await supabase.rpc('verify_admin_password', {
      p_email: credentials.email,
      p_password: credentials.password,
    });

    console.log('[auth.ts] Supabase RPC response:', { data, error });

    if (error || !data || data.length === 0) {
      console.error('[auth.ts] Login failed:', error || 'No data returned');
      return null;
    }

    const user = data[0];
    console.log('[auth.ts] User found:', user);

    // Create a Supabase Auth session using a dummy email/password
    // This will persist the session across page reloads
    const authEmail = `admin-${user.user_id}@timepulse.internal`;
    console.log('[auth.ts] Creating Supabase Auth session for:', authEmail);

    // Try to sign in first (in case the user already exists)
    let authUserId: string | null = null;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: user.user_id, // Use user_id as password
    });

    if (signInError) {
      console.log('[auth.ts] Sign in failed, trying to create new user:', signInError.message);

      // If sign in fails, try to create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password: user.user_id,
        options: {
          data: {
            admin_id: user.user_id,
            admin_email: user.user_email,
            admin_name: user.user_name,
            admin_role: user.user_role,
          }
        }
      });

      if (signUpError) {
        console.error('[auth.ts] Failed to create auth session:', signUpError);
        // Continue anyway, we'll use metadata storage
      } else {
        authUserId = signUpData.user?.id || null;
        console.log('[auth.ts] ✅ Created new Supabase Auth user:', authUserId);
      }
    } else {
      authUserId = signInData.user?.id || null;
      console.log('[auth.ts] ✅ Signed in with existing Supabase Auth user:', authUserId);
    }

    // Update admin_users.user_id with the Supabase Auth user ID
    if (authUserId) {
      const { error: updateError } = await supabase.rpc('update_admin_user_id', {
        p_admin_id: user.user_id,
        p_auth_user_id: authUserId
      });

      if (updateError) {
        console.error('[auth.ts] Failed to link admin to Supabase Auth:', updateError);
      } else {
        console.log('[auth.ts] ✅ Linked admin_users.user_id to Supabase Auth ID');
      }
    }

    await supabase.rpc('update_last_login', {
      p_user_id: user.user_id,
    });

    // Store user metadata in Supabase Auth metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        admin_id: user.user_id,
        admin_email: user.user_email,
        admin_name: user.user_name,
        admin_role: user.user_role,
      }
    });

    if (updateError) {
      console.error('[auth.ts] Failed to update user metadata:', updateError);
    } else {
      console.log('[auth.ts] ✅ Stored admin data in Supabase Auth metadata');
    }

    return {
      id: user.user_id,
      email: user.user_email,
      name: user.user_name,
      role: user.user_role,
      orgId: user.org_id,
    };
  } catch (error) {
    console.error('[auth.ts] Login error:', error);
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
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRole');
  }
}
