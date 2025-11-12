import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Search, X } from 'lucide-react';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  onClose: () => void;
}

const POPULAR_ICONS = [
  { name: 'Timer', keywords: ['chronométrage', 'temps', 'chrono', 'horloge', 'time'] },
  { name: 'Trophy', keywords: ['trophée', 'victoire', 'gagnant', 'champion', 'award'] },
  { name: 'Award', keywords: ['médaille', 'récompense', 'award', 'winner'] },
  { name: 'Zap', keywords: ['éclair', 'rapide', 'speed', 'fast', 'performance'] },
  { name: 'Target', keywords: ['cible', 'objectif', 'goal', 'aim'] },
  { name: 'Activity', keywords: ['activité', 'graphique', 'statistiques', 'stats', 'chart'] },
  { name: 'BarChart', keywords: ['graphique', 'statistiques', 'données', 'chart', 'data'] },
  { name: 'TrendingUp', keywords: ['croissance', 'progression', 'montée', 'amélioration', 'growth'] },
  { name: 'LineChart', keywords: ['graphique', 'courbe', 'statistiques', 'chart'] },
  { name: 'Users', keywords: ['utilisateurs', 'participants', 'équipe', 'team', 'people'] },
  { name: 'UserCheck', keywords: ['inscription', 'validation', 'participant', 'registration'] },
  { name: 'UserPlus', keywords: ['inscription', 'ajout', 'nouveau', 'registration', 'add'] },
  { name: 'Heart', keywords: ['coeur', 'santé', 'passion', 'health', 'love'] },
  { name: 'HeartPulse', keywords: ['battement', 'santé', 'cardio', 'health', 'pulse'] },
  { name: 'MapPin', keywords: ['localisation', 'lieu', 'carte', 'location', 'map'] },
  { name: 'Map', keywords: ['carte', 'parcours', 'trajet', 'route'] },
  { name: 'Navigation', keywords: ['navigation', 'direction', 'GPS', 'route'] },
  { name: 'Flag', keywords: ['drapeau', 'départ', 'arrivée', 'finish', 'start'] },
  { name: 'CheckCircle', keywords: ['validé', 'succès', 'terminé', 'completed', 'success'] },
  { name: 'Check', keywords: ['validation', 'ok', 'correct', 'done'] },
  { name: 'Star', keywords: ['étoile', 'favori', 'meilleur', 'star', 'favorite'] },
  { name: 'Calendar', keywords: ['calendrier', 'date', 'événement', 'event', 'schedule'] },
  { name: 'CalendarCheck', keywords: ['inscription', 'réservation', 'date', 'booking'] },
  { name: 'Clock', keywords: ['horloge', 'temps', 'heure', 'time'] },
  { name: 'Mountain', keywords: ['montagne', 'trail', 'course', 'nature', 'outdoor'] },
  { name: 'Waves', keywords: ['vagues', 'natation', 'triathlon', 'swimming', 'water'] },
  { name: 'Bike', keywords: ['vélo', 'cyclisme', 'triathlon', 'cycling'] },
  { name: 'Footprints', keywords: ['course', 'marche', 'running', 'walking', 'trail'] },
  { name: 'Gauge', keywords: ['vitesse', 'performance', 'mesure', 'speed', 'meter'] },
  { name: 'Rocket', keywords: ['décollage', 'rapide', 'lancement', 'fast', 'launch'] },
  { name: 'Zap', keywords: ['éclair', 'énergie', 'puissance', 'power', 'energy'] },
  { name: 'Shield', keywords: ['sécurité', 'protection', 'security', 'safe'] },
  { name: 'ShieldCheck', keywords: ['sécurisé', 'validé', 'protected', 'verified'] },
  { name: 'Lock', keywords: ['sécurité', 'privé', 'verrouillé', 'security', 'private'] },
  { name: 'CreditCard', keywords: ['paiement', 'carte', 'payment', 'card'] },
  { name: 'DollarSign', keywords: ['argent', 'prix', 'tarif', 'money', 'price'] },
  { name: 'Gift', keywords: ['cadeau', 'bonus', 'offre', 'gift', 'offer'] },
  { name: 'Settings', keywords: ['paramètres', 'configuration', 'réglages', 'settings'] },
  { name: 'Sliders', keywords: ['réglages', 'ajustements', 'settings', 'adjust'] },
  { name: 'FileText', keywords: ['document', 'texte', 'fichier', 'file', 'document'] },
  { name: 'Download', keywords: ['télécharger', 'download', 'export'] },
  { name: 'Upload', keywords: ['charger', 'upload', 'import'] },
  { name: 'Share2', keywords: ['partager', 'share', 'social'] },
  { name: 'Camera', keywords: ['photo', 'caméra', 'image', 'picture'] },
  { name: 'Video', keywords: ['vidéo', 'film', 'enregistrement', 'recording'] },
  { name: 'Mic', keywords: ['microphone', 'audio', 'son', 'sound'] },
  { name: 'Speaker', keywords: ['haut-parleur', 'son', 'audio', 'sound'] },
  { name: 'Bell', keywords: ['notification', 'alerte', 'rappel', 'alert', 'notification'] },
  { name: 'MessageCircle', keywords: ['message', 'chat', 'communication', 'message'] },
  { name: 'Mail', keywords: ['email', 'courrier', 'message', 'mail'] },
  { name: 'Phone', keywords: ['téléphone', 'appel', 'contact', 'call'] },
  { name: 'Smartphone', keywords: ['mobile', 'téléphone', 'phone', 'mobile'] },
  { name: 'Tablet', keywords: ['tablette', 'tablet', 'ipad'] },
  { name: 'Monitor', keywords: ['écran', 'ordinateur', 'screen', 'computer'] },
  { name: 'Wifi', keywords: ['wifi', 'internet', 'connexion', 'connection'] },
  { name: 'Globe', keywords: ['monde', 'international', 'web', 'world', 'internet'] },
  { name: 'Link', keywords: ['lien', 'connexion', 'link', 'url'] },
  { name: 'Eye', keywords: ['voir', 'visible', 'visualiser', 'view', 'visible'] },
  { name: 'EyeOff', keywords: ['caché', 'invisible', 'masqué', 'hidden'] },
  { name: 'Search', keywords: ['recherche', 'chercher', 'trouver', 'search', 'find'] },
  { name: 'Filter', keywords: ['filtre', 'trier', 'filter', 'sort'] },
  { name: 'List', keywords: ['liste', 'menu', 'list'] },
  { name: 'Grid', keywords: ['grille', 'tableau', 'grid'] },
  { name: 'Layers', keywords: ['calques', 'niveaux', 'layers'] },
  { name: 'Package', keywords: ['paquet', 'colis', 'package', 'box'] },
  { name: 'Briefcase', keywords: ['mallette', 'travail', 'business', 'work'] },
  { name: 'Clipboard', keywords: ['presse-papiers', 'liste', 'clipboard', 'list'] },
  { name: 'ClipboardList', keywords: ['liste', 'tâches', 'checklist', 'tasks'] },
  { name: 'BookOpen', keywords: ['livre', 'documentation', 'guide', 'book', 'manual'] },
  { name: 'Bookmark', keywords: ['marque-page', 'favori', 'bookmark', 'favorite'] },
  { name: 'Home', keywords: ['accueil', 'maison', 'home'] },
  { name: 'Building', keywords: ['bâtiment', 'entreprise', 'building', 'company'] },
  { name: 'Store', keywords: ['magasin', 'boutique', 'shop', 'store'] },
  { name: 'ShoppingCart', keywords: ['panier', 'achat', 'cart', 'shopping'] },
  { name: 'Tag', keywords: ['étiquette', 'tag', 'label', 'price'] },
  { name: 'Sparkles', keywords: ['étoiles', 'nouveau', 'brillant', 'new', 'sparkle'] },
  { name: 'Sun', keywords: ['soleil', 'journée', 'sun', 'day'] },
  { name: 'Moon', keywords: ['lune', 'nuit', 'moon', 'night'] },
  { name: 'CloudRain', keywords: ['pluie', 'météo', 'rain', 'weather'] },
  { name: 'Cloud', keywords: ['nuage', 'cloud', 'weather'] },
  { name: 'Thermometer', keywords: ['température', 'météo', 'temperature', 'weather'] },
  { name: 'Wind', keywords: ['vent', 'wind', 'weather'] },
  { name: 'Compass', keywords: ['boussole', 'direction', 'compass', 'navigation'] },
  { name: 'Megaphone', keywords: ['mégaphone', 'annonce', 'communication', 'announcement'] },
  { name: 'Radio', keywords: ['radio', 'diffusion', 'broadcast'] },
  { name: 'Tv', keywords: ['télévision', 'écran', 'tv', 'screen'] },
  { name: 'Film', keywords: ['film', 'vidéo', 'movie', 'video'] },
  { name: 'Image', keywords: ['image', 'photo', 'picture'] },
  { name: 'PlayCircle', keywords: ['lecture', 'play', 'start', 'vidéo'] },
  { name: 'PauseCircle', keywords: ['pause', 'arrêt'] },
  { name: 'StopCircle', keywords: ['stop', 'arrêt'] },
  { name: 'SkipForward', keywords: ['suivant', 'next', 'forward'] },
  { name: 'SkipBack', keywords: ['précédent', 'previous', 'back'] },
  { name: 'RefreshCw', keywords: ['actualiser', 'recharger', 'refresh', 'reload'] },
  { name: 'RotateCw', keywords: ['rotation', 'rotate', 'turn'] },
  { name: 'Repeat', keywords: ['répéter', 'boucle', 'repeat', 'loop'] },
  { name: 'Shuffle', keywords: ['mélanger', 'aléatoire', 'shuffle', 'random'] },
];

export default function IconPicker({ selectedIcon, onSelectIcon, onClose }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = POPULAR_ICONS.filter(icon => {
    const query = searchQuery.toLowerCase();
    return (
      icon.name.toLowerCase().includes(query) ||
      icon.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Bibliothèque d'icônes</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une icône... (ex: chrono, course, inscription)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredIcons.length} icône{filteredIcons.length > 1 ? 's' : ''} trouvée{filteredIcons.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredIcons.map((iconData) => {
              const IconComponent = (Icons as any)[iconData.name];
              const isSelected = selectedIcon === iconData.name;

              return (
                <button
                  key={iconData.name}
                  onClick={() => onSelectIcon(iconData.name)}
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  title={iconData.name}
                >
                  <IconComponent
                    className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`}
                    strokeWidth={2}
                  />
                  <span className={`mt-2 text-xs text-center line-clamp-1 ${
                    isSelected ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {iconData.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune icône trouvée pour "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-2">Essayez avec un autre mot-clé</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {POPULAR_ICONS.length} icônes disponibles
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
