import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { parseResults, parseResultsWithMapping, type ParsedResult } from '../lib/results-parser';
import ColumnMapper from './ColumnMapper';

interface ResultsImporterProps {
  raceId: string;
  onImportComplete?: () => void;
}

export default function ResultsImporter({ raceId, onImportComplete }: ResultsImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedResult[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errorDetails?: string } | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileSeparator, setFileSeparator] = useState<string>(',');
  const [fileFormat, setFileFormat] = useState<string>('csv');
  const [columnMapping, setColumnMapping] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setImportResult(null);

    // Lire et parser le fichier
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setFileContent(content);

      // Détecter le format
      const lower = selectedFile.name.toLowerCase();
      const contentStart = content.trim().substring(0, 100).toLowerCase();

      let detectedFormat = 'csv';
      if (contentStart.includes('<html') || contentStart.includes('<!doctype') || contentStart.includes('<table')) {
        detectedFormat = 'html';
      } else if (lower.includes('elogica') || content.trim().startsWith('<?xml')) {
        detectedFormat = 'elogica';
      } else if (lower.includes('ffa')) {
        detectedFormat = 'ffa-text';
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        detectedFormat = 'excel';
      }

      setFileFormat(detectedFormat);

      // Extraire les en-têtes selon le format
      if (detectedFormat === 'html') {
        // Pour HTML, extraire les en-têtes du tableau
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const headerRow = doc.querySelector('table thead tr') || doc.querySelector('table tr');

        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('th, td');
          const headers = Array.from(headerCells).map(cell => cell.textContent?.trim() || '');
          setFileHeaders(headers);
          setFileSeparator('|'); // Séparateur fictif pour HTML
        }
      } else {
        // Pour CSV/TSV/etc
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(separator).map(h => h.trim());
          setFileHeaders(headers);
          setFileSeparator(separator);
        }
      }

      // Parser automatiquement pour preview
      const parsed = parseResults(selectedFile.name, content);
      setPreview(parsed.results.slice(0, 10));
      setErrors(parsed.errors);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Parser avec mapping si disponible
      const parsed = columnMapping
        ? parseResultsWithMapping(fileContent, columnMapping, fileSeparator)
        : parseResults(file.name, fileContent);

      if (parsed.results.length === 0) {
        throw new Error('Aucun résultat trouvé dans le fichier');
      }

      // Créer un batch d'import
      const batchId = crypto.randomUUID();

      // Créer l'entrée d'import
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error: importError } = await supabase
        .from('result_imports')
        .insert({
          race_id: raceId,
          file_name: file.name,
          file_format: fileFormat,
          file_type: file.type || 'text/plain',
          imported_by: user.id,
          total_rows: parsed.results.length,
          mapping_used: columnMapping,
          status: 'processing',
        });

      if (importError) throw importError;

      // Insérer les résultats par lots de 100
      let successCount = 0;
      let failCount = 0;
      const batchSize = 100;

      for (let i = 0; i < parsed.results.length; i += batchSize) {
        const batch = parsed.results.slice(i, i + batchSize);

        const resultsToInsert = batch.map(result => ({
          race_id: raceId,
          bib_number: result.bibNumber,
          athlete_name: result.athleteName,
          gender: result.gender,
          category: result.category,
          finish_time: result.finishTime,
          gun_time: result.gunTime,
          net_time: result.netTime,
          status: result.status,
          import_source: file.name.toLowerCase().includes('elogica') ? 'elogica' :
                        file.name.toLowerCase().endsWith('.xlsx') ? 'excel' : 'csv',
          import_batch_id: batchId,
          split_times: result.splitTimes || [],
          custom_fields: result.customFields || {},
        }));

        const { error: insertError } = await supabase
          .from('results')
          .upsert(resultsToInsert, {
            onConflict: 'race_id,bib_number',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error('Erreur insertion batch:', insertError);
          console.error('Détails:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          failCount += batch.length;
          // Stocker l'erreur pour l'afficher
          if (i === 0 && !importResult?.errorDetails) {
            setImportResult({
              success: 0,
              failed: 0,
              errorDetails: insertError.message || insertError.hint || 'Erreur inconnue'
            });
          }
        } else {
          successCount += batch.length;
        }
      }

      // Mettre à jour le statut de l'import
      await supabase
        .from('result_imports')
        .update({
          imported_rows: successCount,
          failed_rows: failCount,
          error_log: parsed.errors,
          status: failCount === 0 ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('race_id', raceId)
        .eq('file_name', file.name);

      // Recalculer les classements si des résultats ont été importés
      if (successCount > 0) {
        const { error: rankError } = await supabase.rpc('calculate_rankings', { p_race_id: raceId });
        if (rankError) {
          console.error('Erreur calcul des classements:', rankError);
        }
      }

      setImportResult({ success: successCount, failed: failCount });

      if (successCount > 0) {
        onImportComplete?.();
      }
    } catch (error: any) {
      console.error('Erreur import complète:', error);
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Erreur inconnue';
      setImportResult({
        success: 0,
        failed: parsed.results.length,
        errorDetails: errorMessage
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Importer les Résultats</h3>

      {/* Zone de drop */}
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500">
              CSV, Excel, FFA E@logica (TXT), HTML ou Elogica (XML)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls,.xml,.txt,.html,.htm"
            onChange={handleFileSelect}
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration du mapping */}
      {file && fileHeaders.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowMapper(!showMapper)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
            <span>{showMapper ? 'Masquer' : 'Configurer'} le mapping des colonnes</span>
          </button>
        </div>
      )}

      {showMapper && fileHeaders.length > 0 && (
        <div className="mb-6">
          <ColumnMapper
            headers={fileHeaders}
            separator={fileSeparator}
            fileFormat={fileFormat}
            onMappingChange={(mapping) => {
              setColumnMapping(mapping);
              // Re-parser avec le nouveau mapping
              if (fileContent) {
                const parsed = parseResultsWithMapping(fileContent, mapping, fileSeparator);
                setPreview(parsed.results.slice(0, 10));
                setErrors(parsed.errors);
              }
            }}
          />
        </div>
      )}

      {/* Erreurs de parsing */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                {errors.length} erreur{errors.length > 1 ? 's' : ''} de parsing
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.slice(0, 10).map((err, idx) => (
                  <p key={idx} className="text-xs text-red-700">
                    Ligne {err.row}: {err.error}
                  </p>
                ))}
                {errors.length > 10 && (
                  <p className="text-xs text-red-700 font-medium">
                    ... et {errors.length - 10} autres erreurs
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Aperçu (10 premiers résultats)
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Dossard
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Athlète
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Sexe
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Catégorie
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Temps
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((result, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {result.bibNumber}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {result.athleteName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {result.gender || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                      {result.category || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {result.finishTime || result.netTime || result.gunTime || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        result.status === 'finished' ? 'bg-green-100 text-green-800' :
                        result.status === 'dnf' ? 'bg-orange-100 text-orange-800' :
                        result.status === 'dns' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'finished' ? 'Arrivé' :
                         result.status === 'dnf' ? 'Abandon' :
                         result.status === 'dns' ? 'Absent' : 'Disqualifié'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Résultat de l'import */}
      {importResult && (
        <div className={`mb-6 p-4 rounded-lg border ${
          importResult.failed === 0
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start gap-3">
            {importResult.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${
                importResult.failed === 0 ? 'text-green-900' : 'text-orange-900'
              }`}>
                Import terminé
              </h4>
              <p className={`text-sm ${
                importResult.failed === 0 ? 'text-green-700' : 'text-orange-700'
              }`}>
                {importResult.success} résultat{importResult.success > 1 ? 's' : ''} importé{importResult.success > 1 ? 's' : ''}
                {importResult.failed > 0 && ` • ${importResult.failed} échec${importResult.failed > 1 ? 's' : ''}`}
              </p>
              {importResult.errorDetails && (
                <p className="text-xs text-orange-600 mt-2 font-mono bg-orange-100 p-2 rounded">
                  {importResult.errorDetails}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={!file || preview.length === 0 || importing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {importing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Import en cours...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Importer {preview.length > 0 && `(${preview.length}+ résultats)`}
            </>
          )}
        </button>

        {file && !importing && (
          <button
            onClick={() => {
              setFile(null);
              setPreview([]);
              setErrors([]);
              setImportResult(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Annuler
          </button>
        )}
      </div>

      {/* Guide d'utilisation */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Formats acceptés
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>CSV standard</strong>: Dossard, Nom, Prénom, Sexe, Catégorie, Temps</li>
          <li>• <strong>FFA E@logica (TXT)</strong>: Export texte au format positions fixes de la FFA</li>
          <li>• <strong>Elogica</strong>: Export CSV ou XML depuis le logiciel Elogica</li>
          <li>• <strong>Excel</strong>: Fichier .xlsx avec colonnes identiques au CSV</li>
          <li>• <strong>HTML</strong>: Tableau HTML de résultats</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3 font-medium">
          Le système détecte automatiquement le format et adapte le parsing.
        </p>
      </div>
    </div>
  );
}
