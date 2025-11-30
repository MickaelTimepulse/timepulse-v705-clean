import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, Building, X, Edit2, Globe, CreditCard, Copy, Check } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import { supabase } from '../lib/supabase';

export default function AdminOrganizers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState<any>(null);
  const [federations, setFederations] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [selectedFederations, setSelectedFederations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    organization_name: '',
    organizer_type: 'association',
    email: '',
    mobile_phone: '',
    contact_name: '',
    siret: '',
    full_address: '',
    city: '',
    postal_code: ''
  });
  const [editFormData, setEditFormData] = useState<any>({});

  useEffect(() => {
    loadOrganizers();
    loadFederations();
  }, []);

  async function loadFederations() {
    try {
      const { data, error } = await supabase
        .from('federations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setFederations(data || []);
    } catch (error) {
      console.error('Error loading federations:', error);
    }
  }

  async function loadOrganizers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('admin_get_all_organizers');

      if (error) throw error;

      setOrganizers(data || []);
    } catch (error) {
      console.error('Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrganizer(e: React.FormEvent) {
    e.preventDefault();
    try {
      let userId: string;
      let isNewAccount = false;
      let tempPassword = '';

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
        isNewAccount = false;
        console.log('Compte existant trouvé, utilisation du profil existant');
      } else {
        tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
        isNewAccount = true;

        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
        });

        if (userError) {
          if (userError.message.includes('already registered') || userError.message.includes('already exists')) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', formData.email)
              .maybeSingle();

            if (retryProfile) {
              userId = retryProfile.id;
              isNewAccount = false;
              console.log('Profil trouvé après retry');
            } else {
              throw new Error(
                `Compte existant détecté mais profil non trouvé.\n\n` +
                `Email: ${formData.email}\n\n` +
                `Ce problème peut être résolu en exécutant cette requête SQL dans Supabase:\n\n` +
                `INSERT INTO public.profiles (id, email, created_at)\n` +
                `SELECT id, email, created_at FROM auth.users WHERE email = '${formData.email}'\n` +
                `ON CONFLICT (id) DO NOTHING;\n\n` +
                `Puis réessayez de créer l'organisateur.`
              );
            }
          } else {
            throw userError;
          }
        } else {
          if (!userData.user) throw new Error('Erreur lors de la création du compte');
          userId = userData.user.id;

          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

          if (!profileCheck) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{
                id: userId,
                email: formData.email,
                full_name: formData.contact_name,
                phone: formData.mobile_phone,
                role: 'organizer'
              }]);

            if (profileError && !profileError.message.includes('duplicate')) {
              console.error('Profile error:', profileError);
              throw new Error('Erreur lors de la création du profil');
            }
          }
        }
      }

      const { data: existingOrg } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingOrg) {
        throw new Error('Cet utilisateur est déjà enregistré comme organisateur');
      }

      const { error: orgError } = await supabase
        .from('organizers')
        .insert([{
          user_id: userId,
          organization_name: formData.organization_name,
          organizer_type: formData.organizer_type,
          email: formData.email,
          mobile_phone: formData.mobile_phone,
          contact_name: formData.contact_name,
          siret: formData.siret,
          full_address: formData.full_address,
          city: formData.city,
          postal_code: formData.postal_code,
          status: 'active'
        }]);

      if (orgError) throw orgError;

      const successMessage = isNewAccount
        ? `Organisateur créé avec succès!\nNouveau compte créé.\nMot de passe temporaire: ${tempPassword}\n(Notez-le pour le test)`
        : `Organisateur créé avec succès!\nCompte athlète existant utilisé.\nL'utilisateur peut se connecter avec son mot de passe habituel.`;

      alert(successMessage);
      setShowCreateModal(false);
      setFormData({
        organization_name: '',
        organizer_type: 'association',
        email: '',
        mobile_phone: '',
        contact_name: '',
        siret: '',
        full_address: '',
        city: '',
        postal_code: ''
      });
      loadOrganizers();
    } catch (error: any) {
      console.error('Error creating organizer:', error);
      alert('Erreur: ' + error.message);
    }
  }

  async function handleEditOrganizer(org: any) {
    try {
      setEditingOrganizer(org);
      setEditFormData({ ...org });

      const { data: orgFederations } = await supabase
        .from('organizer_federations')
        .select('federation_id')
        .eq('organizer_id', org.id);

      setSelectedFederations(orgFederations?.map(f => f.federation_id) || []);

      const { data: bank } = await supabase
        .from('organizer_bank_details')
        .select('*')
        .eq('organizer_id', org.id)
        .maybeSingle();

      setBankDetails(bank || null);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading organizer details:', error);
      alert('Erreur lors du chargement des détails');
    }
  }

  async function handleUpdateOrganizer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error: orgError } = await supabase
        .from('organizers')
        .update({
          organization_name: editFormData.organization_name,
          organizer_type: editFormData.organizer_type,
          email: editFormData.email,
          mobile_phone: editFormData.mobile_phone,
          contact_name: editFormData.contact_name,
          siret: editFormData.siret,
          full_address: editFormData.full_address,
          city: editFormData.city,
          postal_code: editFormData.postal_code,
          country: editFormData.country || 'France',
          website_url: editFormData.website_url,
          facebook_url: editFormData.facebook_url,
          instagram_url: editFormData.instagram_url,
          public_description: editFormData.public_description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrganizer.id);

      if (orgError) throw orgError;

      const { error: delFedError } = await supabase
        .from('organizer_federations')
        .delete()
        .eq('organizer_id', editingOrganizer.id);

      if (delFedError) console.error('Error deleting federations:', delFedError);

      if (selectedFederations.length > 0) {
        const { error: fedError } = await supabase
          .from('organizer_federations')
          .insert(
            selectedFederations.map(fedId => ({
              organizer_id: editingOrganizer.id,
              federation_id: fedId
            }))
          );

        if (fedError) throw fedError;
      }

      if (bankDetails && (bankDetails.iban || bankDetails.account_holder_name)) {
        const { data: existingBank } = await supabase
          .from('organizer_bank_details')
          .select('id')
          .eq('organizer_id', editingOrganizer.id)
          .maybeSingle();

        if (existingBank) {
          const { error: bankError } = await supabase
            .from('organizer_bank_details')
            .update({
              account_holder_name: bankDetails.account_holder_name,
              iban: bankDetails.iban,
              bic: bankDetails.bic,
              bank_name: bankDetails.bank_name,
              notes: bankDetails.notes,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBank.id);

          if (bankError) throw bankError;
        } else {
          const { error: bankError } = await supabase
            .from('organizer_bank_details')
            .insert([{
              organizer_id: editingOrganizer.id,
              account_holder_name: bankDetails.account_holder_name,
              iban: bankDetails.iban,
              bic: bankDetails.bic,
              bank_name: bankDetails.bank_name,
              notes: bankDetails.notes
            }]);

          if (bankError) throw bankError;
        }
      }

      alert('Organisateur mis à jour avec succès!');
      setShowEditModal(false);
      setEditingOrganizer(null);
      setBankDetails(null);
      setSelectedFederations([]);
      loadOrganizers();
    } catch (error: any) {
      console.error('Error updating organizer:', error);
      alert('Erreur: ' + error.message);
    }
  }

  function toggleFederation(fedId: string) {
    setSelectedFederations(prev =>
      prev.includes(fedId)
        ? prev.filter(id => id !== fedId)
        : [...prev, fedId]
    );
  }

  async function handleResetPassword() {
    if (!editingOrganizer) return;

    const confirmed = confirm(
      `Voulez-vous réinitialiser le mot de passe de ${editFormData.organization_name}?\n\n` +
      `Un nouveau mot de passe temporaire sera généré.`
    );

    if (!confirmed) return;

    try {
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

      const { data, error } = await supabase.rpc('admin_reset_organizer_password', {
        p_organizer_id: editingOrganizer.id,
        p_new_password: tempPassword
      });

      if (error) throw error;

      setPasswordData({
        email: data.email,
        password: tempPassword
      });
      setShowPasswordModal(true);
      setCopied(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert('Erreur lors de la réinitialisation du mot de passe: ' + error.message);
    }
  }

  function copyPassword() {
    if (passwordData) {
      navigator.clipboard.writeText(passwordData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <AdminLayout title="Organisateurs">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des organisateurs</h1>
            <p className="text-gray-600 mt-1">Gérez les comptes organisateurs et leurs événements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvel organisateur</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un organisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Événements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : organizers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun organisateur trouvé
                    </td>
                  </tr>
                ) : organizers.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{org.organization_name}</div>
                          <div className="text-xs text-gray-500">{org.organizer_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {org.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {org.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{org.event_count || 0}</span>
                      <span className="text-sm text-gray-500 ml-1">événement{org.event_count !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {org.status === 'active' ? 'Actif' : org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditOrganizer(org)}
                        className="text-pink-600 hover:text-pink-900 mr-4 inline-flex items-center"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Créer un organisateur</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateOrganizer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'organisation *
                  </label>
                  <select
                    value={formData.organizer_type}
                    onChange={(e) => setFormData({ ...formData, organizer_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  >
                    <option value="association">Association</option>
                    <option value="collectivity">Collectivité</option>
                    <option value="company">Entreprise</option>
                    <option value="individual">Particulier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'organisation *
                  </label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du contact *
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone mobile *
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile_phone}
                      onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SIRET
                    </label>
                    <input
                      type="text"
                      value={formData.siret}
                      onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse complète *
                  </label>
                  <input
                    type="text"
                    value={formData.full_address}
                    onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                  >
                    Créer l'organisateur
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingOrganizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Modifier {editFormData.organization_name}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateOrganizer} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Informations générales
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'organisation *
                      </label>
                      <input
                        type="text"
                        value={editFormData.organization_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, organization_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type d'organisation *
                      </label>
                      <select
                        value={editFormData.organizer_type || 'association'}
                        onChange={(e) => setEditFormData({ ...editFormData, organizer_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="association">Association</option>
                        <option value="club">Club</option>
                        <option value="federation">Fédération</option>
                        <option value="company">Entreprise</option>
                        <option value="municipality">Municipalité</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone mobile
                      </label>
                      <input
                        type="tel"
                        value={editFormData.mobile_phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, mobile_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du contact
                      </label>
                      <input
                        type="text"
                        value={editFormData.contact_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SIRET
                      </label>
                      <input
                        type="text"
                        value={editFormData.siret || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, siret: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Adresse
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse complète
                    </label>
                    <input
                      type="text"
                      value={editFormData.full_address || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, full_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={editFormData.city || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={editFormData.postal_code || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <input
                        type="text"
                        value={editFormData.country || 'France'}
                        onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Réseaux sociaux et web
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site web
                      </label>
                      <input
                        type="url"
                        value={editFormData.website_url || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, website_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={editFormData.facebook_url || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, facebook_url: e.target.value })}
                        placeholder="https://facebook.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={editFormData.instagram_url || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description publique
                    </label>
                    <textarea
                      value={editFormData.public_description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, public_description: e.target.value })}
                      rows={3}
                      placeholder="Description visible par les participants..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fédérations
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {federations.map((fed) => (
                      <label
                        key={fed.id}
                        className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFederations.includes(fed.id)}
                          onChange={() => toggleFederation(fed.id)}
                          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm">
                          <span className="font-medium text-gray-900">{fed.code}</span>
                          <span className="text-gray-500 ml-2">- {fed.short_name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Informations bancaires
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titulaire du compte
                      </label>
                      <input
                        type="text"
                        value={bankDetails?.account_holder_name || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la banque
                      </label>
                      <input
                        type="text"
                        value={bankDetails?.bank_name || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN
                      </label>
                      <input
                        type="text"
                        value={bankDetails?.iban || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BIC
                      </label>
                      <input
                        type="text"
                        value={bankDetails?.bic || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value })}
                        placeholder="BNPAFRPPXXX"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={bankDetails?.notes || ''}
                      onChange={(e) => setBankDetails({ ...bankDetails, notes: e.target.value })}
                      rows={2}
                      placeholder="Notes internes sur les informations bancaires..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Réinitialiser le mot de passe
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && passwordData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Mot de passe réinitialisé
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">
                    Le mot de passe a été réinitialisé avec succès !
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de l'organisateur
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900">
                    {passwordData.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe temporaire
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={passwordData.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono text-lg"
                    />
                    <button
                      onClick={copyPassword}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 text-sm">
                    <strong>Important :</strong> Transmettez ce mot de passe à l'organisateur de manière sécurisée.
                    Il devra le changer lors de sa première connexion.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
