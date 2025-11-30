import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn, ChevronDown, Trophy, Video } from 'lucide-react';

// Force rebuild 2025-11-24 - Chrome cache fix
export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginMenu, setShowLoginMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center group">
            <img
              src="/time.png"
              alt="Timepulse"
              className="h-10 w-auto transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:brightness-110 group-hover:drop-shadow-lg"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/videos"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-lg"
            >
              <Video className="w-4 h-4" />
              <span>Vidéos</span>
            </Link>
            <Link
              to="/resultats"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-lg"
            >
              <Trophy className="w-4 h-4" />
              <span>Résultats</span>
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowLoginMenu(!showLoginMenu)}
                onBlur={() => setTimeout(() => setShowLoginMenu(false), 200)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-lg"
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLoginMenu ? 'rotate-180' : ''}`} />
              </button>
              {showLoginMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link
                    to="/athlete/login"
                    className="block px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium rounded-lg mx-2"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    Espace Athlète
                  </Link>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Link
                    to="/admin/login"
                    className="block px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium rounded-lg mx-2"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    Compte Admin Timepulse
                  </Link>
                  <Link
                    to="/organizer/login"
                    className="block px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium rounded-lg mx-2"
                    onClick={() => setShowLoginMenu(false)}
                  >
                    Compte Organisateur
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-100 animate-in slide-in-from-top duration-200">
            <div className="flex flex-col space-y-2">
              <Link
                to="/videos"
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Video className="w-5 h-5" />
                <span>Vidéos</span>
              </Link>
              <Link
                to="/resultats"
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy className="w-5 h-5" />
                <span>Résultats</span>
              </Link>
              <div className="h-px bg-gray-100 my-2"></div>
              <Link
                to="/admin/login"
                className="px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Timepulse
              </Link>
              <Link
                to="/organizer/login"
                className="px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium transition-all rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                Organisateur
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
