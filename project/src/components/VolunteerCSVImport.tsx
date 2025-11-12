import { useState } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VolunteerCSVImportProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

export default function VolunteerCSVImport({ eventId, onClose, onSuccess }: VolunteerCSVImportProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const csvContent = `prenom,nom,email,telephone,date_naissance,adresse,ville,code_postal,pays,taille_tshirt,regime_alimentaire,secourisme,permis,notes
Jean,Dupont,jean.dupont@email.com,0612345678,1990-05-15,12 rue de la Paix,Paris,75001,France,M,végétarien,oui,oui,Disponible tout le week-end
Marie,Martin,marie.martin@email.com,0623456789,1985-08-22,5 avenue Victor Hugo,Lyon,69001,France,S,sans gluten,non,oui,Expérience en secourisme`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_import_benevoles.csv';
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const row: any = { rowNumber: index + 2 };

      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });

      return row;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('Le fichier CSV est vide');
      }

      const results: ImportResult = {
        success: 0,
        errors: []
      };

      for (const row of rows) {
        try {
          if (!row.prenom || !row.nom || !row.email || !row.telephone) {
            results.errors.push({
              row: row.rowNumber,
              email: row.email || 'non fourni',
              error: 'Champs obligatoires manquants (prénom, nom, email, téléphone)'
            });
            continue;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email)) {
            results.errors.push({
              row: row.rowNumber,
              email: row.email,
              error: 'Format d\'email invalide'
            });
            continue;
          }

          const volunteerData = {
            event_id: eventId,
            first_name: row.prenom,
            last_name: row.nom,
            email: row.email,
            phone: row.telephone,
            birth_date: row.date_naissance || null,
            address: row.adresse || null,
            city: row.ville || null,
            postal_code: row.code_postal || null,
            country: row.pays || 'France',
            tshirt_size: row.taille_tshirt || null,
            dietary_restrictions: row.regime_alimentaire || null,
            has_first_aid_certification: row.secourisme?.toLowerCase() === 'oui',
            has_driving_license: row.permis?.toLowerCase() === 'oui',
            notes: row.notes || null,
            status: 'confirmed'
          };

          const { error: insertError } = await supabase
            .from('volunteers')
            .insert(volunteerData);

          if (insertError) {
            if (insertError.code === '23505') {
              results.errors.push({
                row: row.rowNumber,
                email: row.email,
                error: 'Email déjà inscrit pour cet événement'
              });
            } else {
              results.errors.push({
                row: row.rowNumber,
                email: row.email,
                error: insertError.message
              });
            }
          } else {
            results.success++;
          }
        } catch (err: any) {
          results.errors.push({
            row: row.rowNumber,
            email: row.email || 'inconnu',
            error: err.message
          });
        }
      }

      setResult(results);

      if (results.success > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error importing CSV:', err);
      setError(err.message || 'Erreur lors de l\'import du fichier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Importer des bénévoles (CSV)</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Format du fichier CSV</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Colonnes obligatoires : prenom, nom, email, telephone</li>
                      <li>• Colonnes optionnelles : date_naissance, adresse, ville, code_postal, pays, taille_tshirt, regime_alimentaire, secourisme, permis, notes</li>
                      <li>• Secourisme et permis : "oui" ou "non"</li>
                      <li>• Date de naissance au format : AAAA-MM-JJ</li>
                      <li>• Séparateur : virgule (,)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le modèle CSV</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-pink-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className={`cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">
                    {loading ? 'Import en cours...' : 'Cliquez pour sélectionner votre fichier CSV'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Format accepté : .csv uniquement
                  </p>
                </label>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Import terminé : {result.success} bénévole{result.success > 1 ? 's' : ''} importé{result.success > 1 ? 's' : ''}
                    </h3>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-900 mb-2">
                        {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''}
                      </h3>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {result.errors.map((err, index) => (
                          <div key={index} className="text-sm text-orange-800 bg-white rounded p-2">
                            <span className="font-medium">Ligne {err.row}</span> ({err.email}) : {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setResult(null);
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Importer un autre fichier
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
