import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Move, Type, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { CertificateVariable, AVAILABLE_VARIABLES, PROFESSIONAL_FONTS } from '../lib/certificate-generator';

interface CertificateEditorProps {
  templateImageUrl: string;
  variables: CertificateVariable[];
  onChange: (variables: CertificateVariable[]) => void;
}

export default function CertificateEditor({ templateImageUrl, variables, onChange }: CertificateEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [previewMode, setPreviewMode] = useState<'labels' | 'athlete'>('labels');
  const [flagUrl, setFlagUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // Charger l'image pour obtenir ses dimensions
    const img = new Image();
    img.onload = () => {
      if (mounted) {
        setImageSize({ width: img.width, height: img.height });
      }
    };
    img.onerror = () => {
      if (mounted) {
        console.error('Failed to load template image');
      }
    };
    img.src = templateImageUrl;

    return () => {
      mounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [templateImageUrl]);

  // Charger le drapeau quand on est en mode aperçu athlète
  useEffect(() => {
    let mounted = true;
    let flagImage: HTMLImageElement | null = null;

    if (previewMode === 'athlete') {
      // Charger le drapeau français pour l'aperçu
      const countryCode = 'fr'; // France pour Sébastien HALLIGAN
      flagImage = new Image();

      const handleLoad = () => {
        if (mounted) {
          setFlagUrl(`https://flagcdn.com/w80/${countryCode}.png`);
        }
      };

      const handleError = () => {
        if (mounted) {
          console.error('Failed to load flag image');
          setFlagUrl(null);
        }
      };

      flagImage.addEventListener('load', handleLoad);
      flagImage.addEventListener('error', handleError);
      flagImage.src = `https://flagcdn.com/w80/${countryCode}.png`;

      return () => {
        mounted = false;
        if (flagImage) {
          flagImage.removeEventListener('load', handleLoad);
          flagImage.removeEventListener('error', handleError);
        }
      };
    } else {
      if (mounted) {
        setFlagUrl(null);
      }
    }

    return () => {
      mounted = false;
    };
  }, [previewMode]);

  const addVariable = (field: string) => {
    const varDef = AVAILABLE_VARIABLES.find(v => v.field === field);
    if (!varDef) return;

    const isFlag = varDef.type === 'flag';

    const newVariable: CertificateVariable = {
      id: `var_${Date.now()}`,
      label: varDef.label,
      field: varDef.field,
      type: varDef.type || 'text',
      x: 400,
      y: 400,
      fontSize: isFlag ? 40 : 48,
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      bold: true,
      width: isFlag ? 40 : undefined,
      height: isFlag ? 40 : undefined
    };

    onChange([...variables, newVariable]);
  };

  const updateVariable = (id: string, updates: Partial<CertificateVariable>) => {
    onChange(variables.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVariable = (id: string) => {
    onChange(variables.filter(v => v.id !== id));
    if (selectedVariable === id) {
      setSelectedVariable(null);
    }
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedVariable(id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedVariable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    updateVariable(selectedVariable, { x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fonction pour obtenir la valeur d'aperçu (fictive ou label)
  const getPreviewValue = (variable: CertificateVariable): string => {
    if (previewMode === 'labels') {
      return variable.label;
    }

    // Mode aperçu athlète avec données fictives
    const mockData: Record<string, string> = {
      'athlete_name': 'Sébastien HALLIGAN',
      'finish_time': '02:37:20',
      'chip_time': '02:36:45',
      'rank_scratch': '238ème',
      'rank_gender': '198ème',
      'rank_category': '56ème',
      'race_name': 'Marathon de Carquefou',
      'race_distance': '42.195 km',
      'event_name': 'Les Foulées de Carquefou',
      'event_date': '15 Décembre 2025',
      'gender': 'Homme',
      'category': 'M2',
      'bib_number': '2745',
      'club': 'AC Carquefou',
      'nationality': 'France'
    };

    return mockData[variable.field] || variable.label;
  };

  const selected = variables.find(v => v.id === selectedVariable);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Zone de prévisualisation */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Prévisualisation</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode('labels')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'labels'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mode Éditeur
              </button>
              <button
                onClick={() => setPreviewMode('athlete')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'athlete'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aperçu Athlète
              </button>
            </div>
          </div>
          <div
            ref={canvasRef}
            className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-crosshair"
            style={{
              aspectRatio: imageSize.width && imageSize.height
                ? `${imageSize.width}/${imageSize.height}`
                : '1/1'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Image de fond */}
            <img
              src={templateImageUrl}
              alt="Template"
              className="w-full h-full object-contain"
              draggable={false}
            />

            {/* Quadrillage d'aide au positionnement */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: 0.2 }}
            >
              <defs>
                <pattern
                  id="grid"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Lignes de repère centrales */}
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Affichage des variables */}
            {variables.map(variable => {
              const scaleX = canvasRef.current ? canvasRef.current.getBoundingClientRect().width / imageSize.width : 1;
              const scaleY = canvasRef.current ? canvasRef.current.getBoundingClientRect().height / imageSize.height : 1;

              if (variable.type === 'flag') {
                const width = (variable.width || 40) * scaleX;
                const height = (variable.height || 40) * scaleY;

                // Le canvas centre le drapeau autour du point (X, Y)
                // On doit donc décaler de -width/2 et -height/2 pour correspondre
                return (
                  <div
                    key={variable.id}
                    className={`absolute cursor-move ${selectedVariable === variable.id ? 'ring-2 ring-pink-500' : ''}`}
                    style={{
                      left: `${variable.x * scaleX - width/2}px`,
                      top: `${variable.y * scaleY - height/2}px`,
                      width: `${width}px`,
                      height: `${height}px`
                    }}
                    onMouseDown={(e) => handleMouseDown(variable.id, e)}
                  >
                    {previewMode === 'athlete' && flagUrl ? (
                      <img
                        src={flagUrl}
                        alt="Drapeau"
                        className="w-full h-full object-cover rounded-full border-2 border-gray-300"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 border-2 border-gray-400 flex items-center justify-center text-xs">
                        🏁
                      </div>
                    )}
                  </div>
                );
              }

              // Utiliser la famille de police complète si disponible
              const fontInfo = PROFESSIONAL_FONTS.find(f => f.name === variable.fontFamily);
              const fontFamily = fontInfo ? fontInfo.family : variable.fontFamily;

              // Calculer le décalage pour correspondre au comportement du Canvas
              // Canvas avec textAlign 'center' centre le texte AUTOUR du point X
              // CSS avec textAlign 'center' centre le texte A PARTIR du point X
              let transformValue = '';
              if (variable.align === 'center') {
                transformValue = 'translateX(-50%)';
              } else if (variable.align === 'right') {
                transformValue = 'translateX(-100%)';
              }

              // Construire le style avec les effets
              const textStyle: React.CSSProperties = {
                left: `${variable.x * scaleX}px`,
                top: `${variable.y * scaleY}px`,
                fontSize: `${variable.fontSize * scaleY}px`,
                fontFamily: fontFamily,
                color: variable.color,
                fontWeight: variable.bold ? 'bold' : 'normal',
                textAlign: 'left', // Toujours left, on gère l'alignement avec transform
                whiteSpace: 'nowrap',
                transform: transformValue
              };

              // Ajouter l'effet d'ombre si défini
              if (variable.shadowBlur && variable.shadowBlur > 0) {
                textStyle.textShadow = `${variable.shadowOffsetX || 0}px ${variable.shadowOffsetY || 2}px ${variable.shadowBlur}px ${variable.shadowColor || 'rgba(0,0,0,0.5)'}`;
              }

              // Ajouter l'effet de contour si défini
              if (variable.strokeWidth && variable.strokeWidth > 0) {
                textStyle.WebkitTextStroke = `${variable.strokeWidth}px ${variable.strokeColor || '#ffffff'}`;
                textStyle.paintOrder = 'stroke fill';
              }

              return (
                <div
                  key={variable.id}
                  className={`absolute cursor-move ${selectedVariable === variable.id ? 'ring-2 ring-pink-500' : ''}`}
                  style={textStyle}
                  onMouseDown={(e) => handleMouseDown(variable.id, e)}
                >
                  {getPreviewValue(variable)}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Move className="w-4 h-4" />
            <span>Cliquez et déplacez les variables pour les positionner</span>
          </div>
        </div>
      </div>

      {/* Panneau de configuration */}
      <div className="space-y-6">
        {/* Ajout de variables */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter une variable
          </h3>
          <div className="space-y-2">
            {AVAILABLE_VARIABLES.map(varDef => (
              <button
                key={varDef.id}
                onClick={() => addVariable(varDef.field)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-pink-50 rounded-lg transition-colors"
                disabled={variables.some(v => v.field === varDef.field)}
              >
                {varDef.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des variables actives */}
        {variables.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Variables actives ({variables.length})
            </h3>
            <div className="space-y-2">
              {variables.map(variable => (
                <div
                  key={variable.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    selectedVariable === variable.id
                      ? 'bg-pink-50 border-2 border-pink-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedVariable(variable.id)}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {variable.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {variable.fontSize}px • {variable.fontFamily}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteVariable(variable.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors ml-2"
                    title="Supprimer cette variable"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration de la variable sélectionnée */}
        {selected && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selected.label}
              </h3>
              <button
                onClick={() => deleteVariable(selected.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Taille (pour texte ou image) */}
              {selected.type === 'flag' ? (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Type className="w-4 h-4" />
                    Taille du drapeau
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={selected.width || 40}
                    onChange={(e) => updateVariable(selected.id, {
                      width: parseInt(e.target.value),
                      height: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {selected.width || 40} x {selected.height || 40}px
                  </div>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Type className="w-4 h-4" />
                    Taille
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={selected.fontSize}
                  onChange={(e) => updateVariable(selected.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
                  <div className="text-sm text-gray-600 mt-1">{selected.fontSize}px</div>
                </div>
              )}

              {/* Police (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police
                  </label>
                  <select
                    value={selected.fontFamily}
                    onChange={(e) => updateVariable(selected.id, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    style={{ fontFamily: selected.fontFamily }}
                  >
                    {PROFESSIONAL_FONTS.map(font => (
                      <option
                        key={font.name}
                        value={font.name}
                        style={{ fontFamily: font.family }}
                      >
                        {font.name} {font.category && `• ${font.category}`}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {PROFESSIONAL_FONTS.find(f => f.name === selected.fontFamily)?.category || 'Police système'}
                  </div>
                </div>
              )}

              {/* Couleur (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4" />
                    Couleur
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateVariable(selected.id, { color: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selected.color}
                      onChange={(e) => updateVariable(selected.id, { color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Alignement (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alignement
                  </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateVariable(selected.id, { align: 'left' })}
                    className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                      selected.align === 'left'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <AlignLeft className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => updateVariable(selected.id, { align: 'center' })}
                    className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                      selected.align === 'center'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <AlignCenter className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => updateVariable(selected.id, { align: 'right' })}
                    className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                      selected.align === 'right'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <AlignRight className="w-5 h-5 mx-auto" />
                  </button>
                  </div>
                </div>
              )}

              {/* Gras (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bold"
                    checked={selected.bold}
                    onChange={(e) => updateVariable(selected.id, { bold: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                  />
                  <label htmlFor="bold" className="text-sm font-medium text-gray-700">
                    Gras
                  </label>
                </div>
              )}

              {/* Effet Ombre (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900">Effet Ombre</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intensité de l'ombre
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={selected.shadowBlur || 0}
                      onChange={(e) => updateVariable(selected.id, { shadowBlur: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {selected.shadowBlur || 0}px
                    </div>
                  </div>

                  {(selected.shadowBlur || 0) > 0 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Couleur de l'ombre
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selected.shadowColor || '#000000'}
                            onChange={(e) => updateVariable(selected.id, { shadowColor: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selected.shadowColor || '#000000'}
                            onChange={(e) => updateVariable(selected.id, { shadowColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Décalage X
                          </label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            value={selected.shadowOffsetX || 0}
                            onChange={(e) => updateVariable(selected.id, { shadowOffsetX: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-xs text-gray-500 text-center">{selected.shadowOffsetX || 0}px</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Décalage Y
                          </label>
                          <input
                            type="range"
                            min="-10"
                            max="10"
                            value={selected.shadowOffsetY || 0}
                            onChange={(e) => updateVariable(selected.id, { shadowOffsetY: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <div className="text-xs text-gray-500 text-center">{selected.shadowOffsetY || 0}px</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Effet Contour Brillant (seulement pour le texte) */}
              {selected.type !== 'flag' && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900">Contour Brillant</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épaisseur du contour
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={selected.strokeWidth || 0}
                      onChange={(e) => updateVariable(selected.id, { strokeWidth: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {selected.strokeWidth || 0}px
                    </div>
                  </div>

                  {(selected.strokeWidth || 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur du contour
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selected.strokeColor || '#ffffff'}
                          onChange={(e) => updateVariable(selected.id, { strokeColor: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selected.strokeColor || '#ffffff'}
                          onChange={(e) => updateVariable(selected.id, { strokeColor: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X
                  </label>
                  <input
                    type="number"
                    value={Math.round(selected.x)}
                    onChange={(e) => updateVariable(selected.id, { x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y
                  </label>
                  <input
                    type="number"
                    value={Math.round(selected.y)}
                    onChange={(e) => updateVariable(selected.id, { y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
