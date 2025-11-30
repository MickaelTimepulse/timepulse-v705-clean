import { useState } from 'react';
import { Copy, CheckCircle2, Terminal, GitBranch, Rocket, Database, FileCode, AlertCircle } from 'lucide-react';

export default function AdminDeployment() {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [id]: false });
    }, 2000);
  };

  const CommandBlock = ({
    command,
    id,
    description
  }: {
    command: string;
    id: string;
    description?: string;
  }) => (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      {description && (
        <p className="text-gray-400 text-sm mb-2">{description}</p>
      )}
      <div className="flex items-center justify-between">
        <code className="text-green-400 font-mono text-sm flex-1">{command}</code>
        <button
          onClick={() => copyToClipboard(command, id)}
          className="ml-4 p-2 hover:bg-gray-800 rounded transition-colors"
        >
          {copiedStates[id] ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Copy className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Guide de Déploiement</h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Important : Ouvre ton terminal dans le dossier du projet</h3>
              <p className="text-blue-800 text-sm mb-3">
                Ces commandes doivent être exécutées dans le terminal de ton ordinateur,
                dans le dossier du projet Timepulse.
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Commande pour naviguer vers le dossier :</p>
                <div className="flex items-center justify-between bg-gray-900 rounded p-3">
                  <code className="text-green-400 font-mono text-sm">cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\project"</code>
                  <button
                    onClick={() => copyToClipboard('cd "C:\\Users\\micka\\OneDrive\\Bureau\\NEW SITE\\projet bolt\\project"', 'cd-path')}
                    className="ml-4 p-2 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                  >
                    {copiedStates['cd-path'] ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 <strong>Astuce :</strong> Dans l'Explorateur Windows, ouvre ce dossier, fais un clic droit et choisis "Git Bash Here" pour ouvrir le terminal directement au bon endroit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Initiale */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">1. Configuration Initiale</h2>
              <p className="text-gray-600">À faire une seule fois</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Prérequis</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Compte GitHub (gratuit) - <a href="https://github.com/join" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Créer un compte</a></span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Compte Vercel (gratuit) - <a href="https://vercel.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Créer un compte</a></span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Git installé (vérifie avec <code className="bg-white px-2 py-0.5 rounded text-sm">git --version</code>)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Étape 1 : Rendre les scripts exécutables
            </h3>
            <CommandBlock
              command="chmod +x *.sh"
              id="chmod"
              description="Active les permissions d'exécution sur les scripts"
            />

            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
              <Terminal className="w-5 h-5 text-blue-600" />
              Étape 2 : Lancer la configuration automatique
            </h3>
            <CommandBlock
              command="./setup-auto-deploy.sh"
              id="setup"
              description="Lance le script de configuration (durée : ~10 minutes)"
            />

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note :</strong> Le script va te poser des questions et te guider pour :
              </p>
              <ul className="text-sm text-yellow-800 mt-2 ml-4 space-y-1">
                <li>• Configurer Git avec ton nom et email</li>
                <li>• Créer un repository GitHub</li>
                <li>• Configurer les variables Vercel</li>
                <li>• Faire le premier déploiement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Déploiement Quotidien */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <Rocket className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">2. Déploiement Quotidien</h2>
              <p className="text-gray-600">À chaque modification du code</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Workflow Simple</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">1</span>
                <span>Modifie le code dans ton éditeur</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">2</span>
                <span>Lance la commande de déploiement</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">3</span>
                <span>Attends 2 minutes que Vercel déploie</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">4</span>
                <span>Vérifie sur ton URL Vercel</span>
              </li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-green-600" />
              Commande de déploiement
            </h3>

            <CommandBlock
              command='./deploy.sh "Description de tes changements"'
              id="deploy-template"
              description="Remplace le message par une description de tes modifications"
            />

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Exemples concrets :</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Correction d'un bug :</p>
                  <CommandBlock
                    command='./deploy.sh "Fix bug paiement Lyra"'
                    id="example-fix"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nouvelle fonctionnalité :</p>
                  <CommandBlock
                    command='./deploy.sh "Ajout export Excel pour organisateurs"'
                    id="example-feature"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mise à jour :</p>
                  <CommandBlock
                    command='./deploy.sh "Update dashboard admin avec stats"'
                    id="example-update"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Base de Données */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">3. Backup Base de Données</h2>
              <p className="text-gray-600">Avant une grosse modification</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700">
              Supabase fait des backups automatiques quotidiens. Ce script affiche les informations
              pour accéder aux backups en cas de besoin.
            </p>
          </div>

          <CommandBlock
            command="./backup-database.sh"
            id="backup"
            description="Affiche le lien vers les backups Supabase"
          />
        </div>

        {/* Liens Utiles */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-lg">
              <FileCode className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">4. Liens Utiles</h2>
              <p className="text-gray-600">Dashboards et documentation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <GitBranch className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">GitHub</h3>
              </div>
              <p className="text-sm text-gray-600">Gestion du code source</p>
            </a>

            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Vercel Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600">Suivi des déploiements</p>
            </a>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Supabase Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600">Gestion de la base de données</p>
            </a>

            <div className="p-4 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileCode className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Documentation</h3>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• QUICK-DEPLOY.md</li>
                <li>• AUTOMATION-GUIDE.md</li>
                <li>• COMMENCER-ICI.txt</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Résolution de Problèmes */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">5. Résolution de Problèmes</h2>
              <p className="text-gray-600">Solutions aux erreurs courantes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Erreur : "Git not configured"</h3>
              <p className="text-gray-600 text-sm mb-2">Configure Git avec tes informations :</p>
              <CommandBlock
                command='git config --global user.name "Ton Nom"'
                id="git-name"
              />
              <CommandBlock
                command='git config --global user.email "ton@email.com"'
                id="git-email"
              />
            </div>

            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Erreur : "Build failed"</h3>
              <p className="text-gray-600 text-sm mb-2">Teste le build manuellement pour voir l'erreur :</p>
              <CommandBlock
                command="npm run build"
                id="test-build"
              />
              <p className="text-gray-600 text-sm mt-2">Corrige les erreurs affichées, puis relance le déploiement.</p>
            </div>

            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Le site ne se met pas à jour</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>1. Vérifie que le push GitHub a fonctionné</li>
                <li>2. Va sur <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vercel Dashboard</a></li>
                <li>3. Regarde les logs de déploiement</li>
                <li>4. Vérifie les variables d'environnement dans Vercel Settings</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Résumé Ultra-Rapide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-600 mb-1">Configuration (1 fois)</div>
              <code className="text-xs bg-white px-2 py-1 rounded block">./setup-auto-deploy.sh</code>
            </div>
            <div>
              <div className="font-semibold text-green-600 mb-1">Déploiement (quotidien)</div>
              <code className="text-xs bg-white px-2 py-1 rounded block">./deploy.sh "Message"</code>
            </div>
            <div>
              <div className="font-semibold text-purple-600 mb-1">Backup (occasionnel)</div>
              <code className="text-xs bg-white px-2 py-1 rounded block">./backup-database.sh</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
