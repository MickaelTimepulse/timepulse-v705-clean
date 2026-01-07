import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, FileDown, Trophy, Clock, User, ArrowLeft, Users, Award, TrendingUp, Flag, Calendar, MapPin } from 'lucide-react';
import { generateResultsPDF } from '../lib/results-pdf-generator';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import CertificateShareModal from '../components/CertificateShareModal';
import { ResultData } from '../lib/certificate-generator';

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

const getSportImage = (sportType: string): string => {
  const images: { [key: string]: string } = {
    'course': 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&q=80',
    'trail': 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80',
    'triathlon': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80',
    'velo': 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80',
    'natation': 'https://images.unsplash.com/photo-1560053110-d1c714d96df9?auto=format&fit=crop&q=80',
    'marche': 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80'
  };
  return images[sportType?.toLowerCase()] || images['course'];
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const estimateAgeFromCategory = (category: string): number | null => {
  if (!category) return null;

  const cat = category.toUpperCase();

  if (cat.includes('CA') || cat.includes('CADET')) return 16;
  if (cat.includes('JU') || cat.includes('JUNIOR')) return 18;
  if (cat === 'ES' || cat.includes('ESPOIR')) return 21;
  if (cat === 'SE' || cat.includes('SENIOR')) return 32;

  const masterMatch = cat.match(/M(\d+)/);
  if (masterMatch) {
    const level = parseInt(masterMatch[1]);
    return 40 + (level * 5);
  }

  if (cat.includes('VET') || cat.includes('VETERAN')) {
    const vetMatch = cat.match(/(\d+)/);
    if (vetMatch) {
      const level = parseInt(vetMatch[1]);
      return 40 + (level * 5);
    }
    return 45;
  }

  return null;
};

const timeToSeconds = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':').map(p => parseInt(p));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
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
  athlete_id?: string;
  birthdate?: string;
  club?: string;
  custom_fields?: {
    nationality?: string;
    club?: string;
    [key: string]: any;
  };
}

interface Race {
  id: string;
  name: string;
  distance: number;
  sport_type?: string;
  slug?: string;
  ref_id?: string;
  event: {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    start_date?: string;
    city?: string;
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
  avg_age: number;
  avg_age_male: number;
  avg_age_female: number;
}

export default function RaceResults() {
  const { raceId, raceSlug } = useParams<{ raceId?: string; raceSlug?: string }>();
  const identifier = raceId || raceSlug;
  const [race, setRace] = useState<Race | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isRefId = (str: string): boolean => {
    return /^[A-Z]\d{6}$/.test(str);
  };
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [hasCertificateTemplate, setHasCertificateTemplate] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(100);
  const [stats, setStats] = useState<RaceStats>({
    total_finishers: 0,
    by_gender: { male: 0, female: 0 },
    by_category: {},
    avg_time: '00:00:00',
    fastest_time: '00:00:00',
    median_time: '00:00:00',
    slowest_time: '00:00:00',
    avg_age: 0,
    avg_age_male: 0,
    avg_age_female: 0
  });

  useEffect(() => {
    if (identifier) {
      loadResults();
    }
  }, [identifier]);

  useEffect(() => {
    filterResults();
    setDisplayLimit(100); // Réinitialiser la limite d'affichage quand les filtres changent
  }, [results, searchTerm, genderFilter, categoryFilter]);

  useEffect(() => {
    calculateStats();
  }, [filteredResults]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Vérifier le type d'identifiant : UUID, ref_id ou slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier!);
      const isRefIdFormat = isRefId(identifier!);

      let raceData;
      let raceError;

      if (isUUID) {
        // Requête par UUID
        const result = await supabase
          .from('races')
          .select('id, name, distance, sport_type, slug, ref_id, event:events(id, name, slug, image_url, start_date, city)')
          .eq('id', identifier)
          .single();

        raceData = result.data;
        raceError = result.error;
      } else if (isRefIdFormat) {
        // Requête par ref_id (format R123456)
        const result = await supabase
          .from('races')
          .select('id, name, distance, sport_type, slug, ref_id, event:events(id, name, slug, image_url, start_date, city)')
          .eq('ref_id', identifier)
          .maybeSingle();

        raceData = result.data;
        raceError = result.error;

        // Si trouvé par ref_id, rediriger vers l'URL ref_id pour cohérence
        if (raceData && raceData.ref_id) {
          window.history.replaceState(null, '', `/races/${raceData.ref_id}/results`);
        }
      } else {
        // Requête par slug
        const result = await supabase
          .from('races')
          .select('id, name, distance, sport_type, slug, ref_id, event:events(id, name, slug, image_url, start_date, city)')
          .eq('slug', identifier)
          .maybeSingle();

        raceData = result.data;
        raceError = result.error;

        // Si trouvé par slug et qu'il existe un ref_id, rediriger vers ref_id
        if (raceData && raceData.ref_id) {
          window.history.replaceState(null, '', `/races/${raceData.ref_id}/results`);
        } else if (raceData && raceData.slug) {
          // Sinon conserver le slug
          window.history.replaceState(null, '', `/races/${raceData.slug}/results`);
        }
      }

      if (raceError) throw raceError;
      if (!raceData) throw new Error('Course non trouvée');

      setRace(raceData);

      // Charger les résultats avec pagination
      let allResults: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: resultsData, error: resultsError} = await supabase
          .from('results')
          .select('*, athletes(birthdate)')
          .eq('race_id', raceData.id)
          .eq('status', 'finished')
          .order('overall_rank', { ascending: true })
          .range(from, from + pageSize - 1);

        if (resultsError) throw resultsError;

        if (resultsData && resultsData.length > 0) {
          const processedResults = resultsData.map(r => ({
            ...r,
            birthdate: r.athletes?.birthdate || null
          }));
          allResults = [...allResults, ...processedResults];
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

      // Vérifier si un template de diplôme existe pour cette course
      const { data: templates } = await supabase
        .from('certificate_templates')
        .select('id')
        .eq('is_active', true)
        .or(`race_id.eq.${raceData.id},race_id.is.null`)
        .limit(1);

      setHasCertificateTemplate(templates && templates.length > 0);

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
        slowest_time: '00:00:00',
        avg_age: 0,
        avg_age_male: 0,
        avg_age_female: 0
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
        slowest_time: '00:00:00',
        avg_age: 0,
        avg_age_male: 0,
        avg_age_female: 0
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
      slowest_time: sortedTimes[sortedTimes.length - 1]?.finish_time || '00:00:00',
      avg_age: 0,
      avg_age_male: 0,
      avg_age_female: 0
    };

    console.log('Race stats:', raceStats);

    let totalAge = 0;
    let countAge = 0;
    let totalAgeMale = 0;
    let countMale = 0;
    let totalAgeFemale = 0;
    let countFemale = 0;

    filteredResults.forEach((result) => {
      if (result.gender === 'M') raceStats.by_gender.male++;
      else if (result.gender === 'F') raceStats.by_gender.female++;

      if (result.category) {
        raceStats.by_category[result.category] = (raceStats.by_category[result.category] || 0) + 1;
      }

      let age: number | null = null;

      if (result.birthdate) {
        const birthYear = new Date(result.birthdate).getFullYear();
        age = new Date().getFullYear() - birthYear;
      } else if (result.category) {
        age = estimateAgeFromCategory(result.category);
      }

      if (age && age > 0 && age < 120) {
        totalAge += age;
        countAge++;
        if (result.gender === 'M') {
          totalAgeMale += age;
          countMale++;
        } else if (result.gender === 'F') {
          totalAgeFemale += age;
          countFemale++;
        }
      }
    });

    raceStats.avg_age = countAge > 0 ? Math.round(totalAge / countAge) : 0;
    raceStats.avg_age_male = countMale > 0 ? Math.round(totalAgeMale / countMale) : 0;
    raceStats.avg_age_female = countFemale > 0 ? Math.round(totalAgeFemale / countFemale) : 0;

    setStats(raceStats);
  };

  const filterResults = () => {
    let filtered = [...results];

    // Filtre recherche (nom, dossard ou club)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => {
        const club = r.club || r.custom_fields?.club || '';
        return r.athlete_name.toLowerCase().includes(term) ||
               r.bib_number.toString().includes(term) ||
               club.toLowerCase().includes(term);
      });
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

  const exportToPDF = async () => {
    if (!race) {
      alert('Aucune course sélectionnée');
      return;
    }

    if (filteredResults.length === 0) {
      alert('Aucun résultat à exporter');
      return;
    }

    try {
      console.log('Génération du PDF avec:', {
        results_count: filteredResults.length,
        race: race.name,
        event: race.event?.name
      });

      await generateResultsPDF(filteredResults, {
        event_name: race.event?.name || 'Événement',
        race_name: race.name || 'Course',
        distance: race.distance || 0,
        date: new Date().toISOString(),
        city: ''
      });

      console.log('PDF généré avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert(`Erreur lors de la génération du PDF: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  const handleOpenCertificate = (result: Result) => {
    setSelectedResult(result);
    setShowCertificateModal(true);
  };

  const prepareResultData = (result: Result): ResultData => {
    return {
      athlete_name: result.athlete_name,
      finish_time: result.finish_time,
      chip_time: result.chip_time,
      rank_scratch: result.overall_rank,
      rank_gender: result.gender_rank,
      rank_category: result.category_rank,
      race_name: race?.name || '',
      race_distance: race?.distance,
      event_name: race?.event?.name || race?.name || '',
      event_date: race?.date,
      gender: result.gender,
      category: result.category,
      bib_number: result.bib_number,
      club: result.club || result.custom_fields?.club,
      nationality: result.nationality
    };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-pink-50/30 overflow-x-hidden">
      <Header />

      {/* Event Header avec image de fond et overlay */}
      <div className="relative min-h-[450px] overflow-hidden">
        {/* Image de fond */}
        <div className="absolute inset-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${race.event.image_url || getSportImage(race.sport_type || 'course')})`
            }}
          />
          {/* Overlay avec gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>

        {/* Contenu en overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
          <Link
            to={`/events/${race.event.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors mb-8 group backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'événement
          </Link>

          {/* En-tête avec titre et infos */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-2xl mb-4 leading-tight">
              {race.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-cyan-400" />
                <span>{race.distance} km</span>
              </div>
              {race.event.start_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-400" />
                  <span>{formatDate(race.event.start_date)}</span>
                </div>
              )}
              {race.event.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span>{race.event.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques en overlay avec style caractéristiques */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <h2 className="text-xl sm:text-2xl font-bold drop-shadow-lg">Statistiques</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-pink-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Classés</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{stats.total_finishers.toLocaleString()}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Hommes</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats.by_gender.male} <span className="text-lg text-white/70">({stats.total_finishers > 0 ? Math.round((stats.by_gender.male / stats.total_finishers) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-pink-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Femmes</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats.by_gender.female} <span className="text-lg text-white/70">({stats.total_finishers > 0 ? Math.round((stats.by_gender.female / stats.total_finishers) * 100) : 0}%)</span>
                </div>
              </div>
            </div>

            {/* Statistiques détaillées - Grid 3x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-green-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Rapide</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {formatTime(stats.fastest_time)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Médian</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {formatTime(stats.median_time)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Lent</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {formatTime(stats.slowest_time)}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-purple-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Âge moyen</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats.avg_age > 0 ? `${stats.avg_age} ans` : '-'}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-blue-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Âge moyen H</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats.avg_age_male > 0 ? `${stats.avg_age_male} ans` : '-'}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg hover:bg-white/15 transition-all duration-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-5 h-5 text-pink-400" />
                  <div className="text-xs text-white/70 uppercase tracking-wide font-medium">Âge moyen F</div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">
                  {stats.avg_age_female > 0 ? `${stats.avg_age_female} ans` : '-'}
                </div>
              </div>
            </div>

            <button
              onClick={exportToPDF}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-6 py-3 shadow-lg hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <FileDown className="w-5 h-5" />
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Podium - Style avec angle coupé */}
        {filteredResults.length >= 3 && (
          <div className="mb-8">
            {genderFilter !== 'all' && (
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Podium {genderFilter === 'M' ? 'Hommes' : 'Femmes'}
              </h3>
            )}
            <div className="grid grid-cols-3 gap-2 md:gap-4 items-end max-w-5xl mx-auto">
              {[1, 0, 2].map((offset, idx) => {
                const result = filteredResults[offset];
                if (!result) return null;

                const heights = ['h-64 md:h-80', 'h-72 md:h-96', 'h-64 md:h-80'];
                const positions = ['2', '1', '3'];
                const backgroundImages = [
                  'https://fgstscztsighabpzzzix.supabase.co/storage/v1/object/public/email-assets/1762539005723_course_piste_stade.jpeg',
                  'https://fgstscztsighabpzzzix.supabase.co/storage/v1/object/public/email-assets/1762539049067_tour_eiffel_coureur.jpeg',
                  'https://fgstscztsighabpzzzix.supabase.co/storage/v1/object/public/email-assets/1762539210145_course_a_pied_masse_deux.jpeg'
                ];
                const numberColors = [
                  'text-white',
                  'text-white',
                  'text-white'
                ];

                return (
                  <div
                    key={result.id}
                    className={`${heights[idx]} relative transition-all duration-300 hover:scale-105 shadow-xl overflow-hidden`}
                    style={{
                      clipPath: 'polygon(0 20%, 100% 0, 100% 100%, 0 100%)'
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${backgroundImages[idx]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0">
                      <div className="absolute top-8 md:top-12 left-1/2 transform -translate-x-1/2 text-6xl md:text-9xl font-black opacity-60">
                        <span className={numberColors[idx]}>{positions[idx]}</span>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-end p-3 md:p-6 pb-4 md:pb-8">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                          {(() => {
                            const nationality = result.custom_fields?.nationality || result.nationality;
                            const countryCode = nationality ? getCountryCode(nationality) : null;
                            return countryCode ? (
                              <div className="relative w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                                <img
                                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                                  alt={nationality}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : null;
                          })()}
                          <p className="font-bold text-sm md:text-xl text-white text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {result.athlete_name}
                          </p>
                        </div>
                        <p className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
                          {formatTime(result.finish_time)}
                        </p>
                        {race && race.distance > 0 && (() => {
                          const timeInSeconds = timeToSeconds(result.finish_time);
                          if (timeInSeconds > 0) {
                            const speedKmh = (race.distance / (timeInSeconds / 3600)).toFixed(2);
                            return (
                              <p className="font-semibold text-xs md:text-base text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                {speedKmh} km/h
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtres - Improved Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Recherche */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, dossard ou club..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Filtre genre */}
            <div className="w-full sm:w-48">
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
            <div className="w-full sm:w-48">
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

        {/* Tableau des résultats - Responsive Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100 select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Vue mobile - Cartes */}
          <div className="block lg:hidden">
            {filteredResults.slice(0, displayLimit).map((result) => {
              const rank = genderFilter !== 'all' ? result.gender_rank : result.overall_rank;
              const nat = result.custom_fields?.nationality || result.custom_fields?.nation;
              const code = nat ? getCountryCode(nat) : '';

              return (
                <div key={result.id} className="border-b border-gray-100 p-4 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-blue-50/50 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Rang */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const getBgClass = () => {
                          if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white';
                          if (rank === 2) return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white';
                          if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
                          return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white';
                        };

                        return (
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-sm font-bold shadow-lg ${getBgClass()}`}>
                            <span className="font-extrabold">{rank}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Infos athlète */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-gray-900 truncate">
                          {result.athlete_name}
                        </span>
                        {code && (
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-gray-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-pink-400 flex-shrink-0">
                            <img
                              src={`https://flagcdn.com/w40/${code}.png`}
                              alt={nat}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        {hasCertificateTemplate && (
                          <button
                            onClick={() => handleOpenCertificate(result)}
                            className="p-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg flex-shrink-0"
                            title="Obtenir mon diplôme"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {(result.club || result.custom_fields?.club) && (
                        <div className="text-xs text-gray-600 mb-1 truncate">
                          {result.club || result.custom_fields?.club}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          #{result.bib_number}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          result.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {result.gender}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {result.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {formatTime(result.finish_time)}
                          </div>
                          {race && race.distance > 0 && (() => {
                            const timeInSeconds = timeToSeconds(result.finish_time);
                            if (timeInSeconds > 0) {
                              const distanceKm = race.distance;
                              const speedKmh = (distanceKm / (timeInSeconds / 3600));
                              const paceMinPerKm = 60 / speedKmh;
                              const paceMin = Math.floor(paceMinPerKm);
                              const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
                              return (
                                <div className="text-xs text-blue-600 font-semibold">
                                  {speedKmh.toFixed(1)} km/h • {paceMin}'{paceSec.toString().padStart(2, '0')}"/km
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>G: {result.gender_rank}</span>
                          <span>C: {result.category_rank}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vue desktop - Tableau optimisé */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-16">
                    {genderFilter === 'M' ? 'Clt H' : genderFilter === 'F' ? 'Clt F' : 'Clt'}
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Dos.
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-auto">
                    Athlète
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-32">
                    Club
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-12">
                    Nat
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-14">
                    Sexe
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Cat
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-tight w-24">
                    Temps
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Moy
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Clt/Sexe
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-20">
                    Clt Cat
                  </th>
                  {hasCertificateTemplate && (
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-tight w-16">
                      Diplôme
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredResults.slice(0, displayLimit).map((result) => {
                  const rank = genderFilter !== 'all' ? result.gender_rank : result.overall_rank;
                  const nat = result.custom_fields?.nationality || result.custom_fields?.nation;
                  const code = nat ? getCountryCode(nat) : '';

                  return (
                    <tr key={result.id} className="hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-blue-50/50 transition-all">
                      <td className="px-2 py-2">
                        {(() => {
                          const getBgClass = () => {
                            if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white';
                            if (rank === 2) return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white';
                            if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white';
                            return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white';
                          };

                          return (
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-bold shadow-md ${getBgClass()}`}>
                              <span className="font-extrabold">{rank}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                          {result.bib_number}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs font-semibold text-gray-900 truncate block">
                          {result.athlete_name}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs text-gray-600 truncate block">
                          {result.club || result.custom_fields?.club || '-'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {code ? (
                          <div className="inline-flex justify-center">
                            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-gray-300 shadow-md transition-all duration-300 hover:scale-110 hover:border-pink-400">
                              <img
                                src={`https://flagcdn.com/w40/${code}.png`}
                                alt={nat}
                                title={nat}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        ) : nat ? (
                          <span className="text-xs text-gray-600" title={nat}>{nat.slice(0, 3)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold ${
                          result.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {result.gender}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold truncate max-w-full">
                          {result.category}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                          {formatTime(result.finish_time)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {race && race.distance > 0 && (() => {
                          const timeInSeconds = timeToSeconds(result.finish_time);
                          if (timeInSeconds > 0) {
                            const distanceKm = race.distance;
                            const speedKmh = (distanceKm / (timeInSeconds / 3600));
                            const paceMinPerKm = 60 / speedKmh;
                            const paceMin = Math.floor(paceMinPerKm);
                            const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
                            return (
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-semibold text-blue-600">
                                  {speedKmh.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {paceMin}'{paceSec.toString().padStart(2, '0')}"/km
                                </span>
                              </div>
                            );
                          }
                          return <span className="text-gray-400 text-xs">-</span>;
                        })()}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {result.gender_rank}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                          {result.category_rank}
                        </span>
                      </td>
                      {hasCertificateTemplate && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleOpenCertificate(result)}
                            className="inline-flex items-center justify-center p-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            title="Obtenir mon diplôme"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun résultat trouvé</p>
            </div>
          )}
        </div>

        {/* Bouton Charger plus */}
        {filteredResults.length > displayLimit && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setDisplayLimit(prev => prev + 100)}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <span>Charger plus de résultats</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                {Math.min(displayLimit + 100, filteredResults.length)} / {filteredResults.length}
              </span>
            </button>
          </div>
        )}

        {/* Afficher tous */}
        {filteredResults.length > displayLimit && displayLimit < filteredResults.length && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setDisplayLimit(filteredResults.length)}
              className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow border-2 border-gray-200 hover:border-pink-300 transition-all duration-300"
            >
              Afficher tous les {filteredResults.length} résultats
            </button>
          </div>
        )}
      </div>

      <Footer />

      {/* Modal de diplôme */}
      {showCertificateModal && selectedResult && race && (
        <CertificateShareModal
          resultId={selectedResult.id}
          resultData={prepareResultData(selectedResult)}
          raceId={race.id}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
}
