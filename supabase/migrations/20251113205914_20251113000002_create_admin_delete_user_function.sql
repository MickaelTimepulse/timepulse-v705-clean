/*
  # Create function to delete admin users

  1. Changes
    - Create function admin_delete_user
    - Allows super admins to delete any user
    - Allows admins to delete non-super-admin users
    - Prevents self-deletion

  2. Security
    - Verifies the deleting user has proper permissions
    - Prevents deletion of super admins by non-super admins
    - Prevents users from deleting themselves
*/

CREATE OR REPLACE FUNCTION admin_delete_user(
  p_user_id_to_delete uuid,
  p_current_user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user record;
  v_user_to_delete record;
BEGIN
  -- Get current user info
  SELECT id, email, role
  INTO v_current_user
  FROM admin_users
  WHERE email = p_current_user_email;

  IF v_current_user IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur actuel non trouvé'
    );
  END IF;

  -- Get user to delete info
  SELECT id, email, role
  INTO v_user_to_delete
  FROM admin_users
  WHERE id = p_user_id_to_delete;

  IF v_user_to_delete IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur à supprimer non trouvé'
    );
  END IF;

  -- Prevent self-deletion
  IF v_current_user.id = v_user_to_delete.id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas supprimer votre propre compte'
    );
  END IF;

  -- Check permissions
  -- Super admins can delete anyone
  -- Regular admins can only delete non-super-admin users
  IF v_current_user.role != 'super_admin' THEN
    IF v_user_to_delete.role = 'super_admin' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Seul un super admin peut supprimer un autre super admin'
      );
    END IF;

    IF v_current_user.role NOT IN ('admin', 'super_admin') THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Vous n''avez pas la permission de supprimer des utilisateurs'
      );
    END IF;
  END IF;

  -- Delete user
  DELETE FROM admin_users
  WHERE id = p_user_id_to_delete;

  -- Log the action
  INSERT INTO admin_activity_logs (
    user_id,
    user_email,
    action,
    module,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_current_user.id,
    v_current_user.email,
    'delete',
    'users',
    'admin_user',
    p_user_id_to_delete,
    json_build_object(
      'deleted_user_email', v_user_to_delete.email,
      'deleted_user_role', v_user_to_delete.role
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Utilisateur supprimé avec succès'
  );
END;
$$;
