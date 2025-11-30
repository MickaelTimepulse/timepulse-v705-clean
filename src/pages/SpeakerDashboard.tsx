import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  Search,
  Star,
  Trophy,
  TrendingUp,
  Users,
  LogOut,
  Shield,
  Clipboard,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Download,
  Filter,
  X,
  StickyNote
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SpeakerAccess {
  id: string;
  event_id: string;
  access_code: string;
  speaker_name: string;
  event: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    city: string;
  };
  organizer: {
    organization_name: string;
  };
  permissions: {
    show_reference_times: boolean;
    show_timepulse_index: boolean;
    show_betrail_index: boolean;
    show_utmb_index: boolean;
    show_history: boolean;
    show_statistics: boolean;
  };
  custom_notes: string | null;
}

interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  nationality: string;
  bib_number: string;
  race_name: string;
  club: string;
  category: string;
  timepulse_index?: number;
  gender?: string;
  birth_date?: string;
}

export default function SpeakerDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [speakerAccess, setSpeakerAccess] = useState<SpeakerAccess | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRace, setSelectedRace] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedClub, setSelectedClub] = useState('all');
  const [minReferenceTime, setMinReferenceTime] = useState('');
  const [races, setRaces] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total_entries: 0,
    total_races: 0,
    avg_timepulse_index: 0,
    top_athletes: 0
  });

  useEffect(() => {
    console.log('[SpeakerDashboard] Component mounted, eventId:', eventId);

    const accessData = sessionStorage.getItem('speaker_access');
    console.log('[SpeakerDashboard] SessionStorage data:', accessData);

    if (!accessData) {
      console.warn('[SpeakerDashboard] No access data, redirecting to login');
      navigate('/speaker/login');
      return;
    }

    const access = JSON.parse(accessData);
    console.log('[SpeakerDashboard] Parsed access:', access);

    if (access.event_id !== eventId) {
      console.warn('[SpeakerDashboard] Event ID mismatch, redirecting');
      navigate('/speaker/login');
      return;
    }

    setSpeakerAccess(access);
    loadData(access);
  }, [eventId, navigate]);

  const loadData = async (access: SpeakerAccess) => {
    console.log('[SpeakerDashboard] Loading data for event:', access.event_id);
    setLoading(true);
    try {
      // Load entries with race info and athlete data
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          bib_number,
          category,
          races:race_id (
            name
          ),
          athletes:athlete_id (
            first_name,
            last_name,
            city,
            country_code,
            nationality,
            license_club,
            timepulse_index,
            gender,
            birthdate
          )
        `)
        .eq('event_id', access.event_id)
        .eq('status', 'confirmed')
        .order('bib_number');

      console.log('[SpeakerDashboard] Entries query result:', { entriesData, entriesError });

      if (entriesError) {
        console.error('[SpeakerDashboard] Error loading entries:', entriesError);
        throw entriesError;
      }

      // Transform data
      const transformedEntries = (entriesData || []).map((entry: any) => ({
        id: entry.id,
        first_name: entry.athletes?.first_name || 'N/A',
        last_name: entry.athletes?.last_name || 'N/A',
        city: entry.athletes?.city || '',
        country: entry.athletes?.country_code || '',
        nationality: entry.athletes?.nationality || '',
        bib_number: entry.bib_number ? String(entry.bib_number) : 'N/A',
        race_name: entry.races?.name || 'N/A',
        club: entry.athletes?.license_club || '',
        category: entry.category || '',
        timepulse_index: entry.athletes?.timepulse_index,
        gender: entry.athletes?.gender || '',
        birth_date: entry.athletes?.birthdate || '',
      }));

      console.log('[SpeakerDashboard] Transformed entries:', transformedEntries.length);

      setEntries(transformedEntries);
      setFilteredEntries(transformedEntries);

      // Extract unique races, categories, cities, and clubs
      const uniqueRaces = [...new Set(transformedEntries.map((e: Entry) => e.race_name))];
      const uniqueCategories = [...new Set(transformedEntries.map((e: Entry) => e.category).filter(Boolean))];
      const uniqueCities = [...new Set(transformedEntries.map((e: Entry) => e.city).filter(Boolean))];
      const uniqueClubs = [...new Set(transformedEntries.map((e: Entry) => e.club).filter(Boolean))];
      setRaces(uniqueRaces);
      setCategories(uniqueCategories);
      setCities(uniqueCities.sort());
      setClubs(uniqueClubs.sort());

      // Load speaker notes
      const { data: notesData } = await supabase
        .from('speaker_notes')
        .select('entry_id, note')
        .eq('speaker_access_id', access.id);

      if (notesData) {
        const notesMap: Record<string, string> = {};
        notesData.forEach((note: any) => {
          notesMap[note.entry_id] = note.note;
        });
        setNotes(notesMap);
      }

      // Calculate stats
      const totalEntries = transformedEntries.length;
      const validIndices = transformedEntries
        .filter((e: Entry) => e.timepulse_index && e.timepulse_index > 0)
        .map((e: Entry) => e.timepulse_index || 0);
      const avgIndex = validIndices.length > 0
        ? Math.round(validIndices.reduce((a, b) => a + b, 0) / validIndices.length)
        : 0;
      const topAthletes = transformedEntries.filter((e: Entry) =>
        e.timepulse_index && e.timepulse_index >= 750
      ).length;

      setStats({
        total_entries: totalEntries,
        total_races: uniqueRaces.length,
        avg_timepulse_index: avgIndex,
        top_athletes: topAthletes
      });

      // Log activity
      await supabase
        .from('speaker_activity_log')
        .insert({
          speaker_access_id: access.id,
          action: 'Consultation dashboard',
          details: {
            timestamp: new Date().toISOString(),
            entries_count: totalEntries
          }
        });

      console.log('[SpeakerDashboard] Data loaded successfully');

    } catch (err: any) {
      console.error('[SpeakerDashboard] Error loading data:', err);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = entries;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.first_name.toLowerCase().includes(term) ||
        e.last_name.toLowerCase().includes(term) ||
        e.bib_number.includes(term) ||
        e.city?.toLowerCase().includes(term) ||
        e.club?.toLowerCase().includes(term)
      );
    }

    if (selectedRace !== 'all') {
      filtered = filtered.filter(e => e.race_name === selectedRace);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(e => e.city === selectedCity);
    }

    if (selectedClub !== 'all') {
      filtered = filtered.filter(e => e.club === selectedClub);
    }

    if (minReferenceTime && speakerAccess?.permissions.show_reference_times) {
      const minTime = parseFloat(minReferenceTime);
      filtered = filtered.filter(e => {
        const refTime = e.timepulse_index;
        return refTime && refTime >= minTime;
      });
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(e => favorites.includes(e.id));
    }

    setFilteredEntries(filtered);
  }, [searchTerm, selectedRace, selectedCategory, selectedCity, selectedClub, minReferenceTime, showFavoritesOnly, entries, favorites, speakerAccess]);

  const toggleFavorite = (entryId: string) => {
    setFavorites(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const clearAllFavorites = () => {
    if (favorites.length === 0) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer tous les favoris (${favorites.length}) ?`)) {
      setFavorites([]);
      setShowFavoritesOnly(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRace('all');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedClub('all');
    setMinReferenceTime('');
    setShowFavoritesOnly(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('speaker_access');
    navigate('/speaker/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copié !');
  };

  const handleSaveNote = async (entryId: string, noteText: string) => {
    if (!speakerAccess) return;

    try {
      const { error } = await supabase
        .from('speaker_notes')
        .upsert({
          speaker_access_id: speakerAccess.id,
          entry_id: entryId,
          note: noteText
        }, {
          onConflict: 'speaker_access_id,entry_id'
        });

      if (error) throw error;

      setNotes(prev => ({ ...prev, [entryId]: noteText }));
      setEditingNote(null);
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Erreur lors de la sauvegarde de la note');
    }
  };

  const handleDeleteNote = async (entryId: string) => {
    if (!speakerAccess) return;

    try {
      const { error } = await supabase
        .from('speaker_notes')
        .delete()
        .eq('speaker_access_id', speakerAccess.id)
        .eq('entry_id', entryId);

      if (error) throw error;

      setNotes(prev => {
        const updated = { ...prev };
        delete updated[entryId];
        return updated;
      });
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Erreur lors de la suppression de la note');
    }
  };

  const handleGeneratePDF = async () => {
    if (!speakerAccess) return;

    const { generatePDF } = await import('../lib/pdf-generator');

    await generatePDF(
      filteredEntries,
      speakerAccess.event,
      {
        speaker_name: speakerAccess.speaker_name,
        organization_name: speakerAccess.organizer?.organization_name
      },
      notes
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!speakerAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-2 rounded-lg">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{speakerAccess.event.name}</h1>
                <p className="text-xs text-gray-600">
                  {speakerAccess.speaker_name}{speakerAccess.organizer ? ` - ${speakerAccess.organizer.organization_name}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_entries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_races}</p>
              </div>
            </div>
          </div>

          {speakerAccess.permissions.show_timepulse_index && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Index moyen</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avg_timepulse_index}</p>
                </div>
              </div>
            </div>
          )}

          {speakerAccess.permissions.show_timepulse_index && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-rose-600" />
                <div>
                  <p className="text-sm text-gray-600">Top athlètes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.top_athletes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Notes */}
        {speakerAccess.custom_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Notes de l'organisateur</p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{speakerAccess.custom_notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Filtres & Actions</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">Réinitialiser</span>
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Générer PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedRace}
              onChange={(e) => setSelectedRace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">Toutes les courses</option>
              {races.map(race => (
                <option key={race} value={race}>{race}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">Toutes les villes</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="all">Tous les clubs</option>
              {clubs.map(club => (
                <option key={club} value={club}>{club}</option>
              ))}
            </select>

            {speakerAccess.permissions.show_reference_times && (
              <input
                type="number"
                placeholder="Index min..."
                value={minReferenceTime}
                onChange={(e) => setMinReferenceTime(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFavoritesOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span>Favoris ({favorites.length})</span>
            </button>

            {favorites.length > 0 && (
              <button
                onClick={clearAllFavorites}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Supprimer tous les favoris</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredEntries.length} participant{filteredEntries.length > 1 ? 's' : ''} affiché{filteredEntries.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Entries List */}
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const isFavorite = favorites.includes(entry.id);
            const isExpanded = expandedEntry === entry.id;

            return (
              <div key={entry.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-bold">
                          #{entry.bib_number}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {entry.first_name} {entry.last_name}
                        </h3>
                        <button
                          onClick={() => toggleFavorite(entry.id)}
                          className="ml-auto"
                        >
                          <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Trophy className="w-4 h-4" />
                          <span>{entry.race_name}</span>
                        </div>
                        {entry.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{entry.city}</span>
                          </div>
                        )}
                        {entry.nationality && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-medium">{entry.nationality}</span>
                          </div>
                        )}
                        {entry.club && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="truncate">{entry.club}</span>
                          </div>
                        )}
                        {entry.category && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Shield className="w-4 h-4" />
                            <span>{entry.category}</span>
                          </div>
                        )}
                      </div>

                      {speakerAccess.permissions.show_timepulse_index && entry.timepulse_index && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              Index Timepulse: {entry.timepulse_index}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Speaker Notes */}
                      {notes[entry.id] && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <StickyNote className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-900">{notes[entry.id]}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(entry.id)}
                              className="text-amber-600 hover:text-amber-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setEditingNote(editingNote === entry.id ? null : entry.id)}
                          className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          {notes[entry.id] ? 'Modifier la note' : 'Ajouter une note'}
                        </button>

                        <button
                          onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                          className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Réduire
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Voir plus
                            </>
                          )}
                        </button>
                      </div>

                      {/* Note Editor */}
                      {editingNote === entry.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            defaultValue={notes[entry.id] || ''}
                            placeholder="Ajouter une note sur ce participant..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            rows={3}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                handleSaveNote(entry.id, e.currentTarget.value);
                              }
                            }}
                            id={`note-${entry.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const textarea = document.getElementById(`note-${entry.id}`) as HTMLTextAreaElement;
                                handleSaveNote(entry.id, textarea.value);
                              }}
                              className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Annuler
                            </button>
                            <span className="text-xs text-gray-500 ml-auto">Ctrl+Entrée pour enregistrer</span>
                          </div>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(`${entry.first_name} ${entry.last_name}`)}
                              className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                            >
                              <Clipboard className="w-4 h-4" />
                              Copier le nom
                            </button>
                            {entry.club && (
                              <button
                                onClick={() => copyToClipboard(entry.club)}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                <Clipboard className="w-4 h-4" />
                                Copier le club
                              </button>
                            )}
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

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun participant trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
