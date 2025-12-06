import { useState, useEffect } from 'react';
import { Users, Mail, Copy, CheckCircle, AlertCircle, Plus, X, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

interface TeamConfig {
  min_members: number;
  max_members: number;
  team_types: string[];
  allow_mixed_gender: boolean;
  payment_mode: 'team' | 'individual' | 'flexible';
  modify_deadline_days: number;
}

interface TeamRegistrationFormProps {
  raceId: string;
  raceName: string;
  teamConfig: TeamConfig;
  onTeamCreated: (teamId: string) => void;
  onBack: () => void;
}

export default function TeamRegistrationForm({
  raceId,
  raceName,
  teamConfig,
  onTeamCreated,
  onBack,
}: TeamRegistrationFormProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState(teamConfig.team_types[0] || 'mixte');
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'team' | 'individual'>(
    teamConfig.payment_mode === 'flexible' ? 'team' : teamConfig.payment_mode
  );

  // Captain info (for team creation)
  const [captainInfo, setCaptainInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Veuillez saisir un nom d\'équipe');
      return;
    }

    if (!captainInfo.firstName || !captainInfo.lastName || !captainInfo.email) {
      setError('Veuillez renseigner vos informations personnelles');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate modification deadline
      const modifyDeadline = new Date();
      modifyDeadline.setDate(modifyDeadline.getDate() + teamConfig.modify_deadline_days);

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          race_id: raceId,
          name: teamName,
          team_type: teamType,
          captain_email: captainInfo.email,
          captain_phone: captainInfo.phone,
          status: 'pending',
          min_members: teamConfig.min_members,
          max_members: teamConfig.max_members,
          payment_mode: paymentMode,
          can_modify_until: modifyDeadline.toISOString(),
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Generate invitation code
      const { data: invitationData, error: invitationError } = await supabase.rpc(
        'generate_team_invitation_code'
      );

      if (invitationError) throw invitationError;

      const code = invitationData;

      // Create invitation with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

      await supabase.from('team_invitations').insert({
        team_id: team.id,
        invitation_code: code,
        status: 'pending',
        max_uses: 0, // Unlimited uses
        expires_at: expiresAt.toISOString(),
      });

      setGeneratedCode(code);
      setSuccess('Équipe créée avec succès ! Partagez le code d\'invitation avec vos coéquipiers.');

      // Redirect to complete registration after showing code
      setTimeout(() => {
        onTeamCreated(team.id);
      }, 5000);
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message || 'Erreur lors de la création de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!invitationCode.trim()) {
      setError('Veuillez saisir le code d\'invitation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify invitation code
      const { data: invitation, error: invError } = await supabase
        .from('team_invitations')
        .select('*, teams(*)')
        .eq('invitation_code', invitationCode.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invError || !invitation) {
        throw new Error('Code d\'invitation invalide ou expiré');
      }

      // Check if team is full
      const team = invitation.teams;
      if (team.current_members_count >= team.max_members) {
        throw new Error('Cette équipe est complète');
      }

      setSuccess('Code valide ! Vous allez rejoindre l\'équipe : ' + team.name);

      // Redirect to complete registration
      setTimeout(() => {
        onTeamCreated(team.id);
      }, 2000);
    } catch (err: any) {
      console.error('Error joining team:', err);
      setError(err.message || 'Erreur lors de la vérification du code');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 mb-4"
          >
            <span>← Retour</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Inscription par Équipe</h2>
          <p className="text-gray-600 mt-2">
            {raceName} - {teamConfig.min_members} à {teamConfig.max_members} membres par équipe
          </p>
        </div>

        {/* Mode Selection */}
        {!generatedCode && !success && (
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                mode === 'create'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold">Créer une équipe</div>
              <div className="text-xs mt-1 opacity-75">Je suis le capitaine</div>
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                mode === 'join'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <UserPlus className="w-5 h-5 mx-auto mb-1" />
              <div className="font-semibold">Rejoindre une équipe</div>
              <div className="text-xs mt-1 opacity-75">J'ai un code</div>
            </button>
          </div>
        )}

        {/* Success Message with Code */}
        {generatedCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Équipe créée avec succès !</h3>
                <p className="text-sm text-green-800 mb-4">
                  Partagez ce code avec vos coéquipiers pour qu'ils puissent rejoindre l'équipe :
                </p>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-green-700">
                    {generatedCode}
                  </span>
                  <button
                    onClick={copyCodeToClipboard}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  Vous allez être redirigé vers la suite de l'inscription...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Team Form */}
        {mode === 'create' && !generatedCode && (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'équipe *
              </label>
              <select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {teamConfig.team_types.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {teamConfig.payment_mode === 'flexible' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="team"
                      checked={paymentMode === 'team'}
                      onChange={(e) => setPaymentMode(e.target.value as 'team')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Paiement par équipe</div>
                      <div className="text-xs text-gray-500">Je paie pour toute l'équipe</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="individual"
                      checked={paymentMode === 'individual'}
                      onChange={(e) => setPaymentMode(e.target.value as 'individual')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Paiement individuel</div>
                      <div className="text-xs text-gray-500">Chaque membre paie son inscription</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Vos Informations (Capitaine)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={captainInfo.firstName}
                    onChange={(e) => setCaptainInfo({ ...captainInfo, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={captainInfo.lastName}
                    onChange={(e) => setCaptainInfo({ ...captainInfo, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={captainInfo.email}
                    onChange={(e) => setCaptainInfo({ ...captainInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={captainInfo.phone}
                    onChange={(e) => setCaptainInfo({ ...captainInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateTeam}
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
            >
              {loading ? 'Création en cours...' : 'Créer mon équipe'}
            </button>
          </div>
        )}

        {/* Join Team Form */}
        {mode === 'join' && !success && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'invitation *
              </label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC12DEF"
                maxLength={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono font-bold uppercase"
              />
              <p className="text-xs text-gray-500 mt-2">
                Saisissez le code d'invitation fourni par le capitaine de l'équipe
              </p>
            </div>

            <button
              onClick={handleJoinTeam}
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
            >
              {loading ? 'Vérification...' : 'Rejoindre l\'équipe'}
            </button>
          </div>
        )}

        {/* Success message for joining */}
        {success && !generatedCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
