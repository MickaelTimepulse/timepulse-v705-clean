import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

interface StaticPageData {
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPage(slug);
    }
  }, [slug]);

  async function loadPage(pageSlug: string) {
    try {
      setLoading(true);
      setError(false);

      const { data, error: fetchError } = await supabase
        .from('static_pages')
        .select('title, content, meta_title, meta_description')
        .eq('slug', pageSlug)
        .eq('is_published', true)
        .single();

      if (fetchError) throw fetchError;

      setPage(data);

      if (data.meta_title) {
        document.title = data.meta_title;
      } else {
        document.title = `${data.title} - Timepulse`;
      }

      if (data.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', data.meta_description);
      }
    } catch (err) {
      console.error('Error loading page:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
            <p className="text-gray-600 mb-6">
              La page que vous recherchez n'existe pas ou n'est plus disponible.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/course%20%C3%A0%20pied%20masse%201.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/75 to-white/85"></div>
      </div>

      <div className="relative z-10">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="p-8 md:p-12">
              <div className="mb-8">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Link>
              </div>

              <article
                className="prose prose-lg max-w-none font-light"
                dangerouslySetInnerHTML={{ __html: page.content || '' }}
                style={{
                  lineHeight: '1.8',
                }}
              />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      <style>{`
        .prose h1 {
          font-size: 2.5rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        .prose h2 {
          font-size: 1.875rem;
          font-weight: 500;
          color: #1f2937;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .prose h3 {
          font-size: 1.5rem;
          font-weight: 500;
          color: #374151;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .prose p {
          font-size: 1.125rem;
          font-weight: 300;
          color: #4b5563;
          margin-bottom: 1.25rem;
          line-height: 1.8;
        }
        .prose ul, .prose ol {
          margin-top: 1rem;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .prose li {
          font-size: 1.125rem;
          font-weight: 300;
          color: #4b5563;
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .prose a {
          color: #db2777;
          text-decoration: underline;
          font-weight: 300;
        }
        .prose a:hover {
          color: #be185d;
        }
        .prose strong {
          font-weight: 500;
          color: #111827;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 300;
        }
        .prose blockquote {
          border-left: 4px solid #db2777;
          padding-left: 1rem;
          font-style: italic;
          font-weight: 300;
          color: #6b7280;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
