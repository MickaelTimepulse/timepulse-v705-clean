import { Mountain, TrendingUp, TrendingDown } from 'lucide-react';
import type { GPXData } from '../lib/gpx-parser';

interface ElevationProfileProps {
  data: GPXData;
  className?: string;
  height?: number;
  compact?: boolean;
}

export default function ElevationProfile({ data, className = '', height: customHeight, compact = false }: ElevationProfileProps) {
  const width = 800;
  const height = customHeight || 300;
  const padding = compact
    ? { top: 20, right: 20, bottom: 30, left: 40 }
    : { top: 40, right: 40, bottom: 50, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const elevationRange = data.maxElevation - data.minElevation;
  const elevationPadding = elevationRange * 0.1;

  const minY = data.minElevation - elevationPadding;
  const maxY = data.maxElevation + elevationPadding;
  const rangeY = maxY - minY;

  const points = data.points.map((point) => ({
    x: padding.left + (point.distance / data.totalDistance) * chartWidth,
    y: padding.top + chartHeight - ((point.elevation - minY) / rangeY) * chartHeight,
  }));

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x},${height - padding.bottom}` +
    ` L ${padding.left},${height - padding.bottom} Z`;

  const xTicks = 5;
  const yTicks = 5;

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1 text-red-400">
            <TrendingUp className="w-3 h-3" />
            <span className="font-semibold">D+ {data.totalElevationGain}m</span>
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <TrendingDown className="w-3 h-3" />
            <span className="font-semibold">D- {data.totalElevationLoss}m</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path d={areaD} fill="url(#elevationGradient)" />
            <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Mountain className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">Profil d'altitude</h3>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Distance totale</div>
            <div className="text-xl font-bold text-gray-900">
              {data.totalDistance.toFixed(2)} km
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Dénivelé positif</div>
            <div className="text-xl font-bold text-green-600">
              +{data.totalElevationGain} m
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Altitude min</div>
            <div className="text-xl font-bold text-blue-600">
              {Math.round(data.minElevation)} m
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Altitude max</div>
            <div className="text-xl font-bold text-orange-600">
              {Math.round(data.maxElevation)} m
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <defs>
              <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {Array.from({ length: yTicks }).map((_, i) => {
              const y = padding.top + (chartHeight / (yTicks - 1)) * i;
              const elevation = maxY - (rangeY / (yTicks - 1)) * i;
              return (
                <g key={`y-tick-${i}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600"
                  >
                    {Math.round(elevation)}m
                  </text>
                </g>
              );
            })}

            {Array.from({ length: xTicks }).map((_, i) => {
              const x = padding.left + (chartWidth / (xTicks - 1)) * i;
              const distance = (data.totalDistance / (xTicks - 1)) * i;
              return (
                <g key={`x-tick-${i}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {distance.toFixed(1)}km
                  </text>
                </g>
              );
            })}

            <path d={areaD} fill="url(#elevationGradient)" />

            <path d={pathD} fill="none" stroke="#ec4899" strokeWidth="2" />

            <rect
              x={padding.left}
              y={padding.top}
              width={chartWidth}
              height={chartHeight}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1"
            />
          </svg>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Distance (km)
        </div>
      </div>
    </div>
  );
}
