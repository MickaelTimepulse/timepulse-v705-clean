import { useState, useEffect } from 'react';
import { Trophy, Search, Upload, FileText, Download, Trash2 } from 'lucide-react';
import AdminLayout from '../components/Admin/AdminLayout';
import ResultsImporter from '../components/ResultsImporter';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  name: string;
  slug: string;
  city: string;
  start_date: string;
}

interface Race {
  id: string;
  name: string;
  distance: number;
  event: Event;
  result_count: number;
}

export default function AdminResults() {
  const [races, setRaces] = useState<Race[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<Race[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    loadRaces();
  }, []);

  useEffect(() => {
    filterRaces();
  }, [races, searchTerm]);

  async function loadRaces() {
    try {
      const { data, error } = await supabase
        .from('races')
        .select(`
          id,
          name,
          distance,
          events!inner(id, name, slug, city, start_date)
        `)
        .order('events(start_date)', { ascending: false });

      if (error) throw error;

      const racesWithCounts = await Promise.all(
        (data || []).map(async (race: any) => {
          const { count } = await supabase
            .from('results')
            .select('id', { count: 'exact', head: true })
            .eq('race_id', race.id);

          return {
            id: race.id,
            name: race.name,
            distance: race.distance,
            event: race.events,
            result_count: count || 0
          };
        })
      );

      setRaces(racesWithCounts);
    } catch (err) {
      console.error('Error loading races:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterRaces() {
    if (!searchTerm.trim()) {
      setFilteredRaces(races);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = races.filter(
      race =>
        race.name.toLowerCase().includes(term) ||
        race.event.name.toLowerCase().includes(term) ||
        race.event.city.toLowerCase().includes(term)
    );
    setFilteredRaces(filtered);
  }

  async function handleDeleteResults(raceId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tous les résultats de cette épreuve ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('race_id', raceId);

      if (error) throw error;

      alert('Résultats supprimés avec succès');
      loadRaces();
    } catch (err) {
      console.error('Error deleting results:', err);
      alert('Erreur lors de la suppression des résultats');
    }
  }

  async function handleExportResults(race: Race) {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('race_id', race.id)
        .order('overall_rank', { ascending: true });

      if (error) throw error;

      const headers = ['Classement', 'Dossard', 'Nom', 'Sexe', 'Catégorie', 'Temps', 'Cls Genre', 'Cls Catégorie'];
      const rows = (data || []).map((r: any) => [
        r.overall_rank || '',
        r.bib_number || '',
        r.athlete_name || '',
        r.gender || '',
        r.category || '',
        r.finish_time || '',
        r.gender_rank || '',
        r.category_rank || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `resultats-${race.name.replace(/\s+/g, '-')}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting results:', err);
      alert('Erreur lors de l\'export des résultats');
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Résultats</h1>
            <p className="text-gray-600 mt-2">Importez et gérez les résultats des épreuves</p>
          </div>
          <Trophy className="w-12 h-12 text-pink-500" />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une épreuve ou un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {showImporter && selectedRace ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Import pour: {selectedRace.name}
              </h2>
              <button
                onClick={() => {
                  setShowImporter(false);
                  setSelectedRace(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Fermer
              </button>
            </div>
            <ResultsImporter
              raceId={selectedRace.id}
              onImportComplete={() => {
                loadRaces();
                setShowImporter(false);
                setSelectedRace(null);
              }}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : filteredRaces.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune épreuve trouvée</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Épreuve
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Événement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Résultats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRaces.map((race) => (
                  <tr key={race.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{race.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{race.event.name}</div>
                      <div className="text-xs text-gray-500">{race.event.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(race.event.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {race.distance} km
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        race.result_count > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {race.result_count} résultat{race.result_count > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRace(race);
                            setShowImporter(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-pink-600 hover:bg-pink-700"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Importer
                        </button>
                        {race.result_count > 0 && (
                          <>
                            <button
                              onClick={() => handleExportResults(race)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Exporter
                            </button>
                            <button
                              onClick={() => handleDeleteResults(race.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
