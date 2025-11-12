# CMS Timepulse - Zod Schemas pour Blocks

## Block Props Validation par Type

```typescript
// lib/cms/block-schemas.ts
import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1, "Alt text requis pour l'accessibilité"),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  focalPoint: z.object({ x: z.number(), y: z.number() }).optional(),
});

const linkSchema = z.object({
  text: z.string().min(1),
  href: z.string().min(1),
  target: z.enum(['_self', '_blank']).default('_self'),
  rel: z.string().optional(),
});

const buttonSchema = z.object({
  text: z.string().min(1).max(50),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  icon: z.string().optional(),
});

const visibilitySchema = z.object({
  breakpoints: z.object({
    mobile: z.boolean().default(true),
    tablet: z.boolean().default(true),
    desktop: z.boolean().default(true),
  }).optional(),
  audience: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
});

// ==================== HERO BLOCK ====================

export const heroBlockPropsSchema = z.object({
  variant: z.enum(['default', 'split', 'centered', 'video']).default('default'),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(500).optional(),
  image: imageSchema.optional(),
  video: z.object({
    url: z.string().url(),
    poster: z.string().url().optional(),
    autoplay: z.boolean().default(false),
    loop: z.boolean().default(true),
    muted: z.boolean().default(true),
  }).optional(),
  buttons: z.array(buttonSchema).max(3),
  badges: z.array(z.object({
    text: z.string(),
    variant: z.enum(['info', 'success', 'warning']),
  })).max(2).optional(),
  backgroundGradient: z.object({
    from: z.string(),
    to: z.string(),
    direction: z.enum(['to-r', 'to-br', 'to-b']),
  }).optional(),
  animation: z.enum(['fade', 'slide', 'zoom', 'none']).default('fade'),
});

// Example valid hero props
export const heroExample = {
  variant: 'split',
  eyebrow: 'Chronométrage professionnel',
  title: 'La précision au service de vos événements sportifs',
  subtitle: 'Depuis 2009, Timepulse accompagne les organisateurs avec des solutions complètes',
  image: {
    url: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg',
    alt: 'Athlètes au départ d\'une course',
  },
  buttons: [
    { text: 'Demander un devis', href: '/contact', variant: 'primary' },
    { text: 'Nos services', href: '/services', variant: 'outline' },
  ],
};

// ==================== FEATURES BLOCK ====================

export const featuresBlockPropsSchema = z.object({
  variant: z.enum(['grid', 'list', 'cards', 'timeline']).default('grid'),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  columns: z.enum(['2', '3', '4']).default('3'),
  features: z.array(z.object({
    icon: z.string(),
    title: z.string().min(3).max(80),
    description: z.string().min(10).max(300),
    link: linkSchema.optional(),
    image: imageSchema.optional(),
    stats: z.object({
      value: z.string(),
      label: z.string(),
    }).optional(),
  })).min(1).max(12),
  centerAlign: z.boolean().default(false),
});

export const featuresExample = {
  variant: 'grid',
  title: 'Un écosystème complet pour vos événements',
  columns: '3',
  features: [
    {
      icon: 'timer',
      title: 'Chronométrage électronique',
      description: 'Puces RFID, tapis de détection, résultats en temps réel avec précision au centième',
    },
    {
      icon: 'users',
      title: 'Inscriptions en ligne',
      description: 'Plateforme intuitive, paiement sécurisé, gestion automatisée des participants',
    },
    {
      icon: 'monitor',
      title: 'Écrans géants',
      description: 'Affichage live des classements, animations graphiques et sonores professionnelles',
    },
  ],
};

// ==================== PRICING BLOCK ====================

export const pricingBlockPropsSchema = z.object({
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  billingPeriod: z.enum(['monthly', 'yearly', 'both']).default('both'),
  plans: z.array(z.object({
    id: z.string(),
    name: z.string().min(2).max(50),
    description: z.string().max(200).optional(),
    price: z.number().nonnegative(),
    currency: z.enum(['EUR', 'USD']).default('EUR'),
    interval: z.enum(['month', 'year', 'event']),
    featured: z.boolean().default(false),
    features: z.array(z.object({
      text: z.string(),
      included: z.boolean(),
      tooltip: z.string().optional(),
    })),
    button: buttonSchema,
  })).min(1).max(5),
});

export const pricingExample = {
  title: 'Tarifs adaptés à votre événement',
  description: 'Solutions flexibles selon la taille et les besoins',
  billingPeriod: 'both',
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Pour les petits événements',
      price: 500,
      currency: 'EUR',
      interval: 'event',
      features: [
        { text: 'Jusqu\'à 500 participants', included: true },
        { text: 'Chronométrage RFID', included: true },
        { text: 'Résultats en ligne', included: true },
        { text: 'Écrans géants', included: false },
      ],
      button: { text: 'Choisir Starter', href: '/contact?plan=starter', variant: 'outline' },
    },
  ],
};

// ==================== STEPS BLOCK ====================

export const stepsBlockPropsSchema = z.object({
  variant: z.enum(['vertical', 'horizontal', 'cards']).default('vertical'),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    number: z.number().int().positive(),
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(400),
    icon: z.string().optional(),
    image: imageSchema.optional(),
    duration: z.string().optional(),
  })).min(2).max(8),
});

export const stepsExample = {
  variant: 'vertical',
  title: 'Comment organiser votre événement avec Timepulse',
  steps: [
    {
      number: 1,
      title: 'Demande de devis',
      description: 'Décrivez votre événement et recevez une proposition personnalisée sous 48h',
      icon: 'mail',
      duration: '2 jours',
    },
    {
      number: 2,
      title: 'Préparation technique',
      description: 'Notre équipe configure le chronométrage et prépare tous les équipements',
      icon: 'settings',
      duration: '1 semaine',
    },
    {
      number: 3,
      title: 'Jour J',
      description: 'Installation sur site, chronométrage en direct et affichage live des résultats',
      icon: 'zap',
      duration: 'Event day',
    },
  ],
};

// ==================== STATS BLOCK ====================

export const statsBlockPropsSchema = z.object({
  variant: z.enum(['simple', 'cards', 'highlighted']).default('simple'),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120).optional(),
  stats: z.array(z.object({
    value: z.string().min(1).max(20),
    label: z.string().min(2).max(100),
    description: z.string().max(200).optional(),
    icon: z.string().optional(),
    suffix: z.string().optional(),
    prefix: z.string().optional(),
  })).min(2).max(6),
  layout: z.enum(['row', 'grid']).default('row'),
});

export const statsExample = {
  variant: 'highlighted',
  title: 'Timepulse en chiffres',
  stats: [
    { value: '15', label: 'Années d\'expérience', suffix: 'ans', icon: 'calendar' },
    { value: '500', label: 'Événements chronométrés', suffix: '+', icon: 'trophy' },
    { value: '200K', label: 'Participants inscrits', suffix: '+', icon: 'users' },
    { value: '99.9', label: 'Fiabilité', suffix: '%', icon: 'shield-check' },
  ],
  layout: 'grid',
};

// ==================== LOGOS BLOCK ====================

export const logosBlockPropsSchema = z.object({
  eyebrow: z.string().max(100).optional(),
  title: z.string().max(120).optional(),
  logos: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    link: z.string().url().optional(),
  })).min(3).max(20),
  variant: z.enum(['default', 'carousel', 'grid']).default('default'),
  grayscale: z.boolean().default(true),
});

export const logosExample = {
  title: 'Ils nous font confiance',
  logos: [
    { name: 'Marathon de Paris', url: '/logos/marathon-paris.svg' },
    { name: 'UTMB', url: '/logos/utmb.svg' },
    { name: 'Ironman', url: '/logos/ironman.svg' },
  ],
  grayscale: true,
};

// ==================== MEDIA BLOCK ====================

export const mediaBlockPropsSchema = z.object({
  type: z.enum(['image', 'video', 'gallery', 'embed']),
  image: imageSchema.optional(),
  video: z.object({
    url: z.string().url(),
    provider: z.enum(['youtube', 'vimeo', 'custom']),
    poster: z.string().url().optional(),
    autoplay: z.boolean().default(false),
  }).optional(),
  gallery: z.array(imageSchema).max(20).optional(),
  embed: z.object({
    html: z.string(),
    aspectRatio: z.string().default('16/9'),
  }).optional(),
  caption: z.string().max(300).optional(),
  aspectRatio: z.enum(['16/9', '4/3', '1/1', '21/9']).default('16/9'),
  rounded: z.boolean().default(true),
  shadow: z.boolean().default(true),
});

export const mediaExample = {
  type: 'video',
  video: {
    url: 'https://www.youtube.com/watch?v=example',
    provider: 'youtube',
    poster: 'https://images.pexels.com/photos/runner.jpg',
  },
  caption: 'Reportage vidéo du Marathon de Paris 2024',
  aspectRatio: '16/9',
};

// ==================== CASE TEASER BLOCK ====================

export const caseTeaserBlockPropsSchema = z.object({
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  cases: z.array(z.object({
    id: z.string(),
    title: z.string().min(5).max(100),
    excerpt: z.string().min(20).max(300),
    image: imageSchema,
    category: z.string(),
    date: z.string().optional(),
    tags: z.array(z.string()).max(5).optional(),
    link: z.string().url(),
    stats: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).max(3).optional(),
  })).min(1).max(6),
  layout: z.enum(['grid', 'list', 'carousel']).default('grid'),
});

export const caseTeaserExample = {
  title: 'Nos réalisations récentes',
  layout: 'grid',
  cases: [
    {
      id: 'marathon-paris-2024',
      title: 'Marathon de Paris 2024',
      excerpt: 'Chronométrage de 50 000 participants avec affichage live sur 20 écrans géants',
      image: {
        url: 'https://images.pexels.com/photos/2524739/pexels-photo-2524739.jpeg',
        alt: 'Marathon de Paris',
      },
      category: 'Running',
      tags: ['Marathon', 'Chronométrage', 'Écrans'],
      link: '/cases/marathon-paris-2024',
      stats: [
        { label: 'Participants', value: '50K' },
        { label: 'Écrans', value: '20' },
      ],
    },
  ],
};

// ==================== CTA BLOCK ====================

export const ctaBlockPropsSchema = z.object({
  variant: z.enum(['default', 'bordered', 'split', 'centered']).default('default'),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  buttons: z.array(buttonSchema).min(1).max(3),
  image: imageSchema.optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

export const ctaExample = {
  variant: 'centered',
  title: 'Prêt à organiser votre prochain événement ?',
  description: 'Contactez-nous pour un devis personnalisé et découvrez nos solutions',
  buttons: [
    { text: 'Demander un devis', href: '/contact', variant: 'primary', size: 'lg' },
  ],
};

// ==================== FAQ BLOCK ====================

export const faqBlockPropsSchema = z.object({
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  questions: z.array(z.object({
    id: z.string(),
    question: z.string().min(10).max(200),
    answer: z.string().min(20).max(1000),
    category: z.string().optional(),
  })).min(3).max(20),
  variant: z.enum(['accordion', 'grid']).default('accordion'),
  defaultOpen: z.boolean().default(false),
});

export const faqExample = {
  title: 'Questions fréquentes',
  variant: 'accordion',
  questions: [
    {
      id: 'q1',
      question: 'Quel est le délai pour organiser un événement ?',
      answer: 'Nous recommandons de nous contacter au moins 3 mois avant votre événement pour une préparation optimale.',
      category: 'Général',
    },
    {
      id: 'q2',
      question: 'Quels types d\'événements chronométrez-vous ?',
      answer: 'Courses sur route, trails, triathlons, swimruns, cyclisme, marche nordique, et tout événement sportif nécessitant un chronométrage professionnel.',
      category: 'Services',
    },
  ],
};

// ==================== RICHTEXT BLOCK ====================

export const richtextBlockPropsSchema = z.object({
  content: z.string().min(10),
  format: z.enum(['html', 'markdown']).default('html'),
  maxWidth: z.enum(['full', 'prose', 'narrow']).default('prose'),
  textAlign: z.enum(['left', 'center', 'right']).default('left'),
});

export const richtextExample = {
  content: '<h2>À propos de Timepulse</h2><p>Depuis 2009, nous accompagnons les organisateurs...</p>',
  format: 'html',
  maxWidth: 'prose',
};

// ==================== FORM BLOCK ====================

export const formBlockPropsSchema = z.object({
  formId: z.string().cuid(),
  eyebrow: z.string().max(100).optional(),
  title: z.string().min(5).max(120),
  description: z.string().max(500).optional(),
  submitButtonText: z.string().max(50).default('Envoyer'),
  successMessage: z.string().max(300).default('Merci, nous vous répondrons sous 48h'),
  layout: z.enum(['inline', 'stacked']).default('stacked'),
});

export const formExample = {
  formId: 'clxxx123456',
  title: 'Demander un devis',
  description: 'Décrivez votre événement et nous vous répondrons rapidement',
  submitButtonText: 'Envoyer ma demande',
};

// ==================== MAP BLOCK ====================

export const mapBlockPropsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  zoom: z.number().int().min(1).max(20).default(12),
  markers: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    title: z.string(),
    description: z.string().optional(),
  })).optional(),
  height: z.number().int().min(200).max(800).default(400),
  interactive: z.boolean().default(true),
});

export const mapExample = {
  latitude: 48.8566,
  longitude: 2.3522,
  zoom: 13,
  markers: [
    { lat: 48.8566, lng: 2.3522, title: 'Timepulse HQ', description: 'Notre siège à Paris' },
  ],
  height: 400,
};

// ==================== BLOCK UNION SCHEMA ====================

export const blockPropsSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HERO'), props: heroBlockPropsSchema }),
  z.object({ type: z.literal('FEATURES'), props: featuresBlockPropsSchema }),
  z.object({ type: z.literal('PRICING'), props: pricingBlockPropsSchema }),
  z.object({ type: z.literal('STEPS'), props: stepsBlockPropsSchema }),
  z.object({ type: z.literal('STATS'), props: statsBlockPropsSchema }),
  z.object({ type: z.literal('LOGOS'), props: logosBlockPropsSchema }),
  z.object({ type: z.literal('MEDIA'), props: mediaBlockPropsSchema }),
  z.object({ type: z.literal('CASE_TEASER'), props: caseTeaserBlockPropsSchema }),
  z.object({ type: z.literal('CTA'), props: ctaBlockPropsSchema }),
  z.object({ type: z.literal('FAQ'), props: faqBlockPropsSchema }),
  z.object({ type: z.literal('RICHTEXT'), props: richtextBlockPropsSchema }),
  z.object({ type: z.literal('FORM'), props: formBlockPropsSchema }),
  z.object({ type: z.literal('MAP'), props: mapBlockPropsSchema }),
]);

// ==================== VALIDATION HELPER ====================

export function validateBlockProps(blockType: string, props: unknown) {
  const schema = blockPropsSchema.parse({ type: blockType, props });
  return schema.props;
}
```
