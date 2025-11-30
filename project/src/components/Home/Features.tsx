import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  background_image_url: string | null;
  image_opacity: number;
  display_order: number;
  slug: string;
}

export default function Features() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const { data, error } = await supabase
        .from('service_pages')
        .select('id, title, short_description, icon, hero_image_url, hero_image_opacity, order_index, slug')
        .eq('is_published', true)
        .eq('show_on_homepage', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const mappedData = (data as any)?.map((page: any) => ({
        id: page.id,
        title: page.title,
        description: page.short_description || '',
        icon: page.icon || 'Star',
        background_image_url: page.hero_image_url,
        image_opacity: page.hero_image_opacity || 20,
        display_order: page.order_index || 0,
        slug: page.slug
      })) || [];

      setFeatures(mappedData);
    } catch (err) {
      console.error('Error loading features:', err);
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Star;
    return Icon;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Pourquoi choisir Timepulse ?</h2>
            <p className="mt-4 text-lg text-gray-600">Chargement...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Pourquoi choisir Timepulse ?</h2>
          <p className="mt-4 text-lg text-gray-600">
            Une plateforme complète pour vos inscriptions et votre chronométrage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = getIcon(feature.icon);

            const handleClick = () => {
              navigate(`/services/${feature.slug}`);
            };

            return (
              <div
                key={feature.id}
                onClick={handleClick}
                className="relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 hover:-translate-y-1"
              >
                {feature.background_image_url && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${feature.background_image_url})`,
                      opacity: feature.image_opacity / 100,
                    }}
                  />
                )}
                <div className="relative bg-white/85 backdrop-blur-sm p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-700">{feature.description}</p>
                  <div className="mt-4 text-pink-600 text-sm font-semibold flex items-center gap-2">
                    En savoir plus
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
