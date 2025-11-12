import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import EmailVariablesPanel from '../components/Admin/EmailVariablesPanel';
import { ArrowLeft, Info, Code, Zap, CheckCircle } from 'lucide-react';

export default function AdminEmailVariables() {
  const navigate = useNavigate();
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const handleVariableCopy = (variable: string) => {
    setCopiedMessage(`Variable ${variable} copiée !`);
    setTimeout(() => setCopiedMessage(null), 3000);
  };

  return (
    <AdminLayout title="Variables d'emails">
      <div className="space-y-6">
        {copiedMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{copiedMessage}</p>
          </div>
        )}

        <div>
          <button
            onClick={() => navigate('/admin/email-manager')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au gestionnaire d'emails
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Variables d'emails</h1>
          <p className="text-gray-600">
            Personnalisez vos emails avec des variables dynamiques qui s'adaptent à chaque inscription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EmailVariablesPanel onVariableCopy={handleVariableCopy} />
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Comment utiliser ?</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Insérez les variables entre doubles accolades dans vos templates
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Exemple de template :</p>
                  <code className="text-sm text-gray-800 block">
                    Bonjour <span className="text-blue-600 font-semibold">{'{{athlete_first_name}}'}</span>,
                  </code>
                  <code className="text-sm text-gray-800 block mt-2">
                    Votre inscription pour <span className="text-blue-600 font-semibold">{'{{event_name}}'}</span> est confirmée !
                  </code>
                  <code className="text-sm text-gray-800 block mt-2">
                    Dossard : <span className="text-blue-600 font-semibold">{'{{bib_number}}'}</span>
                  </code>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Résultat pour l'athlète :</p>
                  <p className="text-sm text-gray-800">
                    Bonjour <span className="font-semibold text-green-600">Jean</span>,
                  </p>
                  <p className="text-sm text-gray-800 mt-2">
                    Votre inscription pour <span className="font-semibold text-green-600">Marathon de Paris 2025</span> est confirmée !
                  </p>
                  <p className="text-sm text-gray-800 mt-2">
                    Dossard : <span className="font-semibold text-green-600">12345</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Variables dynamiques d'options</h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Les options sélectionnées par l'athlète sont automatiquement disponibles
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-purple-900 mb-2">Options configurées :</p>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="text-sm font-medium text-gray-900">T-shirt</p>
                      <code className="text-xs text-purple-600">{'{{option_tshirt_size}}'}</code>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="text-sm font-medium text-gray-900">Repas</p>
                      <code className="text-xs text-purple-600">{'{{option_repas}}'}</code>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <p className="text-sm font-medium text-gray-900">Parking</p>
                      <code className="text-xs text-purple-600">{'{{option_parking}}'}</code>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-900 text-white rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">Exemple d'utilisation :</p>
                  <code className="text-xs block">
                    Votre t-shirt <span className="text-purple-300 font-bold">{'{{option_tshirt_size}}'}</span> vous attend !
                  </code>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-900">
                  <p className="font-semibold mb-2">Bonnes pratiques</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Testez toujours vos templates avec l'aperçu</li>
                    <li>Prévoyez des valeurs par défaut si une variable est vide</li>
                    <li>Les variables d'options apparaissent seulement si l'athlète a choisi l'option</li>
                    <li>Utilisez des noms de variables explicites</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
