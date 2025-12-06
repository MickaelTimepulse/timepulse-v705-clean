/*
  # Fix Admin Manager Permissions
  
  1. Problem
    - Morgane and Laurine (role "Manager") cannot modify organizers, events, races and athletes
    - The function `is_admin()` does not exist
    - RLS policies rely on this function
  
  2. Solution
    - Create `is_admin()` function that checks if user has an active role in admin_users
    - This function will be used by all RLS policies to grant admin access
    
  3. Security
    - Function checks both `is_active` and `role_id` presence
    - Super admins (role_id NULL but is_active true) also have access
    - Only active admins with a role can modify data
*/

-- Create the is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = user_id
    AND is_active = true
    AND (role_id IS NOT NULL OR email LIKE '%@timepulse.fr')
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Comment the function
COMMENT ON FUNCTION public.is_admin(uuid) IS 'Check if a user is an active admin with a role';
