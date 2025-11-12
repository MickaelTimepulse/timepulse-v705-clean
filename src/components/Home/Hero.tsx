import { useState } from 'react';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';

interface HeroProps {
  onSearch?: (filters: { month: string; sport: string; region: string }) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const sports = [
    'Running', 'Trail', 'Triathlon', 'Swimrun', 'Cyclisme', 'Marche',
    'Natation', 'Duathlon', 'Raid', 'Canicross'
  ];

  const regions = [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
    'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
    'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
    'Pays de la Loire', "Provence-Alpes-Côte d'Azur"
  ];

  return (
    <div className="relative min-h-[65vh] overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/80"></div>
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex items-center min-h-[65vh]">
        <div className="w-full">
          <div className="text-center mb-10 space-y-5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
              Trouvez votre <span className="relative inline-block">
                <span className="relative z-10">prochain défi</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-white/20 -skew-y-1 transform"></span>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto">
              Inscrivez-vous aux événements sportifs partout en France
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Mois
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white text-gray-900 transition-all hover:border-gray-300 font-medium"
                  >
                    <option value="">Tous les mois</option>
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    <Search className="w-4 h-4 inline mr-2" />
                    Sport
                  </label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white text-gray-900 transition-all hover:border-gray-300 font-medium"
                  >
                    <option value="">Tous les sports</option>
                    {sports.map((sport) => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Région
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white text-gray-900 transition-all hover:border-gray-300 font-medium"
                  >
                    <option value="">Toutes les régions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onSearch) {
                    onSearch({
                      month: selectedMonth,
                      sport: selectedSport,
                      region: selectedRegion
                    });
                  }
                  const eventsSection = document.getElementById('events');
                  if (eventsSection) {
                    eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full py-5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center space-x-3 group"
              >
                <Search className="w-5 h-5" />
                <span>Rechercher mon événement</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
