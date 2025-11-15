import {
  Award, Trophy, TrendingUp, RefreshCw, Mountain, Trees, PartyPopper,
  Zap, Footprints, CheckCircle, RouteIcon
} from 'lucide-react';

interface Characteristic {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
}

interface EventCharacteristicsBadgesProps {
  characteristics: Characteristic[];
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

const ICON_MAP: Record<string, any> = {
  Award,
  Trophy,
  TrendingUp,
  RefreshCw,
  Mountain,
  Trees,
  PartyPopper,
  Zap,
  Footprints,
  RouteIcon,
  CheckCircle,
};

const SIZE_CLASSES = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
  },
};

export default function EventCharacteristicsBadges({
  characteristics,
  size = 'md',
  maxDisplay
}: EventCharacteristicsBadgesProps) {
  if (!characteristics || characteristics.length === 0) {
    return null;
  }

  const displayCharacteristics = maxDisplay
    ? characteristics.slice(0, maxDisplay)
    : characteristics;

  const remaining = maxDisplay && characteristics.length > maxDisplay
    ? characteristics.length - maxDisplay
    : 0;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className="flex flex-wrap gap-2">
      {displayCharacteristics.map((char) => {
        const Icon = ICON_MAP[char.icon] || CheckCircle;

        return (
          <div
            key={char.id}
            className={`
              inline-flex items-center gap-1.5 rounded-full font-medium
              bg-white border-2 shadow-sm transition-all hover:shadow-md
              ${sizeClass.badge}
            `}
            style={{ borderColor: char.color }}
            title={char.name}
          >
            <Icon className={sizeClass.icon} style={{ color: char.color }} />
            <span style={{ color: char.color }}>{char.name}</span>
          </div>
        );
      })}

      {remaining > 0 && (
        <div
          className={`
            inline-flex items-center gap-1 rounded-full font-medium
            bg-gray-100 text-gray-700 border-2 border-gray-300
            ${sizeClass.badge}
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
