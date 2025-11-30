import { useState } from 'react';
import OrganizerLayout from '../components/OrganizerLayout';
import { ArrowLeft, Upload, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function OrganizerExternalResultsImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [eventData, setEventData] = useState({
    name: '',
    event_date: '',
    city: '',
    country_code: 'FRA',
    sport_type: 'running',
    distance_km: '',
    organizer_website: '',
    timing_provider: '',
    results_url: '',
    description: '',
  });

  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

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
    if (!eventData.name || !eventData.event_date || !eventData.city) {
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

      const { data: organizer } = await supabase
        .from('organizers')
        .select('id, name, email, phone')
        .eq('user_id', user?.id)
        .single();

      if (!organizer) {
        alert('Erreur : Profil organisateur introuvable');
        return;
      }

      const slug = generateSlug(`${eventData.name}-${eventData.city}-${eventData.event_date}`);

      // Vérifier si un événement avec ce slug existe déjà
      const { data: existingEvent } = await supabase
        .from('external_events')
        .select('id, name')
        .eq('slug', slug)
        .maybeSingle();

      if (existingEvent) {
        const shouldReplace = confirm(
          `Un événement "${existingEvent.name}" existe déjà.\n\n` +
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
          .eq('id', existingEvent.id);

        if (deleteError) throw deleteError;
      }

      const { data: event, error: eventError } = await supabase
        .from('external_events')
        .insert({
          ...eventData,
          slug,
          distance_km: eventData.distance_km ? parseFloat(eventData.distance_km) : null,
          organizer_id: organizer.id,
          organizer_name: organizer.name,
          organizer_email: organizer.email,
          organizer_phone: organizer.phone,
          status: 'published',
          is_public: true,
        })
        .select()
        .single();

      if (eventError) throw eventError;

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

      alert(`Import réussi ! ${results.length} résultats publiés.`);

      const shouldMatch = confirm('Voulez-vous lancer le matching automatique des athlètes maintenant ?\n\nCela permettra de lier vos résultats aux profils athlètes Timepulse existants.');
      if (shouldMatch) {
        const { data: matchData, error: matchError } = await supabase.rpc('batch_match_external_results', {
          p_event_id: event.id
        });

        if (matchError) {
          console.error('Error matching:', matchError);
        } else {
          alert(`Matching terminé !\n\n✅ ${matchData.matched} athlètes liés (${matchData.match_rate}%)\n⚠️ ${matchData.unmatched} non liés\n\nTotal : ${matchData.total} résultats`);
        }
      }

      navigate('/organizer/external-results');
    } catch (error: any) {
      console.error('Error importing results:', error);
      alert('Erreur lors de l\'import : ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate('/organizer/external-results')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
        </div>

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
                <p className="text-gray-600">Renseignez les détails de votre course</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Pourquoi publier vos résultats sur Timepulse ?</p>
                    <p className="text-sm text-blue-800">
                      Vos participants pourront consulter leurs résultats, les partager sur les réseaux sociaux,
                      et alimenter leur profil athlète. C'est gratuit et améliore votre visibilité !
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'événement *
                  </label>
                  <input
                    type="text"
                    value={eventData.name}
                    onChange={(e) => setEventData({ ...eventData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Trail des Vignes 2025"
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
                      placeholder="Ex: Bordeaux"
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
                    placeholder="Ex: 21.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web de l'événement
                  </label>
                  <input
                    type="url"
                    value={eventData.organizer_website}
                    onChange={(e) => setEventData({ ...eventData, organizer_website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://www.mon-event.fr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Système de chronométrage utilisé
                  </label>
                  <input
                    type="text"
                    value={eventData.timing_provider}
                    onChange={(e) => setEventData({ ...eventData, timing_provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Ex: Wiclax, Chronorace..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={eventData.description}
                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Décrivez votre événement en quelques mots..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!eventData.name || !eventData.event_date || !eventData.city}
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
                <p className="text-gray-600">Téléchargez le fichier contenant vos résultats</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-700 font-medium text-lg">Choisir un fichier</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">Formats acceptés : CSV, TSV ou TXT</p>
                <p className="text-xs text-gray-400 mt-1">Séparateurs supportés : , ; ou tabulation</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Format attendu du fichier</h4>
                <p className="text-sm text-blue-800 mb-2">Votre fichier doit contenir <strong>au minimum</strong> :</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside mb-3">
                  <li><strong>Prénom</strong> (obligatoire)</li>
                  <li><strong>Nom</strong> (obligatoire)</li>
                </ul>
                <p className="text-sm text-blue-800 mb-2">Colonnes <strong>recommandées</strong> pour un meilleur matching :</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Date de naissance ou année de naissance</li>
                  <li>Sexe (M/F)</li>
                  <li>Ville, Club, Dossard</li>
                  <li>Temps, Classement général, Classement par sexe, Catégorie</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Association des colonnes</h2>
                <p className="text-gray-600">Faites correspondre les colonnes de votre fichier</p>
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
                    { key: 'birth_date', label: 'Date de naissance (AAAA-MM-JJ)', required: false },
                    { key: 'city', label: 'Ville', required: false },
                    { key: 'club', label: 'Club', required: false },
                    { key: 'category', label: 'Catégorie', required: false },
                    { key: 'finish_time', label: 'Temps', required: false },
                    { key: 'overall_rank', label: 'Classement général', required: false },
                    { key: 'gender_rank', label: 'Classement sexe', required: false },
                    { key: 'category_rank', label: 'Classement catégorie', required: false },
                  ].map(field => (
                    <div key={field.key} className="flex items-center space-x-4">
                      <label className="w-56 text-sm font-medium text-gray-700">
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
                  Valider et continuer
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Récapitulatif</h2>
                <p className="text-gray-600">Vérifiez les informations avant la publication</p>
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
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Résultats à publier</p>
                    <p className="font-semibold text-gray-900 text-2xl">{csvData.length} participants</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  ✅ Vos résultats seront <strong>publiés publiquement</strong> sur Timepulse<br/>
                  ✅ Les athlètes pourront les consulter et les partager<br/>
                  ✅ Ils seront <strong>indexés sur Google</strong> pour améliorer votre visibilité
                </p>
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
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Publication en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>Publier les résultats</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </OrganizerLayout>
  );
}
