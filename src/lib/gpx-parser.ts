export interface ElevationPoint {
  distance: number;
  elevation: number;
  lat: number;
  lon: number;
}

export interface GPXData {
  points: ElevationPoint[];
  totalDistance: number;
  minElevation: number;
  maxElevation: number;
  totalElevationGain: number;
  totalElevationLoss: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function parseGPXFile(file: File): Promise<GPXData> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  const trackPoints = xmlDoc.getElementsByTagName('trkpt');

  if (trackPoints.length === 0) {
    throw new Error('Aucun point de trace trouvé dans le fichier GPX');
  }

  const points: ElevationPoint[] = [];
  let cumulativeDistance = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  let previousElevation: number | null = null;

  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const lat = parseFloat(point.getAttribute('lat') || '0');
    const lon = parseFloat(point.getAttribute('lon') || '0');
    const eleElement = point.getElementsByTagName('ele')[0];
    const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0;

    if (i > 0) {
      const prevPoint = points[i - 1];
      const distance = calculateDistance(prevPoint.lat, prevPoint.lon, lat, lon);
      cumulativeDistance += distance;
    }

    if (previousElevation !== null) {
      const elevationDiff = elevation - previousElevation;
      if (elevationDiff > 0) {
        totalElevationGain += elevationDiff;
      } else {
        totalElevationLoss += Math.abs(elevationDiff);
      }
    }

    minElevation = Math.min(minElevation, elevation);
    maxElevation = Math.max(maxElevation, elevation);
    previousElevation = elevation;

    points.push({
      distance: cumulativeDistance,
      elevation,
      lat,
      lon,
    });
  }

  const sampledPoints: ElevationPoint[] = [];
  const targetPoints = 200;
  const step = Math.max(1, Math.floor(points.length / targetPoints));

  for (let i = 0; i < points.length; i += step) {
    sampledPoints.push(points[i]);
  }

  if (sampledPoints[sampledPoints.length - 1] !== points[points.length - 1]) {
    sampledPoints.push(points[points.length - 1]);
  }

  return {
    points: sampledPoints,
    totalDistance: cumulativeDistance,
    minElevation,
    maxElevation,
    totalElevationGain: Math.round(totalElevationGain),
    totalElevationLoss: Math.round(totalElevationLoss),
  };
}
