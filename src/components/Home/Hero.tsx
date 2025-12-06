import { useState, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EventCharacteristicsFilter from '../EventCharacteristicsFilter';

interface HeroProps {
  onFiltersChange?: (filters: {
    searchText: string;
    selectedSport: string;
    selectedMonth: string;
    selectedCharacteristics: string[];
  }) => void;
}

export default function Hero({ onFiltersChange }: HeroProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        searchText,
        selectedSport,
        selectedMonth,
        selectedCharacteristics,
      });
    }
  }, [searchText, selectedSport, selectedMonth, selectedCharacteristics]);


  const handleSearch = () => {
    const eventsSection = document.getElementById('events');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasActiveFilters = searchText || selectedSport || selectedMonth || selectedCharacteristics.length > 0;

  const resetFilters = () => {
    setSearchText('');
    setSelectedSport('');
    setSelectedMonth('');
    setSelectedCharacteristics([]);
  };

  return (
    <div className="relative min-h-[70vh] z-20">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/65 to-slate-900/85"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex items-center min-h-[70vh] pb-32">
        <div className="w-full">
          <div className="text-center mb-10 space-y-5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-tight">
              Trouvez votre <span className="relative inline-block">
                <span className="relative z-10 font-bold tracking-wider bg-gradient-to-r from-white via-orange-50 to-white bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif", letterSpacing: '0.02em' }}>prochain défi</span>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto font-light">
              Inscrivez-vous aux événements sportifs partout en France
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">

              {/* Search bar */}
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou ville..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-400 shadow-sm font-medium hover:border-blue-400 transition-all"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Filters - All aligned on one row */}
              <div className="mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Characteristics filter */}
                  <EventCharacteristicsFilter
                    selectedFilters={selectedCharacteristics}
                    onChange={setSelectedCharacteristics}
                  />

                  {/* Sport filter */}
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 font-medium cursor-pointer hover:border-blue-400 transition-all shadow-sm"
                  >
                    <option value="">Tous les sports</option>
                    <option value="running">Course à pied</option>
                    <option value="trail">Trail</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="cycling">Cyclisme</option>
                    <option value="swimming">Natation</option>
                    <option value="obstacle">Course d'obstacles</option>
                    <option value="walking">Marche</option>
                    <option value="other">Autre</option>
                  </select>

                  {/* Month filter */}
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 font-medium cursor-pointer hover:border-blue-400 transition-all shadow-sm"
                  >
                    <option value="">Tous les mois</option>
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>

                  {/* Reset filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium shadow-sm border-2 border-slate-900 flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl font-bold text-base flex items-center justify-center space-x-2 group border-2 border-orange-400 hover:border-orange-500"
              >
                <Search className="w-4 h-4" />
                <span>Voir les événements</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
