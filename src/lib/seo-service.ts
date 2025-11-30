interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
}

interface GenerateSEOParams {
  pageTitle: string;
  pageContent: string;
  pageType?: 'service' | 'event' | 'homepage' | 'blog';
  shortDescription?: string;
}

export async function generateSEO(params: GenerateSEOParams): Promise<SEOData> {
  const { pageTitle, pageContent, pageType = 'service', shortDescription } = params;

  const cleanContent = stripHTML(pageContent).substring(0, 500);

  const seoTitle = generateSEOTitle(pageTitle, pageType);
  const seoDescription = generateSEODescription(pageTitle, cleanContent, shortDescription);
  const keywords = extractKeywords(pageTitle, cleanContent);

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
  };
}

function generateSEOTitle(title: string, pageType: string): string {
  const maxLength = 60;
  const suffix = ' | Timepulse';

  const templates: Record<string, string> = {
    service: `${title} - Chronométrage & Inscriptions`,
    event: `${title} - Inscription en ligne`,
    homepage: 'Timepulse - Chronométrage et inscriptions sportives',
    blog: `${title} - Blog Timepulse`,
  };

  let seoTitle = templates[pageType] || `${title}${suffix}`;

  if (seoTitle.length > maxLength) {
    const availableLength = maxLength - suffix.length - 3;
    seoTitle = title.substring(0, availableLength) + '...' + suffix;
  }

  return seoTitle;
}

function generateSEODescription(
  title: string,
  content: string,
  shortDescription?: string
): string {
  const maxLength = 160;

  if (shortDescription && shortDescription.length <= maxLength) {
    return shortDescription;
  }

  const templates = [
    `Découvrez ${title.toLowerCase()} avec Timepulse. ${content.substring(0, 100)}...`,
    `${title} : solutions professionnelles de chronométrage et inscriptions en ligne. ${content.substring(0, 80)}...`,
    `Timepulse propose ${title.toLowerCase()} pour vos événements sportifs. ${content.substring(0, 90)}...`,
  ];

  for (const template of templates) {
    if (template.length <= maxLength) {
      return template;
    }
  }

  const description = `${title} - ${content.substring(0, maxLength - title.length - 5)}...`;
  return description.substring(0, maxLength);
}

function extractKeywords(title: string, content: string): string[] {
  const commonWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'car',
    'pour', 'avec', 'sans', 'sur', 'sous', 'dans', 'par', 'en', 'de', 'du',
    'à', 'au', 'aux', 'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son',
  ]);

  const text = `${title} ${content}`.toLowerCase();

  const words = text
    .replace(/[^\wàâäéèêëïîôùûüÿæœç\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  const sortedWords = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 10);

  const defaultKeywords = [
    'chronométrage',
    'inscription',
    'course',
    'événement sportif',
    'timepulse',
  ];

  const keywords = Array.from(new Set([...sortedWords, ...defaultKeywords])).slice(0, 10);

  return keywords;
}

function stripHTML(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function validateSEO(title: string, description: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (title.length < 30) {
    warnings.push('Le titre SEO est trop court (recommandé: 30-60 caractères)');
  }
  if (title.length > 60) {
    warnings.push('Le titre SEO est trop long (recommandé: 30-60 caractères)');
  }

  if (description.length < 120) {
    warnings.push('La description est trop courte (recommandé: 120-160 caractères)');
  }
  if (description.length > 160) {
    warnings.push('La description est trop longue (recommandé: 120-160 caractères)');
  }

  if (!title.toLowerCase().includes('timepulse')) {
    warnings.push('Le titre ne contient pas le nom de la marque "Timepulse"');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
