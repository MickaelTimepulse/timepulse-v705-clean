import { useState, useEffect } from 'react';
import { Users, Plus, Check, X, ChevronRight, AlertCircle, UserPlus, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadCountries, type Country } from '../lib/countries';

interface RelayMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  nationality: string;
  segmentOrder?: number;
  licenseType?: string;
  licenseId?: string;
  licenseClub?: string;
  ppsNumber?: string;
  selectedOptions?: Record<string, { choice_id?: string; value?: string; quantity: number }>;
}

interface LicenseType {
  id: string;
  name: string;
  code: string;
}

interface RaceOption {
  id: string;
  type: string;
  label: string;
  description: string;
  image_url?: string;
  is_required: boolean;
  is_question: boolean;
  price_cents: number;
  choices: Array<{
    id: string;
    label: string;
    description: string;
    price_modifier_cents: number;
    has_quantity_limit: boolean;
    max_quantity: number;
    current_quantity: number;
  }>;
}

interface RelaySegment {
  id: string;
  segment_order: number;
  name: string;
  distance: number;
  discipline: string;
  custom_discipline?: string;
}

interface RelayTeamRegistrationFormProps {
  raceId: string;
  raceName: string;
  teamSize: number;
  segments: RelaySegment[];
  regulations: string;
  licenseTypes?: LicenseType[];
  raceOptions?: RaceOption[];
  eventDate?: string;
  calorgCode?: string;
  isFFAAffiliated?: boolean;
  onComplete: (teamData: any) => void;
  onBack: () => void;
}

export default function RelayTeamRegistrationForm({
  raceId,
  raceName,
  teamSize,
  segments,
  regulations,
  licenseTypes = [],
  raceOptions = [],
  eventDate,
  calorgCode,
  isFFAAffiliated = false,
  onComplete,
  onBack,
}: RelayTeamRegistrationFormProps) {
  const [step, setStep] = useState<'team-info' | 'members' | 'legal'>('team-info');
  const [teamName, setTeamName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relation: '',
  });

  const [members, setMembers] = useState<RelayMember[]>([]);
  const [currentMember, setCurrentMember] = useState<Partial<RelayMember>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'M',
    birthDate: '',
    nationality: 'FRA',
    licenseType: '',
    licenseId: '',
    licenseClub: '',
    ppsNumber: '',
    selectedOptions: {},
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [ffaVerifying, setFfaVerifying] = useState(false);
  const [ffaVerificationMessage, setFfaVerificationMessage] = useState<string>('');
  const [pspVerifying, setPspVerifying] = useState(false);
  const [pspVerificationMessage, setPspVerificationMessage] = useState<string>('');

  useEffect(() => {
    loadCountriesData();
  }, []);

  const loadCountriesData = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const [legalAcceptances, setLegalAcceptances] = useState({
    regulations: false,
    rgpd: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingMembers = teamSize - members.length;
  const isTeamComplete = members.length === teamSize;
  const canProceedToLegal = isTeamComplete;

  const isFFALicense = () => {
    const selectedLicense = licenseTypes.find(lt => lt.id === currentMember.licenseType);
    return selectedLicense?.code === 'FFA';
  };

  const requiresPSP = () => {
    return !isFFALicense() && currentMember.licenseType && isFFAAffiliated && calorgCode;
  };

  const verifyFFALicense = async () => {
    if (!currentMember.licenseId || !currentMember.lastName || !currentMember.firstName || !currentMember.birthDate) {
      setFfaVerificationMessage('❌ Veuillez remplir tous les champs obligatoires avant de vérifier');
      return;
    }

    const licenseNumber = currentMember.licenseId.trim().toUpperCase();
    if (licenseNumber.startsWith('P')) {
      setFfaVerificationMessage('❌ Ce numéro commence par "P" - il s\'agit d\'un numéro PSP, pas d\'une licence FFA.');
      return;
    }

    if (!/^\d+$/.test(licenseNumber)) {
      setFfaVerificationMessage('❌ Le numéro de licence FFA doit contenir uniquement des chiffres.');
      return;
    }

    setFfaVerifying(true);
    setFfaVerificationMessage('');

    try {
      const { data: credentials } = await supabase.rpc('get_ffa_credentials').maybeSingle();
      if (!credentials || !credentials.uid || !credentials.password) {
        setFfaVerificationMessage('❌ Configuration FFA manquante');
        setFfaVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;
      const birthYear = currentMember.birthDate ? new Date(currentMember.birthDate).getFullYear().toString() : '';
      const testEventDate = eventDate || '01/01/2026';

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: currentMember.licenseId,
        nom: currentMember.lastName.toUpperCase(),
        prenom: currentMember.firstName.toUpperCase(),
        sexe: currentMember.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: calorgCode || '307834',
        cmpdate: testEventDate,
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;
        const club = athlete.club || '';
        setCurrentMember({ ...currentMember, licenseClub: club });
        setFfaVerificationMessage(`✓ Licence vérifiée - Club: ${club || 'Non trouvé'}`);
      } else {
        setFfaVerificationMessage(result.message || '❌ Licence non trouvée');
      }
    } catch (error) {
      console.error('FFA verification error:', error);
      setFfaVerificationMessage('❌ Erreur lors de la vérification');
    } finally {
      setFfaVerifying(false);
    }
  };

  const verifyPSP = async () => {
    if (!currentMember.ppsNumber) return;

    if (!currentMember.ppsNumber.toUpperCase().startsWith('P')) {
      setPspVerificationMessage('❌ Le numéro PSP doit commencer par la lettre P');
      return;
    }

    setPspVerifying(true);
    setPspVerificationMessage('');

    try {
      const { data: credentials } = await supabase.rpc('get_ffa_credentials').maybeSingle();
      if (!credentials || !credentials.uid || !credentials.password) {
        setPspVerificationMessage('⚠️ Configuration FFA manquante - Vérification impossible');
        setPspVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;
      const birthYear = currentMember.birthDate ? new Date(currentMember.birthDate).getFullYear().toString() : '';
      const testEventDate = eventDate || '01/01/2026';

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: currentMember.ppsNumber,
        nom: currentMember.lastName!.toUpperCase(),
        prenom: currentMember.firstName!.toUpperCase(),
        sexe: currentMember.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: calorgCode || '307834',
        cmpdate: testEventDate,
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;
        const ppsExpiryDate = athlete.pps_expiry || athlete.license_expiry || athlete.dfinrel;
        setPspVerificationMessage(`✓ PSP ${currentMember.ppsNumber} vérifié${ppsExpiryDate ? ` - Valide jusqu'au ${ppsExpiryDate}` : ''}`);
      } else {
        setPspVerificationMessage(`⚠️ PSP non trouvé dans la base FFA`);
      }
    } catch (error) {
      console.error('PSP verification error:', error);
      setPspVerificationMessage('⚠️ Erreur lors de la vérification du PSP');
    } finally {
      setPspVerifying(false);
    }
  };

  const addMember = () => {
    if (!currentMember.firstName || !currentMember.lastName || !currentMember.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentMember.email!)) {
      setError('Email invalide');
      return;
    }

    // Check if email already exists
    if (members.some(m => m.email === currentMember.email)) {
      setError('Cet email est déjà utilisé par un autre membre');
      return;
    }

    // Validate license if FFA
    if (isFFALicense() && (!currentMember.licenseId || !ffaVerificationMessage.includes('✓'))) {
      setError('Veuillez vérifier la licence FFA avant de continuer');
      return;
    }

    // Validate PSP if required
    if (requiresPSP() && (!currentMember.ppsNumber || !pspVerificationMessage.includes('✓'))) {
      setError('Veuillez vérifier le numéro PSP avant de continuer');
      return;
    }

    const newMember: RelayMember = {
      id: `temp-${Date.now()}`,
      firstName: currentMember.firstName!,
      lastName: currentMember.lastName!,
      email: currentMember.email!,
      phone: currentMember.phone || '',
      gender: currentMember.gender!,
      birthDate: currentMember.birthDate!,
      nationality: currentMember.nationality!,
      segmentOrder: members.length + 1,
      licenseType: currentMember.licenseType,
      licenseId: currentMember.licenseId,
      licenseClub: currentMember.licenseClub,
      ppsNumber: currentMember.ppsNumber,
      selectedOptions: currentMember.selectedOptions || {},
    };

    setMembers([...members, newMember]);
    setCurrentMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'M',
      birthDate: '',
      nationality: 'FRA',
      licenseType: '',
      licenseId: '',
      licenseClub: '',
      ppsNumber: '',
      selectedOptions: {},
    });
    setFfaVerificationMessage('');
    setPspVerificationMessage('');
    setError('');
  };

  const removeMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    // Reorder segments
    updated.forEach((member, i) => {
      member.segmentOrder = i + 1;
    });
    setMembers(updated);
  };

  const handleTeamInfoSubmit = () => {
    if (!teamName.trim()) {
      setError('Veuillez saisir un nom d\'équipe');
      return;
    }

    if (!emergencyContact.name || !emergencyContact.phone) {
      setError('Veuillez renseigner un contact d\'urgence');
      return;
    }

    setError('');
    setStep('members');
  };

  const handleMembersSubmit = () => {
    if (!isTeamComplete) {
      setError(`Vous devez inscrire ${remainingMembers} athlète(s) supplémentaire(s)`);
      return;
    }

    setError('');
    setStep('legal');
  };

  const handleFinalSubmit = async () => {
    if (!legalAcceptances.regulations || !legalAcceptances.rgpd) {
      setError('Vous devez accepter le règlement et la politique RGPD');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create team with all data
      const teamData = {
        race_id: raceId,
        name: teamName,
        members: members,
        emergency_contact: emergencyContact,
        acceptances: legalAcceptances,
      };

      onComplete(teamData);
    } catch (err: any) {
      console.error('Error submitting team:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 mb-4"
          >
            <span>← Retour</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Inscription Relais / Ekiden</h2>
          <p className="text-gray-600 mt-2">
            {raceName} - Équipe de {teamSize} athlètes
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center space-x-2 ${step === 'team-info' ? 'text-blue-600 font-semibold' : step === 'members' || step === 'legal' ? 'text-green-600' : 'text-gray-400'}`}>
              {(step === 'members' || step === 'legal') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">1</div>
              )}
              <span className="text-sm">Équipe</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
            <div className={`flex items-center space-x-2 ${step === 'members' ? 'text-blue-600 font-semibold' : step === 'legal' ? 'text-green-600' : 'text-gray-400'}`}>
              {step === 'legal' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">2</div>
              )}
              <span className="text-sm">Athlètes ({members.length}/{teamSize})</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
            <div className={`flex items-center space-x-2 ${step === 'legal' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">3</div>
              <span className="text-sm">Validation</span>
            </div>
          </div>
        </div>

        {/* Step 1: Team Information */}
        {step === 'team-info' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Les Rapides, Team Carquefou, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact d'urgence (pour toute l'équipe)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ce contact sera utilisé en cas d'urgence pour n'importe quel membre de l'équipe
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                  <input
                    type="text"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                    placeholder="Ami, famille, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleTeamInfoSubmit}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <span>Continuer vers les athlètes</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Members Registration */}
        {step === 'members' && (
          <div className="space-y-6">
            {/* Remaining counter */}
            {!isTeamComplete && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  <Users className="w-5 h-5 inline mr-2" />
                  Encore {remainingMembers} athlète(s) à saisir
                </p>
              </div>
            )}

            {/* List of added members */}
            {members.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Athlètes inscrits ({members.length}/{teamSize})</h3>
                </div>
                <div className="divide-y">
                  {members.map((member, index) => (
                    <div key={member.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                          {member.segmentOrder}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                            {segments[index] && (
                              <span className="ml-2 text-blue-600">
                                → {segments[index].name} ({segments[index].distance} km)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add member form */}
            {!isTeamComplete && (
              <div className="border border-blue-300 rounded-lg p-6 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Ajouter un athlète
                  {segments[members.length] && (
                    <span className="ml-2 text-sm text-blue-600 font-normal">
                      → {segments[members.length].name} ({segments[members.length].distance} km)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={currentMember.firstName}
                      onChange={(e) => setCurrentMember({ ...currentMember, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={currentMember.lastName}
                      onChange={(e) => setCurrentMember({ ...currentMember, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={currentMember.email}
                      onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={currentMember.phone}
                      onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre *</label>
                    <select
                      value={currentMember.gender}
                      onChange={(e) => setCurrentMember({ ...currentMember, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                    <input
                      type="date"
                      value={currentMember.birthDate}
                      onChange={(e) => setCurrentMember({ ...currentMember, birthDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité *</label>
                    <select
                      value={currentMember.nationality}
                      onChange={(e) => setCurrentMember({ ...currentMember, nationality: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez un pays</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {licenseTypes.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Type de licence *
                      </label>
                      <select
                        value={currentMember.licenseType}
                        onChange={(e) => setCurrentMember({ ...currentMember, licenseType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionner un type de licence</option>
                        {licenseTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isFFALicense() && (
                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <label className="block text-sm font-bold text-blue-900 mb-2">
                        Numéro de licence FFA *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentMember.licenseId}
                          onChange={(e) => setCurrentMember({ ...currentMember, licenseId: e.target.value })}
                          className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Ex: 929636"
                        />
                        <button
                          type="button"
                          onClick={verifyFFALicense}
                          disabled={ffaVerifying || !currentMember.licenseId}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                          {ffaVerifying ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                      {ffaVerificationMessage && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          ffaVerificationMessage.includes('✓')
                            ? 'bg-green-50 text-green-800 border border-green-500'
                            : 'bg-red-50 text-red-800 border border-red-500'
                        }`}>
                          <p className="text-sm font-medium">{ffaVerificationMessage}</p>
                        </div>
                      )}
                      {currentMember.licenseClub && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
                          <input
                            type="text"
                            value={currentMember.licenseClub}
                            onChange={(e) => setCurrentMember({ ...currentMember, licenseClub: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {requiresPSP() && (
                    <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                      <label className="block text-sm font-bold text-amber-900 mb-2">
                        Numéro PSP (Pass Prévention Santé) *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentMember.ppsNumber}
                          onChange={(e) => setCurrentMember({ ...currentMember, ppsNumber: e.target.value.toUpperCase() })}
                          className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          placeholder="Ex: P123456"
                        />
                        <button
                          type="button"
                          onClick={verifyPSP}
                          disabled={pspVerifying || !currentMember.ppsNumber}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                          {pspVerifying ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                      {pspVerificationMessage && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          pspVerificationMessage.includes('✓')
                            ? 'bg-green-50 text-green-800 border border-green-500'
                            : 'bg-amber-50 text-amber-800 border border-amber-400'
                        }`}>
                          <p className="text-sm font-medium">{pspVerificationMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {raceOptions.length > 0 && (
                    <div className="md:col-span-2 border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Options pour cet athlète</h4>
                      <div className="space-y-3">
                        {raceOptions.map((option) => (
                          <div key={option.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <label className="font-medium text-gray-900">
                                  {option.label}
                                  {option.is_required && <span className="text-red-600 ml-1">*</span>}
                                </label>
                                {option.description && (
                                  <p className="text-sm text-gray-600">{option.description}</p>
                                )}
                              </div>
                              {option.price_cents > 0 && (
                                <span className="text-blue-600 font-medium">
                                  +{(option.price_cents / 100).toFixed(2)}€
                                </span>
                              )}
                            </div>
                            {option.is_question && option.choices.length > 0 ? (
                              <select
                                required={option.is_required}
                                value={currentMember.selectedOptions?.[option.id]?.choice_id || ''}
                                onChange={(e) => {
                                  const opts = { ...currentMember.selectedOptions };
                                  if (e.target.value) {
                                    opts[option.id] = { choice_id: e.target.value, quantity: 1 };
                                  } else {
                                    delete opts[option.id];
                                  }
                                  setCurrentMember({ ...currentMember, selectedOptions: opts });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Sélectionner...</option>
                                {option.choices.map((choice) => (
                                  <option key={choice.id} value={choice.id}>
                                    {choice.label}
                                    {choice.price_modifier_cents !== 0 &&
                                      ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(
                                        choice.price_modifier_cents / 100
                                      ).toFixed(2)}€)`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={!!currentMember.selectedOptions?.[option.id]}
                                  onChange={(e) => {
                                    const opts = { ...currentMember.selectedOptions };
                                    if (e.target.checked) {
                                      opts[option.id] = { quantity: 1 };
                                    } else {
                                      delete opts[option.id];
                                    }
                                    setCurrentMember({ ...currentMember, selectedOptions: opts });
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui, je souhaite cette option</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={addMember}
                  className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Ajouter cet athlète</span>
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep('team-info')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              {isTeamComplete && (
                <button
                  onClick={handleMembersSubmit}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continuer vers la validation</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Legal Acceptances & Summary */}
        {step === 'legal' && (
          <div className="space-y-6">
            {/* Team Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                <Check className="w-5 h-5 mr-2" />
                Récapitulatif de l'équipe
              </h3>
              <div className="space-y-2 text-sm text-green-800">
                <p><strong>Équipe :</strong> {teamName}</p>
                <p><strong>Nombre d'athlètes :</strong> {members.length}</p>
                <p><strong>Contact d'urgence :</strong> {emergencyContact.name} ({emergencyContact.phone})</p>
              </div>
            </div>

            {/* Regulations */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Règlement sportif</h3>
              <div className="max-h-60 overflow-y-auto text-sm text-gray-700 mb-4 p-4 bg-gray-50 rounded">
                {regulations || 'Aucun règlement spécifique.'}
              </div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAcceptances.regulations}
                  onChange={(e) => setLegalAcceptances({ ...legalAcceptances, regulations: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm text-gray-700">
                  <strong>Tous les membres de l'équipe acceptent</strong> le règlement sportif de cette épreuve
                </div>
              </label>
            </div>

            {/* RGPD */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Protection des données (RGPD)</h3>
              <div className="text-sm text-gray-700 mb-4 space-y-2">
                <p>Les informations recueillies font l'objet d'un traitement informatique destiné à la gestion de votre inscription.</p>
                <p>Conformément à la loi "informatique et libertés", vous pouvez exercer votre droit d'accès aux données vous concernant et les faire rectifier en contactant l'organisateur.</p>
              </div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAcceptances.rgpd}
                  onChange={(e) => setLegalAcceptances({ ...legalAcceptances, rgpd: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm text-gray-700">
                  <strong>Tous les membres de l'équipe acceptent</strong> la politique de protection des données
                </div>
              </label>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep('members')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !legalAcceptances.regulations || !legalAcceptances.rgpd}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
              >
                {loading ? 'Traitement en cours...' : 'Procéder au paiement'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
