import { useState } from 'react';
import {
  Bold, Italic, Link, Image, AlignLeft, AlignCenter, AlignRight,
  Eye, Code, Palette, Upload, Trash2, Settings
} from 'lucide-react';

interface EmailTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  backgroundImage?: string;
  onBackgroundImageChange: (url: string) => void;
  backgroundColor?: string;
  onBackgroundColorChange: (color: string) => void;
  opacity?: number;
  onOpacityChange: (opacity: number) => void;
}

export default function EmailTemplateEditor({
  value,
  onChange,
  subject,
  onSubjectChange,
  backgroundImage = '',
  onBackgroundImageChange,
  backgroundColor = '#ffffff',
  onBackgroundColorChange,
  opacity = 100,
  onOpacityChange
}: EmailTemplateEditorProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById('email-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const wrapSelection = (before: string, after: string) => {
    const textarea = document.getElementById('email-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (!selectedText) {
      insertAtCursor(before + 'texte' + after);
      return;
    }

    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + before.length + selectedText.length + after.length);
    }, 0);
  };

  const backgroundImageOptions = [
    { name: 'Aucune', value: '' },
    { name: 'Triathlon', value: '/triathlete.jpeg' },
    { name: 'Eclipse', value: '/solar-eclipse-hd-4k-space-585bmk4grpijoamp.jpg' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-lg p-2">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Formatting */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => wrapSelection('<strong>', '</strong>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Gras"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('<em>', '</em>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Italique"
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => wrapSelection('<div style="text-align: left;">', '</div>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Aligner à gauche"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('<div style="text-align: center;">', '</div>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Centrer"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => wrapSelection('<div style="text-align: right;">', '</div>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Aligner à droite"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Insert */}
          <div className="flex gap-1 border-r pr-2">
            <button
              onClick={() => insertAtCursor('<a href="URL" style="color: #2563eb; text-decoration: none;">Lien</a>')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Insérer un lien"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertAtCursor('<img src="URL" alt="Description" style="max-width: 100%; height: auto;" />')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Insérer une image"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>

          {/* View */}
          <div className="flex gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded ${showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Paramètres de design"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className={`p-2 rounded ${showCode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title="Mode code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="w-4 h-4 inline mr-1" />
                  Image de fond
                </label>
                <select
                  value={backgroundImage}
                  onChange={(e) => onBackgroundImageChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {backgroundImageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {backgroundImage && (
                  <div className="mt-2 relative group">
                    <img
                      src={backgroundImage}
                      alt="Aperçu"
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      onClick={() => onBackgroundImageChange('')}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Couleur de fond
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacité de l'arrière-plan : {opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => onOpacityChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Transparent</span>
                  <span>Opaque</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sujet de l'email
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
          placeholder="Sujet de l'email"
        />
      </div>

      {/* Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {showCode ? 'Code HTML' : 'Contenu de l\'email'}
        </label>
        <textarea
          id="email-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full border border-gray-300 rounded-lg px-4 py-2 ${
            showCode ? 'font-mono text-sm' : ''
          }`}
          rows={20}
          placeholder="Contenu de l'email (HTML supporté)"
        />
      </div>

      {/* Quick Snippets */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Blocs prêts à l'emploi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => insertAtCursor('\n<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 16px 0;">Titre</h1>\n')}
            className="text-xs px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100"
          >
            Titre
          </button>
          <button
            onClick={() => insertAtCursor('\n<p style="color: #4b5563; margin: 12px 0;">Paragraphe</p>\n')}
            className="text-xs px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100"
          >
            Paragraphe
          </button>
          <button
            onClick={() => insertAtCursor('\n<a href="URL" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Bouton</a>\n')}
            className="text-xs px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100"
          >
            Bouton
          </button>
          <button
            onClick={() => insertAtCursor('\n<div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;">Note importante</div>\n')}
            className="text-xs px-3 py-2 bg-white border border-blue-300 rounded hover:bg-blue-100"
          >
            Note
          </button>
        </div>
      </div>
    </div>
  );
}
