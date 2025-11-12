export type SportType = 'running' | 'trail' | 'triathlon' | 'swimming' | 'cycling' | 'duathlon' | 'swimrun' | 'other';

export const SPORT_LABELS: Record<SportType, string> = {
  running: 'Course sur route',
  trail: 'Trail',
  triathlon: 'Triathlon',
  swimming: 'Natation',
  cycling: 'Cyclisme',
  duathlon: 'Duathlon',
  swimrun: 'Swimrun',
  other: 'Autre',
};

export const DEFAULT_SPORT_IMAGES: Record<SportType, string> = {
  running: 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1200',
  trail: 'https://images.pexels.com/photos/2524739/pexels-photo-2524739.jpeg?auto=compress&cs=tinysrgb&w=1200',
  triathlon: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1200',
  swimming: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1200',
  cycling: 'https://images.pexels.com/photos/221161/pexels-photo-221161.jpeg?auto=compress&cs=tinysrgb&w=1200',
  duathlon: 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=1200',
  swimrun: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1200',
  other: 'https://images.pexels.com/photos/248547/pexels-photo-248547.jpeg?auto=compress&cs=tinysrgb&w=1200',
};

export function getSportImage(sportType: SportType, customImage?: string | null): string {
  if (customImage) {
    return customImage;
  }
  return DEFAULT_SPORT_IMAGES[sportType] || DEFAULT_SPORT_IMAGES.other;
}

export function getSportLabel(sportType: SportType, customSportType?: string | null): string {
  if (sportType === 'other' && customSportType) {
    return customSportType;
  }
  return SPORT_LABELS[sportType] || SPORT_LABELS.other;
}
