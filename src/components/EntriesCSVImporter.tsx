import { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateFFACategory } from '../lib/category-calculator';

interface EntriesCSVImporterProps {
  raceId: string;
  eventId: string;
  onImportComplete: () => void;
  onClose: () => void;
}

interface ParsedEntry {
  firstName: string;
  lastName: string;
  email: string;
  birthdate: string;
  gender: 'M' | 'F';
  city: string;
  postalCode: string;
  nationality: string;
  club: string;
  licenseNumber: string;
  licenseType: string;
  licenseTypeFull: string;
  federation: string;
  baseAmount: number;
  optionsAmount: number;
  totalAmount: number;
  bibNumber?: string;
  registrationDate?: string;
  optionsData?: { [optionId: string]: string };
}

interface RaceOption {
  id: string;
  label: string;
  type: 'text' | 'choice' | 'checkbox' | 'number';
  choices?: string;
  required: boolean;
}

export default function EntriesCSVImporter({
  raceId,
  eventId,
  onImportComplete,
  onClose
}: EntriesCSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [preview, setPreview] = useState<ParsedEntry[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvLines, setCsvLines] = useState<string[]>([]);

  const [step, setStep] = useState<'upload' | 'options-mapping' | 'import'>('upload');
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [optionsMapping, setOptionsMapping] = useState<{ [optionId: string]: number }>({});
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [isFFARace, setIsFFARace] = useState(false);

  useEffect(() => {
    loadRaceOptions();
    loadEventInfo();
  }, [raceId, eventId]);

  async function loadRaceOptions() {
    try {
      const { data, error } = await supabase
        .from('race_options')
        .select('*')
        .eq('race_id', raceId)
        .order('display_order');

      if (error) throw error;
      setRaceOptions(data || []);
    } catch (err) {
      console.error('Error loading race options:', err);
    }
  }

  async function loadEventInfo() {
    try {
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('is_ffa_race')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setIsFFARace(raceData?.is_ffa_race || false);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('start_date')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (eventData?.start_date) {
        setEventDate(new Date(eventData.start_date));
      }
    } catch (err) {
      console.error('Error loading event info:', err);
    }
  }

  function parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    return null;
  }

  function normalizeGender(gender: string): 'M' | 'F' {
    if (!gender) return 'M';
    const g = gender.toUpperCase().trim();
    if (g === 'F' || g === 'FEMME' || g === 'FEMALE' || g === 'W') return 'F';
    return 'M';
  }

  function parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/[€\s]/g, '').replace(',', '.');
    const amount = parseFloat(cleaned);
    return isNaN(amount) ? 0 : amount;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        setErrors(['Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données']);
        return;
      }

      const csvHeaders = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
      setHeaders(csvHeaders);
      setCsvLines(lines);

      const previewData: ParsedEntry[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''));

        try {
          const entry = parseCSVLine(csvHeaders, values, {});
          if (entry) {
            previewData.push(entry);
          }
        } catch (err: any) {
          parseErrors.push(`Ligne ${i + 1}: ${err.message}`);
        }
      }

      setPreview(previewData);
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
      }
    };

    reader.readAsText(selectedFile);
  }

  function parseCSVLine(headers: string[], values: string[], optMapping: { [optionId: string]: number }): ParsedEntry | null {
    const getColumn = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h =>
          h.toLowerCase().includes(name.toLowerCase())
        );
        if (index !== -1 && values[index]) {
          return values[index];
        }
      }
      return '';
    };

    const firstName = getColumn(['Prénom', 'prenom', 'first_name']);
    const lastName = getColumn(['Nom', 'nom', 'last_name']);
    const email = getColumn(['Email', 'email', 'Mail']);
    const birthdate = parseDate(getColumn(['Date de naissance', 'date_naissance', 'birthdate', 'naissance']));
    const gender = normalizeGender(getColumn(['Sexe', 'sexe', 'gender']));
    const city = getColumn(['Ville', 'ville', 'city']);
    const postalCode = getColumn(['CP', 'code_postal', 'postal_code']);
    const nationality = getColumn(['Nationalité', 'nationalite', 'nationality']) || 'FRA';
    const club = getColumn(['Club/Asso', 'club', 'Club']);

    const rawLicenseNumber = getColumn(['N° de licence', 'numero_licence', 'license_number']);
    const rawLicenseType = getColumn(['Type de licence', 'type_licence', 'license_type']);
    const federation = getColumn(['Licence', 'licence', 'federation']);

    // Déterminer intelligemment quel champ contient quoi
    let licenseNumber = '';
    let licenseTypeFull = '';

    // Si "N° de licence" contient FFA/FFTRI/etc, c'est en fait le type
    if (rawLicenseNumber && /^(FFA|FFTRI|FFN|FFVélo|FFCO)/i.test(rawLicenseNumber.trim())) {
      licenseTypeFull = rawLicenseType || rawLicenseNumber;
      licenseNumber = '';
    }
    // Si "N° de licence" est vide ou "-", pas de numéro
    else if (!rawLicenseNumber || rawLicenseNumber === '-') {
      licenseNumber = '';
      licenseTypeFull = rawLicenseType;
    }
    // Sinon, utilisation normale
    else {
      licenseNumber = rawLicenseNumber;
      licenseTypeFull = rawLicenseType;
    }

    const baseAmount = parseAmount(getColumn(['Montant inscription', 'montant_inscription', 'base_amount']));
    const optionsAmount = parseAmount(getColumn(['Montant options', 'montant_options', 'options_amount']));
    const totalAmount = baseAmount + optionsAmount;

    let bibNumber = getColumn(['Dossard', 'dossard', 'bib_number', 'bib']);
    // Nettoyer le dossard (supprimer les espaces et zéros initiaux)
    if (bibNumber) {
      bibNumber = bibNumber.trim().replace(/^0+/, '') || null;
    }

    const registrationDateStr = getColumn(['Date inscription', 'date_inscription', 'registration_date', 'Date d\'inscription']);
    const registrationDate = parseDate(registrationDateStr) || new Date().toISOString().split('T')[0];

    if (!firstName || !lastName || !birthdate) {
      return null;
    }

    // Parse options data based on mapping
    const optionsData: { [optionId: string]: string } = {};
    Object.entries(optMapping).forEach(([optionId, columnIndex]) => {
      if (columnIndex >= 0 && values[columnIndex]) {
        optionsData[optionId] = values[columnIndex];
      }
    });

    return {
      firstName,
      lastName,
      email,
      birthdate,
      gender,
      city,
      postalCode,
      nationality,
      club,
      licenseNumber: licenseNumber || '',
      licenseType: licenseTypeFull || '',
      licenseTypeFull,
      federation,
      baseAmount,
      optionsAmount,
      totalAmount,
      bibNumber: bibNumber || undefined,
      registrationDate,
      optionsData
    };
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setSuccess(false);
    setImportedCount(0);
    setStep('import');

    const importErrors: string[] = [];
    let successCount = 0;

    // Get event_id and organizer_id from race once
    const { data: raceData, error: raceError } = await supabase
      .from('races')
      .select('event_id, events(organizer_id)')
      .eq('id', raceId)
      .single();

    if (raceError || !raceData) {
      setErrors(['Erreur: Course introuvable']);
      setImporting(false);
      return;
    }

    const eventId = raceData.event_id;
    const organizerId = (raceData.events as any).organizer_id;

    setProgress({ current: 0, total: csvLines.length - 1 });

    // Process in batches of 20 for better performance
    const BATCH_SIZE = 20;
    const totalLines = csvLines.length - 1;

    for (let batchStart = 1; batchStart < csvLines.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, csvLines.length);
      const batchPromises = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const lineNumber = i;
        const values = csvLines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''));

        const processLine = async () => {
          try {
            const entry = parseCSVLine(headers, values, optionsMapping);
            if (!entry) {
              importErrors.push(`Ligne ${lineNumber + 1}: Données manquantes (prénom, nom ou date de naissance)`);
              return;
            }

            // Check if athlete already exists (by name and birthdate)
            const { data: existingAthletes } = await supabase
              .from('athletes')
              .select('id')
              .eq('first_name', entry.firstName)
              .eq('last_name', entry.lastName)
              .eq('birthdate', entry.birthdate)
              .limit(1);

            let athleteId: string;

            if (existingAthletes && existingAthletes.length > 0) {
              athleteId = existingAthletes[0].id;
            } else {
              const { data: newAthlete, error: athleteError } = await supabase
                .from('athletes')
                .insert({
                  first_name: entry.firstName,
                  last_name: entry.lastName,
                  email: entry.email || null,
                  birthdate: entry.birthdate,
                  gender: entry.gender,
                  city: entry.city || null,
                  postal_code: entry.postalCode || null,
                  nationality: entry.nationality,
                  license_club: entry.club || null,
                  license_number: entry.licenseNumber || null,
                  license_type: entry.licenseType || null,
                })
                .select('id')
                .single();

              if (athleteError) {
                importErrors.push(`Ligne ${lineNumber + 1}: Erreur création athlète - ${athleteError.message}`);
                return;
              }

              athleteId = newAthlete.id;
            }

            // Calculate category for FFA races
            let calculatedCategory = entry.category || 'Senior';
            if (isFFARace && eventDate && entry.birthdate) {
              calculatedCategory = calculateFFACategory(entry.birthdate, eventDate);
            }

            // Create entry
            const { data: newEntry, error: entryError } = await supabase
              .from('entries')
              .insert({
                race_id: raceId,
                event_id: eventId,
                organizer_id: organizerId,
                athlete_id: athleteId,
                category: calculatedCategory,
                source: 'bulk_import',
                created_by_type: 'timepulse_staff',
                status: 'confirmed',
                amount: entry.totalAmount,
                bib_number: entry.bibNumber || null,
                registration_date: entry.registrationDate
              })
              .select()
              .single();

            if (entryError) {
              if (entryError.code === '23505') {
                importErrors.push(`Ligne ${lineNumber + 1}: Inscription déjà existante pour ${entry.firstName} ${entry.lastName}`);
              } else {
                importErrors.push(`Ligne ${lineNumber + 1}: Erreur inscription - ${entryError.message}`);
              }
              return;
            }

            // Create registration options if any
            if (entry.optionsData && Object.keys(entry.optionsData).length > 0) {
              const optionsToInsert = Object.entries(entry.optionsData).map(([optionId, value]) => {
                return {
                  entry_id: newEntry.id,
                  option_id: optionId,
                  value: value,
                  quantity: 1,
                  price_paid_cents: 0
                };
              });

              const { error: optionsError } = await supabase
                .from('registration_options')
                .insert(optionsToInsert);

              if (optionsError) {
                console.error(`Warning: Could not insert options for entry ${newEntry.id}:`, optionsError);
              }
            }

            successCount++;
          } catch (err: any) {
            importErrors.push(`Ligne ${lineNumber + 1}: Exception - ${err.message}`);
          }
        };

        batchPromises.push(processLine());
      }

      // Wait for all promises in this batch to complete
      await Promise.all(batchPromises);
      setProgress({ current: batchEnd - 1, total: totalLines });
    }

    setImportedCount(successCount);
    setErrors(importErrors);
    setImporting(false);
    setProgress(null);

    if (successCount > 0) {
      setSuccess(true);
      setTimeout(() => {
        onImportComplete();
      }, 2000);
    }
  }

  function goToOptionsMapping() {
    if (raceOptions.length === 0) {
      handleImport();
    } else {
      setStep('options-mapping');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Importer des inscriptions depuis CSV
            </h2>
            <div className="flex items-center space-x-2 mt-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === 'upload' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
              }`}>
                1. Fichier
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === 'options-mapping' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
              }`}>
                2. Options
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                step === 'import' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
              }`}>
                3. Import
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'upload' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Format attendu du fichier CSV
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>Séparateur: point-virgule (;)</li>
                  <li>Encodage: UTF-8</li>
                  <li>Colonnes requises: Prénom, Nom, Date de naissance</li>
                  <li>Colonnes optionnelles: Email, Sexe, Ville, CP, Nationalité, Club/Asso, N° de licence, Type de licence, Licence (fédération), Montant inscription, Montant options, Dossard, Date inscription</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un fichier CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50"
                />
              </div>

              {preview.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Aperçu des données (5 premières lignes)</span>
                      </h5>
                      <div className="text-sm">
                        <span className="font-medium text-pink-600">{csvLines.length - 1}</span>
                        <span className="text-gray-600"> lignes de données détectées</span>
                        <span className="text-gray-400 ml-2">({csvLines.length} lignes totales avec en-tête)</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prénom</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Naissance</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date inscr.</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Club</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Licence</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((entry, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.lastName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.firstName}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{entry.birthdate}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{entry.registrationDate}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{entry.club || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {entry.federation && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-1">{entry.federation}</span>}
                              {entry.licenseNumber || '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.totalAmount.toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-red-900 mb-2">
                        Erreurs détectées ({errors.length})
                      </h5>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-xs text-red-700 space-y-1">
                          {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={goToOptionsMapping}
                  disabled={!file || preview.length === 0}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </>
          )}

          {step === 'options-mapping' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Mapping des options d'inscription
                </h4>
                <p className="text-xs text-blue-700">
                  Associez les colonnes de votre CSV aux options de la course. Laissez "Non mappé" si l'option n'est pas présente dans votre fichier.
                </p>
              </div>

              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900">
                  Colonnes disponibles dans votre CSV :
                </h5>
                <div className="flex flex-wrap gap-2">
                  {headers.map((header, idx) => (
                    <div key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {idx + 1}. {header}
                    </div>
                  ))}
                </div>
              </div>

              {raceOptions.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-semibold text-gray-900">Options de la course</h5>
                  </div>
                  <div className="p-4 space-y-3">
                    {raceOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-4">
                        <div className="w-1/3">
                          <label className="text-sm font-medium text-gray-700">
                            {option.label}
                            {option.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {option.type === 'choice' && option.choices && (
                            <p className="text-xs text-gray-500 mt-1">
                              Choix: {option.choices}
                            </p>
                          )}
                        </div>
                        <div className="flex-1">
                          <select
                            value={optionsMapping[option.id] ?? -1}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value === -1) {
                                const newMapping = { ...optionsMapping };
                                delete newMapping[option.id];
                                setOptionsMapping(newMapping);
                              } else {
                                setOptionsMapping({ ...optionsMapping, [option.id]: value });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                          >
                            <option value={-1}>-- Non mappé --</option>
                            {headers.map((header, idx) => (
                              <option key={idx} value={idx}>
                                Colonne {idx + 1}: {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Cette course n'a pas d'options configurées
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Lancer l'import</span>
                </button>
              </div>
            </>
          )}

          {step === 'import' && (
            <>
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h5 className="font-semibold text-green-900">
                        Import réussi !
                      </h5>
                      <p className="text-sm text-green-700">
                        {importedCount} inscription(s) importée(s) avec succès
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {progress && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Import en cours...</span>
                    <span className="text-sm text-gray-600">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-red-900 mb-2">
                        Erreurs détectées ({errors.length})
                      </h5>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-xs text-red-700 space-y-1">
                          {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
