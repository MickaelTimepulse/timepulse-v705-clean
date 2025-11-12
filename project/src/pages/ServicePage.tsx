import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import * as Icons from 'lucide-react';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface ContentSection {
  type: 'section' | 'features';
  title?: string;
  content?: string;
  items?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

interface ServicePage {
  id: string;
  slug: string;
  title: string;
  icon: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  content: ContentSection[];
  seo_title: string;
  seo_description: string;
}

export default function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ServicePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPage() {
      if (!slug) return;

      const { data, error } = await supabase
        .from('service_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as ServicePage);

        if (data.seo_title) {
          document.title = data.seo_title;
        }

        if (data.seo_description) {
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', data.seo_description);
          }
        }
      }

      setLoading(false);
    }

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !page) {
    return <Navigate to="/" replace />;
  }

  const HeroIcon = (Icons as any)[page.icon] || Icons.Circle;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm mb-6">
              <HeroIcon className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {page.hero_title}
            </h1>
            {page.hero_subtitle && (
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                {page.hero_subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {page.content?.map((section, index) => (
          <div key={index} className="mb-16 last:mb-0">
            {(section.type === 'section' || section.type === 'text') && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                {section.title && (
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    {section.title}
                  </h2>
                )}
                {section.content && (
                  <div
                    className="prose prose-lg max-w-none text-gray-700
                      [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h1]:mb-4
                      [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-4
                      [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-6 [&>h3]:mb-3
                      [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-4
                      [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul]:text-gray-700
                      [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol]:text-gray-700
                      [&>li]:mb-2
                      [&>strong]:font-semibold [&>strong]:text-gray-900
                      [&>em]:italic [&>em]:text-gray-700
                      [&>a]:text-blue-600 [&>a]:underline [&>a]:hover:text-blue-800
                      [&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-6 [&>img]:w-full
                      [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600 [&>blockquote]:my-4"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </div>
            )}

            {section.type === 'features' && section.items && (
              <div>
                {section.title && (
                  <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                    {section.title}
                  </h2>
                )}
                <div className="grid md:grid-cols-2 gap-8">
                  {section.items.map((item, itemIndex) => {
                    const ItemIcon = (Icons as any)[item.icon] || Icons.Circle;
                    return (
                      <div
                        key={itemIndex}
                        className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <ItemIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à organiser votre prochain événement ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour un devis personnalisé et découvrez nos solutions
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Demander un devis
            <Icons.ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
