import { useState, useEffect } from 'react';
import { X, Download, Share2, Facebook, Twitter, MessageCircle, Copy, Award } from 'lucide-react';
import { generateCertificate, shareCertificate, trackCertificateShare, ResultData } from '../lib/certificate-generator';
import { supabase } from '../lib/supabase';

interface CertificateShareModalProps {
  resultId: string;
  resultData: ResultData;
  raceId: string;
  onClose: () => void;
}

export default function CertificateShareModal({ resultId, resultData, raceId, onClose }: CertificateShareModalProps) {
  const [certificateUrl, setCertificateUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        await loadCertificate();
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [raceId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Recherche de template pour race_id:', raceId);

      // Trouver le template actif pour cette course
      // On cherche uniquement les templates spécifiques à cette course OU les templates globaux
      const { data: templates, error: templateError } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .or(`race_id.eq.${raceId},race_id.is.null`)
        .order('created_at', { ascending: false });

      if (templateError) {
        console.error('❌ Erreur lors de la récupération des templates:', templateError);
        throw templateError;
      }

      console.log('📋 Templates trouvés pour cette course:', templates);

      if (!templates || templates.length === 0) {
        setError('Aucun diplôme n\'est configuré pour cette épreuve');
        return;
      }

      // Prioriser dans cet ordre :
      // 1. Template spécifique à cette race
      // 2. Template global (race_id === null)
      const specificTemplate = templates.find(t => t.race_id === raceId);
      const globalTemplate = templates.find(t => t.race_id === null);
      const template = specificTemplate || globalTemplate;

      if (!template) {
        setError('Aucun diplôme n\'est configuré pour cette épreuve');
        return;
      }

      console.log('✅ Template sélectionné:', template);
      setTemplateId(template.id);

      // Générer le diplôme
      const url = await generateCertificate(template.id, resultData);
      setCertificateUrl(url);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la génération du diplôme');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(certificateUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        await shareCertificate(certificateUrl, resultData.race_name, resultData.athlete_name, platform);
      }

      // Tracker le partage
      await trackCertificateShare(
        resultId,
        resultData.athlete_name,
        certificateUrl,
        platform
      );
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = certificateUrl;
      link.download = `diplome_${resultData.athlete_name.replace(/\s+/g, '_')}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Retirer le lien après un délai pour éviter les erreurs de timing
      setTimeout(() => {
        try {
          if (link.parentNode === document.body) {
            document.body.removeChild(link);
          }
        } catch (err) {
          console.error('Error removing download link:', err);
        }
      }, 100);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const shareMessage = `J'ai participé à "${resultData.race_name}" ! Voici mon diplôme ! Tu peux y arriver ? 🏃‍♂️🏆`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Votre diplôme
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Génération de votre diplôme...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && certificateUrl && (
            <>
              {/* Prévisualisation */}
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={certificateUrl}
                  alt="Diplôme"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              {/* Message de partage */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 mb-2 font-medium">Message de partage :</p>
                <p className="text-blue-800 italic">"{shareMessage}"</p>
              </div>

              {/* Boutons de téléchargement */}
              <div>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Télécharger mon diplôme
                </button>
              </div>

              {/* Partage sur les réseaux sociaux */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Partager sur les réseaux sociaux
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                    Facebook
                  </button>

                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    Twitter
                  </button>

                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>

                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors relative"
                  >
                    <Copy className="w-5 h-5" />
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  💡 Votre diplôme est optimisé pour tous les réseaux sociaux (Facebook, Twitter, Instagram, WhatsApp, Snapchat...). Téléchargez-le et partagez votre fierté !
                </p>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
