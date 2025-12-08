import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Award } from 'lucide-react';
import { loadCountries, getCountryByCode, type Country } from '../lib/countries';
import { formatAthleteName } from '../lib/formatters';
import ScrollableStatCard from './ScrollableStatCard';

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
  eventImageUrl?: string;
  eventImagePositionX?: number;
  eventImagePositionY?: number;
}

const ITEMS_PER_PAGE = 30;


export default function PublicEntriesList({ raceId, raceName, eventName, eventImageUrl, eventImagePositionX = 50, eventImagePositionY = 50 }: PublicEntriesListProps) {
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

    let allEntries: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
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
        .order('bib_number', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('Error loading entries:', error);
        break;
      }

      if (data && data.length > 0) {
        allEntries = [...allEntries, ...data];
        from += pageSize;

        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    setEntries(allEntries as any);
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

  const allClubs = Object.entries(clubStats)
    .sort(([, a], [, b]) => b - a);

  const topClubs = allClubs.slice(0, 5);

  const nationalityStats = entries
    .filter((e) => e.athletes.nationality)
    .reduce((acc, entry) => {
      const nationality = entry.athletes.nationality;
      acc[nationality] = (acc[nationality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const allNationalities = Object.entries(nationalityStats)
    .sort(([, a], [, b]) => b - a);

  const topNationalities = allNationalities.slice(0, 5);

  // Calculer la répartition Homme/Femme
  const genderStats = entries.reduce((acc, entry) => {
    const gender = entry.athletes.gender?.toUpperCase();
    if (gender === 'M' || gender === 'HOMME' || gender === 'H') {
      acc.men++;
    } else if (gender === 'F' || gender === 'FEMME') {
      acc.women++;
    }
    return acc;
  }, { men: 0, women: 0 });

  const menPercentage = entries.length > 0 ? Math.round((genderStats.men / entries.length) * 100) : 0;
  const womenPercentage = entries.length > 0 ? Math.round((genderStats.women / entries.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement de la liste des inscrits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-lg overflow-hidden shadow-lg min-h-[300px] sm:min-h-[280px]">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: eventImageUrl ? `url(${eventImageUrl})` : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            backgroundPosition: `${eventImagePositionX}% ${eventImagePositionY}%`,
          }}
        >
          {/* Overlay sombre pour améliorer la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>

        {/* Contenu */}
        <div className="relative z-10 p-4 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2 drop-shadow-lg leading-tight">
                Engagés - {eventName}
              </h1>
            </div>
            <div className="text-left sm:text-right group">
              <div className="text-xl sm:text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] transition-all duration-300 group-hover:scale-105 drop-shadow-lg">
                Timepulse
              </div>
              <div className="text-xs text-pink-200 uppercase tracking-wide opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                Chronométrage
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-white/90 text-base sm:text-lg font-medium drop-shadow">
              {entries.length} participant{entries.length > 1 ? 's' : ''} inscrit{entries.length > 1 ? 's' : ''} • {raceName}
            </p>

            {/* Répartition Homme/Femme */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                <span className="text-blue-300 font-semibold">👨 Hommes:</span>
                <span className="font-bold text-white">{genderStats.men}</span>
                <span className="text-white/70">({menPercentage}%)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full">
                <span className="text-pink-300 font-semibold">👩 Femmes:</span>
                <span className="font-bold text-white">{genderStats.women}</span>
                <span className="text-white/70">({womenPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScrollableStatCard
          title="Catégories"
          icon={<Award className="w-4 h-4 text-pink-600" />}
          items={Object.entries(statsByCategory).map(([category, count]) => ({
            label: category,
            value: count as number
          }))}
          maxVisible={5}
          scrollSpeed={15}
        />

        <ScrollableStatCard
          title="Clubs les plus représentés"
          icon={<Users className="w-4 h-4 text-pink-600" />}
          items={allClubs.length > 0 ? allClubs.map(([club, count]) => ({
            label: club.toUpperCase(),
            value: count as number
          })) : [{ label: 'Aucun club renseigné', value: 0 }]}
          maxVisible={5}
          scrollSpeed={12}
        />

        <ScrollableStatCard
          title="Nationalités"
          icon={<span className="text-lg">🌍</span>}
          items={allNationalities.length > 0 ? allNationalities.map(([nationality, count]) => {
            const country = getCountryByCode(nationality, countries);
            return {
              label: nationality.toUpperCase(),
              value: count as number,
              extra: country ? (
                <div className="relative transform transition-all duration-200" style={{ perspective: '500px' }}>
                  <div style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-3deg)' }}>
                    <img
                      src={country.flag_url}
                      alt={country.name}
                      className="w-6 h-4 object-cover rounded border border-gray-200 shadow-md"
                      style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
                    />
                  </div>
                </div>
              ) : null
            };
          }) : [{ label: 'Aucune nationalité renseignée', value: 0 }]}
          maxVisible={5}
          scrollSpeed={18}
        />
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
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-center py-2 px-1 sm:px-3 font-semibold text-gray-700 text-xs sm:text-sm">N°</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-semibold text-gray-700 text-xs sm:text-sm">Participant</th>
                  <th className="text-center py-2 px-1 sm:px-3 font-semibold text-gray-700 hidden md:table-cell text-xs sm:text-sm">Nationalité</th>
                  <th className="text-left py-2 px-2 sm:px-3 font-semibold text-gray-700 text-xs sm:text-sm">Club</th>
                  <th className="text-center py-2 px-1 sm:px-3 font-semibold text-gray-700 hidden lg:table-cell text-xs sm:text-sm">Cat.</th>
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
                      <td className="py-2 px-1 sm:px-3 text-center">
                        <div className="hidden md:inline-flex items-center justify-center relative rounded-lg shadow-md overflow-hidden"
                          style={{
                            backgroundImage: 'url(/dossardsite.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            width: '80px',
                            height: '52px'
                          }}
                        >
                          <span className="text-xl font-black text-gray-800 relative z-10">
                            {entry.bib_number || '-'}
                          </span>
                        </div>
                        <div className="md:hidden inline-flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white px-2 py-1 rounded-lg shadow-sm min-w-[40px]">
                          <span className="text-base font-bold">
                            {entry.bib_number || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-3 font-medium text-gray-900 text-left">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {entry.athletes.is_anonymous && (
                            <img
                              src="/AdobeStock_1549036275 copy.jpeg"
                              alt="Anonyme"
                              className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                            />
                          )}
                          <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{displayName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-center hidden md:table-cell">
                        {entry.athletes.nationality ? (
                          <div className="flex flex-col items-center gap-1.5 group">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-pink-400 hover:shadow-lg">
                              <img
                                src={getCountryByCode(entry.athletes.nationality, countries)?.flag_url}
                                alt={getCountryByCode(entry.athletes.nationality, countries)?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 font-semibold tracking-wider">
                              {entry.athletes.nationality}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-gray-600 uppercase text-left">
                        <span className="text-xs sm:text-sm truncate block max-w-[80px] sm:max-w-none">
                          {entry.athletes.license_club || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-center hidden lg:table-cell">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1) ||
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsisBefore && <span className="px-2 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? 'bg-pink-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
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
