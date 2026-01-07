import { useEffect, useState } from 'react';
import { Clock, Wrench, RefreshCw } from 'lucide-react';

export default function Maintenance() {
  const [message, setMessage] = useState('Nous effectuons actuellement une maintenance programmée pour améliorer votre expérience. Le site sera de nouveau disponible très prochainement.');

  useEffect(() => {
    // Charger le message personnalisé depuis localStorage si disponible
    const customMessage = localStorage.getItem('maintenance_message');
    if (customMessage) {
      setMessage(customMessage);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Image de fond avec overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url(/tour-eiffel-coureur.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />

      {/* Contenu */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center space-x-3 mb-6">
              <img
                src="/TP.png"
                alt="Timepulse"
                className="h-16 w-16"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="text-5xl font-bold text-white tracking-tight">
                Timepulse
              </h1>
            </div>
          </div>

          {/* Card principale */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
            {/* Icône animée */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-6">
                  <Wrench className="h-12 w-12 text-white animate-bounce" />
                </div>
              </div>
            </div>

            {/* Titre */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
              Maintenance en cours
            </h2>

            {/* Message */}
            <p className="text-lg text-gray-700 text-center mb-8 leading-relaxed">
              {message}
            </p>

            {/* Informations */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Durée estimée
                  </h3>
                  <p className="text-gray-600">
                    Nous travaillons activement pour restaurer le service dans les plus brefs délais.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                <RefreshCw className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Améliorations en cours
                  </h3>
                  <p className="text-gray-600">
                    Cette maintenance nous permet d'améliorer les performances et d'ajouter de nouvelles fonctionnalités.
                  </p>
                </div>
              </div>
            </div>

            {/* Bouton reload */}
            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Rafraîchir la page</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-500 text-sm">
                Pour toute urgence, contactez-nous à{' '}
                <a
                  href="mailto:support@timepulse.fr"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@timepulse.fr
                </a>
              </p>
            </div>
          </div>

          {/* Message supplémentaire */}
          <div className="mt-8 text-center">
            <p className="text-white/80 text-sm">
              Merci pour votre patience et votre compréhension
            </p>
          </div>
        </div>
      </div>

      {/* Animation de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000" />
      </div>
    </div>
  );
}
