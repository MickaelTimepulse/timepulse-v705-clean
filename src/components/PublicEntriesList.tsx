import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Award, X } from 'lucide-react';
import { loadCountries, getCountryByCode, type Country } from '../lib/countries';
import { formatAthleteName } from '../lib/formatters';
import ScrollableStatCard from './ScrollableStatCard';

interface Entry {
  id: string;
  bib_number: number;
  category: string;
  created_at: string;
  team_id?: string;
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

interface Team {
  id: string;
  name: string;
  team_type: string;
  bib_numbers: string[];
  current_members_count: number;
  representative_club?: string;
  company_name?: string;
}

interface TeamMember {
  id: string;
  position: number;
  role: string;
  entry: {
    bib_number: number;
    category: string;
    athlete: {
      first_name: string;
      last_name: string;
      gender: string;
      birthdate: string;
      license_club: string;
      nationality: string;
    };
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
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [countries, setCountries] = useState<Country[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

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

  const loadTeamMembers = async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          position,
          role,
          entry:entries (
            bib_number,
            category,
            athlete:athletes (
              first_name,
              last_name,
              gender,
              birthdate,
              license_club,
              nationality
            )
          )
        `)
        .eq('team_id', teamId)
        .order('position', { ascending: true });

      if (error) throw error;

      setTeamMembers(data as any || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleTeamClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    loadTeamMembers(teamId);
  };

  const closeModal = () => {
    setSelectedTeamId(null);
    setTeamMembers([]);
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

    const { data: teamMembersData } = await supabase
      .from('team_members')
      .select('entry_id, team_id')
      .in('entry_id', allEntries.map(e => e.id));

    const teamMemberMap: Record<string, string> = {};
    if (teamMembersData) {
      teamMembersData.forEach(tm => {
        teamMemberMap[tm.entry_id] = tm.team_id;
      });
    }

    allEntries = allEntries.map(entry => ({
      ...entry,
      team_id: teamMemberMap[entry.id] || null
    }));

    console.log('Team members map:', teamMemberMap);
    console.log('All entries with team_id:', allEntries.filter(e => e.team_id));

    const uniqueTeamIds = [...new Set(Object.values(teamMemberMap))];
    if (uniqueTeamIds.length > 0) {
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, team_type, bib_numbers, current_members_count, company_name')
        .in('id', uniqueTeamIds);

      if (teamsData) {
        const teamsMap: Record<string, Team> = {};

        // Charger les membres de chaque équipe pour déterminer le club représentatif
        for (const team of teamsData) {
          const { data: membersData } = await supabase
            .from('team_members')
            .select(`
              role,
              entry:entries (
                athlete:athletes (
                  license_club
                )
              )
            `)
            .eq('team_id', team.id);

          let representativeClub = '';

          if (membersData && membersData.length > 0) {
            // Compter les occurrences de chaque club
            const clubCounts: Record<string, number> = {};
            let captainClub = '';

            membersData.forEach((member: any) => {
              const club = member.entry?.athlete?.license_club;
              if (club) {
                clubCounts[club] = (clubCounts[club] || 0) + 1;
              }
              if (member.role === 'captain' && club) {
                captainClub = club;
              }
            });

            // Trouver le club le plus représenté
            const clubs = Object.entries(clubCounts);
            if (clubs.length > 0) {
              clubs.sort(([, a], [, b]) => b - a);
              const [mostCommonClub, count] = clubs[0];

              // Si plusieurs clubs différents avec le même nombre, prendre celui du capitaine
              const allDifferent = clubs.every(([, c]) => c === 1);
              if (allDifferent && captainClub) {
                representativeClub = captainClub;
              } else {
                representativeClub = mostCommonClub;
              }
            }
          }

          // Si pas de club, utiliser le nom de l'entreprise/association
          if (!representativeClub && team.company_name) {
            representativeClub = team.company_name;
          }

          teamsMap[team.id] = {
            ...team,
            representative_club: representativeClub
          };
        }

        setTeams(teamsMap);
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

  const groupedEntries = entries.reduce((acc, entry) => {
    if (entry.team_id) {
      if (!acc.some(e => e.team_id === entry.team_id)) {
        acc.push(entry);
      }
    } else {
      acc.push(entry);
    }
    return acc;
  }, [] as Entry[]);

  console.log('Entries count:', entries.length);
  console.log('Grouped entries count:', groupedEntries.length);
  console.log('Entries with team_id:', entries.filter(e => e.team_id).length);

  const categories = ['all', ...new Set(entries.map((e) => e.category))];

  const hasTeams = groupedEntries.some(entry => entry.team_id);

  const filteredEntries = groupedEntries.filter((entry) => {
    const team = entry.team_id ? teams[entry.team_id] : null;

    const searchMatch = team
      ? team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.bib_numbers[0] && team.bib_numbers[0].toString().includes(searchTerm))
      : entry.athletes.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTeamId) {
        closeModal();
      }
    };

    if (selectedTeamId) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedTeamId]);

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
              placeholder={hasTeams ? "Rechercher par nom d'équipe ou dossard..." : "Rechercher par nom, prénom ou dossard..."}
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
                  <th className="text-left py-2 px-2 sm:px-3 font-semibold text-gray-700 text-xs sm:text-sm">
                    {hasTeams ? 'Équipe' : 'Participant'}
                  </th>
                  <th className="text-left py-2 px-1 sm:px-3 font-semibold text-gray-700 hidden md:table-cell text-xs sm:text-sm">
                    {hasTeams ? 'Club' : 'Nationalité'}
                  </th>
                  {!hasTeams && <th className="text-left py-2 px-2 sm:px-3 font-semibold text-gray-700 text-xs sm:text-sm">Club</th>}
                  <th className="text-center py-2 px-1 sm:px-3 font-semibold text-gray-700 hidden lg:table-cell text-xs sm:text-sm">Cat.</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry, index) => {
                  const team = entry.team_id ? teams[entry.team_id] : null;
                  const isTeamEntry = !!team;

                  const displayName = isTeamEntry
                    ? team.name
                    : entry.athletes.is_anonymous
                    ? 'Anonyme'
                    : formatAthleteName(entry.athletes.first_name, entry.athletes.last_name);

                  // Pour les équipes avec dossards à suffixe (ex: "001 A", "001 B", etc.)
                  // On affiche une plage comme "001 A-D" ou juste "001" si un seul dossard
                  const bibNumber = (() => {
                    if (isTeamEntry && team.bib_numbers.length > 0) {
                      const bibs = team.bib_numbers;
                      if (bibs.length === 1) {
                        return bibs[0];
                      }

                      // Vérifie si les dossards ont un format avec suffixe (ex: "001 A")
                      const firstBib = bibs[0];
                      const lastBib = bibs[bibs.length - 1];
                      const hasSpace = firstBib.includes(' ');

                      if (hasSpace) {
                        const [baseNumber, firstSuffix] = firstBib.split(' ');
                        const [, lastSuffix] = lastBib.split(' ');
                        return `${baseNumber} ${firstSuffix}-${lastSuffix}`;
                      }

                      return firstBib;
                    }
                    return entry.bib_number;
                  })();

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
                            width: bibNumber && bibNumber.includes('-') ? '95px' : '80px',
                            height: '52px'
                          }}
                        >
                          <span className={`font-black text-gray-800 relative z-10 ${bibNumber && bibNumber.includes('-') ? 'text-base' : 'text-xl'}`}>
                            {bibNumber || '-'}
                          </span>
                        </div>
                        <div className="md:hidden inline-flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white px-2 py-1 rounded-lg shadow-sm min-w-[40px]">
                          <span className={`font-bold ${bibNumber && bibNumber.includes('-') ? 'text-sm' : 'text-base'}`}>
                            {bibNumber || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-3 font-medium text-gray-900 text-left">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {isTeamEntry ? (
                            <>
                              <button
                                onClick={() => handleTeamClick(team.id)}
                                className="flex-shrink-0 flex flex-col items-center justify-center p-1.5 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors relative"
                                title="Voir la composition de l'équipe"
                              >
                                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                                <span className="text-purple-600 text-xs font-bold leading-none mt-0.5">+</span>
                              </button>
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-none">{displayName}</span>
                                <span className="text-xs text-gray-500">
                                  {team.current_members_count} membre{team.current_members_count > 1 ? 's' : ''}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              {entry.athletes.is_anonymous && (
                                <img
                                  src="/AdobeStock_1549036275 copy.jpeg"
                                  alt="Anonyme"
                                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                                />
                              )}
                              <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{displayName}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1 sm:px-3 text-left hidden md:table-cell">
                        {isTeamEntry ? (
                          team.representative_club ? (
                            <span className="text-xs sm:text-sm text-gray-600 uppercase truncate block max-w-[150px]">
                              {team.representative_club}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )
                        ) : entry.athletes.nationality ? (
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
                      {!hasTeams && (
                        <td className="py-2 px-2 sm:px-3 text-gray-600 uppercase text-left">
                          <span className="text-xs sm:text-sm truncate block max-w-[80px] sm:max-w-none">
                            {entry.athletes.license_club || '-'}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-1 sm:px-3 text-center hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          {isTeamEntry ? (
                            team.team_type === 'homme' || team.team_type === 'men' || team.team_type === 'masculin' ? 'Homme' :
                            team.team_type === 'femme' || team.team_type === 'women' || team.team_type === 'féminin' ? 'Femme' :
                            'Mixte'
                          ) : entry.category}
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

      {/* Modal de composition d'équipe */}
      {selectedTeamId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold">
                      {teams[selectedTeamId]?.name || 'Composition de l\'équipe'}
                    </h3>
                    {(() => {
                      const team = teams[selectedTeamId];
                      if (!team?.team_type) return null;

                      const categoryLabel =
                        team.team_type === 'homme' || team.team_type === 'men' || team.team_type === 'masculin' ? 'Homme' :
                        team.team_type === 'femme' || team.team_type === 'women' || team.team_type === 'féminin' ? 'Femme' :
                        'Mixte';

                      return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-purple-700 border-2 border-purple-300">
                          {categoryLabel}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-purple-100 text-sm mt-1">
                    {teams[selectedTeamId]?.current_members_count || 0} membre{teams[selectedTeamId]?.current_members_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-purple-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-600">Chargement...</div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun membre trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member, index) => {
                    const athlete = member.entry?.athlete;
                    const entry = member.entry;

                    if (!athlete || !entry) return null;

                    const isCaptain = member.role === 'captain';
                    const country = getCountryByCode(athlete.nationality, countries);

                    return (
                      <div
                        key={member.id}
                        className={`border-2 rounded-lg p-4 ${
                          isCaptain
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-purple-600">
                                #{member.position}
                              </span>
                              {isCaptain && (
                                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                                  Capitaine
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg font-bold text-gray-900 mb-1">
                              {formatAthleteName(athlete.first_name, athlete.last_name)}
                            </h4>

                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Dossard:</span>
                                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded font-bold">
                                  {entry.bib_number}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Genre:</span>
                                <span>{athlete.gender === 'M' ? '👨 Homme' : '👩 Femme'}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Catégorie:</span>
                                <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                                  {entry.category}
                                </span>
                              </div>

                              {athlete.license_club && (
                                <div className="col-span-2 flex items-center gap-2">
                                  <span className="font-semibold">Club:</span>
                                  <span className="uppercase">{athlete.license_club}</span>
                                </div>
                              )}

                              {country && (
                                <div className="col-span-2 flex items-center gap-2">
                                  <span className="font-semibold">Nationalité:</span>
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={country.flag_url}
                                      alt={country.name}
                                      className="w-6 h-4 object-cover rounded border border-gray-200 shadow-sm"
                                    />
                                    <span>{athlete.nationality}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
