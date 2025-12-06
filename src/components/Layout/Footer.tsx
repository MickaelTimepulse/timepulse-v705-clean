import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  section: string;
  items: FooterLink[];
}

interface FooterSettings {
  company_name: string;
  company_description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  copyright_text: string;
  links: FooterSection[];
}

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    loadFooterSettings();
  }, []);

  async function loadFooterSettings() {
    try {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading footer settings:', error);
    }
  }

  // Valeurs par défaut si les settings ne sont pas chargés
  const defaultSettings: FooterSettings = {
    company_name: 'Timepulse',
    company_description: 'Plateforme de chronométrage et d\'inscriptions pour événements sportifs depuis 2009.',
    email: 'contact@timepulse.fr',
    phone: '+33 4 XX XX XX XX',
    address: 'Grenoble, France',
    facebook_url: null,
    twitter_url: null,
    instagram_url: null,
    linkedin_url: null,
    youtube_url: null,
    copyright_text: `© ${new Date().getFullYear()} Timepulse. Tous droits réservés.`,
    links: []
  };

  const footerData = settings || defaultSettings;

  return (
    <footer className="relative bg-gray-900 text-gray-300 overflow-hidden font-light">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src="/time.png"
                alt={footerData.company_name}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            {footerData.company_description && (
              <p className="text-gray-400 leading-relaxed font-light text-sm">
                {footerData.company_description}
              </p>
            )}
            <div className="flex items-center space-x-3 pt-2">
              {footerData.facebook_url && (
                <a href={footerData.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <Facebook className="w-5 h-5 text-white" />
                </a>
              )}
              {footerData.twitter_url && (
                <a href={footerData.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <Twitter className="w-5 h-5 text-white" />
                </a>
              )}
              {footerData.instagram_url && (
                <a href={footerData.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <Instagram className="w-5 h-5 text-white" />
                </a>
              )}
              {footerData.linkedin_url && (
                <a href={footerData.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              )}
              {footerData.youtube_url && (
                <a href={footerData.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all">
                  <Youtube className="w-5 h-5 text-white" />
                </a>
              )}
            </div>
          </div>

          {footerData.links.map((section, index) => (
            <div key={index}>
              <h3 className="text-white font-semibold mb-4 text-base tracking-wide">{section.section}</h3>
              <ul className="space-y-2">
                {section.items.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.url.startsWith('http') ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-orange-400 transition-colors flex items-center space-x-2 group font-light text-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span>{link.label}</span>
                      </a>
                    ) : (
                      <Link
                        to={link.url}
                        className="text-gray-400 hover:text-orange-400 transition-colors flex items-center space-x-2 group font-light text-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span>{link.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-white font-semibold mb-4 text-base tracking-wide">Contact</h3>
            <ul className="space-y-3">
              {footerData.email && (
                <li>
                  <a href={`mailto:${footerData.email}`} className="flex items-start space-x-3 text-gray-400 hover:text-white transition-colors group font-light text-sm">
                    <Mail className="w-5 h-5 mt-0.5 text-slate-400" />
                    <span>{footerData.email}</span>
                  </a>
                </li>
              )}
              {footerData.phone && (
                <li>
                  <a href={`tel:${footerData.phone.replace(/\s/g, '')}`} className="flex items-start space-x-3 text-gray-400 hover:text-white transition-colors group font-light text-sm">
                    <Phone className="w-5 h-5 mt-0.5 text-slate-400" />
                    <span>{footerData.phone}</span>
                  </a>
                </li>
              )}
              {footerData.address && (
                <li className="flex items-start space-x-3 text-gray-400 font-light text-sm">
                  <MapPin className="w-5 h-5 mt-0.5 text-slate-400" />
                  <span>{footerData.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Carte de France avec positionnement Timepulse */}
          <div className="lg:col-span-2 -mt-6">
            <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-gray-700/30 rounded-xl p-4 overflow-hidden">
              {/* Fond subtil */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>

              <div className="relative space-y-4">
                {/* Drapeau français animé + Texte */}
                <div className="flex items-center gap-3">
                  {/* Drapeau français avec animation */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                    <div className="absolute inset-0 flex">
                      <div className="w-1/3 bg-blue-600 animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                      <div className="w-1/3 bg-white animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
                      <div className="w-1/3 bg-red-600 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-base mb-1">
                      Entreprise 100% Française
                    </h4>
                    <p className="text-gray-300 text-xs font-light leading-relaxed">
                      Basée au cœur de la <span className="text-blue-400 font-medium">Vallée de la Loire</span>,
                      entre Nantes et Angers, <span className="text-white font-medium">Timepulse</span> est dirigée
                      par des passionnés de sport depuis <span className="text-orange-400 font-semibold">2009</span>.
                    </p>
                  </div>
                </div>

                {/* Carte de France horizontale avec itinéraire */}
                <div className="relative h-48 w-full">
                  {/* Silhouette France en arrière-plan */}
                  <svg viewBox="0 0 600 200" className="w-full h-full absolute opacity-10">
                    <path
                      d="M 250 10 L 280 20 L 310 25 L 340 35 L 360 50 L 370 70 L 365 90 L 355 110 L 340 125 L 315 135 L 280 140 L 245 138 L 210 135 L 180 130 L 155 120 L 135 105 L 125 85 L 120 65 L 125 45 L 140 30 L 165 18 L 200 12 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-blue-400/40"
                    />
                  </svg>

                  {/* Ligne de parcours de Plogoff à Paris */}
                  <svg viewBox="0 0 600 200" className="w-full h-full absolute">
                    <defs>
                      <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#f97316" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
                      </linearGradient>

                      {/* Animation pour les lignes vers les points extrêmes */}
                      <style>
                        {`
                          @keyframes dashAnimation {
                            0% { stroke-dashoffset: 30; }
                            100% { stroke-dashoffset: 0; }
                          }
                          .animated-line {
                            animation: dashAnimation 3s ease-in-out infinite;
                          }
                          @keyframes pulsePoint {
                            0%, 100% { opacity: 0.4; r: 2.5; }
                            50% { opacity: 1; r: 3.5; }
                          }
                          .pulse-city {
                            animation: pulsePoint 2s ease-in-out infinite;
                          }
                        `}
                      </style>
                    </defs>

                    {/* Ligne principale horizontale */}
                    <path d="M 20 100 L 60 100 L 100 100 L 180 100 L 260 100 L 310 100 L 360 100 L 440 100 L 500 100 L 580 100" fill="none" stroke="url(#routeGradient)" strokeWidth="3" strokeDasharray="8,4" className="animate-pulse" style={{ animationDuration: '2s' }} />
                    {/* Lignes rayonnantes depuis Loireauxence */}
                    <path d="M 260 100 L 20 100" fill="none" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 580 100" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 280 35" fill="none" stroke="#10b981" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 240 155" fill="none" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 165 55" fill="none" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 165 145" fill="none" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    <path d="M 260 100 L 380 145" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5,5" opacity="0.4" className="animated-line" />
                    {/* Points villes principales */}
                    <circle cx="20" cy="100" r="5" fill="#3b82f6" className="pulse-city" />
                    <circle cx="60" cy="100" r="3.5" fill="#3b82f6" className="pulse-city" />
                    <circle cx="100" cy="100" r="3.5" fill="#3b82f6" className="pulse-city" />
                    <circle cx="180" cy="100" r="4.5" fill="#3b82f6" className="pulse-city" />
                    <g transform="translate(260, 100)">
                      <circle r="22" fill="#fff" className="animate-ping" opacity="0.4" />
                      <circle r="18" fill="#fff" className="pulse-city" opacity="0.3" />
                      <image href="/TP copy.png" x="-12" y="-12" width="24" height="24" />
                    </g>
                    <circle cx="310" cy="100" r="4.5" fill="#f97316" className="pulse-city" />
                    <circle cx="360" cy="100" r="3.5" fill="#f97316" className="pulse-city" />
                    <circle cx="280" cy="35" r="3.5" fill="#10b981" className="pulse-city" />
                    <circle cx="240" cy="155" r="3.5" fill="#8b5cf6" className="pulse-city" />
                    <circle cx="440" cy="100" r="3.5" fill="#ef4444" className="pulse-city" />
                    <circle cx="500" cy="100" r="3.5" fill="#ef4444" className="pulse-city" />
                    <circle cx="580" cy="100" r="6" fill="#ef4444" className="pulse-city" />
                    {/* Points villes périphériques */}
                    <circle cx="165" cy="55" r="3.5" fill="#06b6d4" className="pulse-city" />
                    <circle cx="165" cy="145" r="3.5" fill="#a855f7" className="pulse-city" />
                    <circle cx="380" cy="145" r="3.5" fill="#f59e0b" className="pulse-city" />
                  </svg>

                  {/* Labels */}
                  <svg viewBox="0 0 600 200" className="w-full h-full absolute pointer-events-none">
                    <text x="20" y="118" fontSize="11" fill="#3b82f6" fontWeight="600" textAnchor="middle">Plogoff</text>
                    <text x="60" y="118" fontSize="10" fill="#9ca3af" textAnchor="middle">Quimper</text>
                    <text x="100" y="118" fontSize="10" fill="#9ca3af" textAnchor="middle">Vannes</text>
                    <text x="180" y="118" fontSize="11" fill="#9ca3af" fontWeight="500" textAnchor="middle">Nantes</text>
                    <text x="260" y="82" fontSize="12" fill="#f97316" fontWeight="700" textAnchor="middle">Loireauxence</text>
                    <text x="310" y="118" fontSize="11" fill="#9ca3af" fontWeight="500" textAnchor="middle">Angers</text>
                    <text x="360" y="118" fontSize="10" fill="#9ca3af" textAnchor="middle">Le Mans</text>
                    <text x="280" y="22" fontSize="10" fill="#10b981" textAnchor="middle">Laval</text>
                    <text x="240" y="173" fontSize="10" fill="#8b5cf6" textAnchor="middle">Cholet</text>
                    <text x="440" y="118" fontSize="10" fill="#9ca3af" textAnchor="middle">Chartres</text>
                    <text x="500" y="118" fontSize="10" fill="#9ca3af" textAnchor="middle">Orléans</text>
                    <text x="580" y="118" fontSize="11" fill="#ef4444" fontWeight="600" textAnchor="middle">Paris</text>
                    <text x="165" y="42" fontSize="10" fill="#06b6d4" textAnchor="middle">Rennes</text>
                    <text x="165" y="163" fontSize="10" fill="#a855f7" textAnchor="middle">La Roche-sur-Yon</text>
                    <text x="380" y="163" fontSize="10" fill="#f59e0b" textAnchor="middle">Tours</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <p className="text-gray-400 text-sm font-light text-center">
            {footerData.copyright_text}
          </p>
        </div>
      </div>
    </footer>
  );
}
