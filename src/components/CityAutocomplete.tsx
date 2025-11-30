import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Search, X } from 'lucide-react';

interface City {
  id: string;
  city_name: string;
  postal_code: string;
  country_code: string;
  country_name: string;
  region?: string;
}

interface CityAutocompleteProps {
  value: string;
  onCitySelect: (city: string, postalCode: string, countryCode: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({
  value,
  onCitySelect,
  placeholder = 'Rechercher une ville...',
  className = ''
}: CityAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchCities = async () => {
      if (searchTerm.length < 2) {
        setCities([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        // Vérifier si c'est une recherche par code postal (nombres uniquement)
        const isPostalCode = /^\d+$/.test(searchTerm);

        let query = supabase.from('european_cities').select('*');

        if (isPostalCode) {
          // Recherche par code postal exact ou commence par
          query = query.or(`postal_code.eq.${searchTerm},postal_code.ilike.${searchTerm}%`);
        } else {
          // Recherche par nom de ville
          query = query.ilike('city_name', `${searchTerm}%`);
        }

        const { data, error } = await query
          .order(isPostalCode ? 'postal_code' : 'city_name')
          .limit(20);

        if (error) throw error;
        setCities(data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Error searching cities:', error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchCities, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleSelect = (city: City) => {
    setSearchTerm(city.city_name);
    onCitySelect(city.city_name, city.postal_code, city.country_code);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || cities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < cities.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < cities.length) {
          handleSelect(cities[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setCities([]);
    setIsOpen(false);
    onCitySelect('', '', '');
  };

  const getFlagEmoji = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      FR: '🇫🇷',
      ES: '🇪🇸',
      IT: '🇮🇹',
      DE: '🇩🇪',
      BE: '🇧🇪',
      CH: '🇨🇭',
      PT: '🇵🇹',
      NL: '🇳🇱',
      AT: '🇦🇹',
      UK: '🇬🇧',
      IE: '🇮🇪',
      LU: '🇱🇺',
      PL: '🇵🇱',
      CZ: '🇨🇿',
      GR: '🇬🇷',
      SE: '🇸🇪',
      NO: '🇳🇴',
      DK: '🇩🇰',
      FI: '🇫🇮'
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && cities.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          autoComplete="off"
        />
        {searchTerm.length >= 2 && (
          <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
            {/^\d+$/.test(searchTerm) ? '🔢 Recherche par code postal' : '📍 Recherche par nom de ville'}
          </div>
        )}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && cities.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
              Recherche...
            </div>
          )}
          {!loading && cities.map((city, index) => (
            <button
              key={city.id}
              onClick={() => handleSelect(city)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition ${
                index === selectedIndex ? 'bg-pink-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {city.city_name}
                  </div>
                  {city.region && (
                    <div className="text-xs text-gray-500">
                      {city.region}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {city.postal_code}
                </span>
                <span className="text-lg" title={city.country_name}>
                  {getFlagEmoji(city.country_code)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && searchTerm.length >= 2 && cities.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Aucune ville trouvée pour "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}
