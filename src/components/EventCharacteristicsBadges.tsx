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
    badge: 'px-3 py-1.5 text-xs',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    badge: 'px-4 py-2 text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    badge: 'px-5 py-2.5 text-base',
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
    <div className="flex flex-wrap gap-2.5">
      {displayCharacteristics.map((char) => {
        const Icon = ICON_MAP[char.icon] || CheckCircle;

        return (
          <div
            key={char.id}
            className={`
              inline-flex items-center gap-2 rounded-full font-semibold
              backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105
              ${sizeClass.badge}
            `}
            style={{
              background: `linear-gradient(135deg, ${char.color}15 0%, ${char.color}25 100%)`,
              border: `2px solid ${char.color}`,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
            title={char.name}
          >
            <Icon className={sizeClass.icon} style={{ color: 'white', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }} />
            <span>{char.name}</span>
          </div>
        );
      })}

      {remaining > 0 && (
        <div
          className={`
            inline-flex items-center gap-1 rounded-full font-semibold
            backdrop-blur-md shadow-lg border-2 transition-all duration-300 hover:scale-105
            ${sizeClass.badge}
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.3) 100%)',
            borderColor: 'rgba(255,255,255,0.6)',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
