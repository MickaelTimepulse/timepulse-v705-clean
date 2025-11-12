const backgroundImages = [
  '/triathlete.jpeg'
];

export function getRandomBackgroundImage(): string {
  return backgroundImages[0];
}

export function getBackgroundImageByType(type: 'running' | 'victory' | 'swimming' | 'triathlon'): string {
  return '/triathlete.jpeg';
}

export { backgroundImages };
