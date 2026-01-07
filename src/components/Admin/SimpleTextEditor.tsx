import { useState, useEffect } from 'react';
import {
  Bold, Italic, List, Link as LinkIcon,
  AlignLeft, AlignCenter, Type, X, Plus
} from 'lucide-react';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SimpleTextEditor({ value, onChange, placeholder }: SimpleTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef && value !== editorRef.innerHTML) {
      editorRef.innerHTML = value;
    }
  }, [value, editorRef]);

  const handleInput = () => {
    if (editorRef) {
      onChange(editorRef.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef) {
      onChange(editorRef.innerHTML);
    }
  };

  const insertLink = () => {
    if (linkText && linkUrl) {
      const link = `<a href="${linkUrl}" style="color: #2563eb; text-decoration: underline;">${linkText}</a>`;
      document.execCommand('insertHTML', false, link);
      setShowLinkModal(false);
      setLinkText('');
      setLinkUrl('');
      if (editorRef) {
        onChange(editorRef.innerHTML);
      }
    }
  };

  const insertVariable = (variable: string) => {
    const varSpan = `<span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-family: monospace;">{{${variable}}}</span>&nbsp;`;
    document.execCommand('insertHTML', false, varSpan);
    if (editorRef) {
      onChange(editorRef.innerHTML);
    }
  };

  const commonVariables = [
    'athlete_name',
    'event_name',
    'race_name',
    'bib_number',
    'management_code'
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Titre"
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-xs font-semibold"
          title="Paragraphe"
        >
          P
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insérer un lien"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-gray-600 font-medium">Variables :</span>
          {commonVariables.map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => insertVariable(variable)}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-mono"
              title={`Insérer {{${variable}}}`}
            >
              {variable}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={setEditorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[300px] focus:outline-none prose max-w-none"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#333'
        }}
        suppressContentEditableWarning
        placeholder={placeholder}
      />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Insérer un lien</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte du lien
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Cliquez ici"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemple.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={insertLink}
                disabled={!linkText || !linkUrl}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="bg-gray-50 border-t border-gray-300 p-3 text-xs text-gray-600">
        <p>
          <strong>Astuce :</strong> Utilisez la barre d'outils pour mettre en forme votre texte.
          Cliquez sur une variable pour l'insérer dans le texte.
          Le HTML sera généré automatiquement.
        </p>
      </div>
    </div>
  );
}
