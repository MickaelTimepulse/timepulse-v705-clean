import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Award } from 'lucide-react';
import { loadCountries, getCountryByCode, type Country } from '../lib/countries';
import { formatAthleteName } from '../lib/formatters';

interface Entry {
  id: string;
  bib_number: number;
  category: string;
  created_at: string;
  athletes: {
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: string;
    license_club: string;
    is_anonymous: boolean;
    nationality: string;
  };
  races: {
    name: string;
  };
}

interface PublicEntriesListProps {
  raceId: string;
  raceName: string;
  eventName: string;
}

const ITEMS_PER_PAGE = 30;


export default function PublicEntriesList({ raceId, raceName, eventName }: PublicEntriesListProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [countries, setCountries] = useState<Country[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadCountriesData();
    loadEntries();

    // Subscribe to realtime updates for new entries
    const channel = supabase
      .channel(`entries-race-${raceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `race_id=eq.${raceId}`
        },
        (payload) => {
          console.log('Entry change detected:', payload);
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [raceId]);

  const loadCountriesData = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const loadEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select(`
        id,
        bib_number,
        category,
        created_at,
        athletes (
          first_name,
          last_name,
          birthdate,
          gender,
          license_club,
          is_anonymous,
          nationality
        ),
        races (name)
      `)
      .eq('race_id', raceId)
      .eq('status', 'confirmed')
      .order('bib_number', { ascending: true });

    if (!error && data) {
      setEntries(data as any);
    }
    setLoading(false);
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const categories = ['all', ...new Set(entries.map((e) => e.category))];

  const filteredEntries = entries.filter((entry) => {
    const searchMatch =
      entry.athletes.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.bib_number?.toString().includes(searchTerm);

    const categoryMatch = selectedCategory === 'all' || entry.category === selectedCategory;

    return searchMatch && categoryMatch;
  });

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const statsByCategory = categories.reduce((acc, cat) => {
    if (cat === 'all') return acc;
    acc[cat] = entries.filter((e) => e.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const clubStats = entries
    .filter((e) => e.athletes.license_club)
    .reduce((acc, entry) => {
      const club = entry.athletes.license_club;
      acc[club] = (acc[club] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topClubs = Object.entries(clubStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const nationalityStats = entries
    .filter((e) => e.athletes.nationality)
    .reduce((acc, entry) => {
      const nationality = entry.athletes.nationality;
      acc[nationality] = (acc[nationality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topNationalities = Object.entries(nationalityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement de la liste des inscrits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold mb-2">{eventName}</h1>
            <p className="text-pink-100 text-lg">
              {entries.length} participant{entries.length > 1 ? 's' : ''} inscrit{entries.length > 1 ? 's' : ''} • {raceName}
            </p>
          </div>
          <div className="text-right group">
            <div className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] transition-all duration-300 group-hover:scale-105">
              Timepulse
            </div>
            <div className="text-xs text-pink-200 uppercase tracking-wide opacity-90 transition-opacity duration-300 group-hover:opacity-100">
              Chronométrage
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-pink-600" />
            Catégories
          </h3>
          <div className="space-y-1.5">
            {Object.entries(statsByCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{category}</span>
                <span className="font-semibold text-gray-900 bg-pink-50 px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-600" />
            Clubs les plus représentés
          </h3>
          <div className="space-y-1.5">
            {topClubs.length > 0 ? (
              topClubs.map(([club, count]) => (
                <div key={club} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 truncate flex-1 mr-2 uppercase">{club}</span>
                  <span className="font-semibold text-gray-900 bg-pink-50 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Aucun club renseigné</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-lg">🌍</span>
            Nationalités
          </h3>
          <div className="space-y-1.5">
            {topNationalities.length > 0 ? (
              topNationalities.map(([nationality, count]) => {
                const country = getCountryByCode(nationality, countries);
                return (
                  <div key={nationality} className="flex justify-between items-center text-xs group hover:bg-gray-50 p-1.5 rounded transition-colors">
                    <span className="text-gray-600 flex items-center gap-2">
                      {country && (
                        <div className="relative transform transition-all duration-200 group-hover:scale-110" style={{ perspective: '500px' }}>
                          <div style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-3deg)' }}>
                            <img
                              src={country.flag_url}
                              alt={country.name}
                              className="w-6 h-4 object-cover rounded border border-gray-200 shadow-md"
                              style={{
                                boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <span className="font-medium">{nationality.toUpperCase()}</span>
                    </span>
                    <span className="font-semibold text-gray-900 bg-pink-50 px-2 py-0.5 rounded">{count}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune nationalité renseignée</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou dossard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            {categories
              .filter((c) => c !== 'all')
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun participant trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Dossard</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Participant</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 hidden md:table-cell">Nationalité</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Club / Association</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 hidden sm:table-cell">Catégorie</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry, index) => {
                  const displayName = entry.athletes.is_anonymous
                    ? 'Anonyme'
                    : formatAthleteName(entry.athletes.first_name, entry.athletes.last_name);

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-100 hover:bg-pink-50 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <div className="hidden md:inline-flex items-center justify-center relative rounded-lg shadow-md overflow-hidden"
                          style={{
                            backgroundImage: 'url(/dossardsite.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            width: '100px',
                            height: '65px'
                          }}
                        >
                          <span className="text-2xl font-black text-gray-800 relative z-10">
                            {entry.bib_number || '-'}
                          </span>
                        </div>
                        <div className="md:hidden inline-flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white px-3 py-2 rounded-lg shadow-sm">
                          <span className="text-lg font-bold">
                            {entry.bib_number || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-900 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {entry.athletes.is_anonymous && (
                            <img
                              src="/AdobeStock_1549036275 copy.jpeg"
                              alt="Anonyme"
                              className="w-7 h-7 object-contain"
                            />
                          )}
                          <span>{displayName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center hidden md:table-cell">
                        {entry.athletes.nationality ? (
                          <div className="flex flex-col items-center gap-1 group">
                            <div className="relative transform transition-all duration-300 hover:scale-110 hover:-rotate-2" style={{ perspective: '1000px' }}>
                              <div className="relative bg-gray-100 rounded-md p-0.5" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-5deg)' }}>
                                <img
                                  src={getCountryByCode(entry.athletes.nationality, countries)?.flag_url}
                                  alt={getCountryByCode(entry.athletes.nationality, countries)?.name}
                                  className="w-10 h-7 object-cover rounded border border-gray-300 shadow-lg transition-shadow duration-300 group-hover:shadow-2xl"
                                  style={{
                                    boxShadow: '3px 3px 6px rgba(0,0,0,0.15), 6px 6px 12px rgba(0,0,0,0.1)',
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-md pointer-events-none" style={{ transform: 'translateZ(1px)' }}></div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 font-semibold tracking-wider">
                              {entry.athletes.nationality}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-gray-600 uppercase text-center">
                        {entry.athletes.license_club || '-'}
                      </td>
                      <td className="py-2 px-3 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          {entry.category}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredEntries.length)} sur {filteredEntries.length} participant{filteredEntries.length > 1 ? 's' : ''}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-pink-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
