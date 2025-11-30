import React, { useState, useEffect } from 'react';
import { Handshake, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Partner {
  id: string;
  event_id: string;
  name: string | null;
  logo_url: string;
  website_url: string | null;
  display_order: number;
}

interface EventPartnersSectionProps {
  eventId: string;
}

export default function EventPartnersSection({ eventId }: EventPartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, [eventId]);

  const loadPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('event_partners')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (partners.length === 0) {
    return null;
  }

  console.log(`EventPartnersSection: ${partners.length} partenaires chargés pour l'événement ${eventId}`);

  const PartnerLogo = ({ partner }: { partner: Partner }) => {
    const logo = (
      <div className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Subtle shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute -inset-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
        </div>

        {/* Logo container */}
        <div className="relative flex items-center justify-center h-32">
          <img
            src={partner.logo_url}
            alt={partner.name || 'Partenaire'}
            className="max-w-full max-h-full object-contain transition-all duration-500 group-hover:scale-110"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>

        {/* Partner name if provided */}
        {partner.name && (
          <div className="relative mt-4 text-center">
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
              {partner.name}
            </p>
          </div>
        )}

        {/* External link indicator */}
        {partner.website_url && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg transform rotate-0 group-hover:rotate-12 transition-transform duration-300">
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Animated border on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border animate-[spin_3s_linear_infinite] opacity-30"></div>
        </div>
      </div>
    );

    if (partner.website_url) {
      return (
        <a
          href={partner.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-xl transition-all duration-300"
          aria-label={`Visiter le site de ${partner.name || 'notre partenaire'}`}
        >
          {logo}
        </a>
      );
    }

    return logo;
  };

  // Dupliquer suffisamment pour un défilement infini fluide
  const partnersToDisplay = partners.length > 4
    ? [...partners, ...partners, ...partners, ...partners]
    : partners;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Handshake className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Partenaires
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nous remercions nos partenaires pour leur confiance et leur soutien dans l'organisation de cet événement.
          </p>
        </div>

        {/* Partners 3D Carousel Container */}
        <div className="relative" style={{
          height: partners.length > 4 ? '320px' : 'auto',
          perspective: '1200px'
        }}>
          <div className={`flex items-center ${
            partners.length > 4
              ? 'animate-scroll-3d gap-8 h-full'
              : 'justify-center gap-6 flex-wrap py-8'
          }`}>
            {partnersToDisplay.map((partner, index) => (
              <div
                key={`${partner.id}-${index}`}
                className="partner-card flex-shrink-0 w-64"
                style={{
                  '--index': index,
                  '--total': partnersToDisplay.length
                } as React.CSSProperties}
              >
                <PartnerLogo partner={partner} />
              </div>
            ))}
          </div>

          {/* Enhanced gradient overlays with perspective fade */}
          {partners.length > 4 && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>
            </>
          )}
        </div>

        {/* Decorative element */}
        <div className="mt-12 flex justify-center">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes scroll-3d {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 4));
          }
        }

        .animate-scroll-3d {
          animation: scroll-3d 25s linear infinite;
          transform-style: preserve-3d;
          width: max-content;
        }

        .animate-scroll-3d:hover {
          animation-play-state: paused;
        }

        /* Effet 3D sphérique sur chaque carte */
        .partner-card {
          transform-style: preserve-3d;
          transition: all 0.5s ease-out;
        }

        /* Animation perspective qui crée l'effet de courbure */
        @keyframes float-curve {
          0%, 100% {
            transform: rotateY(0deg) translateZ(0px) scale(1);
          }
          25% {
            transform: rotateY(-8deg) translateZ(30px) scale(1.05);
          }
          50% {
            transform: rotateY(0deg) translateZ(50px) scale(1.1);
          }
          75% {
            transform: rotateY(8deg) translateZ(30px) scale(1.05);
          }
        }

        .animate-scroll-3d .partner-card {
          animation: float-curve 8s ease-in-out infinite;
          animation-delay: calc(var(--index) * -0.5s);
        }

        /* Perspective dynamique basée sur la position */
        .animate-scroll-3d .partner-card:nth-child(odd) {
          transform: perspective(1000px) rotateY(-5deg);
        }

        .animate-scroll-3d .partner-card:nth-child(even) {
          transform: perspective(1000px) rotateY(5deg);
        }

        /* Effet de profondeur avec échelle */
        @media (min-width: 768px) {
          .animate-scroll-3d .partner-card {
            transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .animate-scroll-3d:hover .partner-card {
            animation-play-state: paused;
          }

          /* Effet de "vague" sur le survol */
          .animate-scroll-3d:not(:hover) .partner-card:hover {
            transform: perspective(1000px) translateZ(80px) scale(1.15) rotateY(0deg) !important;
            z-index: 20;
          }
        }

        /* Ajustement de l'opacité pour l'effet de profondeur */
        .partner-card {
          opacity: 0.85;
          filter: blur(0px);
          transition: opacity 0.3s, filter 0.3s;
        }

        .partner-card:hover,
        .animate-scroll-3d:hover .partner-card {
          opacity: 1;
          filter: blur(0px);
        }
      `}</style>
    </section>
  );
}
