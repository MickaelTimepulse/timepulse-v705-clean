interface AIGenerateRequest {
  prompt: string;
  context?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'marketing';
  length?: 'short' | 'medium' | 'long';
}

interface AIGenerateResponse {
  text: string;
  success: boolean;
  error?: string;
}

export async function generateText(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === '') {
    return generateFallbackContent(request);
  }

  try {
    const systemPrompt = buildSystemPrompt(request.tone, request.context);
    const userPrompt = buildUserPrompt(request.prompt, request.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(request.length),
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API error, using fallback content');
      return generateFallbackContent(request);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';

    return {
      success: true,
      text: generatedText.trim(),
    };
  } catch (error) {
    console.warn('AI generation error, using fallback:', error);
    return generateFallbackContent(request);
  }
}

function generateFallbackContent(request: AIGenerateRequest): AIGenerateResponse {
  const prompt = request.prompt.toLowerCase();
  let content = '';

  if (prompt.includes('chronométrage') || prompt.includes('chrono')) {
    content = generateChronometrageContent(request.length);
  } else if (prompt.includes('inscription') || prompt.includes('registration')) {
    content = generateInscriptionContent(request.length);
  } else if (prompt.includes('résultat') || prompt.includes('result')) {
    content = generateResultatContent(request.length);
  } else if (prompt.includes('paiement') || prompt.includes('payment')) {
    content = generatePaiementContent(request.length);
  } else if (prompt.includes('gestion') || prompt.includes('backoffice')) {
    content = generateGestionContent(request.length);
  } else if (prompt.includes('statistique') || prompt.includes('analytics')) {
    content = generateStatistiqueContent(request.length);
  } else if (prompt.includes('hero') || prompt.includes('titre')) {
    content = generateHeroContent(request.length);
  } else {
    content = generateGenericContent(request.length);
  }

  return {
    success: true,
    text: content,
  };
}

function generateChronometrageContent(length?: string): string {
  const short = "Expert en chronométrage électronique depuis 2009, Timepulse garantit des résultats précis et fiables pour tous vos événements sportifs. Notre technologie RFID de pointe et nos équipes expérimentées assurent un suivi en temps réel de chaque participant.";

  const medium = `<p>Depuis 2009, Timepulse s'impose comme un acteur majeur du chronométrage électronique en France. Notre expertise reconnue et notre technologie RFID de dernière génération garantissent des résultats d'une précision absolue.</p>

<p>Nous équipons les plus grands événements sportifs français avec un matériel professionnel et des équipes techniques hautement qualifiées. Chaque course bénéficie d'une couverture complète avec détection automatique des temps de passage et affichage instantané des classements.</p>

<p>Notre système de redondance totale assure une fiabilité maximale le jour J. Nous mettons tout en œuvre pour que votre événement soit une réussite technique, permettant aux participants de se concentrer sur leur performance.</p>`;

  const long = `<p>Depuis sa création en 2009, Timepulse s'est imposé comme une référence incontournable dans le domaine du chronométrage électronique pour événements sportifs. Fort d'une expérience de plus de 500 événements chronométrés et 200 000 participants chaque année, nous maîtrisons tous les aspects techniques du timing sportif.</p>

<p>Notre technologie RFID passive ultra-performante offre une précision au centième de seconde. Les puces sont détectées par nos tapis de dernière génération positionnés aux points stratégiques du parcours. Chaque passage est enregistré instantanément et transmis en temps réel à notre plateforme centrale.</p>

<p>L'affichage des résultats est immédiat : dès qu'un participant franchit une ligne, son temps apparaît sur les écrans géants, le site web et peut être consulté par ses proches depuis n'importe où. Cette réactivité crée une expérience immersive pour tous les acteurs de l'événement.</p>

<p>Notre approche professionnelle se distingue par une redondance totale des systèmes critiques. Chaque point de chronométrage est équipé de matériel de secours, garantissant une fiabilité absolue même dans les conditions les plus exigeantes. Nos équipes techniques interviennent sur site pour superviser l'ensemble du dispositif.</p>

<p>Au-delà de la simple mesure du temps, nous proposons un accompagnement complet : installation, paramétrages, gestion des imprévus, support technique continu et analyse post-événement. Votre tranquillité d'esprit est notre priorité.</p>`;

  return length === 'short' ? short : length === 'long' ? long : medium;
}

function generateInscriptionContent(length?: string): string {
  const short = "Notre plateforme d'inscription en ligne simplifie la gestion de vos participants. Interface intuitive, paiement sécurisé et gestion automatique des jauges pour une expérience fluide côté organisateur comme participant.";

  const medium = `<p>Offrez à vos participants une expérience d'inscription moderne et fluide. Notre plateforme optimisée permet de s'inscrire en quelques clics depuis n'importe quel appareil, mobile ou desktop.</p>

<p>La gestion des paiements est entièrement sécurisée avec conformité PCI-DSS. Les confirmations et rappels sont envoyés automatiquement par email, réduisant considérablement votre charge administrative.</p>

<p>Vous gardez le contrôle total avec des tableaux de bord détaillés, la gestion automatique des quotas par course, et la possibilité d'ajuster les tarifs selon vos périodes. Tout est pensé pour vous faire gagner du temps.</p>`;

  return length === 'short' ? short : medium;
}

function generateResultatContent(length?: string): string {
  const short = "Résultats en temps réel accessible sur écrans géants et site web. Vos participants et spectateurs suivent les performances instantanément, créant une expérience immersive et engageante.";

  const medium = `<p>Transformez votre événement en spectacle vivant grâce à l'affichage des résultats en temps réel. Dès qu'un participant franchit une ligne chronométrée, son temps et son classement sont instantanément visibles.</p>

<p>Les écrans géants sur site diffusent les classements en direct avec animations personnalisées. Simultanément, le site web permet aux proches de suivre leurs favoris depuis n'importe où dans le monde.</p>

<p>Tous les résultats sont exportables en PDF et CSV pour vos archives et communications post-événement. Les certificats de participation sont générés automatiquement.</p>`;

  return length === 'short' ? short : medium;
}

function generatePaiementContent(length?: string): string {
  const short = "Système de paiement 100% sécurisé avec cryptage SSL et conformité PCI-DSS. Protection maximale des données bancaires et validation 3D Secure pour toutes les transactions.";

  const medium = `<p>La sécurité de vos transactions est notre priorité absolue. Notre système de paiement intègre les normes les plus strictes du secteur bancaire avec un cryptage SSL 256 bits de toutes les données sensibles.</p>

<p>Nous sommes certifiés PCI-DSS et utilisons l'authentification 3D Secure pour une validation renforcée. Les coordonnées bancaires ne sont jamais stockées sur nos serveurs, garantissant une protection optimale.</p>

<p>Conformité totale au RGPD pour la protection des données personnelles. Vos participants peuvent s'inscrire en toute confiance.</p>`;

  return length === 'short' ? short : medium;
}

function generateGestionContent(length?: string): string {
  const short = "Backoffice complet pour piloter votre événement de A à Z. Gestion des inscriptions, attribution des dossards, validation des documents et statistiques en temps réel.";

  const medium = `<p>Notre backoffice organisateur vous donne un contrôle total sur tous les aspects de votre événement sportif. Interface claire et intuitive pour gérer efficacement vos participants et leurs données.</p>

<p>Attribution automatique ou manuelle des numéros de dossard, collecte et validation des certificats médicaux, gestion des catégories et des options payantes. Tous les outils essentiels sont centralisés.</p>

<p>Les tableaux de bord statistiques vous donnent une vision claire de l'évolution de vos inscriptions, des revenus et de la répartition démographique. Exportez vos données à tout moment pour vos analyses et communications.</p>`;

  return length === 'short' ? short : medium;
}

function generateStatistiqueContent(length?: string): string {
  const short = "Tableaux de bord interactifs avec analyses détaillées de vos événements. Suivez l'évolution des inscriptions, les statistiques de performance et la démographie de vos participants en temps réel.";

  const medium = `<p>Accédez à des analyses poussées de vos événements grâce à nos tableaux de bord interactifs. Toutes les données sont actualisées en temps réel pour un pilotage optimal.</p>

<p>Suivez l'évolution jour par jour de vos inscriptions, analysez les temps de passage et les allures par catégorie, visualisez la répartition géographique et démographique de vos participants.</p>

<p>Comparez vos éditions d'une année sur l'autre pour identifier les tendances et optimiser vos futures organisations. Exportez vos rapports personnalisés en quelques clics.</p>`;

  return length === 'short' ? short : medium;
}

function generateHeroContent(length?: string): string {
  return "Chronométrage professionnel et inscriptions en ligne pour vos événements sportifs";
}

function generateGenericContent(length?: string): string {
  const short = "Timepulse, votre partenaire de confiance pour la réussite de vos événements sportifs. Expertise technique, service premium et accompagnement personnalisé depuis 2009.";

  const medium = `<p>Timepulse accompagne les organisateurs d'événements sportifs avec des solutions complètes et professionnelles. Notre expertise couvre tous les aspects techniques de votre course, du chronométrage aux inscriptions en ligne.</p>

<p>Nous mettons à votre service notre expérience de plus de 15 ans dans le secteur, un matériel de pointe et des équipes passionnées. Chaque événement bénéficie d'un accompagnement personnalisé pour garantir sa réussite.</p>

<p>Faites confiance à un acteur reconnu du chronométrage français pour faire de votre prochaine course un succès technique et organisationnel.</p>`;

  return length === 'short' ? short : medium;
}

function buildSystemPrompt(tone?: string, context?: string): string {
  let prompt = `Tu es un expert en rédaction de contenu pour Timepulse, une entreprise française spécialisée dans le chronométrage d'événements sportifs depuis 2009.

CONTEXTE TIMEPULSE:
- Leader du chronométrage électronique en France
- Services: chronométrage RFID, inscriptions en ligne, résultats live, écrans géants
- Ton: ${tone === 'professional' ? 'professionnel et expert' : tone === 'casual' ? 'accessible et convivial' : tone === 'technical' ? 'technique et précis' : 'engageant et persuasif'}
- Public cible: organisateurs d'événements sportifs (courses, trails, triathlons)

${context ? `CONTEXTE ADDITIONNEL:\n${context}\n` : ''}

INSTRUCTIONS:
- Rédige en français
- Utilise des phrases claires et percutantes
- Mets en valeur l'expertise et la fiabilité de Timepulse
- Intègre des bénéfices concrets pour les organisateurs
- Évite le jargon inutile`;

  return prompt;
}

function buildUserPrompt(prompt: string, length?: string): string {
  const lengthInstructions = {
    short: 'Rédige un texte court et percutant (1-2 paragraphes, environ 50-100 mots).',
    medium: 'Rédige un texte de longueur moyenne (3-4 paragraphes, environ 150-250 mots).',
    long: 'Rédige un texte détaillé et complet (5-8 paragraphes, environ 300-500 mots).',
  };

  return `${lengthInstructions[length || 'medium']}

DEMANDE: ${prompt}

Génère uniquement le texte demandé, sans introduction ni conclusion méta. Le texte doit être directement utilisable.`;
}

function getMaxTokens(length?: string): number {
  switch (length) {
    case 'short':
      return 200;
    case 'medium':
      return 500;
    case 'long':
      return 1000;
    default:
      return 500;
  }
}

export async function improveText(text: string, instruction: string): Promise<AIGenerateResponse> {
  return generateText({
    prompt: `Améliore ce texte selon cette instruction: "${instruction}"\n\nTexte original:\n${text}`,
    tone: 'professional',
    length: 'medium',
  });
}

export async function translateText(text: string, targetLang: string): Promise<AIGenerateResponse> {
  return generateText({
    prompt: `Traduis ce texte en ${targetLang}:\n\n${text}`,
    tone: 'professional',
    length: 'medium',
  });
}

async function getOpenAIKey(): Promise<string> {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  if (envKey) {
    console.log('OpenAI key loaded from environment');
    return envKey;
  }

  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'openai_api_key')
      .maybeSingle();

    if (error) {
      console.error('Error fetching OpenAI key from database:', error);
      return '';
    }

    const key = data?.value || '';
    console.log('OpenAI key loaded from database:', key ? 'Key found' : 'No key found');
    return key;
  } catch (error) {
    console.error('Exception fetching OpenAI key:', error);
    return '';
  }
}

export async function generateSEOWithAI(params: {
  pageTitle: string;
  pageContent: string;
  shortDescription?: string;
}): Promise<{ title: string; description: string }> {
  console.log('Starting SEO generation for:', params.pageTitle);

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    console.log('OpenAI key loaded:', openaiKey ? `${openaiKey.substring(0, 20)}...` : 'NOT FOUND');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/generate-seo`;

    console.log('Calling Edge Function:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        pageTitle: params.pageTitle,
        pageContent: params.pageContent,
        shortDescription: params.shortDescription,
        openaiApiKey: openaiKey,
      }),
    });

    console.log('Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge Function error:', errorData);

      if (errorData.details?.error?.code === 'insufficient_quota') {
        throw new Error('INSUFFICIENT_QUOTA');
      }

      if (errorData.error === 'OpenAI API key not configured') {
        throw new Error('API_KEY_MISSING');
      }

      throw new Error(`Edge Function error: ${response.status}`);
    }

    const result = await response.json();
    console.log('SEO generated successfully:', result);

    return {
      title: result.title || `${params.pageTitle} | Timepulse`,
      description: result.description || params.shortDescription || '',
    };
  } catch (error: any) {
    console.error('AI SEO generation error:', error);

    if (error.message === 'INSUFFICIENT_QUOTA' || error.message === 'API_KEY_MISSING') {
      throw error;
    }

    console.warn('Using fallback SEO generation');
    return {
      title: `${params.pageTitle} - Chronométrage & Inscriptions | Timepulse`,
      description: params.shortDescription || `Découvrez ${params.pageTitle.toLowerCase()} avec Timepulse, leader du chronométrage sportif depuis 2009.`,
    };
  }
}

export const AI_SUGGESTIONS = {
  hero: [
    'Un titre accrocheur pour une page Chronométrage professionnel',
    'Un sous-titre engageant pour une page Inscriptions en ligne',
    'Une description courte et percutante pour Résultats en direct',
  ],
  section: [
    'Un paragraphe expliquant les avantages du chronométrage RFID',
    'Une introduction sur l\'importance des inscriptions en ligne pour les organisateurs',
    'Un texte sur la fiabilité et la précision des résultats Timepulse',
  ],
  features: [
    'Liste 4 avantages du chronométrage électronique pour un organisateur',
    'Décris 3 fonctionnalités clés de la plateforme d\'inscription',
    'Présente 4 bénéfices des résultats en temps réel pour les participants',
  ],
};
