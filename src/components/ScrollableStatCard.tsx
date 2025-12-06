import { useEffect, useState } from 'react';

interface StatItem {
  label: string;
  value: number;
  extra?: React.ReactNode;
}

interface ScrollableStatCardProps {
  title: string;
  icon: React.ReactNode;
  items: StatItem[];
  maxVisible?: number;
  scrollSpeed?: number;
}

export default function ScrollableStatCard({
  title,
  icon,
  items,
  maxVisible = 5,
  scrollSpeed = 15,
}: ScrollableStatCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const shouldScroll = items.length > maxVisible;

  const itemHeight = 32;
  const containerHeight = Math.min(items.length || 1, maxVisible) * itemHeight;

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500"></div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <p className="text-xs text-gray-400 italic">Aucune donnée disponible</p>
      </div>
    );
  }

  // Dupliquer les items pour créer un effet de boucle infinie
  const displayItems = shouldScroll ? [...items, ...items] : items;
  const totalHeight = displayItems.length * itemHeight;
  const animationDuration = totalHeight / scrollSpeed; // secondes

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500"></div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>

      <div className="relative">
        <div
          className="overflow-hidden"
          style={{ height: `${containerHeight}px` }}
        >
          <div
            className={shouldScroll && !isHovering ? 'animate-scroll-up' : ''}
            style={{
              ...(shouldScroll && !isHovering ? {
                animation: `scrollUp ${animationDuration}s linear infinite`,
              } : {})
            }}
          >
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs py-1.5 px-2 rounded hover:bg-pink-50 transition-colors group"
                style={{ height: `${itemHeight}px` }}
              >
                <span className="text-gray-600 truncate flex-1 mr-2 flex items-center gap-2 group-hover:text-pink-700 transition-colors">
                  {item.extra}
                  {item.label}
                </span>
                <span className="font-semibold text-gray-900 bg-gradient-to-r from-pink-100 to-purple-100 px-2.5 py-1 rounded-full group-hover:from-pink-200 group-hover:to-purple-200 transition-all">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {shouldScroll && (
          <>
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none z-10"></div>
          </>
        )}
      </div>

      <div className="mt-2 text-[10px] text-gray-400 italic text-center">
        {shouldScroll ? (
          <span>{isHovering ? 'Survolez pour voir plus' : `Défilement continu • ${items.length} entrées`}</span>
        ) : (
          <span>{items.length} entrée{items.length > 1 ? 's' : ''}</span>
        )}
      </div>

      <style>{`
        @keyframes scrollUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
