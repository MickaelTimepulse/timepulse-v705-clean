import { useState, useRef, useEffect } from 'react';
import { Move } from 'lucide-react';

interface ImagePositionEditorProps {
  imageUrl: string;
  positionX: number;
  positionY: number;
  onPositionChange: (x: number, y: number) => void;
}

export default function ImagePositionEditor({
  imageUrl,
  positionX,
  positionY,
  onPositionChange,
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tempPosition, setTempPosition] = useState({ x: positionX, y: positionY });

  useEffect(() => {
    setTempPosition({ x: positionX, y: positionY });
  }, [positionX, positionY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setTempPosition({ x: clampedX, y: clampedY });
    onPositionChange(clampedX, clampedY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Position de l'image
      </label>
      <div
        ref={containerRef}
        className={`relative h-64 rounded-lg overflow-hidden border-2 ${
          isDragging ? 'border-pink-500 cursor-grabbing' : 'border-gray-300 cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-cover pointer-events-none select-none"
          style={{
            objectPosition: `${tempPosition.x}% ${tempPosition.y}%`,
          }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none">
          <div
            className="absolute w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${tempPosition.x}%`,
              top: `${tempPosition.y}%`,
            }}
          >
            <Move className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Cliquez et faites glisser l'image pour ajuster la zone visible
      </p>
    </div>
  );
}
