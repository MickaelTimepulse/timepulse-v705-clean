import { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { ArrowLeft, Upload, Calendar, MapPin, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminExternalResultsImport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reimportEventId = searchParams.get('event_id');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingEvent, setExistingEvent] = useState<any>(null);

  const [eventData, setEventData] = useState({
    name: '',
    event_date: '',
    city: '',
    country_code: 'FRA',
    sport_type: 'running',
    distance_km: '',
    organizer_name: '',
    organizer_email: '',
    organizer_website: '',
    timing_provider: '',
    results_url: '',
    description: '',
  });

  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reimportEventId) {
      loadExistingEvent();
    }
  }, [reimportEventId]);

  async function loadExistingEvent() {
    try {
      const { data, error } = await supabase
        .from('external_events')
        .select('*')
        .eq('id', reimportEventId)
        .single();

      if (error) throw error;

      setExistingEvent(data);
      setEventData({
        name: data.name,
        event_date: data.event_date,
        city: data.city,
        country_code: data.country_code || 'FRA',
        sport_type: data.sport_type || 'running',
        distance_km: data.distance_km?.toString() || '',
        organizer_name: data.organizer_name || '',
        organizer_email: data.organizer_email || '',
        organizer_website: data.organizer_website || '',
        timing_provider: data.timing_provider || '',
        results_url: data.results_url || '',
        description: data.description || '',
      });
    } catch (error) {
      console.error('Error loading existing event:', error);
      alert('Erreur lors du chargement de l\'événement');
    }
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function autoMapElogicaColumns(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    // Mapping Elogica standard (noms de colonnes en français)
    const elogicaMap: Record<string, string> = {
      'Nom': 'last_name',
      'Prénom': 'first_name',
      'Prenom': 'first_name',
      'Sexe': 'gender',
      'Catégorie': 'category',
      'Categorie': 'category',
      'Cat': 'category',
      'NumDossard': 'bib_number',
      'Dossard': 'bib_number',
      'Perf': 'finish_time',
      'Temps': 'finish_time',
      'Place': 'overall_rank',
      'Classement': 'overall_rank',
      'Rang': 'overall_rank',
      'Cl/Cat': 'category_rank',
      'Cl/Sexe': 'gender_rank',
      'Cl. Scratch': 'overall_rank',
      'Ville': 'city',
      'Club': 'club',
      'Année': 'birth_year',
      'Annee': 'birth_year',
      'Date de naissance': 'birth_date',
      'DateNaissance': 'birth_date',
      'Naissance': 'birth_date',
    };

    // Chercher les correspondances
    headers.forEach(header => {
      const trimmedHeader = header.trim();
      if (elogicaMap[trimmedHeader]) {
        mapping[elogicaMap[trimmedHeader]] = trimmedHeader;
      }
    });

    return mapping;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        alert('Fichier CSV vide');
        return;
      }

      // Détecter le format Elogica (commence par "ENG\tATH\t...")
      let headerLineIndex = 0;
      let dataStartIndex = 1;

      if (lines[0] && lines[0].startsWith('ENG\t')) {
        // Format Elogica : ligne 1 = codes, ligne 2 = noms anglais, ligne 3 = noms FR (en-têtes)
        console.log('Format Elogica détecté');
        headerLineIndex = 2; // 3ème ligne (index 2)
        dataStartIndex = 3;  // Les données commencent à la 4ème ligne
      }

      const headers = lines[headerLineIndex].split(/[;,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
      setCsvHeaders(headers);

      const data = lines.slice(dataStartIndex).map(line => {
        const values = line.split(/[;,\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      console.log(`Import: ${headers.length} colonnes, ${data.length} lignes de données`);
      setCsvData(data);

      // Auto-mapping pour le format Elogica
      if (headerLineIndex === 2) {
        const elogicaMapping = autoMapElogicaColumns(headers);
        setColumnMapping(elogicaMapping);
        console.log('Mapping automatique Elogica appliqué:', elogicaMapping);
      }

      setStep(3);
    };

    reader.readAsText(file);
  }

  function parseFrenchDate(dateString: string): string | null {
    if (!dateString) return null;

    dateString = dateString.trim();

    // Format français JJ/MM/AAAA ou DD/MM/YYYY
    const frenchPattern = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
    const match = dateString.match(frenchPattern);

    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`; // Format PostgreSQL YYYY-MM-DD
    }

    // Format ISO déjà correct YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    return null;
  }

  function parseTime(timeString: string): string | null {
    if (!timeString) return null;

    // Nettoyer la chaîne
    timeString = timeString.trim();

    // Formats classiques en priorité (HH:MM:SS, MM:SS, etc.)
    const patterns = [
      /^(\d{1,2}):(\d{2}):(\d{2})$/,     // HH:MM:SS ou H:MM:SS
      /^(\d{1,2}):(\d{2})$/,              // MM:SS
      /^(\d{1,2})h(\d{2})m(\d{2})s$/,    // HHhMMmSSs
      /^(\d{1,2})h(\d{2})$/,              // HHhMM
    ];

    for (const pattern of patterns) {
      const match = timeString.match(pattern);
      if (match) {
        let hours = parseInt(match[1]) || 0;
        let minutes = parseInt(match[2]) || 0;
        let seconds = parseInt(match[3]) || 0;

        // Si c'est le format MM:SS (2 parties), la première est les minutes
        if (pattern === patterns[1]) {
          // Format MM:SS
          minutes = parseInt(match[1]);
          seconds = parseInt(match[2]);
          hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // Format compact MMSS ou HMMSS (ex: 3156 = 31:56, 13520 = 1:35:20)
    // Seulement si aucun format standard n'a matché
    if (/^\d{3,6}$/.test(timeString)) {
      const totalValue = parseInt(timeString);

      // Si 3 ou 4 chiffres: format MMSS (ex: 3156 = 31min 56sec)
      if (timeString.length <= 4) {
        let minutes = Math.floor(totalValue / 100);
        let seconds = totalValue % 100;
        let hours = 0;

        // Si les minutes sont > 59, c'est probablement des heures
        if (minutes > 59) {
          hours = Math.floor(minutes / 60);
          minutes = minutes % 60;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      // Si 5 ou 6 chiffres: format HMMSS ou HHMMSS (ex: 13520 = 1:35:20)
      if (timeString.length >= 5) {
        const seconds = totalValue % 100;
        const minutes = Math.floor(totalValue / 100) % 100;
        const hours = Math.floor(totalValue / 10000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    return null;
  }

  async function handleImport() {
    if (!eventData.name || !eventData.event_date || !eventData.city || !eventData.organizer_name) {
      alert('Veuillez remplir tous les champs obligatoires de l\'événement');
      return;
    }

    if (csvData.length === 0) {
      alert('Aucune donnée à importer');
      return;
    }

    if (!columnMapping.first_name || !columnMapping.last_name) {
      alert('Les colonnes Prénom et Nom sont obligatoires');
      return;
    }

    try {
      setLoading(true);

      let event;

      // Mode réimport : supprimer les anciens résultats et réutiliser l'événement
      if (reimportEventId && existingEvent) {
        // Supprimer tous les anciens résultats
        const { error: deleteResultsError } = await supabase
          .from('external_results')
          .delete()
          .eq('external_event_id', reimportEventId);

        if (deleteResultsError) throw deleteResultsError;

        // Mettre à jour les informations de l'événement si modifiées
        const { data: updatedEvent, error: updateError } = await supabase
          .from('external_events')
          .update({
            ...eventData,
            distance_km: eventData.distance_km ? parseFloat(eventData.distance_km) : null,
          })
          .eq('id', reimportEventId)
          .select()
          .single();

        if (updateError) throw updateError;
        event = updatedEvent;
      } else {
        // Mode nouvel import
        const slug = generateSlug(`${eventData.name}-${eventData.city}-${eventData.event_date}`);

        // Vérifier si un événement avec ce slug existe déjà
        const { data: duplicateEvent } = await supabase
          .from('external_events')
          .select('id, name')
          .eq('slug', slug)
          .maybeSingle();

        if (duplicateEvent) {
          const shouldReplace = confirm(
            `Un événement "${duplicateEvent.name}" existe déjà.\n\n` +
            `Voulez-vous le remplacer par ce nouvel import ?\n\n` +
            `⚠️ Cette action supprimera tous les résultats existants.`
          );

          if (!shouldReplace) {
            setLoading(false);
            return;
          }

          // Supprimer l'ancien événement et ses résultats
          const { error: deleteError } = await supabase
            .from('external_events')
            .delete()
            .eq('id', duplicateEvent.id);

          if (deleteError) throw deleteError;
        }

        const { data: newEvent, error: eventError } = await supabase
          .from('external_events')
          .insert({
            ...eventData,
            slug,
            distance_km: eventData.distance_km ? parseFloat(eventData.distance_km) : null,
            status: 'published',
            is_public: true,
          })
          .select()
          .single();

        if (eventError) throw eventError;
        event = newEvent;
      }

      const results = csvData.map(row => ({
        external_event_id: event.id,
        bib_number: columnMapping.bib_number ? row[columnMapping.bib_number] : null,
        first_name: row[columnMapping.first_name],
        last_name: row[columnMapping.last_name],
        gender: columnMapping.gender ? row[columnMapping.gender]?.toUpperCase() : null,
        birth_year: columnMapping.birth_year ? parseInt(row[columnMapping.birth_year]) : null,
        birth_date: columnMapping.birth_date ? parseFrenchDate(row[columnMapping.birth_date]) : null,
        city: columnMapping.city ? row[columnMapping.city] : null,
        club: columnMapping.club ? row[columnMapping.club] : null,
        category: columnMapping.category ? row[columnMapping.category] : null,
        finish_time: columnMapping.finish_time ? parseTime(row[columnMapping.finish_time]) : null,
        finish_time_display: columnMapping.finish_time ? row[columnMapping.finish_time] : null,
        overall_rank: columnMapping.overall_rank ? parseInt(row[columnMapping.overall_rank]) : null,
        gender_rank: columnMapping.gender_rank ? parseInt(row[columnMapping.gender_rank]) : null,
        category_rank: columnMapping.category_rank ? parseInt(row[columnMapping.category_rank]) : null,
        status: 'finished',
      }));

      const { error: resultsError } = await supabase
        .from('external_results')
        .insert(results);

      if (resultsError) throw resultsError;

      alert(`Import réussi ! ${results.length} résultats importés.`);

      const shouldMatch = confirm('Voulez-vous lancer le matching automatique des athlètes maintenant ?');
      if (shouldMatch) {
        const { data: matchData, error: matchError } = await supabase.rpc('batch_match_external_results', {
          p_event_id: event.id
        });

        if (matchError) {
          console.error('Error matching:', matchError);
        } else {
          alert(`Matching terminé !\n\nTotal : ${matchData.total}\nMatchés : ${matchData.matched} (${matchData.match_rate}%)\nNon matchés : ${matchData.unmatched}`);
        }
      }

      navigate('/admin/external-results');
    } catch (error: any) {
      console.error('Error importing results:', error);
      alert('Erreur lors de l\'import : ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout title={reimportEventId ? "Réimporter des résultats" : "Importer des résultats"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/admin/external-results')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
        </div>

        {reimportEventId && existingEvent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Mode Réimport</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Vous êtes en train de réimporter les résultats pour l'événement <strong>{existingEvent.name}</strong>.
                  Les anciens résultats seront remplacés par les nouveaux.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-24 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de l'événement</h2>
                <p className="text-gray-600">Renseignez les détails de la course</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'événement *
                  </label>
                  <input
                    type="text"
                    value={eventData.name}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Marathon de Paris 2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de l'événement *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={eventData.event_date}
                      onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={eventData.city}
                      onChange={(e) => setEventData({ ...eventData, city: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="Ex: Paris"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de sport
                  </label>
                  <select
                    value={eventData.sport_type}
                    onChange={(e) => setEventData({ ...eventData, sport_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="running">Course à pied</option>
                    <option value="trail">Trail</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="cycling">Cyclisme</option>
                    <option value="swimming">Natation</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eventData.distance_km}
                    onChange={(e) => setEventData({ ...eventData, distance_km: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: 42.195"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'organisateur *
                  </label>
                  <input
                    type="text"
                    value={eventData.organizer_name}
                    onChange={(e) => setEventData({ ...eventData, organizer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: ASO"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email organisateur
                  </label>
                  <input
                    type="email"
                    value={eventData.organizer_email}
                    onChange={(e) => setEventData({ ...eventData, organizer_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="contact@exemple.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web organisateur
                  </label>
                  <input
                    type="url"
                    value={eventData.organizer_website}
                    onChange={(e) => setEventData({ ...eventData, organizer_website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://www.exemple.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Système de chronométrage
                  </label>
                  <input
                    type="text"
                    value={eventData.timing_provider}
                    onChange={(e) => setEventData({ ...eventData, timing_provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Timepulse, Wiclax, Chronorace..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL des résultats
                  </label>
                  <input
                    type="url"
                    value={eventData.results_url}
                    onChange={(e) => setEventData({ ...eventData, results_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://resultats.exemple.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Description de l'événement..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!eventData.name || !eventData.event_date || !eventData.city || !eventData.organizer_name}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Étape suivante
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Import du fichier CSV</h2>
                <p className="text-gray-600">Sélectionnez le fichier contenant les résultats</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-700 font-medium">Choisir un fichier</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">CSV, TSV ou TXT (séparateurs : , ; ou tabulation)</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Format attendu</h4>
                <p className="text-sm text-blue-800 mb-2">Votre fichier doit contenir au minimum :</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Une colonne <strong>Prénom</strong></li>
                  <li>Une colonne <strong>Nom</strong></li>
                </ul>
                <p className="text-sm text-blue-800 mt-2">Colonnes optionnelles recommandées : Dossard, Sexe, Date de naissance, Ville, Club, Catégorie, Temps, Classement...</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mapping des colonnes</h2>
                <p className="text-gray-600">Associez les colonnes de votre fichier aux champs Timepulse</p>
              </div>

              {Object.keys(columnMapping).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900">Mapping automatique appliqué</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Format Elogica détecté : {Object.keys(columnMapping).length} colonnes mappées automatiquement.
                        Vous pouvez modifier le mapping si nécessaire.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  {[
                    { key: 'bib_number', label: 'Numéro de dossard', required: false },
                    { key: 'first_name', label: 'Prénom', required: true },
                    { key: 'last_name', label: 'Nom', required: true },
                    { key: 'gender', label: 'Sexe (M/F)', required: false },
                    { key: 'birth_year', label: 'Année de naissance', required: false },
                    { key: 'birth_date', label: 'Date de naissance', required: false },
                    { key: 'city', label: 'Ville', required: false },
                    { key: 'club', label: 'Club', required: false },
                    { key: 'category', label: 'Catégorie', required: false },
                    { key: 'finish_time', label: 'Temps', required: false },
                    { key: 'overall_rank', label: 'Classement général', required: false },
                    { key: 'gender_rank', label: 'Classement sexe', required: false },
                    { key: 'category_rank', label: 'Classement catégorie', required: false },
                  ].map(field => (
                    <div key={field.key} className="flex items-center space-x-4">
                      <label className="w-48 text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => setColumnMapping({
                          ...columnMapping,
                          [field.key]: e.target.value
                        })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">-- Non mappé --</option>
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!columnMapping.first_name || !columnMapping.last_name}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Valider et importer
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Récapitulatif</h2>
                <p className="text-gray-600">Vérifiez les informations avant l'import</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Événement</p>
                    <p className="font-semibold text-gray-900">{eventData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(eventData.event_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lieu</p>
                    <p className="font-semibold text-gray-900">{eventData.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Distance</p>
                    <p className="font-semibold text-gray-900">{eventData.distance_km ? `${eventData.distance_km} km` : 'Non renseignée'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Organisateur</p>
                    <p className="font-semibold text-gray-900">{eventData.organizer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Résultats à importer</p>
                    <p className="font-semibold text-gray-900">{csvData.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Précédent
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Import en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirmer l'import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
