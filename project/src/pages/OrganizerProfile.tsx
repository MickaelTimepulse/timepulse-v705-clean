import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Save, ArrowLeft, CheckCircle2, Upload, CreditCard, Shield, X } from 'lucide-react';
import OrganizerLayout from '../components/OrganizerLayout';
import CityAutocomplete from '../components/CityAutocomplete';
import { supabase } from '../lib/supabase';
import { showErrorToast } from '../lib/error-handler';

export default function OrganizerProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [organizer, setOrganizer] = useState<any>(null);
  const [federations, setFederations] = useState<any[]>([]);
  const [selectedFederations, setSelectedFederations] = useState<string[]>([]);
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    iban: '',
    bic: '',
    bank_name: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    organization_name: '',
    organizer_type: 'association' as 'association' | 'club' | 'federation' | 'company' | 'municipality',
    contact_name: '',
    email: '',
    mobile_phone: '',
    landline_phone: '',
    full_address: '',
    city: '',
    postal_code: '',
    country_code: '',
    siret: '',
    website: '',
    instagram_url: '',
    facebook_url: '',
  });

  useEffect(() => {
    loadOrganizer();
    loadFederations();
  }, []);

  async function loadFederations() {
    try {
      const { data, error } = await supabase
        .from('federations')
        .select('*')
        .eq('active', true)
        .order('code');

      if (error) throw error;
      setFederations(data || []);
    } catch (error) {
      console.error('Error loading federations:', error);
    }
  }

  async function loadOrganizer() {
    try {
      console.log('🔄 Loading organizer data...');
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('❌ No user found, redirecting to login');
        navigate('/organizer/login');
        return;
      }

      console.log('👤 User ID:', user.id);

      const { data: organizerData, error: orgError } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) {
        console.error('❌ Error loading organizer:', orgError);
        throw orgError;
      }

      console.log('✅ Organizer data loaded:', organizerData);
      setOrganizer(organizerData);
      setFormData({
        organization_name: organizerData.organization_name || '',
        organizer_type: organizerData.organizer_type || 'association',
        contact_name: organizerData.contact_name || '',
        email: organizerData.email || '',
        mobile_phone: organizerData.mobile_phone || '',
        landline_phone: organizerData.landline_phone || '',
        full_address: organizerData.full_address || '',
        city: organizerData.city || '',
        postal_code: organizerData.postal_code || '',
        country_code: organizerData.country_code || '',
        siret: organizerData.siret || '',
        website: organizerData.website || '',
        instagram_url: organizerData.instagram_url || '',
        facebook_url: organizerData.facebook_url || '',
      });

      if (organizerData.logo_file_url) {
        setLogoPreview(organizerData.logo_file_url);
      }

      const { data: orgFederations } = await supabase
        .from('organizer_federations')
        .select('federation_id')
        .eq('organizer_id', organizerData.id);

      if (orgFederations) {
        setSelectedFederations(orgFederations.map(f => f.federation_id));
      }

      const { data: bankData } = await supabase
        .from('organizer_bank_details')
        .select('*')
        .eq('organizer_id', organizerData.id)
        .maybeSingle();

      if (bankData) {
        setBankDetails({
          account_holder_name: bankData.account_holder_name || '',
          iban: bankData.iban || '',
          bic: bankData.bic || '',
          bank_name: bankData.bank_name || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading organizer:', error);
      const errorMessage = showErrorToast(error, 'Erreur lors du chargement du profil');
      setError(errorMessage);
      setTimeout(() => setError(''), 10000);
    } finally {
      setLoading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier doit faire moins de 5 Mo');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile || !organizer) return null;

    try {
      setUploadingLogo(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organizer-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organizer-logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Erreur lors de l\'upload du logo');
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }

  function toggleFederation(federationId: string) {
    setSelectedFederations(prev => {
      if (prev.includes(federationId)) {
        return prev.filter(id => id !== federationId);
      } else {
        return [...prev, federationId];
      }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    console.log('=== SAVING ORGANIZER PROFILE ===');
    console.log('Organizer ID:', organizer.id);
    console.log('Form Data:', formData);
    console.log('Selected Federations:', selectedFederations);

    try {
      let logoUrl = organizer.logo_file_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      const isProfileComplete = !!(
        formData.organization_name &&
        formData.contact_name &&
        formData.email &&
        formData.mobile_phone &&
        formData.full_address &&
        formData.city &&
        formData.postal_code
      );

      const updateData = {
        organization_name: formData.organization_name,
        organizer_type: formData.organizer_type,
        contact_name: formData.contact_name,
        email: formData.email,
        mobile_phone: formData.mobile_phone,
        landline_phone: formData.landline_phone || null,
        full_address: formData.full_address,
        city: formData.city,
        postal_code: formData.postal_code,
        country_code: formData.country_code || null,
        siret: formData.siret || null,
        website: formData.website || null,
        instagram_url: formData.instagram_url || null,
        facebook_url: formData.facebook_url || null,
        logo_file_url: logoUrl,
        is_profile_complete: isProfileComplete,
        updated_at: new Date().toISOString(),
      };

      console.log('📤 Données à enregistrer:', updateData);
      console.log('🔑 Adresse complète:', updateData.full_address);
      console.log('🏙️ Ville:', updateData.city);
      console.log('📮 Code postal:', updateData.postal_code);
      console.log('🌍 Pays:', updateData.country_code);

      const { error: updateError } = await supabase
        .from('organizers')
        .update(updateData)
        .eq('id', organizer.id);

      if (updateError) {
        console.error('❌ Error updating organizer:', updateError);
        throw updateError;
      }

      console.log('✅ Organizer updated successfully');

      // Fetch existing federations
      const { data: existingFeds } = await supabase
        .from('organizer_federations')
        .select('federation_id')
        .eq('organizer_id', organizer.id);

      const existingFedIds = existingFeds?.map(f => f.federation_id) || [];

      // Determine which to add and which to remove
      const toAdd = selectedFederations.filter(id => !existingFedIds.includes(id));
      const toRemove = existingFedIds.filter(id => !selectedFederations.includes(id));

      // Remove federations no longer selected
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('organizer_federations')
          .delete()
          .eq('organizer_id', organizer.id)
          .in('federation_id', toRemove);

        if (deleteError) {
          console.error('Error deleting federations:', deleteError);
          // Continue anyway - this is not critical
        }
      }

      // Add new federations
      if (toAdd.length > 0) {
        const federationInserts = toAdd.map(fedId => ({
          organizer_id: organizer.id,
          federation_id: fedId,
        }));

        const { error: fedError } = await supabase
          .from('organizer_federations')
          .insert(federationInserts);

        if (fedError) {
          console.error('Error inserting federations:', fedError);
          throw fedError;
        }
      }

      const { data: existingBank } = await supabase
        .from('organizer_bank_details')
        .select('id')
        .eq('organizer_id', organizer.id)
        .maybeSingle();

      if (bankDetails.iban || bankDetails.bic || bankDetails.account_holder_name) {
        if (existingBank) {
          const { error: bankUpdateError } = await supabase
            .from('organizer_bank_details')
            .update({
              account_holder_name: bankDetails.account_holder_name,
              iban: bankDetails.iban,
              bic: bankDetails.bic,
              bank_name: bankDetails.bank_name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingBank.id);

          if (bankUpdateError) {
            console.error('Error updating bank details:', bankUpdateError);
          }
        } else {
          const { error: bankInsertError } = await supabase
            .from('organizer_bank_details')
            .insert({
              organizer_id: organizer.id,
              account_holder_name: bankDetails.account_holder_name,
              iban: bankDetails.iban,
              bic: bankDetails.bic,
              bank_name: bankDetails.bank_name,
            });

          if (bankInsertError) {
            console.error('Error inserting bank details:', bankInsertError);
          }
        }
      }

      console.log('✅ All operations completed successfully!');
      setSuccess('Profil mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('❌ Error in handleSubmit:', err);
      const errorMessage = showErrorToast(err, 'Erreur lors de la mise à jour du profil');
      setError(errorMessage);
      setTimeout(() => setError(''), 10000);
    } finally {
      setSaving(false);
    }
  }

  function calculateCompletion(): number {
    const requiredFields = [
      formData.organization_name,
      formData.contact_name,
      formData.email,
      formData.mobile_phone,
      formData.full_address,
      formData.city,
      formData.postal_code,
    ];

    const optionalFields = [
      formData.siret,
      formData.website,
      formData.landline_phone,
      formData.instagram_url,
      formData.facebook_url,
      logoPreview,
      selectedFederations.length > 0,
      bankDetails.iban,
    ];

    const requiredFilled = requiredFields.filter(field => field && String(field).trim() !== '').length;
    const optionalFilled = optionalFields.filter(field => field && (typeof field === 'boolean' ? field : String(field).trim() !== '')).length;

    const requiredWeight = 0.7;
    const optionalWeight = 0.3;

    const requiredScore = (requiredFilled / requiredFields.length) * requiredWeight;
    const optionalScore = (optionalFilled / optionalFields.length) * optionalWeight;

    return Math.round((requiredScore + optionalScore) * 100);
  }

  if (loading) {
    return (
      <OrganizerLayout title="Mon Profil">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  const completion = calculateCompletion();

  return (
    <OrganizerLayout title="Mon Profil">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
              <p className="text-gray-600">Gérez les informations de votre organisation</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">Profil complété à</div>
              <div className="text-3xl font-bold text-pink-600">{completion}%</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span className="font-medium">{completion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  completion === 100
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500'
                }`}
                style={{ width: `${completion}%` }}
              ></div>
            </div>
            {completion === 100 && (
              <div className="flex items-center text-green-600 text-sm mt-2">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Profil complet !
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-pink-600" />
                Logo de l'organisation
              </h2>
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block">
                    <span className="sr-only">Choisir un logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-pink-50 file:text-pink-700
                        hover:file:bg-pink-100"
                    />
                  </label>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, SVG ou WEBP. Max 5 Mo.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-pink-600" />
                Informations de l'organisation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'organisation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'organisation <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.organizer_type}
                    onChange={(e) => setFormData({ ...formData, organizer_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="association">Association</option>
                    <option value="club">Club</option>
                    <option value="federation">Fédération</option>
                    <option value="company">Entreprise</option>
                    <option value="municipality">Municipalité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SIRET
                  </label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="12345678901234"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://instagram.com/votre_compte"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://facebook.com/votre_page"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-pink-600" />
                Fédérations
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez les fédérations dont vous dépendez
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {federations.map((federation) => (
                  <label
                    key={federation.id}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFederations.includes(federation.id)
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFederations.includes(federation.id)}
                      onChange={() => toggleFederation(federation.id)}
                      className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                    />
                    {federation.logo_url && (
                      <img
                        src={federation.logo_url}
                        alt={`Logo ${federation.code}`}
                        className="w-10 h-10 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{federation.code}</div>
                      <div className="text-xs text-gray-500">{federation.short_name}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-pink-600" />
                Informations bancaires (RIB)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titulaire du compte
                  </label>
                  <input
                    type="text"
                    value={bankDetails.account_holder_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={bankDetails.iban}
                    onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BIC
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bic}
                    onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="BNPAFRPP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la banque
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bank_name}
                    onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="BNP Paribas"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-pink-600" />
                Coordonnées
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile_phone}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone fixe
                  </label>
                  <input
                    type="tel"
                    value={formData.landline_phone}
                    onChange={(e) => setFormData({ ...formData, landline_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-pink-600" />
                Adresse
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_address}
                    onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="123 rue de la République"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville européenne (autocomplete)
                  </label>
                  <CityAutocomplete
                    value={formData.city}
                    onCitySelect={(city, postalCode, countryCode) => {
                      setFormData({
                        ...formData,
                        city,
                        postal_code: postalCode,
                        country_code: countryCode
                      });
                    }}
                    placeholder="Rechercher une ville européenne..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Si votre ville n'apparaît pas, remplissez les champs ci-dessous
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Le Plessis-Macé"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="49770"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.country_code || ''}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="FRA">France</option>
                    <option value="BEL">Belgique</option>
                    <option value="CHE">Suisse</option>
                    <option value="LUX">Luxembourg</option>
                    <option value="DEU">Allemagne</option>
                    <option value="ESP">Espagne</option>
                    <option value="ITA">Italie</option>
                    <option value="GBR">Royaume-Uni</option>
                    <option value="PRT">Portugal</option>
                    <option value="NLD">Pays-Bas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/organizer/dashboard')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploadingLogo}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
              >
                {saving || uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OrganizerLayout>
  );
}
