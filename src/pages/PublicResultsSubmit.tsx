import { useState } from 'react';
import { Upload, Calendar, MapPin, Building2, Mail, Phone, Globe, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

export default function PublicResultsSubmit() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [organizerData, setOrganizerData] = useState({
    organization_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
  });

  const [eventData, setEventData] = useState({
    name: '',
    event_date: '',
    city: '',
    department: '',
    country_code: 'FRA',
    sport_type: 'running',
    distance_km: '',
    description: '',
    federation_type: 'none',
    is_qualifying_event: false,
    race_name: '',
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isElogicaFormat, setIsElogicaFormat] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };

    reader.readAsText(file);
  }

  function parseCSV(text: string) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      alert('Fichier CSV vide');
      return;
    }

    const firstLines = lines.slice(0, 3).map(line => line.toLowerCase());
    const isElogica = firstLines.some(line =>
      line.includes('elogica') ||
      line.includes('e-logica') ||
      (lines.length >= 3 && lines[2].toLowerCase().includes('dossard'))
    );

    setIsElogicaFormat(isElogica);

    let headers: string[];
    let dataStartLine: number;

    if (isElogica && lines.length >= 3) {
      headers = lines[2].split(/[;,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
      dataStartLine = 3;
    } else {
      headers = lines[0].split(/[;,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
      dataStartLine = 1;
    }

    setCsvHeaders(headers);

    if (isElogica) {
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const lower = header.toLowerCase();

        if (lower === 'numdossard' || lower === 'num_dossard' || lower === 'dossard' || lower === 'dos' || lower === 'bib') {
          autoMapping.bib_number = header;
        }
        if (lower === 'nom' || lower === 'lastname') {
          autoMapping.last_name = header;
        }
        if (lower === 'prenom' || lower === 'prénom' || lower === 'firstname') {
          autoMapping.first_name = header;
        }
        if (lower === 'datenaiss' || lower === 'date_naiss' || lower === 'datenaissance' || lower === 'date_naissance' || lower === 'annee_naissance' || lower === 'annee naissance') {
          autoMapping.birth_year = header;
        }
        if (lower === 'sexe' || lower === 's' || lower === 'gender') {
          autoMapping.gender = header;
        }
        if (lower === 'nomequipe' || lower === 'nom_equipe' || lower === 'club' || lower === 'team') {
          autoMapping.club = header;
        }
        if (lower === 'ville' || lower === 'city') {
          autoMapping.city = header;
        }
        if (lower === 'perf' || lower === 'temps' || lower === 'temps officiel' || lower === 'time') {
          autoMapping.finish_time = header;
        }
        if (lower === 'categorie' || lower === 'catégorie' || lower === 'cat' || lower === 'category') {
          autoMapping.category = header;
        }
        if (lower === 'place' || lower === 'clt' || lower === 'classement' || lower === 'clg' || lower === 'rank') {
          autoMapping.overall_rank = header;
        }
        if (lower === 'perfsexe' || lower === 'perf_sexe' || lower === 'clt/sexe' || lower === 'clts' || lower === 'clt sexe') {
          autoMapping.gender_rank = header;
        }
        if (lower === 'perfcat' || lower === 'perf_cat' || lower === 'perfcate' || lower === 'clt/cat' || lower === 'cltc' || lower === 'clt cat') {
          autoMapping.category_rank = header;
        }
      });
      setColumnMapping(autoMapping);
    }

    const data = lines.slice(dataStartLine).map(line => {
      const values = line.split(/[;,\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setCsvData(data);
  }

  function parseBirthYear(birthString: string): number | null {
    if (!birthString) return null;

    const cleaned = birthString.trim();

    if (/^\d{4}$/.test(cleaned)) {
      return parseInt(cleaned);
    }

    const dateMatch = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (dateMatch) {
      return parseInt(dateMatch[3]);
    }

    const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return parseInt(isoMatch[1]);
    }

    return null;
  }

  function parseTime(timeString: string): string | null {
    if (!timeString) return null;

    const patterns = [
      /^(\d{1,2}):(\d{2}):(\d{2})$/,
      /^(\d{1,2}):(\d{2})$/,
      /^(\d{1,2})h(\d{2})m(\d{2})s$/,
      /^(\d{1,2})h(\d{2})$/,
    ];

    for (const pattern of patterns) {
      const match = timeString.match(pattern);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    return null;
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleSubmit() {
    if (!organizerData.organization_name || !organizerData.email) {
      alert('Veuillez remplir le nom de votre organisation et votre email');
      return;
    }

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

      const slug = generateSlug(`${eventData.name}-${eventData.city}-${eventData.event_date}`);

      const { data: eventResult, error: eventError } = await supabase
        .rpc('insert_external_event_public', {
          p_name: eventData.name,
          p_slug: slug,
          p_event_date: eventData.event_date,
          p_city: eventData.city,
          p_country_code: eventData.country_code,
          p_organizer_name: organizerData.organization_name,
          p_organizer_email: organizerData.email,
          p_description: eventData.description,
          p_sport_type: eventData.sport_type,
          p_distance_km: eventData.distance_km ? parseFloat(eventData.distance_km) : null,
          p_organizer_phone: organizerData.phone,
          p_organizer_website: organizerData.website,
          p_custom_fields: {
            source: 'public_submission',
            contact_name: organizerData.contact_name,
            submitted_at: new Date().toISOString(),
            is_elogica_format: isElogicaFormat,
            federation_type: eventData.federation_type,
            department: eventData.department,
            is_qualifying_event: eventData.is_qualifying_event,
            race_name: eventData.race_name || null,
            recalculate_rankings: true,
          }
        });

      if (eventError) throw eventError;

      const event = eventResult as { id: string };

      const results = csvData.map(row => {
        const timeString = columnMapping.finish_time ? row[columnMapping.finish_time] : null;
        const parsedTime = timeString ? parseTime(timeString) : null;
        const birthYearString = columnMapping.birth_year ? row[columnMapping.birth_year] : null;
        const birthYear = birthYearString ? parseBirthYear(birthYearString) : null;

        return {
          external_event_id: event.id,
          bib_number: columnMapping.bib_number ? row[columnMapping.bib_number] : null,
          first_name: row[columnMapping.first_name],
          last_name: row[columnMapping.last_name],
          gender: columnMapping.gender ? row[columnMapping.gender]?.toUpperCase() : null,
          birth_year: birthYear,
          birth_date: columnMapping.birth_date ? row[columnMapping.birth_date] : null,
          city: columnMapping.city ? row[columnMapping.city] : null,
          club: columnMapping.club ? row[columnMapping.club] : null,
          category: columnMapping.category ? row[columnMapping.category] : null,
          finish_time: parsedTime,
          finish_time_display: timeString,
          overall_rank: columnMapping.overall_rank ? parseInt(row[columnMapping.overall_rank]) || null : null,
          gender_rank: columnMapping.gender_rank ? parseInt(row[columnMapping.gender_rank]) || null : null,
          category_rank: columnMapping.category_rank ? parseInt(row[columnMapping.category_rank]) || null : null,
          status: 'finished',
        };
      });

      const { error: resultsError } = await supabase
        .rpc('insert_external_results_batch', {
          p_results: results
        });

      if (resultsError) throw resultsError;

      setStep(5);
    } catch (error: any) {
      console.error('Error submitting results:', error);
      alert('Erreur lors de l\'envoi : ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Publiez vos résultats sur Timepulse
          </h1>
          <p className="text-lg text-gray-600">
            Service gratuit pour donner plus de visibilité à vos participants
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-24 h-1 ${step > s ? 'bg-pink-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Votre organisation</h2>
                <p className="text-gray-600">Vos coordonnées pour vous contacter</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Service gratuit</p>
                    <p className="text-sm text-blue-800">
                      La publication de vos résultats sur Timepulse est 100% gratuite. Vos participants pourront
                      consulter leurs résultats, les partager et alimenter leur profil athlète.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de votre organisation *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={organizerData.organization_name}
                      onChange={(e) => setOrganizerData({ ...organizerData, organization_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                      placeholder="Ex: Association Sportive de Bordeaux"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    value={organizerData.contact_name}
                    onChange={(e) => setOrganizerData({ ...organizerData, contact_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={organizerData.email}
                      onChange={(e) => setOrganizerData({ ...organizerData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                      placeholder="contact@monasso.fr"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={organizerData.phone}
                      onChange={(e) => setOrganizerData({ ...organizerData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={organizerData.website}
                      onChange={(e) => setOrganizerData({ ...organizerData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                      placeholder="https://www.monasso.fr"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!organizerData.organization_name || !organizerData.email}
                  className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Étape suivante
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de l'événement</h2>
                <p className="text-gray-600">Détails de votre course</p>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Ex: Semi-Marathon de Bordeaux 2025"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                      placeholder="Ex: Bordeaux"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Département *
                  </label>
                  <input
                    type="text"
                    value={eventData.department}
                    onChange={(e) => setEventData({ ...eventData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Ex: 33, 75, 13..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numéro du département (servira pour les statistiques)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de sport
                  </label>
                  <select
                    value={eventData.sport_type}
                    onChange={(e) => setEventData({ ...eventData, sport_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Ex: 21.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fédération *
                  </label>
                  <select
                    value={eventData.federation_type}
                    onChange={(e) => setEventData({ ...eventData, federation_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    required
                  >
                    <option value="none">Aucune fédération</option>
                    <option value="FFA">FFA (Fédération Française d'Athlétisme)</option>
                    <option value="FFTRI">FFTri (Fédération Française de Triathlon)</option>
                    <option value="UFOLEP">UFOLEP</option>
                    <option value="FSGT">FSGT</option>
                    <option value="other">Autre</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Les catégories et classements seront calculés selon les règles de la fédération
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la course (si plusieurs dans l'événement)
                  </label>
                  <input
                    type="text"
                    value={eventData.race_name}
                    onChange={(e) => setEventData({ ...eventData, race_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Ex: 10km, Semi-Marathon, Trail long..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utile si vous publiez plusieurs courses du même événement
                  </p>
                </div>

                <div className="md:col-span-2 flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_qualifying"
                    checked={eventData.is_qualifying_event}
                    onChange={(e) => setEventData({ ...eventData, is_qualifying_event: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-600"
                  />
                  <label htmlFor="is_qualifying" className="text-sm text-gray-700">
                    <strong>Épreuve qualificative</strong> - Les distances sont officielles et homologuées par la fédération
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <textarea
                    value={eventData.description}
                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                    placeholder="Décrivez votre événement..."
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!eventData.name || !eventData.event_date || !eventData.city}
                  className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Étape suivante
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Import du fichier de résultats</h2>
                <p className="text-gray-600">Téléchargez votre fichier CSV ou Elogica</p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-pink-400 transition">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-pink-600 hover:text-pink-700 font-medium text-lg">Choisir un fichier</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">Formats acceptés : CSV, TXT, Elogica</p>
                {csvFile && (
                  <p className="text-sm text-green-600 mt-2">✓ {csvFile.name} ({csvData.length} lignes)</p>
                )}
              </div>

              {isElogicaFormat && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900 font-medium">
                    ✓ Format Elogica détecté ! Le mapping des colonnes sera automatique.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Formats supportés</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Fichiers Elogica</strong> : Détection et mapping automatique</li>
                  <li><strong>CSV standard</strong> : Séparateurs , ; ou tabulation</li>
                  <li><strong>Colonnes obligatoires</strong> : Prénom, Nom</li>
                  <li><strong>Colonnes recommandées</strong> : Temps, Classement, Sexe, Catégorie</li>
                </ul>
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
                  disabled={csvData.length === 0}
                  className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Configurer les colonnes
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Association des colonnes</h2>
                <p className="text-gray-600">
                  {isElogicaFormat
                    ? 'Mapping automatique détecté. Vérifiez et ajustez si nécessaire.'
                    : 'Faites correspondre les colonnes de votre fichier'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  {[
                    { key: 'bib_number', label: 'Numéro de dossard', required: false },
                    { key: 'first_name', label: 'Prénom', required: true },
                    { key: 'last_name', label: 'Nom', required: true },
                    { key: 'gender', label: 'Sexe (M/F)', required: false },
                    { key: 'birth_year', label: 'Année de naissance', required: false },
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
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
                  onClick={() => setStep(3)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!columnMapping.first_name || !columnMapping.last_name || loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      <span>Envoyer les résultats</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-12">
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Résultats envoyés !</h2>
              <p className="text-lg text-gray-600 mb-2">
                Merci d'avoir soumis vos résultats sur Timepulse.
              </p>
              <p className="text-gray-600 mb-8">
                Votre demande est en cours de vérification par notre équipe.
                Vous recevrez un email de confirmation une fois les résultats validés et publiés.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-3">Récapitulatif de votre envoi</h3>
                <div className="text-left space-y-2 text-sm text-blue-800">
                  <p><strong>Organisation :</strong> {organizerData.organization_name}</p>
                  <p><strong>Événement :</strong> {eventData.name}</p>
                  <p><strong>Date :</strong> {new Date(eventData.event_date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Ville :</strong> {eventData.city}</p>
                  <p><strong>Fédération :</strong> {eventData.federation_type === 'none' ? 'Aucune' : eventData.federation_type}</p>
                  <p><strong>Participants :</strong> {csvData.length}</p>
                </div>
              </div>

              {eventData.federation_type !== 'none' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h3 className="font-semibold text-green-900 mb-2">Recalcul automatique des classements</h3>
                      <p className="text-sm text-green-800 mb-2">
                        Les catégories et classements seront automatiquement recalculés selon les règles de la {eventData.federation_type}
                      </p>
                      <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                        <li>Catégories calculées selon l'année de naissance</li>
                        <li>Classement général, par sexe et par catégorie</li>
                        <li>Conformité aux règles fédérales en vigueur</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
                <p className="text-gray-600 mb-4">
                  Notre équipe est disponible pour répondre à vos questions
                </p>
                <a
                  href="mailto:contact@timepulse.run"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  <Mail className="w-5 h-5" />
                  <span>contact@timepulse.run</span>
                </a>
              </div>

              <button
                onClick={() => navigate('/')}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Retour à l'accueil
              </button>
            </div>
          )}
        </div>

        {step < 5 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Besoin d'aide ?</p>
            <a
              href="mailto:contact@timepulse.run"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Contactez notre support : contact@timepulse.run
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
