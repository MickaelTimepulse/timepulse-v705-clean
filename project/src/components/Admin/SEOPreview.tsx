import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { validateSEO } from '../../lib/seo-service';
import { generateSEOWithAI } from '../../lib/ai-service';

interface SEOPreviewProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  pageTitle: string;
  pageContent: string;
  shortDescription?: string;
}

export default function SEOPreview({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  pageTitle,
  pageContent,
  shortDescription,
}: SEOPreviewProps) {
  const [generating, setGenerating] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const validation = validateSEO(title || pageTitle, description || shortDescription || '');

  async function handleAutoGenerate() {
    if (!pageTitle) {
      alert('Veuillez d\'abord renseigner le titre de la page');
      return;
    }

    setGenerating(true);
    try {
      console.log('handleAutoGenerate called with:', { pageTitle, pageContent: pageContent.substring(0, 100) });

      const seoData = await generateSEOWithAI({
        pageTitle,
        pageContent,
        shortDescription,
      });

      console.log('SEO data received:', seoData);

      if (seoData.title) {
        onTitleChange(seoData.title);
      }
      if (seoData.description) {
        onDescriptionChange(seoData.description);
      }
    } catch (error: any) {
      console.error('SEO generation error:', error);

      let errorMessage = 'Impossible de générer le SEO.';

      if (error.message === 'INSUFFICIENT_QUOTA') {
        errorMessage = '⚠️ Crédit OpenAI insuffisant\n\nVotre quota OpenAI est épuisé. Veuillez ajouter du crédit sur platform.openai.com pour continuer à utiliser la génération automatique de contenu SEO.';
      } else if (error.message === 'API_KEY_MISSING') {
        errorMessage = '⚠️ Clé API OpenAI manquante\n\nLa clé API OpenAI n\'est pas configurée. Veuillez l\'ajouter dans le fichier .env (VITE_OPENAI_API_KEY).';
      }

      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateTitle() {
    if (!pageTitle) {
      alert('Veuillez d\'abord renseigner le titre de la page');
      return;
    }

    setGeneratingTitle(true);
    try {
      console.log('handleGenerateTitle called');

      const seoData = await generateSEOWithAI({
        pageTitle,
        pageContent,
        shortDescription,
      });

      console.log('Title received:', seoData.title);

      if (seoData.title) {
        onTitleChange(seoData.title);
      }
    } catch (error: any) {
      console.error('Title generation error:', error);

      let errorMessage = 'Impossible de générer le titre.';

      if (error.message === 'INSUFFICIENT_QUOTA') {
        errorMessage = '⚠️ Crédit OpenAI insuffisant\n\nVotre quota OpenAI est épuisé. Veuillez ajouter du crédit sur platform.openai.com pour continuer à utiliser la génération automatique de contenu SEO.';
      } else if (error.message === 'API_KEY_MISSING') {
        errorMessage = '⚠️ Clé API OpenAI manquante\n\nLa clé API OpenAI n\'est pas configurée. Veuillez l\'ajouter dans le fichier .env (VITE_OPENAI_API_KEY).';
      }

      alert(errorMessage);
    } finally {
      setGeneratingTitle(false);
    }
  }

  async function handleGenerateDescription() {
    if (!pageTitle) {
      alert('Veuillez d\'abord renseigner le titre de la page');
      return;
    }

    setGeneratingDescription(true);
    try {
      console.log('handleGenerateDescription called');

      const seoData = await generateSEOWithAI({
        pageTitle,
        pageContent,
        shortDescription,
      });

      console.log('Description received:', seoData.description);

      if (seoData.description) {
        onDescriptionChange(seoData.description);
      }
    } catch (error: any) {
      console.error('Description generation error:', error);

      let errorMessage = 'Impossible de générer la description.';

      if (error.message === 'INSUFFICIENT_QUOTA') {
        errorMessage = '⚠️ Crédit OpenAI insuffisant\n\nVotre quota OpenAI est épuisé. Veuillez ajouter du crédit sur platform.openai.com pour continuer à utiliser la génération automatique de contenu SEO.';
      } else if (error.message === 'API_KEY_MISSING') {
        errorMessage = '⚠️ Clé API OpenAI manquante\n\nLa clé API OpenAI n\'est pas configurée. Veuillez l\'ajouter dans le fichier .env (VITE_OPENAI_API_KEY).';
      }

      alert(errorMessage);
    } finally {
      setGeneratingDescription(false);
    }
  }

  const displayTitle = title || pageTitle || 'Titre de la page';
  const displayDescription = description || shortDescription || 'Description de la page...';
  const displayUrl = `timepulse.fr/services/${pageTitle.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Optimisation SEO</h3>
        <button
          type="button"
          onClick={handleAutoGenerate}
          disabled={generating || !pageTitle}
          className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Générer automatiquement
            </>
          )}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{displayUrl}</p>
            <h4 className="text-lg text-blue-600 hover:underline cursor-pointer leading-tight mb-1">
              {displayTitle}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayDescription}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Titre SEO
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({(title || pageTitle).length}/60 caractères)
            </span>
          </label>
          <button
            type="button"
            onClick={handleGenerateTitle}
            disabled={generatingTitle || !pageTitle}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingTitle ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Générer avec l'IA
              </>
            )}
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Laissez vide pour utiliser le titre de la page"
          maxLength={60}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Description SEO
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({(description || shortDescription || '').length}/160 caractères)
            </span>
          </label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={generatingDescription || !pageTitle}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingDescription ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Générer avec l'IA
              </>
            )}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={160}
          placeholder="Laissez vide pour utiliser la description courte"
        />
      </div>

      {validation.warnings.length > 0 && (
        <div className="space-y-2">
          {validation.warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {validation.valid && (title || description) && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Votre SEO est optimisé et respecte les bonnes pratiques
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          💡 Bonnes pratiques SEO
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Titre : 30-60 caractères, inclure le nom de la marque</li>
          <li>• Description : 120-160 caractères, claire et incitative</li>
          <li>• Utiliser des mots-clés pertinents naturellement</li>
          <li>• Rester authentique et descriptif</li>
        </ul>
      </div>
    </div>
  );
}
