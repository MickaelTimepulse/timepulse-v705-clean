import { useState, useEffect } from 'react';
import { Users, Mail, AlertCircle, CheckCircle, XCircle, Clock, Copy, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamMember {
  id: string;
  entry_id: string;
  role: string;
  position: number;
  status: string;
  athlete: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Team {
  id: string;
  name: string;
  team_type: string;
  status: string;
  current_members_count: number;
  min_members: number;
  max_members: number;
  payment_mode: string;
  payment_status: string;
  total_amount: number;
  can_modify_until: string;
  bib_numbers: string[];
}

interface TeamDashboardProps {
  teamId: string;
  isCaptain?: boolean;
}

export default function TeamDashboard({ teamId, isCaptain = false }: TeamDashboardProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    loadTeamData();

    // Subscribe to real-time updates
    const membersSubscription = supabase
      .channel('team_members_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`,
      }, () => {
        loadTeamData();
      })
      .subscribe();

    return () => {
      membersSubscription.unsubscribe();
    };
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      // Load team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          entries!inner(
            athlete_id,
            athletes!inner(
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('team_id', teamId)
        .neq('status', 'removed')
        .order('position', { ascending: true, nullsFirst: false })
        .order('joined_at', { ascending: true });

      if (membersError) throw membersError;

      // Transform data
      const transformedMembers = membersData.map((member: any) => ({
        id: member.id,
        entry_id: member.entry_id,
        role: member.role,
        position: member.position,
        status: member.status,
        athlete: member.entries.athletes,
      }));

      setMembers(transformedMembers);

      // Load invitations if captain
      if (isCaptain) {
        const { data: invData, error: invError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('team_id', teamId)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        if (!invError && invData) {
          setInvitations(invData);
        }
      }
    } catch (err: any) {
      console.error('Error loading team data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed' })
        .eq('id', memberId);

      if (error) throw error;
      await loadTeamData();
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert('Erreur lors de la suppression du membre');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'joined':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            Inscrit
          </span>
        );
      case 'documents_complete':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Complet</span>
          </span>
        );
      case 'documents_pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>En attente</span>
          </span>
        );
      case 'validated':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Validé</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {status}
          </span>
        );
    }
  };

  const getTeamStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>En attente</span>
          </span>
        );
      case 'incomplete':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>Incomplète</span>
          </span>
        );
      case 'complete':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Complète</span>
          </span>
        );
      case 'validated':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Validée</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full flex items-center space-x-1">
            <XCircle className="w-4 h-4" />
            <span>Annulée</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error || 'Équipe introuvable'}</p>
        </div>
      </div>
    );
  }

  const canModify = team.can_modify_until && new Date(team.can_modify_until) > new Date();
  const isTeamFull = team.current_members_count >= team.max_members;
  const needsMoreMembers = team.current_members_count < team.min_members;

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
            <div className="flex items-center space-x-4 text-sm opacity-90">
              <span>{team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1)}</span>
              <span>•</span>
              <span>{team.current_members_count} / {team.max_members} membres</span>
            </div>
          </div>
          {getTeamStatusBadge(team.status)}
        </div>
      </div>

      {/* Status Messages */}
      {needsMoreMembers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Équipe incomplète
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Il vous manque encore {team.min_members - team.current_members_count} membre(s) minimum pour valider votre équipe.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Code (Captain only) */}
      {isCaptain && !isTeamFull && invitations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Code d'invitation à partager
              </p>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white border border-blue-300 rounded-lg px-4 py-2 font-mono font-bold text-lg text-blue-700">
                  {invitations[0].invitation_code}
                </div>
                <button
                  onClick={() => copyInvitationCode(invitations[0].invitation_code)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
            </div>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Membres de l'équipe</span>
          </h3>
        </div>

        <div className="space-y-3">
          {members.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {member.athlete.first_name} {member.athlete.last_name}
                    {member.role === 'captain' && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Capitaine
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{member.athlete.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(member.status)}
                {isCaptain && member.role !== 'captain' && canModify && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Retirer du groupe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <p className="text-center text-gray-500 py-8">Aucun membre pour le moment</p>
        )}
      </div>

      {/* Bib Numbers (if assigned) */}
      {team.bib_numbers && team.bib_numbers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Numéros de Dossards</h3>
          <div className="flex flex-wrap gap-2">
            {team.bib_numbers.map((bib, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-mono font-bold"
              >
                {bib}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiement</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Mode de paiement</span>
            <span className="font-semibold">
              {team.payment_mode === 'team' ? 'Par équipe' : 'Individuel'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Statut</span>
            <span className={`font-semibold ${
              team.payment_status === 'paid' ? 'text-green-600' :
              team.payment_status === 'partial' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {team.payment_status === 'paid' ? 'Payé' :
               team.payment_status === 'partial' ? 'Partiel' :
               team.payment_status === 'refunded' ? 'Remboursé' :
               'Non payé'}
            </span>
          </div>
          {team.total_amount > 0 && (
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-600">Montant total</span>
              <span className="font-bold text-lg">{team.total_amount.toFixed(2)} €</span>
            </div>
          )}
        </div>
      </div>

      {/* Modification Deadline */}
      {canModify && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Modifications possibles</p>
              <p className="text-sm text-gray-600 mt-1">
                Vous pouvez modifier votre équipe jusqu'au{' '}
                {new Date(team.can_modify_until).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
