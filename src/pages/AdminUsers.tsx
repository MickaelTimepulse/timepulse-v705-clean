import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, Clock, Activity, Plus, Trash2, X, AlertCircle, ArrowLeft, CheckSquare, Square, Mail, Edit, TrendingUp, Eye, BarChart3 } from 'lucide-react';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  role_id: string | null;
  role_name: string | null;
  role_description: string | null;
  is_super_admin: boolean;
  created_at: string;
  last_login: string | null;
  total_sessions: number;
}

interface Permission {
  id: string;
  module: string;
  permission: string;
  label: string;
  description: string;
  granted: boolean;
  custom: boolean;
}

interface UserPermissions {
  user: {
    id: string;
    email: string;
    role_name: string;
    is_super_admin: boolean;
  };
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_super_admin: boolean;
}

interface ActivityStat {
  user_id: string;
  user_name: string;
  user_email: string;
  total_actions: number;
  login_count: number;
  last_activity: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  module: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: ''
  });

  const [editUserData, setEditUserData] = useState({
    name: '',
    email: ''
  });

  const adminEmail = localStorage.getItem('adminEmail') || authUser?.email || '';
  const adminName = localStorage.getItem('adminName') || authUser?.name || '';
  const currentUser = users.find(u => u.email === adminEmail);

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadActivityStats();
  }, []);

  const loadActivityStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_activity_stats', { p_days: 30 });

      if (error) throw error;
      setActivityStats(data || []);
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  };

  const loadUserLogs = async (userId: string) => {
    try {
      setLogsLoading(true);

      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSelectedUserLogs(data || []);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Error loading user logs:', error);
      setError('Erreur lors du chargement des logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      // Check if user is authenticated in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('name');

      if (error) {
        if (error.code === '42501') {
          setError('Permissions insuffisantes. Veuillez vous reconnecter via /admin/login');
          return;
        }
        throw error;
      }
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      setError('Erreur lors du chargement des rôles. Reconnectez-vous si le problème persiste.');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('admin_get_all_users');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.rpc('admin_get_user_permissions', {
        p_user_id: userId
      });

      if (error) throw error;
      setUserPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setError('Erreur lors du chargement des permissions');
    }
  };

  const handleEditPermissions = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    await loadUserPermissions(user.id);
  };

  const handleTogglePermission = async (permissionId: string, currentlyGranted: boolean) => {
    if (!selectedUser || !userPermissions) return;

    if (!adminEmail) {
      setError('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { data, error } = await supabase.rpc('admin_update_user_permissions', {
        p_user_id: selectedUser.id,
        p_permission_id: permissionId,
        p_granted: !currentlyGranted,
        p_granted_by_email: adminEmail
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      if (data && !data.success) {
        setError(data.error || 'Erreur lors de la modification de la permission');
        return;
      }

      await loadUserPermissions(selectedUser.id);
    } catch (error: any) {
      console.error('Error updating permission:', error);
      setError(error.message || 'Erreur lors de la mise à jour de la permission');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // Hash password and create user
      const { data: userId, error: createError } = await supabase.rpc('admin_create_user', {
        p_email: newUser.email,
        p_name: newUser.name,
        p_password: newUser.password,
        p_role_id: null
      });

      if (createError) throw createError;

      // Send welcome email
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'admin_welcome',
          to: newUser.email,
          data: {
            name: newUser.name,
            email: newUser.email,
            password: newUser.password,
            loginUrl: `${window.location.origin}/admin/login`
          }
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the creation if email fails
      }

      setShowCreateModal(false);
      setNewUser({ email: '', name: '', password: '' });
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Erreur lors de la création de l\'utilisateur');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckAll = async () => {
    if (!selectedUser || !userPermissions) return;

    try {
      setSaving(true);
      setError(null);

      // Update all permissions to granted = true
      const updatePromises = userPermissions.permissions.map(async (perm) => {
        if (!perm.granted) {
          return supabase.rpc('admin_update_user_permissions', {
            p_user_id: selectedUser.id,
            p_permission_id: perm.id,
            p_granted: true,
            p_granted_by_email: adminEmail
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
      await loadUserPermissions(selectedUser.id);
    } catch (error) {
      console.error('Error checking all permissions:', error);
      setError('Erreur lors de l\'activation de toutes les permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleUncheckAll = async () => {
    if (!selectedUser || !userPermissions) return;

    try {
      setSaving(true);
      setError(null);

      // Update all permissions to granted = false
      const updatePromises = userPermissions.permissions.map(async (perm) => {
        if (perm.granted) {
          return supabase.rpc('admin_update_user_permissions', {
            p_user_id: selectedUser.id,
            p_permission_id: perm.id,
            p_granted: false,
            p_granted_by_email: adminEmail
          });
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
      await loadUserPermissions(selectedUser.id);
    } catch (error) {
      console.error('Error unchecking all permissions:', error);
      setError('Erreur lors de la désactivation de toutes les permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleResendEmail = async (user: AdminUser) => {
    try {
      setSaving(true);
      setError(null);

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'admin_credentials_reminder',
          to: user.email,
          data: {
            name: user.name,
            email: user.email,
            loginUrl: `${window.location.origin}/admin/login`
          }
        }
      });

      if (emailError) throw emailError;

      alert('Email de rappel envoyé avec succès');
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser({ id: user.id, name: user.name, email: user.email });
    setEditUserData({ name: user.name, email: user.email });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      setSaving(true);
      setError(null);

      // Get email from localStorage or auth context
      let currentEmail = localStorage.getItem('adminEmail');

      // Fallback to auth context if not in localStorage
      if (!currentEmail && authUser) {
        currentEmail = authUser.email;
        // Store it for future use
        localStorage.setItem('adminEmail', authUser.email);
        localStorage.setItem('adminName', authUser.name || authUser.email);
        localStorage.setItem('adminId', authUser.id);
        localStorage.setItem('adminRole', authUser.role);
      }

      if (!currentEmail) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      console.log('Updating user with:', {
        userId: editingUser.id,
        currentEmail,
        newName: editUserData.name,
        newEmail: editUserData.email
      });

      const { data, error: updateError } = await supabase.rpc('admin_update_user', {
        p_user_id: editingUser.id,
        p_name: editUserData.name,
        p_email: editUserData.email,
        p_current_user_email: currentEmail
      });

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Update result:', data);

      if (data && !data.success) {
        setError(data.error || 'Erreur lors de la modification');
        return;
      }

      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} (${user.email}) ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get email from localStorage or auth context
      let currentEmail = localStorage.getItem('adminEmail');

      // Fallback to auth context if not in localStorage
      if (!currentEmail && authUser) {
        currentEmail = authUser.email;
        // Store it for future use
        localStorage.setItem('adminEmail', authUser.email);
        localStorage.setItem('adminName', authUser.name || authUser.email);
        localStorage.setItem('adminId', authUser.id);
        localStorage.setItem('adminRole', authUser.role);
      }

      if (!currentEmail) {
        setError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      console.log('Deleting user with:', {
        userId: user.id,
        currentEmail,
        targetUser: user.email
      });

      // Use RPC function to delete user
      const { data, error: deleteError } = await supabase.rpc('admin_delete_user', {
        p_user_id_to_delete: user.id,
        p_current_user_email: currentEmail
      });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      console.log('Delete result:', data);

      if (data && !data.success) {
        setError(data.error || 'Erreur lors de la suppression');
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setSaving(false);
    }
  };

  const groupPermissionsByModule = (permissions: Permission[]) => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(perm => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    });
    return grouped;
  };

  const getModuleName = (module: string) => {
    const names: { [key: string]: string } = {
      dashboard: 'Tableau de bord',
      events: 'Événements',
      organizers: 'Organisateurs',
      entries: 'Inscriptions',
      results: 'Résultats',
      finance: 'Finance',
      email: 'Emails',
      settings: 'Paramètres',
      users: 'Utilisateurs Admin',
      pages: 'Pages de service',
      backups: 'Sauvegardes'
    };
    return names[module] || module;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <ProtectedAdminRoute module="users" permission="view" title="Utilisateurs Admin">
      <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Erreur</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </button>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg border border-blue-200 shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Connecté en tant que</p>
                <p className="text-base font-bold text-blue-900">{adminName || adminEmail}</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2">
                {currentUser.is_super_admin && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-lg shadow-md">
                    <Shield className="w-4 h-4" />
                    Super Admin
                  </span>
                )}
                {!currentUser.is_super_admin && currentUser.role === 'admin' && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-semibold rounded-lg shadow-md">
                    <Shield className="w-4 h-4" />
                    Admin
                  </span>
                )}
                {!currentUser.is_super_admin && currentUser.role === 'user' && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg shadow-md">
                    <Users className="w-4 h-4" />
                    Utilisateur
                  </span>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs Admin</h1>
          <p className="text-gray-600">Gérez les accès et permissions de votre équipe</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? 'Masquer stats' : 'Statistiques'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && activityStats.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Statistiques d'activité (30 derniers jours)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {activityStats.map((stat) => {
              const totalActions = activityStats.reduce((sum, s) => sum + Number(s.total_actions), 0);
              const percentage = totalActions > 0 ? (Number(stat.total_actions) / totalActions * 100).toFixed(1) : '0';

              return (
                <div key={stat.user_id} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{stat.user_name}</h3>
                      <p className="text-sm text-gray-500">{stat.user_email}</p>
                    </div>
                    <button
                      onClick={() => loadUserLogs(stat.user_id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Voir les logs"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Actions totales</span>
                      <span className="font-bold text-purple-600">{stat.total_actions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Connexions</span>
                      <span className="font-semibold text-blue-600">{stat.login_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">% d'activité</span>
                      <span className="font-semibold text-green-600">{percentage}%</span>
                    </div>
                    {stat.last_activity && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                        Dernière activité : {new Date(stat.last_activity).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-semibold text-gray-900 mb-3">Répartition de l'activité de l'équipe</h3>
            <div className="space-y-2">
              {activityStats.map((stat) => {
                const totalActions = activityStats.reduce((sum, s) => sum + Number(s.total_actions), 0);
                const percentage = totalActions > 0 ? (Number(stat.total_actions) / totalActions * 100).toFixed(1) : '0';

                return (
                  <div key={stat.user_id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{stat.user_name}</span>
                        <span className="text-sm text-gray-600">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 min-w-[60px] text-right">
                      {stat.total_actions} actions
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dernière connexion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sessions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.is_super_admin && (
                      <Shield className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.is_super_admin
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role_name || user.role || 'Aucun rôle'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(user.last_login).toLocaleDateString('fr-FR')}
                    </div>
                  ) : (
                    'Jamais'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.total_sessions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-purple-600 hover:text-purple-900 inline-flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleEditPermissions(user)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <Shield className="w-4 h-4" />
                      Permissions
                    </button>
                    <button
                      onClick={() => handleResendEmail(user)}
                      className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                    >
                      <Mail className="w-4 h-4" />
                      Renvoyer email
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvel utilisateur admin</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', name: '', password: '' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Après création, vous pourrez configurer les permissions spécifiques de cet utilisateur. Un email de bienvenue avec les identifiants sera envoyé automatiquement.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUser({ email: '', name: '', password: '' });
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Modifier l'utilisateur</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note :</strong> La modification de l'email affectera l'adresse utilisée pour la connexion.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && userPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Permissions - {selectedUser.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {userPermissions.user.role_name || 'Aucun rôle'}
                  {userPermissions.user.is_super_admin && (
                    <span className="ml-2 text-red-600 font-semibold">(Super Admin)</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                  setUserPermissions(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {userPermissions.user.is_super_admin ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Super Administrateur</h3>
                    <p className="text-sm text-red-700">
                      Cet utilisateur a accès complet à toutes les fonctionnalités. Les permissions individuelles ne s'appliquent pas.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex gap-3 justify-end">
                    <button
                      onClick={handleCheckAll}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Tout cocher
                    </button>
                    <button
                      onClick={handleUncheckAll}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Square className="w-4 h-4" />
                      Tout décocher
                    </button>
                  </div>
                  <div className="space-y-6">
                  {Object.entries(groupPermissionsByModule(userPermissions.permissions)).map(
                    ([module, permissions]) => (
                      <div key={module} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          {getModuleName(module)}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={perm.granted}
                                onChange={() => handleTogglePermission(perm.id, perm.granted)}
                                disabled={saving}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {perm.label}
                                  {perm.custom && (
                                    <span className="ml-2 text-xs text-blue-600">(Personnalisé)</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{perm.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                  setUserPermissions(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-600" />
                  Logs d'activité
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  100 dernières actions de l'utilisateur
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLogsModal(false);
                  setSelectedUserLogs([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {logsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600 mt-2">Chargement des logs...</p>
                </div>
              ) : selectedUserLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune activité enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedUserLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              log.action === 'login'
                                ? 'bg-green-100 text-green-700'
                                : log.action === 'logout'
                                ? 'bg-gray-100 text-gray-700'
                                : log.action === 'create'
                                ? 'bg-blue-100 text-blue-700'
                                : log.action === 'update'
                                ? 'bg-yellow-100 text-yellow-700'
                                : log.action === 'delete'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {log.action.toUpperCase()}
                          </span>
                          {log.module && (
                            <span className="text-sm font-medium text-gray-700">
                              {log.module}
                            </span>
                          )}
                          {log.entity_type && (
                            <span className="text-sm text-gray-500">
                              → {log.entity_type}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Détails :</p>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">IP:</span> {log.ip_address}
                          </span>
                        )}
                        {log.entity_id && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">ID:</span> {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowLogsModal(false);
                  setSelectedUserLogs([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedAdminRoute>
  );
}
