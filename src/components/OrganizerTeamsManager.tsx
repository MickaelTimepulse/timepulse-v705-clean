import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, AlertCircle, Download, Hash, Edit2, Trash2, Eye, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Team {
  id: string;
  name: string;
  team_type: string;
  status: string;
  current_members_count: number;
  min_members: number;
  max_members: number;
  payment_status: string;
  payment_mode: string;
  total_amount: number;
  bib_numbers: string[];
  captain_email: string;
  captain_phone: string;
  created_at: string;
}

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

interface OrganizerTeamsManagerProps {
  raceId: string;
  raceName: string;
}

export default function OrganizerTeamsManager({ raceId, raceName }: OrganizerTeamsManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamDetail, setShowTeamDetail] = useState(false);
  const [assigningBibs, setAssigningBibs] = useState(false);
  const [bibStartNumber, setBibStartNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeams();
  }, [raceId]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('race_id', raceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
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
        .order('position', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const transformed = data.map((member: any) => ({
        id: member.id,
        entry_id: member.entry_id,
        role: member.role,
        position: member.position,
        status: member.status,
        athlete: member.entries.athletes,
      }));

      setTeamMembers(transformed);
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  };

  const handleViewTeam = async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
    setShowTeamDetail(true);
  };

  const handleAssignBibs = async (teamId: string) => {
    if (!bibStartNumber || parseInt(bibStartNumber) <= 0) {
      alert('Veuillez saisir un numéro de dossard de départ valide');
      return;
    }

    setAssigningBibs(true);
    try {
      const { error } = await supabase.rpc('assign_team_bib_numbers', {
        team_id_param: teamId,
        start_bib: parseInt(bibStartNumber),
      });

      if (error) throw error;

      alert('Dossards assignés avec succès !');
      await loadTeams();
      if (selectedTeam?.id === teamId) {
        await loadTeamMembers(teamId);
      }
    } catch (err: any) {
      console.error('Error assigning bibs:', err);
      alert('Erreur lors de l\'attribution des dossards : ' + err.message);
    } finally {
      setAssigningBibs(false);
      setBibStartNumber('');
    }
  };

  const handleValidateTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: 'validated' })
        .eq('id', teamId);

      if (error) throw error;

      alert('Équipe validée !');
      await loadTeams();
    } catch (err: any) {
      console.error('Error validating team:', err);
      alert('Erreur lors de la validation : ' + err.message);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${teamName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      alert('Équipe supprimée');
      await loadTeams();
      setShowTeamDetail(false);
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const filteredTeams = teams.filter((team) => {
    if (searchTerm === '') return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.captain_email.toLowerCase().includes(searchLower) ||
      team.captain_phone?.toLowerCase().includes(searchLower) ||
      team.team_type.toLowerCase().includes(searchLower) ||
      team.bib_numbers.some(bib => bib.includes(searchTerm))
    );
  });

  const exportToCSV = () => {
    const headers = [
      'Équipe',
      'Type',
      'Statut',
      'Membres',
      'Paiement',
      'Mode Paiement',
      'Montant',
      'Dossards',
      'Email Capitaine',
      'Téléphone Capitaine',
      'Date Création',
    ];

    const rows = filteredTeams.map(team => [
      team.name,
      team.team_type,
      team.status,
      `${team.current_members_count}/${team.max_members}`,
      team.payment_status,
      team.payment_mode,
      team.total_amount.toFixed(2),
      team.bib_numbers.join(' '),
      team.captain_email,
      team.captain_phone || '',
      new Date(team.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equipes_${raceName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>En attente</span>
          </span>
        );
      case 'incomplete':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Incomplète</span>
          </span>
        );
      case 'complete':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Complète</span>
          </span>
        );
      case 'validated':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Validée</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gestion des Équipes</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredTeams.length} équipe(s) affichée(s) sur {teams.length} pour {raceName}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total équipes</div>
          <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Validées</div>
          <div className="text-2xl font-bold text-green-600">
            {teams.filter(t => t.status === 'validated').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">En attente</div>
          <div className="text-2xl font-bold text-yellow-600">
            {teams.filter(t => t.status === 'incomplete' || t.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total participants</div>
          <div className="text-2xl font-bold text-blue-600">
            {teams.reduce((sum, t) => sum + t.current_members_count, 0)}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher par nom d'équipe, email, téléphone, type ou dossard..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Équipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membres
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paiement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dossards
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'Aucune équipe trouvée pour cette recherche' : 'Aucune équipe inscrite'}
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-gray-900">{team.name}</div>
                  <div className="text-xs text-gray-500">{team.captain_email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {team.team_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {team.current_members_count} / {team.max_members}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(team.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{team.payment_status}</div>
                  <div className="text-xs text-gray-500">{team.total_amount.toFixed(2)} €</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {team.bib_numbers.length > 0 ? (
                    <span className="text-blue-600 font-mono">
                      {team.bib_numbers.join(', ')}
                    </span>
                  ) : (
                    <span className="text-gray-400">Non attribués</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleViewTeam(team)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {team.status !== 'validated' && (
                      <button
                        onClick={() => handleValidateTeam(team.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Valider"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>

        {false && teams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune équipe inscrite pour le moment
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {showTeamDetail && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                <button
                  onClick={() => setShowTeamDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Assign Bibs */}
              {selectedTeam.bib_numbers.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                    <Hash className="w-5 h-5" />
                    <span>Attribuer les Dossards</span>
                  </h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={bibStartNumber}
                      onChange={(e) => setBibStartNumber(e.target.value)}
                      placeholder="Numéro de départ (ex: 1001)"
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleAssignBibs(selectedTeam.id)}
                      disabled={assigningBibs}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {assigningBibs ? 'Attribution...' : 'Attribuer'}
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Membres de l'équipe</h4>
                <div className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {member.athlete.first_name} {member.athlete.last_name}
                            {member.role === 'captain' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Capitaine
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{member.athlete.email}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{member.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-600">Type d'équipe</div>
                  <div className="font-semibold text-gray-900">{selectedTeam.team_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Mode de paiement</div>
                  <div className="font-semibold text-gray-900">
                    {selectedTeam.payment_mode === 'team' ? 'Par équipe' : 'Individuel'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Statut paiement</div>
                  <div className="font-semibold text-gray-900">{selectedTeam.payment_status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Montant total</div>
                  <div className="font-semibold text-gray-900">{selectedTeam.total_amount.toFixed(2)} €</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
