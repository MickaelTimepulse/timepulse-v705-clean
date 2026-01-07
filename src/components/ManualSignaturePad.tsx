import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

interface ManualSignaturePadProps {
  onSignatureComplete: (signatureData: string) => void;
  onClear?: () => void;
  existingSignature?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export default function ManualSignaturePad({
  onSignatureComplete,
  onClear,
  existingSignature,
  disabled = false,
  required = false
}: ManualSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (existingSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setIsEmpty(false);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (disabled) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = 'touches' in e
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e
      ? e.touches[0].clientX - rect.left
      : e.clientX - rect.left;
    const y = 'touches' in e
      ? e.touches[0].clientY - rect.top
      : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setHasSignature(false);
    if (onClear) onClear();
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const signatureData = canvas.toDataURL('image/png');
    onSignatureComplete(signatureData);
    setHasSignature(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Signature manuscrite {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          {!disabled && !isEmpty && (
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Effacer
            </button>
          )}
          {!disabled && !isEmpty && !hasSignature && (
            <button
              type="button"
              onClick={saveSignature}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Valider
            </button>
          )}
        </div>
      </div>

      <div className={`relative border-2 rounded-lg overflow-hidden ${
        disabled
          ? 'border-gray-200 bg-gray-50'
          : hasSignature
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-white'
      }`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-48 ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
        />

        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Signez ici</p>
          </div>
        )}

        {hasSignature && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-lg flex items-center gap-1">
            <Check className="w-3 h-3" />
            Signature validée
          </div>
        )}
      </div>

      {hasSignature && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Votre signature a été enregistrée avec succès
          </p>
        </div>
      )}

      {!disabled && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note :</strong> Dessinez votre signature avec votre souris ou votre doigt sur un écran tactile.
            Cliquez sur "Valider" pour enregistrer votre signature.
          </p>
        </div>
      )}
    </div>
  );
}
