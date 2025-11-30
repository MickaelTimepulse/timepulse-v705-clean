import { useState } from 'react';
import { Plus, Trash2, GripVertical, Sparkles, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MediaLibrary from './MediaLibrary';
import { generateText } from '../../lib/ai-service';

interface PageSection {
  id: string;
  type: 'hero' | 'text' | 'features' | 'images' | 'cta';
  content: any;
}

interface PageEditorProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
}

export default function PageEditor({ sections, onChange }: PageEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(sections[0]?.id || null);
  const [showMediaLibrary, setShowMediaLibrary] = useState<{ sectionId: string; field: string } | null>(null);

  function addSection(type: PageSection['type']) {
    const newSection: PageSection = {
      id: `section_${Date.now()}`,
      type,
      content: getDefaultContent(type),
    };

    onChange([...sections, newSection]);
    setExpandedSection(newSection.id);
  }

  function updateSection(id: string, content: any) {
    onChange(sections.map((s) => (s.id === id ? { ...s, content } : s)));
  }

  function deleteSection(id: string) {
    if (confirm('Supprimer cette section ?')) {
      onChange(sections.filter((s) => s.id !== id));
    }
  }

  function moveSection(id: string, direction: 'up' | 'down') {
    const index = sections.findIndex((s) => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
    onChange(newSections);
  }

  function getDefaultContent(type: PageSection['type']) {
    switch (type) {
      case 'hero':
        return {
          title: '',
          subtitle: '',
          backgroundImage: '',
          buttonText: 'En savoir plus',
          buttonLink: '/contact',
        };
      case 'text':
        return {
          title: '',
          content: '',
        };
      case 'features':
        return {
          title: '',
          items: [
            { icon: 'check', title: '', description: '' },
            { icon: 'check', title: '', description: '' },
          ],
        };
      case 'images':
        return {
          layout: 'grid',
          images: [],
        };
      case 'cta':
        return {
          title: '',
          description: '',
          buttonText: 'Nous contacter',
          buttonLink: '/contact',
        };
      default:
        return {};
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => addSection('hero')}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          + Hero
        </button>
        <button
          type="button"
          onClick={() => addSection('text')}
          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
        >
          + Texte
        </button>
        <button
          type="button"
          onClick={() => addSection('features')}
          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
        >
          + Features
        </button>
        <button
          type="button"
          onClick={() => addSection('images')}
          className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
        >
          + Images
        </button>
        <button
          type="button"
          onClick={() => addSection('cta')}
          className="px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
        >
          + Call-to-Action
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer"
              onClick={() =>
                setExpandedSection(expandedSection === section.id ? null : section.id)
              }
            >
              <GripVertical className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900 flex-1">
                {getSectionLabel(section.type)} {index + 1}
              </span>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => deleteSection(section.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedSection === section.id && (
              <div className="p-6 space-y-4">
                {section.type === 'hero' && (
                  <HeroEditor
                    content={section.content}
                    onChange={(content) => updateSection(section.id, content)}
                    onSelectImage={() =>
                      setShowMediaLibrary({ sectionId: section.id, field: 'backgroundImage' })
                    }
                  />
                )}

                {section.type === 'text' && (
                  <TextEditor
                    content={section.content}
                    onChange={(content) => updateSection(section.id, content)}
                  />
                )}

                {section.type === 'features' && (
                  <FeaturesEditor
                    content={section.content}
                    onChange={(content) => updateSection(section.id, content)}
                  />
                )}

                {section.type === 'cta' && (
                  <CTAEditor
                    content={section.content}
                    onChange={(content) => updateSection(section.id, content)}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Sélectionner une image</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <MediaLibrary
                onSelect={(file) => {
                  const section = sections.find((s) => s.id === showMediaLibrary.sectionId);
                  if (section) {
                    updateSection(section.id, {
                      ...section.content,
                      [showMediaLibrary.field]: file.file_url,
                    });
                  }
                  setShowMediaLibrary(null);
                }}
                category="hero"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowMediaLibrary(null)}
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

function getSectionLabel(type: string): string {
  const labels: Record<string, string> = {
    hero: 'Hero',
    text: 'Texte',
    features: 'Features',
    images: 'Images',
    cta: 'Call-to-Action',
  };
  return labels[type] || type;
}

function HeroEditor({ content, onChange, onSelectImage }: { content: any; onChange: (content: any) => void; onSelectImage: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function generateHeroText(field: 'title' | 'subtitle') {
    setGenerating(true);
    const prompt =
      field === 'title'
        ? 'Un titre accrocheur et impactant pour une page de service Timepulse (max 10 mots)'
        : 'Un sous-titre engageant qui complète le titre et explique le bénéfice principal (max 20 mots)';

    const result = await generateText({ prompt, length: 'short' });
    if (result.success) {
      onChange({ ...content, [field]: result.text });
    }
    setGenerating(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Titre *</label>
          <button
            type="button"
            onClick={() => generateHeroText('title')}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            Générer avec l'IA
          </button>
        </div>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Titre principal de la section hero"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Sous-titre</label>
          <button
            type="button"
            onClick={() => generateHeroText('subtitle')}
            disabled={generating}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            Générer avec l'IA
          </button>
        </div>
        <textarea
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Description du service"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image de fond
        </label>
        {content.backgroundImage ? (
          <div className="relative">
            <img
              src={content.backgroundImage}
              alt="Background"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={onSelectImage}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="ml-2">Changer l'image</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelectImage}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <ImageIcon className="w-12 h-12 mb-2" />
            <span>Sélectionner une image</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TextEditor({ content, onChange }: { content: any; onChange: (content: any) => void }) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [generating, setGenerating] = useState(false);

  async function generateContent() {
    if (!content.title) {
      alert('Ajoutez un titre pour générer du contenu pertinent');
      return;
    }

    setGenerating(true);
    const result = await generateText({
      prompt: `Génère un contenu professionnel et détaillé pour une section intitulée "${content.title}" sur le site de Timepulse, entreprise de chronométrage sportif. Le contenu doit être informatif, engageant et adapté à des organisateurs d'événements sportifs. Format HTML simple (p, ul, li, strong).`,
      length: 'medium',
    });

    if (result.success) {
      onChange({ ...content, content: result.text });
    }
    setGenerating(false);
  }

  function handleImportText() {
    if (importText.trim()) {
      const htmlContent = importText
        .split('\n\n')
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
      onChange({ ...content, content: htmlContent });
      setImportText('');
      setShowImportModal(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Titre de la section (optionnel)"
        />
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={generateContent}
          disabled={generating || !content.title}
          className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Génération...' : 'Générer avec IA'}
        </button>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Importer du texte
        </button>
      </div>

      <RichTextEditor
        label="Contenu"
        value={content.content}
        onChange={(value) => onChange({ ...content, content: value })}
        placeholder="Rédigez votre contenu ici, utilisez l'IA pour générer, ou importez du texte..."
        showAI={false}
      />

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Importer du texte</h3>
              <p className="text-sm text-gray-600 mt-1">
                Collez votre texte ci-dessous. Les paragraphes seront automatiquement formatés.
              </p>
            </div>

            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Collez votre texte ici...&#10;&#10;Séparez les paragraphes par une ligne vide."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setImportText('');
                  setShowImportModal(false);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleImportText}
                disabled={!importText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturesEditor({ content, onChange }: { content: any; onChange: (content: any) => void }) {
  function addFeature() {
    onChange({
      ...content,
      items: [...content.items, { icon: 'check', title: '', description: '' }],
    });
  }

  function updateFeature(index: number, field: string, value: string) {
    const newItems = [...content.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...content, items: newItems });
  }

  function removeFeature(index: number) {
    onChange({
      ...content,
      items: content.items.filter((_: any, i: number) => i !== index),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre de la section
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Nos avantages"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">Features</label>
          <button
            type="button"
            onClick={addFeature}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Ajouter une feature
          </button>
        </div>

        {content.items.map((item: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Icône (Lucide)
                  </label>
                  <input
                    type="text"
                    value={item.icon}
                    onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="check"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateFeature(index, 'title', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Titre de la feature"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Description de la feature"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTAEditor({ content, onChange }: { content: any; onChange: (content: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Titre du call-to-action"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Description courte"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte du bouton
          </label>
          <input
            type="text"
            value={content.buttonText}
            onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nous contacter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lien</label>
          <input
            type="text"
            value={content.buttonLink}
            onChange={(e) => onChange({ ...content, buttonLink: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/contact"
          />
        </div>
      </div>
    </div>
  );
}
