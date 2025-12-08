import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, Info, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateFFACategory } from '../lib/category-calculator';
import AdminLayout from '../components/Admin/AdminLayout';

interface CSVRow {
  [key: string]: string;
}

interface ParsedData {
  rows: CSVRow[];
  headers: string[];
  stats: {
    total: number;
  };
}

interface Event {
  id: string;
  name: string;
}

interface Race {
  id: string;
  name: string;
  event_id: string;
}

export default function AdminTimepulseImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRaces(selectedEventId);
    } else {
      setRaces([]);
      setSelectedRaceId('');
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('admin_get_all_events');

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setError('Aucun événement trouvé. Créez d\'abord un événement.');
      }

      // Transformer pour avoir le bon format
      const eventsData = data?.map((e: any) => ({
        id: e.id,
        name: e.name,
        start_date: e.start_date,
        status: e.status
      })) || [];

      setEvents(eventsData);
    } catch (err: any) {
      console.error('Erreur chargement événements:', err);
      setError(`Impossible de charger les événements : ${err.message}`);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadRaces = async (eventId: string) => {
    try {
      // Charger d'abord l'événement pour vérifier les permissions
      const { data: eventData, error: eventError } = await supabase
        .rpc('admin_get_all_events');

      if (eventError) {
        console.error('Error checking event:', eventError);
        return;
      }

      // Vérifier que l'événement existe dans la liste accessible
      const event = eventData?.find((e: any) => e.id === eventId);
      if (!event) {
        console.error('Event not accessible');
        return;
      }

      // Charger les races avec accès admin
      const { data, error } = await supabase
        .from('races')
        .select('id, name, event_id')
        .eq('event_id', eventId)
        .order('name');

      if (error) throw error;
      setRaces(data || []);
    } catch (err: any) {
      console.error('Erreur chargement épreuves:', err);
      setError('Impossible de charger les épreuves');
    }
  };

  // Convertir valeur vide en null
  const emptyToNull = (value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    return String(value).trim() || null;
  };

  // Convertir une date française DD/MM/YYYY en format ISO YYYY-MM-DD
  const convertFrenchDateToISO = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Format DD/MM/YYYY
    const frenchDateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (frenchDateMatch) {
      const [, day, month, year] = frenchDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Si déjà au format ISO ou autre format, retourner tel quel
    return dateStr;
  };

  const parseCSV = (text: string): ParsedData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Fichier vide');

    // Détecter le séparateur (virgule ou point-virgule)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    console.log('Séparateur détecté:', separator === ';' ? 'point-virgule (;)' : 'virgule (,)');

    // Parser CSV robuste qui gère les guillemets et les séparateurs
    const parseCSVLine = (line: string, sep: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0], separator).map(h => h.replace(/^["']|["']$/g, '').trim());
    console.log('Headers détectés:', headers.slice(0, 10));

    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator).map(v => v.replace(/^["']|["']$/g, '').trim());
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return {
      rows,
      headers,
      stats: { total: rows.length }
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewData(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setPreviewData(parsed);
      setSuccess(`Fichier analysé : ${parsed.stats.total} lignes détectées`);
    } catch (err: any) {
      setError(`Erreur de lecture : ${err.message}`);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recalcule les catégories FFA pour toutes les entrées d'une course
   * si celle-ci est affiliée FFA
   */
  const recalculateFFACategories = async (eventId: string, raceId: string) => {
    try {
      // Récupérer la date de l'événement
      const { data: eventData } = await supabase
        .from('events')
        .select('start_date')
        .eq('id', eventId)
        .single();

      if (!eventData?.start_date) {
        console.log('⚠️ Date d\'événement non trouvée, catégories non recalculées');
        return;
      }

      const eventDate = new Date(eventData.start_date);

      // Vérifier si la course est FFA
      const { data: raceData } = await supabase
        .from('races')
        .select('is_ffa_race, name')
        .eq('id', raceId)
        .single();

      if (!raceData?.is_ffa_race) {
        console.log('ℹ️ Course non-FFA, catégories non recalculées');
        return;
      }

      console.log(`🏃 Recalcul des catégories FFA pour "${raceData.name}"...`);

      // Récupérer toutes les entrées de cette course avec les dates de naissance
      const { data: entries } = await supabase
        .from('entries')
        .select('id, athlete_id, athletes!inner(birthdate, first_name, last_name)')
        .eq('race_id', raceId)
        .limit(10000);

      if (!entries || entries.length === 0) {
        console.log('ℹ️ Aucune entrée trouvée pour recalculer');
        return;
      }

      console.log(`📊 Recalcul pour ${entries.length} participants...`);

      let updated = 0;
      for (const entry of entries) {
        const athlete = entry.athletes as any;
        if (!athlete?.birthdate) {
          console.warn(`⚠️ Pas de date de naissance pour ${athlete?.first_name} ${athlete?.last_name}`);
          continue;
        }

        // Calculer la catégorie FFA
        const category = calculateFFACategory(athlete.birthdate, eventDate);

        if (category) {
          await supabase
            .from('entries')
            .update({ category })
            .eq('id', entry.id);
          updated++;
        }
      }

      console.log(`✅ ${updated} catégories FFA recalculées sur ${entries.length} entrées`);
    } catch (err) {
      console.error('❌ Erreur lors du recalcul des catégories FFA:', err);
    }
  };

  const handleImport = async () => {
    if (!previewData || !selectedEventId || !selectedRaceId) {
      setError('Veuillez sélectionner un événement et une épreuve');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Récupérer l'ID de l'admin connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour importer');
        return;
      }

      // Récupérer l'organisateur de l'événement
      const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', selectedEventId)
        .single();

      if (!event) {
        setError('Événement introuvable');
        return;
      }

      const totalRows = previewData.rows.length;
      setImportProgress({ current: 0, total: totalRows });

      console.log(`🚀 Import en batch de ${totalRows} participants...`);

      // Préparer les données pour l'import en batch
      const participants = previewData.rows.map((row, index) => {
        const email = row.email || row.Email || row.EMAIL || row.e_mail || row.E_mail ||
                      row['E-mail'] || row['e-mail'] || row.mail || row.Mail || '';
        const firstName = row.first_name || row.prenom || row.Prénom || row['Prénom'] || '';
        const lastName = row.last_name || row.nom || row.Nom || row['Nom'] || '';
        const birthdateRaw = row.birth_date || row.birthdate || row.naissance || row['Date de naissance'] || '';
        const birthdate = convertFrenchDateToISO(birthdateRaw);

        const genderValue = (row.gender || row.sexe || row.Sexe || '').toString().toUpperCase();
        const gender = genderValue === 'M' || genderValue === 'H' || genderValue === 'MALE' || genderValue === 'HOMME' ? 'M' : 'F';

        const certDateRaw = row.medical_certificate_date || row.date_certificat || row['Date Certificat'] || row.certificat_medical || '';
        const certDate = convertFrenchDateToISO(certDateRaw);

        const ppsDateRaw = row.pps_valid_until || row.pps_date || row['Date validité PPS'] || '';
        const ppsDate = convertFrenchDateToISO(ppsDateRaw);

        const ppsNumberRaw = emptyToNull(row.pps_number || row.pps || row.num_pps || row['Numéro PPS'] || row.numero_pps);
        const ppsNumber = (ppsNumberRaw && ppsDate) ? ppsNumberRaw : null;

        let notesText = '';
        if (certDate) notesText += `Certificat médical: ${certDate}\n`;
        if (row.team_name || row.equipe) notesText += `Équipe: ${row.team_name || row.equipe}\n`;
        if (row.notes || row.remarques) notesText += row.notes || row.remarques;

        return {
          line_number: index + 1,
          email: email.toLowerCase().trim(),
          first_name: firstName,
          last_name: lastName,
          gender: gender,
          birthdate: birthdate,
          nationality: row.nationality || row.nationalite || 'FRA',
          phone: emptyToNull(row.phone || row.mobile || row.telephone),
          city: emptyToNull(row.city || row.ville),
          postal_code: emptyToNull(row.postal_code || row.cp),
          license_number: emptyToNull(row.license_number || row.licence),
          license_club: emptyToNull(row.license_club || row.club),
          license_type: emptyToNull(row.license_type || row.type_licence),
          federation: emptyToNull(row.federation),
          league: emptyToNull(row.league || row.ligue),
          club_number: emptyToNull(row.club_number || row.num_club),
          pps_number: ppsNumber,
          pps_valid_until: ppsNumber ? ppsDate : null,
          category: row.category || row.categorie || 'SE',
          bib_number: row.bib_number || row.num_dossard || row.dossard || null,
          notes: notesText.trim() || null
        };
      });

      // Appeler la fonction d'import en batch
      const { data: result, error: importError } = await supabase
        .rpc('bulk_import_participants', {
          p_event_id: selectedEventId,
          p_race_id: selectedRaceId,
          p_organizer_id: event.organizer_id,
          p_created_by: user.id,
          p_participants: participants
        });

      if (importError) {
        console.error('❌ Erreur import batch:', importError);
        setError(`Erreur lors de l'import: ${importError.message}`);
        return;
      }

      if (!result.success) {
        setError(`Erreur: ${result.error}`);
        return;
      }

      const imported = result.imported || 0;
      const skipped = result.skipped || 0;
      const errors = result.errors || [];

      console.log(`✅ Import terminé: ${imported} importés, ${skipped} ignorés`);

      // Mise à jour de la progression finale
      setImportProgress({ current: totalRows, total: totalRows });


      // Afficher les erreurs si présentes
      if (errors.length > 0) {
        console.warn(`⚠️ Erreurs d'import:`, errors);
      }

      setSuccess(`Import ultra-rapide terminé : ${imported} inscriptions importées, ${skipped} doublons ignorés.`);
      if (errors.length > 0) {
        setError(`${errors.length} erreurs : ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Import CSV/Excel
              </h1>
              <p className="text-slate-600">
                Importez vos inscriptions depuis l'ancien site Timepulse.fr
              </p>
            </div>
            <FileSpreadsheet className="h-12 w-12 text-blue-600" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Comment utiliser cet outil :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Exportez vos inscriptions depuis l'ancien site en format CSV</li>
                  <li>Téléchargez le fichier CSV ci-dessous</li>
                  <li>Prévisualisez les données détectées</li>
                  <li>Sélectionnez l'événement et l'épreuve de destination</li>
                  <li>Validez l'import</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-100 rounded-md border border-blue-300">
                  <p className="font-semibold text-blue-900 mb-1">⚠️ Gestion automatique :</p>
                  <ul className="text-xs space-y-1 text-blue-900">
                    <li><strong>• Doublons d'emails acceptés :</strong> Permet d'inscrire plusieurs personnes avec le même email (ex: parent inscrivant ses enfants)</li>
                    <li><strong>• Détection des doublons :</strong> Seuls les vrais doublons (même nom + prénom + date de naissance) sont ignorés</li>
                    <li><strong>• Catégories FFA :</strong> Les catégories FFA seront automatiquement recalculées après l'import basées sur la date de l'événement</li>
                  </ul>
                </div>
                <p className="mt-3 font-semibold">Colonnes de base acceptées :</p>
                <p className="text-xs mt-1 mb-2">
                  <strong>Identité :</strong> email, first_name/prenom, last_name/nom, gender/sexe (M/F/H/Homme/Femme), birth_date/birthdate/naissance<br />
                  <strong>Contact :</strong> phone/telephone/mobile/tel, city/ville, postal_code/zip/cp<br />
                  <strong>Nationalité :</strong> nationality/nationalite (code ISO 3 lettres, ex: FRA)<br />
                  <strong>Licence :</strong> license_number/num_licence, license_club/club, license_type/type_licence<br />
                  <strong>Fédération :</strong> federation, league/ligue, club_number/num_club<br />
                  <strong>PPS et Certificat :</strong> pps_number/pps/num_pps, medical_certificate_date/date_certificat/certificat_medical<br />
                  <strong>Équipe :</strong> team_name/equipe/nom_equipe, team_type/type_equipe (M/F/X/Homme/Femme/Mixte)<br />
                  <strong>Course :</strong> bib_number/num_dossard, category/categorie, amount/tarif/montant, notes/remarques/commentaires
                </p>
                <p className="mt-2 font-semibold">Options acceptées (détection automatique) :</p>
                <p className="text-xs mt-1">
                  <strong>Temps de référence :</strong> colonnes contenant "temps", "reference" ou "time"<br />
                  <strong>Taille T-shirt :</strong> colonnes contenant "taille", "t-shirt", "tshirt" ou "size"<br />
                  <strong>Commentaires :</strong> colonnes contenant "commentaire", "comment" ou "note"<br />
                  <strong>Prix des options :</strong> ajoutez "_prix" ou "_price" après le nom (ex: taille_tshirt_prix)<br />
                  <span className="text-blue-900 italic">Les options doivent d'abord être créées dans la configuration de l'épreuve</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Succès</p>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fichier CSV/Excel
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center px-6 py-12 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">
                      {file ? file.name : 'Cliquez pour télécharger un fichier CSV'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Format accepté: .csv
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {previewData && (
              <div className="border border-slate-200 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Aperçu des données
                  </h3>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {previewData.stats.total}
                    </div>
                    <div className="text-sm text-slate-600">lignes détectées</div>
                  </div>

                  {importing && importProgress.total > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">
                          Import en cours...
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {importProgress.current} / {importProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-3 transition-all duration-300 ease-out"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-blue-700 mt-2 text-center">
                        {Math.round((importProgress.current / importProgress.total) * 100)}% terminé
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Colonnes détectées:</p>
                    <div className="flex flex-wrap gap-2">
                      {previewData.headers.map((header, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                        >
                          {header}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Assurez-vous qu'une colonne "email" ou similaire est présente
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-2">Sélectionner la destination</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Événement</label>
                          <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full px-3 py-2 border border-orange-300 rounded bg-white text-slate-900"
                            disabled={loadingEvents}
                          >
                            <option value="">
                              {loadingEvents ? 'Chargement...' : events.length === 0 ? 'Aucun événement disponible' : 'Sélectionner...'}
                            </option>
                            {events.map((event) => (
                              <option key={event.id} value={event.id}>
                                {event.name}
                              </option>
                            ))}
                          </select>
                          {loadingEvents && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Chargement des événements...
                            </p>
                          )}
                          {!loadingEvents && events.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Aucun événement trouvé
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Épreuve</label>
                          <select
                            value={selectedRaceId}
                            onChange={(e) => setSelectedRaceId(e.target.value)}
                            className="w-full px-3 py-2 border border-orange-300 rounded bg-white text-slate-900"
                            disabled={!selectedEventId || races.length === 0}
                          >
                            <option value="">
                              {!selectedEventId ? 'Sélectionnez d\'abord un événement' : races.length === 0 ? 'Aucune épreuve disponible' : 'Sélectionner...'}
                            </option>
                            {races.map((race) => (
                              <option key={race.id} value={race.id}>
                                {race.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {previewData.rows.slice(0, 50).map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            {previewData.headers.map((header, colIndex) => (
                              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewData.stats.total > 50 && (
                    <p className="text-sm text-slate-600 text-center mt-4">
                      Affichage des 50 premières lignes sur {previewData.stats.total}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={handleImport}
                    disabled={importing || !selectedEventId || !selectedRaceId}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-lg font-semibold"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Importer {previewData.stats.total} inscriptions
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
