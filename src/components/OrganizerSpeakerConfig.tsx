import { useState, useEffect } from 'react';
import {
  Mic,
  Calendar,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Users,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrganizerSpeakerConfigProps {
  eventId: string;
  organizerId: string;
}

interface SpeakerAccess {
  id: string;
  is_enabled: boolean;
  access_code: string;
  speaker_name: string;
  speaker_email: string | null;
  start_date: string;
  end_date: string;
  show_reference_times: boolean;
  show_timepulse_index: boolean;
  show_betrail_index: boolean;
  show_utmb_index: boolean;
  show_history: boolean;
  show_statistics: boolean;
  custom_notes: string | null;
}

interface Sponsor {
  id: string;
  name: string;
  category: string;
  logo_url: string | null;
  description: string | null;
  mention_frequency: string;
  keywords: string[];
  website: string | null;
  order_index: number;
  is_active: boolean;
}

export default function OrganizerSpeakerConfig({ eventId, organizerId }: OrganizerSpeakerConfigProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [speakerAccess, setSpeakerAccess] = useState<SpeakerAccess | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sponsors' | 'activity'>('config');
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    is_enabled: false,
    speaker_name: '',
    speaker_email: '',
    start_date: '',
    end_date: '',
    show_reference_times: true,
    show_timepulse_index: true,
    show_betrail_index: false,
    show_utmb_index: false,
    show_history: false,
    show_statistics: true,
    custom_notes: '',
  });

  const [sponsorFormData, setSponsorFormData] = useState({
    name: '',
    category: 'Partenaire',
    logo_url: '',
    description: '',
    mention_frequency: 'Moyenne',
    keywords: [] as string[],
    website: '',
    is_active: true,
  });

  useEffect(() => {
    loadSpeakerAccess();
    loadSponsors();
  }, [eventId]);

  const loadSpeakerAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('speaker_access')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSpeakerAccess(data);
        setFormData({
          is_enabled: data.is_enabled,
          speaker_name: data.speaker_name,
          speaker_email: data.speaker_email || '',
          start_date: data.start_date.split('T')[0],
          end_date: data.end_date.split('T')[0],
          show_reference_times: data.show_reference_times,
          show_timepulse_index: data.show_timepulse_index,
          show_betrail_index: data.show_betrail_index,
          show_utmb_index: data.show_utmb_index,
          show_history: data.show_history,
          show_statistics: data.show_statistics,
          custom_notes: data.custom_notes || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading speaker access:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSponsors = async () => {
    try {
      const { data, error } = await supabase
        .from('speaker_sponsors')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index');

      if (error) throw error;
      setSponsors(data || []);
    } catch (err: any) {
      console.error('Error loading sponsors:', err);
    }
  };

  const loadActivityLogs = async () => {
    if (!speakerAccess) return;

    try {
      const { data, error } = await supabase
        .from('speaker_activity_log')
        .select('*')
        .eq('speaker_access_id', speakerAccess.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (err: any) {
      console.error('Error loading activity logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity' && speakerAccess) {
      loadActivityLogs();
    }
  }, [activeTab, speakerAccess]);

  const generateAccessCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_speaker_access_code');
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error generating access code:', err);
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.speaker_name || !formData.start_date || !formData.end_date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (speakerAccess) {
        // Update existing
        const { error } = await supabase
          .from('speaker_access')
          .update({
            is_enabled: formData.is_enabled,
            speaker_name: formData.speaker_name,
            speaker_email: formData.speaker_email || null,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
            show_reference_times: formData.show_reference_times,
            show_timepulse_index: formData.show_timepulse_index,
            show_betrail_index: formData.show_betrail_index,
            show_utmb_index: formData.show_utmb_index,
            show_history: formData.show_history,
            show_statistics: formData.show_statistics,
            custom_notes: formData.custom_notes || null,
          })
          .eq('id', speakerAccess.id);

        if (error) throw error;
      } else {
        // Create new
        const accessCode = await generateAccessCode();
        if (!accessCode) throw new Error('Failed to generate access code');

        const { error } = await supabase
          .from('speaker_access')
          .insert({
            event_id: eventId,
            organizer_id: organizerId,
            access_code: accessCode,
            is_enabled: formData.is_enabled,
            speaker_name: formData.speaker_name,
            speaker_email: formData.speaker_email || null,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
            show_reference_times: formData.show_reference_times,
            show_timepulse_index: formData.show_timepulse_index,
            show_betrail_index: formData.show_betrail_index,
            show_utmb_index: formData.show_utmb_index,
            show_history: formData.show_history,
            show_statistics: formData.show_statistics,
            custom_notes: formData.custom_notes || null,
          });

        if (error) throw error;
      }

      await loadSpeakerAccess();
      alert('Configuration enregistrée avec succès !');
    } catch (err: any) {
      console.error('Error saving:', err);
      alert('Erreur lors de l\'enregistrement : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyAccessCode = () => {
    if (speakerAccess) {
      navigator.clipboard.writeText(speakerAccess.access_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleSaveSponsor = async () => {
    if (!sponsorFormData.name) {
      alert('Le nom du sponsor est obligatoire');
      return;
    }

    try {
      if (editingSponsor) {
        const { error } = await supabase
          .from('speaker_sponsors')
          .update({
            name: sponsorFormData.name,
            category: sponsorFormData.category,
            logo_url: sponsorFormData.logo_url || null,
            description: sponsorFormData.description || null,
            mention_frequency: sponsorFormData.mention_frequency,
            keywords: sponsorFormData.keywords,
            website: sponsorFormData.website || null,
            is_active: sponsorFormData.is_active,
          })
          .eq('id', editingSponsor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('speaker_sponsors')
          .insert({
            event_id: eventId,
            organizer_id: organizerId,
            name: sponsorFormData.name,
            category: sponsorFormData.category,
            logo_url: sponsorFormData.logo_url || null,
            description: sponsorFormData.description || null,
            mention_frequency: sponsorFormData.mention_frequency,
            keywords: sponsorFormData.keywords,
            website: sponsorFormData.website || null,
            order_index: sponsors.length,
            is_active: sponsorFormData.is_active,
          });

        if (error) throw error;
      }

      await loadSponsors();
      setShowSponsorModal(false);
      setEditingSponsor(null);
      setSponsorFormData({
        name: '',
        category: 'Partenaire',
        logo_url: '',
        description: '',
        mention_frequency: 'Moyenne',
        keywords: [],
        website: '',
        is_active: true,
      });
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    if (!confirm('Supprimer ce sponsor ?')) return;

    try {
      const { error } = await supabase
        .from('speaker_sponsors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSponsors();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Configuration
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sponsors')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'sponsors'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Sponsors ({sponsors.length})
          </div>
        </button>
        {speakerAccess && (
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activité
            </div>
          </button>
        )}
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          {/* Access Code Display */}
          {speakerAccess && (
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Code d'accès Speaker</h3>

              {/* Code Display */}
              <div className="bg-white rounded-lg p-4 border-2 border-rose-300 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Code unique</p>
                    <p className="text-3xl font-mono font-bold text-rose-600 tracking-wider">
                      {showAccessCode ? speakerAccess.access_code : '••••••••'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={showAccessCode ? "Masquer le code" : "Afficher le code"}
                    >
                      {showAccessCode ? (
                        <EyeOff className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={copyAccessCode}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copier le code"
                    >
                      {codeCopied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Connection Link */}
              <div className="bg-white rounded-lg p-4 border-2 border-rose-300 mb-3">
                <p className="text-sm text-gray-600 mb-2">Lien de connexion pour le speaker</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/speaker/login`}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700 font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/speaker/login`);
                      alert('Lien copié !');
                    }}
                    className="px-3 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors flex items-center gap-1"
                    title="Copier le lien"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copier</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Le speaker devra saisir le code manuellement (ci-dessus) sur cette page pour se connecter
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Confidentialité des données</p>
                    <p className="mb-2">Le speaker aura accès uniquement aux données suivantes :</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Nom, prénom, année de naissance</li>
                      <li>Sexe et catégorie</li>
                      <li>Club, association ou entreprise</li>
                      <li>Numéro de dossard</li>
                      <li>Données optionnelles que vous autorisez (indices, temps de référence, historique)</li>
                    </ul>
                    <p className="mt-2 font-medium text-blue-900">
                      ❌ Aucun accès aux données sensibles : email, téléphone, adresse, paiement
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-rose-700 mt-3">
                Partagez ce lien avec votre speaker pour qu'il puisse se connecter directement avec son code.
              </p>
            </div>
          )}

          {/* Configuration Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration générale</h3>

            <div className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Activer le module</p>
                  <p className="text-sm text-gray-600">Le speaker pourra se connecter avec son code</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_enabled ? 'bg-rose-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Speaker Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du speaker *
                  </label>
                  <input
                    type="text"
                    value={formData.speaker_name}
                    onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email du speaker (optionnel)
                  </label>
                  <input
                    type="email"
                    value={formData.speaker_email}
                    onChange={(e) => setFormData({ ...formData, speaker_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="speaker@example.com"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'ouverture *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fermeture *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Data Visibility */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Données visibles par le speaker</h4>
                <div className="space-y-2">
                  {[
                    { key: 'show_reference_times', label: 'Temps de référence' },
                    { key: 'show_timepulse_index', label: 'Indice Timepulse' },
                    { key: 'show_betrail_index', label: 'Indice BetRAIL' },
                    { key: 'show_utmb_index', label: 'Indice UTMB' },
                    { key: 'show_history', label: 'Historique des classements' },
                    { key: 'show_statistics', label: 'Statistiques de l\'événement' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                        className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes personnalisées pour le speaker
                </label>
                <textarea
                  value={formData.custom_notes}
                  onChange={(e) => setFormData({ ...formData, custom_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Informations importantes à communiquer au speaker..."
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:from-rose-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sponsors Tab */}
      {activeTab === 'sponsors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Sponsors à mentionner</h3>
              <p className="text-sm text-gray-600">Gérez les sponsors que le speaker devra mentionner</p>
            </div>
            <button
              onClick={() => {
                setEditingSponsor(null);
                setSponsorFormData({
                  name: '',
                  category: 'Partenaire',
                  logo_url: '',
                  description: '',
                  mention_frequency: 'Moyenne',
                  keywords: [],
                  website: '',
                  is_active: true,
                });
                setShowSponsorModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter un sponsor
            </button>
          </div>

          {sponsors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun sponsor ajouté</p>
              <p className="text-sm text-gray-500">Ajoutez vos sponsors pour que le speaker puisse les mentionner</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{sponsor.name}</h4>
                      <p className="text-sm text-gray-600">{sponsor.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingSponsor(sponsor);
                          setSponsorFormData({
                            name: sponsor.name,
                            category: sponsor.category,
                            logo_url: sponsor.logo_url || '',
                            description: sponsor.description || '',
                            mention_frequency: sponsor.mention_frequency,
                            keywords: sponsor.keywords,
                            website: sponsor.website || '',
                            is_active: sponsor.is_active,
                          });
                          setShowSponsorModal(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSponsor(sponsor.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {sponsor.description && (
                    <p className="text-sm text-gray-700 mb-2">{sponsor.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      sponsor.mention_frequency === 'Haute' ? 'bg-red-100 text-red-700' :
                      sponsor.mention_frequency === 'Moyenne' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sponsor.mention_frequency}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      sponsor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sponsor.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && speakerAccess && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Journal d'activité du speaker</h3>
            <p className="text-sm text-gray-600">Historique des actions effectuées par le speaker</p>
          </div>

          {activityLogs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune activité enregistrée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityLogs.map((log) => (
                <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{log.action}</p>
                      {log.details && (
                        <p className="text-sm text-gray-600 mt-1">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sponsor Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingSponsor ? 'Modifier le sponsor' : 'Ajouter un sponsor'}
                </h3>
                <button
                  onClick={() => setShowSponsorModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du sponsor *
                  </label>
                  <input
                    type="text"
                    value={sponsorFormData.name}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="Nom du sponsor"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={sponsorFormData.category}
                      onChange={(e) => setSponsorFormData({ ...sponsorFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Titre">Titre</option>
                      <option value="Or">Or</option>
                      <option value="Argent">Argent</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Partenaire">Partenaire</option>
                      <option value="Média">Média</option>
                      <option value="Institutionnel">Institutionnel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence de mention
                    </label>
                    <select
                      value={sponsorFormData.mention_frequency}
                      onChange={(e) => setSponsorFormData({ ...sponsorFormData, mention_frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Haute">Haute</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Basse">Basse</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / Message à mentionner
                  </label>
                  <textarea
                    value={sponsorFormData.description}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="Message que le speaker doit mentionner..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={sponsorFormData.website}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={sponsorFormData.is_active}
                    onChange={(e) => setSponsorFormData({ ...sponsorFormData, is_active: e.target.checked })}
                    className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm text-gray-700">Sponsor actif (visible par le speaker)</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSponsorModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveSponsor}
                    className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    {editingSponsor ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
