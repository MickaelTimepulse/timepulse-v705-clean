import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Download, Trophy, Clock, User, ArrowLeft, Users, Award, TrendingUp, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

const getCountryCode = (countryCode: string | undefined): string => {
  if (!countryCode) return '';

  const alpha3ToAlpha2: { [key: string]: string } = {
    'FRA': 'FR', 'USA': 'US', 'GBR': 'GB', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES',
    'BEL': 'BE', 'CHE': 'CH', 'NLD': 'NL', 'PRT': 'PT', 'POL': 'PL', 'AUT': 'AT',
    'CZE': 'CZ', 'DNK': 'DK', 'SWE': 'SE', 'NOR': 'NO', 'FIN': 'FI', 'IRL': 'IE',
    'GRC': 'GR', 'HUN': 'HU', 'ROU': 'RO', 'BGR': 'BG', 'HRV': 'HR', 'SVK': 'SK',
    'SVN': 'SI', 'LUX': 'LU', 'EST': 'EE', 'LVA': 'LV', 'LTU': 'LT', 'MLT': 'MT',
    'CYP': 'CY', 'ISL': 'IS', 'LIE': 'LI', 'MCO': 'MC', 'AND': 'AD', 'SMR': 'SM',
    'VAT': 'VA', 'ALB': 'AL', 'MKD': 'MK', 'BIH': 'BA', 'SRB': 'RS', 'MNE': 'ME',
    'UKR': 'UA', 'BLR': 'BY', 'MDA': 'MD', 'RUS': 'RU', 'TUR': 'TR', 'MAR': 'MA',
    'DZA': 'DZ', 'TUN': 'TN', 'EGY': 'EG', 'ZAF': 'ZA', 'KEN': 'KE', 'ETH': 'ET',
    'CAN': 'CA', 'MEX': 'MX', 'BRA': 'BR', 'ARG': 'AR', 'CHL': 'CL', 'COL': 'CO',
    'CHN': 'CN', 'JPN': 'JP', 'KOR': 'KR', 'IND': 'IN', 'AUS': 'AU', 'NZL': 'NZ'
  };

  const code = countryCode.toUpperCase();
  const alpha2 = code.length === 3 ? alpha3ToAlpha2[code] : code;

  return alpha2 && alpha2.length === 2 ? alpha2.toLowerCase() : '';
};

interface Result {
  id: string;
  bib_number: number;
  athlete_name: string;
  gender: string;
  category: string;
  finish_time: string;
  overall_rank: number;
  gender_rank: number;
  category_rank: number;
  status: string;
  custom_fields?: {
    nationality?: string;
    [key: string]: any;
  };
}

interface Race {
  id: string;
  name: string;
  distance: number;
  event: {
    id: string;
    name: string;
  };
}

interface RaceStats {
  total_finishers: number;
  by_gender: { male: number; female: number };
  by_category: { [key: string]: number };
  avg_time: string;
  fastest_time: string;
  median_time: string;
  slowest_time: string;
}

export default function RaceResults() {
  const { raceId } = useParams<{ raceId: string }>();
  const [race, setRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<RaceStats>({
    total_finishers: 0,
    by_gender: { male: 0, female: 0 },
    by_category: {},
    avg_time: '00:00:00',
    fastest_time: '00:00:00',
    median_time: '00:00:00',
    slowest_time: '00:00:00'
  });

  useEffect(() => {
    if (raceId) {
      loadResults();
    }
  }, [raceId]);

  useEffect(() => {
    filterResults();
  }, [results, searchTerm, genderFilter, categoryFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredResults]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Charger la course
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('id, name, distance, event:events(id, name)')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      // Charger les résultats avec pagination
      let allResults: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select('*')
          .eq('race_id', raceId)
          .eq('status', 'finished')
          .order('overall_rank', { ascending: true })
          .range(from, from + pageSize - 1);

        if (resultsError) throw resultsError;

        if (resultsData && resultsData.length > 0) {
          allResults = [...allResults, ...resultsData];
          from += pageSize;
          hasMore = resultsData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log('Total race results loaded:', allResults.length);

      // Debug: log first result to see structure
      if (allResults.length > 0) {
        console.log('First result sample:', allResults[0]);
        console.log('Custom fields:', allResults[0].custom_fields);
      }

      setResults(allResults);

      // Extraire les catégories uniques
      const uniqueCategories = [...new Set(
        allResults.map(r => r.category).filter(Boolean)
      )].sort();
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Erreur chargement résultats:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  const calculateStats = () => {
    if (!filteredResults || filteredResults.length === 0) {
      setStats({
        total_finishers: 0,
        by_gender: { male: 0, female: 0 },
        by_category: {},
        avg_time: '00:00:00',
        fastest_time: '00:00:00',
        median_time: '00:00:00',
        slowest_time: '00:00:00'
      });
      return;
    }

    console.log('Calculate stats - filteredResults:', filteredResults.length);
    console.log('First result finish_time:', filteredResults[0]?.finish_time);

    const validResults = filteredResults.filter(r => r.finish_time && timeToSeconds(r.finish_time) > 0);
    console.log('Valid results with time:', validResults.length);

    if (validResults.length === 0) {
      setStats({
        total_finishers: filteredResults.length,
        by_gender: { male: 0, female: 0 },
        by_category: {},
        avg_time: '00:00:00',
        fastest_time: '00:00:00',
        median_time: '00:00:00',
        slowest_time: '00:00:00'
      });
      return;
    }

    const sortedTimes = [...validResults].sort((a, b) => {
      const timeA = timeToSeconds(a.finish_time);
      const timeB = timeToSeconds(b.finish_time);
      return timeA - timeB;
    });

    console.log('Sorted times first:', sortedTimes[0]?.finish_time);
    console.log('Sorted times last:', sortedTimes[sortedTimes.length - 1]?.finish_time);

    const medianIndex = Math.floor(sortedTimes.length / 2);
    const medianTime = sortedTimes.length % 2 === 0
      ? sortedTimes[medianIndex - 1]?.finish_time
      : sortedTimes[medianIndex]?.finish_time;

    const raceStats: RaceStats = {
      total_finishers: filteredResults.length,
      by_gender: { male: 0, female: 0 },
      by_category: {},
      avg_time: '00:00:00',
      fastest_time: sortedTimes[0]?.finish_time || '00:00:00',
      median_time: medianTime || '00:00:00',
      slowest_time: sortedTimes[sortedTimes.length - 1]?.finish_time || '00:00:00'
    };

    console.log('Race stats:', raceStats);

    filteredResults.forEach((result) => {
      if (result.gender === 'M') raceStats.by_gender.male++;
      else if (result.gender === 'F') raceStats.by_gender.female++;

      if (result.category) {
        raceStats.by_category[result.category] = (raceStats.by_category[result.category] || 0) + 1;
      }
    });

    setStats(raceStats);
  };

  const filterResults = () => {
    let filtered = [...results];

    // Filtre recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r => r.athlete_name.toLowerCase().includes(term) ||
             r.bib_number.toString().includes(term)
      );
    }

    // Filtre genre
    if (genderFilter !== 'all') {
      filtered = filtered.filter(r => r.gender === genderFilter);
    }

    // Filtre catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    setFilteredResults(filtered);
  };

  const formatTime = (interval: string) => {
    if (!interval) return '-';
    // Format PostgreSQL interval: "HH:MM:SS" ou "days HH:MM:SS"
    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (match) {
      return `${match[1]}:${match[2]}:${match[3]}`;
    }
    return interval;
  };

  const exportToCSV = () => {
    const headers = ['Classement', 'Dossard', 'Nom', 'Sexe', 'Catégorie', 'Temps', 'Cls Genre', 'Cls Catégorie'];
    const rows = filteredResults.map(r => [
      r.overall_rank,
      r.bib_number,
      r.athlete_name,
      r.gender,
      r.category,
      formatTime(r.finish_time),
      r.gender_rank,
      r.category_rank,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resultats-${race?.name || 'course'}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des résultats...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600">Course non trouvée</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-pink-50/30">
      <Header />

      {/* Event Header - Improved Design */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to={`/events/${race.event.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'événement
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{race.name}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Trophy className="w-4 h-4" />
                  {race.distance} km
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                  <Users className="w-4 h-4" />
                  {results.length} participant{results.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques de la course - Improved Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Statistiques</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-3 text-white shadow-md">
              <div className="flex items-center justify-between">
                <Trophy className="w-6 h-6" />
                <div className="text-right">
                  <div className="text-xl font-bold leading-tight">{stats.total_finishers}</div>
                  <div className="text-pink-100 text-xs font-medium">Classés</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-md">
              <div className="flex items-center justify-between">
                <Users className="w-6 h-6" />
                <div className="text-right">
                  <div className="text-xl font-bold leading-tight">{stats.by_gender.male}</div>
                  <div className="text-blue-100 text-xs font-medium">
                    Hommes ({stats.total_finishers > 0 ? Math.round((stats.by_gender.male / stats.total_finishers) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-xl p-3 text-white shadow-md">
              <div className="flex items-center justify-between">
                <Users className="w-6 h-6" />
                <div className="text-right">
                  <div className="text-xl font-bold leading-tight">{stats.by_gender.female}</div>
                  <div className="text-pink-100 text-xs font-medium">
                    Femmes ({stats.total_finishers > 0 ? Math.round((stats.by_gender.female / stats.total_finishers) * 100) : 0}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white shadow-md">
              <div className="flex items-center justify-between">
                <Award className="w-6 h-6" />
                <div className="text-right">
                  <div className="text-xl font-bold leading-tight">{Object.keys(stats.by_category).length}</div>
                  <div className="text-green-100 text-xs font-medium">Catégories</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t pt-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-green-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Rapide</h3>
                  <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {formatTime(stats.fastest_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Médian</h3>
                  <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {formatTime(stats.median_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Lent</h3>
                  <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {formatTime(stats.slowest_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <Award className="w-5 h-5 text-purple-500" />
                <div className="text-right">
                  <h3 className="font-semibold text-gray-600 text-xs uppercase tracking-wide">Top Cat</h3>
                  <div className="text-xs space-y-0.5">
                    {Object.entries(stats.by_category)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2)
                      .map(([cat, count]) => (
                        <div key={cat} className="text-gray-900 font-semibold">
                          {cat}: {count}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Podium - Improved Design */}
        {filteredResults.length >= 3 && (
          <div className="mb-8">
            {genderFilter !== 'all' && (
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Podium {genderFilter === 'M' ? 'Hommes' : 'Femmes'}
              </h3>
            )}
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((offset, idx) => {
                const result = filteredResults[offset];
                if (!result) return null;

                const heights = ['h-32', 'h-40', 'h-24'];
                const positions = ['2', '1', '3'];
                const gradients = [
                  'from-gray-400 to-gray-500',
                  'from-yellow-400 to-yellow-500',
                  'from-orange-400 to-orange-500'
                ];
                const glows = ['shadow-gray-300', 'shadow-yellow-300', 'shadow-orange-300'];

                return (
                  <div key={result.id} className="relative">
                    <div className={`${heights[idx]} bg-gradient-to-br ${gradients[idx]} bg-opacity-80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 shadow-2xl ${glows[idx]} transition-all duration-300 hover:scale-105 hover:shadow-3xl hover:bg-opacity-90 border-2 border-white/30`}>
                      <div className="absolute top-2 right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl border-3 border-white">
                        <span className="text-xl font-black text-gray-700">{positions[idx]}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {(() => {
                          const nat = result.custom_fields?.nationality || result.custom_fields?.nation;
                          const code = nat ? getCountryCode(nat) : '';
                          return code ? (
                            <img
                              src={`https://flagcdn.com/28x21/${code}.png`}
                              srcSet={`https://flagcdn.com/56x42/${code}.png 2x`}
                              width="28"
                              height="21"
                              alt={nat}
                              title={nat}
                              className="inline-block rounded shadow-lg"
                            />
                          ) : null;
                        })()}
                      </div>
                      <p className="font-bold text-sm text-white text-center drop-shadow-lg px-2">{result.athlete_name}</p>
                      <p className="text-lg font-black text-white mt-2 drop-shadow-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.05em' }}>
                        {formatTime(result.finish_time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtres - Improved Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom ou dossard..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Filtre genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-white"
              >
                <option value="all">Tous</option>
                <option value="M">Hommes</option>
                <option value="F">Femmes</option>
              </select>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all bg-white"
              >
                <option value="all">Toutes</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full text-sm font-semibold">
              {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}
            </div>
            {(searchTerm || genderFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Filtré{filteredResults.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Tableau des résultats - Improved Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {genderFilter === 'M' ? 'Cls H' : genderFilter === 'F' ? 'Cls F' : 'Cls'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Dossard
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Athlète
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Nat.
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Sexe
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Temps
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Cls Genre
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Cls Cat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredResults.map((result, idx) => (
                  <tr key={result.id} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-blue-50/50 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shadow-sm ${
                        (genderFilter !== 'all' ? result.gender_rank : result.overall_rank) === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                        (genderFilter !== 'all' ? result.gender_rank : result.overall_rank) === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                        (genderFilter !== 'all' ? result.gender_rank : result.overall_rank) === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                        'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                      }`}>
                        {genderFilter !== 'all' ? result.gender_rank : result.overall_rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                        {result.bib_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {result.athlete_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(() => {
                        const nat = result.custom_fields?.nationality || result.custom_fields?.nation;
                        const code = nat ? getCountryCode(nat) : '';
                        return code ? (
                          <img
                            src={`https://flagcdn.com/32x24/${code}.png`}
                            srcSet={`https://flagcdn.com/64x48/${code}.png 2x`}
                            width="32"
                            height="24"
                            alt={nat}
                            title={nat}
                            className="inline-block rounded shadow-sm"
                          />
                        ) : nat ? (
                          <span className="text-xs text-gray-600" title={nat}>{nat}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        result.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {result.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        {result.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-base font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
                        {formatTime(result.finish_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                        {result.gender_rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">
                        {result.category_rank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun résultat trouvé</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
