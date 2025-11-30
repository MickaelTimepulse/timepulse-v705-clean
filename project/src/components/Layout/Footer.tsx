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
