import { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Bold, Italic, List, Link as LinkIcon } from 'lucide-react';
import { generateText, AI_SUGGESTIONS } from '../../lib/ai-service';
import MediaLibrary from './MediaLibrary';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showAI?: boolean;
  aiContext?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  showAI = true,
  aiContext,
}: RichTextEditorProps) {
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function handleGenerate(mode: 'generate' | 'improve' | 'replace') {
    if (!aiPrompt.trim()) return;

    setGenerating(true);
    try {
      const result = await generateText({
        prompt: aiPrompt,
        context: aiContext,
        tone: 'professional',
        length: 'medium',
      });

      if (result.success) {
        const formattedText = `<p>${result.text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

        if (mode === 'replace') {
          onChange(formattedText);
        } else if (mode === 'improve') {
          onChange(value + '\n' + formattedText);
        } else {
          onChange(value ? value + '\n' + formattedText : formattedText);
        }
        setAiPrompt('');
        setShowAIPanel(false);
      } else {
        alert(result.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Erreur lors de la génération du texte');
    } finally {
      setGenerating(false);
    }
  }

  function insertFormatting(tag: string) {
    const textarea = document.getElementById('rich-text-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'texte';

    let formattedText = '';
    switch (tag) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'list':
        formattedText = `<ul>\n<li>${selectedText}</li>\n</ul>`;
        break;
      case 'link':
        formattedText = `<a href="https://">${selectedText}</a>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText}</h2>`;
        break;
      case 'h3':
        formattedText = `<h3>${selectedText}</h3>`;
        break;
      case 'p':
        formattedText = `<p>${selectedText}</p>`;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
  }

  function insertImage(imageUrl: string) {
    const imgTag = `<img src="${imageUrl}" alt="Image" class="max-w-full h-auto rounded-lg my-4" />`;
    onChange(value ? value + '\n' + imgTag : imgTag);
    setShowMediaLibrary(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">✨ HTML supporté</span>
          {value && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showPreview ? 'Mode édition' : 'Aperçu'}
            </button>
          )}
        </div>
      </div>

      {showPreview && value ? (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-600">Aperçu du rendu</span>
          </div>
          <div
            className="p-6 prose prose-lg max-w-none
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
              [&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-4
              [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-gray-600"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
            <button
              type="button"
              onClick={() => insertFormatting('h2')}
              className="p-2 hover:bg-gray-200 rounded text-sm font-semibold"
              title="Titre H2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('h3')}
              className="p-2 hover:bg-gray-200 rounded text-sm font-semibold"
              title="Titre H3"
            >
              H3
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => insertFormatting('bold')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Gras"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('italic')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Italique"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => insertFormatting('list')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('link')}
              className="p-2 hover:bg-gray-200 rounded"
              title="Lien"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowMediaLibrary(true)}
              className="p-2 hover:bg-gray-200 rounded"
              title="Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Editor Area */}
          <textarea
            id="rich-text-area"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Écrivez ici... Vous pouvez utiliser du HTML : <p>, <strong>, <em>, <ul>, <li>, <a>, etc."}
            className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none resize-none font-mono text-sm"
            rows={12}
          />
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-2">
          {showAI && (
            <button
              type="button"
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Générer avec l'IA
            </button>
          )}
        </div>

        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800 font-medium">
            💡 Aide HTML
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
            <div><code className="text-blue-600">&lt;p&gt;Paragraphe&lt;/p&gt;</code></div>
            <div><code className="text-blue-600">&lt;h2&gt;Titre 2&lt;/h2&gt;</code></div>
            <div><code className="text-blue-600">&lt;h3&gt;Titre 3&lt;/h3&gt;</code></div>
            <div><code className="text-blue-600">&lt;strong&gt;Gras&lt;/strong&gt;</code></div>
            <div><code className="text-blue-600">&lt;em&gt;Italique&lt;/em&gt;</code></div>
            <div><code className="text-blue-600">&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</code> - Liste</div>
            <div><code className="text-blue-600">&lt;a href="url"&gt;Lien&lt;/a&gt;</code></div>
            <div><code className="text-blue-600">&lt;br&gt;</code> - Saut de ligne</div>
            <div className="pt-2 border-t border-gray-300 mt-2">
              <p className="text-gray-700 font-medium mb-1">Vous pouvez coller du HTML complet</p>
              <p className="text-gray-600">Collez votre HTML depuis Word, Google Docs, etc.</p>
            </div>
          </div>
        </details>
      </div>

      {showAIPanel && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Que voulez-vous générer ?
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Un paragraphe sur les avantages du chronométrage RFID pour les organisateurs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  disabled={generating}
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Suggestions:</p>
                <div className="grid grid-cols-1 gap-1">
                  {AI_SUGGESTIONS.section.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAiPrompt(suggestion)}
                      className="text-left text-xs text-purple-600 hover:text-purple-800 hover:underline"
                      disabled={generating}
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerate('generate')}
                  disabled={generating || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer et ajouter
                    </>
                  )}
                </button>

                {value && (
                  <button
                    type="button"
                    onClick={() => handleGenerate('replace')}
                    disabled={generating || !aiPrompt.trim()}
                    className="px-4 py-2 text-sm text-purple-600 bg-white hover:bg-purple-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium border border-purple-200"
                  >
                    Remplacer le contenu
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowAIPanel(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                  disabled={generating}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Photothèque</h2>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <MediaLibrary
                onSelect={(file) => insertImage(file.file_url)}
                category="content"
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
