import { supabase } from './supabase';

export interface CertificateVariable {
  id: string;
  label: string;
  field: string;
  type?: 'text' | 'flag';
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  width?: number;
  height?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeWidth?: number;
  strokeColor?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template_image_url: string;
  race_id?: string;
  is_active: boolean;
  variables_config: CertificateVariable[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ResultData {
  athlete_name: string;
  finish_time: string;
  chip_time?: string;
  rank_scratch?: number;
  rank_gender?: number;
  rank_category?: number;
  race_name: string;
  race_distance?: number;
  event_name?: string;
  event_date?: string;
  gender?: string;
  category?: string;
  bib_number?: number;
  club?: string;
  nationality?: string;
}

/**
 * Génère un diplôme personnalisé avec les données de résultat
 */
export async function generateCertificate(
  templateId: string,
  resultData: ResultData
): Promise<string> {
  try {
    // Récupérer le template
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error('Template introuvable');
    }

    // Créer un canvas pour générer l'image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas');
    }

    // Charger l'image de fond
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = template.template_image_url;
    });

    // Définir les dimensions du canvas selon l'image originale
    // Utiliser les dimensions exactes de l'image pour préserver le ratio
    canvas.width = img.width || 1080;
    canvas.height = img.height || 1080;

    // Dessiner l'image de fond (sans étirer, en préservant les dimensions)
    ctx.drawImage(img, 0, 0);

    // Appliquer les variables
    const variables = template.variables_config as CertificateVariable[];

    // Charger toutes les images nécessaires (drapeaux)
    const imagePromises: Promise<{ variable: CertificateVariable, img: HTMLImageElement } | null>[] = [];

    console.log('🏁 Recherche de drapeaux...', {
      variables: variables.length,
      nationality: resultData.nationality
    });

    for (const variable of variables) {
      console.log('Variable:', {
        type: variable.type,
        field: variable.field,
        label: variable.label
      });

      if (variable.type === 'flag' && variable.field === 'nationality' && resultData.nationality) {
        console.log('🏁 Chargement du drapeau:', resultData.nationality);
        const promise = loadFlagImage(resultData.nationality).then(img => {
          if (img) {
            console.log('✅ Drapeau chargé avec succès');
            return { variable, img };
          } else {
            console.log('❌ Échec du chargement du drapeau');
            return null;
          }
        }).catch((err) => {
          console.error('❌ Erreur lors du chargement du drapeau:', err);
          return null;
        });
        imagePromises.push(promise);
      }
    }

    const flagImages = await Promise.all(imagePromises);
    console.log('🏁 Drapeaux chargés:', flagImages.filter(f => f !== null).length);

    // Dessiner les variables
    for (const variable of variables) {
      if (variable.type === 'flag') {
        // Dessiner le drapeau
        const flagData = flagImages.find(f => f?.variable.id === variable.id);
        console.log('🎨 Tentative de dessin du drapeau:', {
          variableId: variable.id,
          flagDataFound: !!flagData
        });

        if (flagData) {
          const width = variable.width || 40;
          const height = variable.height || 40;

          console.log('🎨 Dessin du drapeau à:', {
            x: variable.x,
            y: variable.y,
            width,
            height
          });

          // Dessiner un cercle de fond blanc
          ctx.save();
          ctx.beginPath();
          ctx.arc(variable.x, variable.y, width/2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Dessiner le drapeau (décaler pour centrer dans le cercle)
          ctx.drawImage(flagData.img, variable.x - width/2, variable.y - height/2, width, height);
          ctx.restore();
          console.log('✅ Drapeau dessiné');
        } else {
          console.log('⚠️ Pas de données de drapeau pour cette variable');
        }
      } else {
        // Dessiner le texte
        const value = getVariableValue(variable.field, resultData);
        if (!value) continue;

        // Utiliser la famille de police complète si disponible
        const fontInfo = PROFESSIONAL_FONTS.find(f => f.name === variable.fontFamily);
        const fontFamily = fontInfo ? fontInfo.family : variable.fontFamily;

        ctx.font = `${variable.bold ? 'bold' : 'normal'} ${variable.fontSize}px ${fontFamily}`;
        ctx.textAlign = variable.align;
        ctx.textBaseline = 'top'; // Important: alignement vertical en haut comme en CSS

        // Appliquer l'effet de contour brillant (stroke)
        if (variable.strokeWidth && variable.strokeWidth > 0) {
          ctx.strokeStyle = variable.strokeColor || '#ffffff';
          ctx.lineWidth = variable.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.strokeText(value, variable.x, variable.y);
        }

        // Appliquer l'effet d'ombre
        if (variable.shadowBlur && variable.shadowBlur > 0) {
          ctx.shadowColor = variable.shadowColor || 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = variable.shadowBlur;
          ctx.shadowOffsetX = variable.shadowOffsetX || 0;
          ctx.shadowOffsetY = variable.shadowOffsetY || 2;
        }

        // Dessiner le texte principal
        ctx.fillStyle = variable.color;
        ctx.fillText(value, variable.x, variable.y);

        // Réinitialiser les ombres pour les prochains dessins
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }

    // Convertir en blob et uploader
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Impossible de générer le diplôme'));
          return;
        }

        try {
          // Upload vers Supabase Storage pour avoir un lien permanent
          const fileName = `certificate_${Date.now()}_${resultData.athlete_name.replace(/\s+/g, '_')}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-certificates')
            .upload(fileName, blob, {
              contentType: 'image/png',
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('generated-certificates')
            .getPublicUrl(fileName);

          resolve(publicUrl);
        } catch (error) {
          // En cas d'erreur d'upload, utiliser un URL temporaire
          console.error('Erreur upload certificat:', error);
          const url = URL.createObjectURL(blob);
          resolve(url);
        }
      }, 'image/png', 0.95);
    });
  } catch (error) {
    console.error('Erreur lors de la génération du diplôme:', error);
    throw error;
  }
}

/**
 * Récupère la valeur d'une variable à partir des données de résultat
 */
function getVariableValue(field: string, data: ResultData): string {
  const mapping: { [key: string]: any } = {
    'athlete_name': data.athlete_name,
    'finish_time': data.finish_time,
    'chip_time': data.chip_time || data.finish_time,
    'rank_scratch': data.rank_scratch ? `${data.rank_scratch}` : '',
    'rank_gender': data.rank_gender ? `${data.rank_gender}` : '',
    'rank_category': data.rank_category ? `${data.rank_category}` : '',
    'race_name': data.race_name,
    'event_name': data.event_name || data.race_name,
    'event_date': data.event_date ? formatDate(data.event_date) : '',
    'gender': data.gender,
    'category': data.category,
    'bib_number': data.bib_number ? `#${data.bib_number}` : '',
    'club': data.club || '',
    'distance': data.race_distance ? `${data.race_distance} km` : ''
  };

  return mapping[field] || '';
}

/**
 * Formate une date en français
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Convertit un code pays Alpha-3 en Alpha-2
 */
function alpha3ToAlpha2(code: string): string {
  const mapping: { [key: string]: string } = {
    'FRA': 'FR', 'USA': 'US', 'GBR': 'GB', 'DEU': 'DE', 'ITA': 'IT', 'ESP': 'ES',
    'BEL': 'BE', 'CHE': 'CH', 'NLD': 'NL', 'PRT': 'PT', 'POL': 'PL', 'AUT': 'AT',
    'CZE': 'CZ', 'DNK': 'DK', 'SWE': 'SE', 'NOR': 'NO', 'FIN': 'FI', 'IRL': 'IE',
    'GRC': 'GR', 'HUN': 'HU', 'ROU': 'RO', 'BGR': 'BG', 'HRV': 'HR', 'SVK': 'SK',
    'SVN': 'SI', 'LUX': 'LU', 'EST': 'EE', 'LVA': 'LV', 'LTU': 'LT', 'MLT': 'MT',
    'CYP': 'CY', 'ISL': 'IS', 'LIE': 'LI', 'MCO': 'MC', 'AND': 'AD', 'SMR': 'SM',
    'VAT': 'VA', 'MKD': 'MK', 'ALB': 'AL', 'SRB': 'RS', 'MNE': 'ME', 'BIH': 'BA',
    'UKR': 'UA', 'BLR': 'BY', 'MDA': 'MD', 'RUS': 'RU', 'TUR': 'TR', 'ISR': 'IL',
    'CAN': 'CA', 'MEX': 'MX', 'BRA': 'BR', 'ARG': 'AR', 'CHL': 'CL', 'COL': 'CO',
    'CHN': 'CN', 'JPN': 'JP', 'KOR': 'KR', 'IND': 'IN', 'AUS': 'AU', 'NZL': 'NZ',
    'ZAF': 'ZA', 'MAR': 'MA', 'DZA': 'DZ', 'TUN': 'TN', 'EGY': 'EG', 'KEN': 'KE',
    'ETH': 'ET', 'NGA': 'NG', 'GHA': 'GH', 'SEN': 'SN', 'CIV': 'CI', 'CMR': 'CM'
  };

  const upperCode = code.toUpperCase();
  // Si c'est déjà Alpha-2, le retourner
  if (upperCode.length === 2) return upperCode;
  // Sinon convertir depuis Alpha-3
  return mapping[upperCode] || upperCode;
}

/**
 * Charge l'image d'un drapeau depuis l'API flagcdn
 */
async function loadFlagImage(countryCode: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);

    // Convertir Alpha-3 vers Alpha-2 si nécessaire
    const alpha2Code = alpha3ToAlpha2(countryCode);

    // Utiliser l'API flagcdn pour les drapeaux en haute qualité
    // Format : https://flagcdn.com/w80/fr.png
    const code = alpha2Code.toLowerCase();
    img.src = `https://flagcdn.com/w80/${code}.png`;
  });
}

/**
 * Partage le diplôme sur les réseaux sociaux
 */
export async function shareCertificate(
  certificateUrl: string,
  eventName: string,
  athleteName: string,
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy'
): Promise<void> {
  const message = `🏆 ${athleteName} a participé à "${eventName}" ! Voici mon diplôme ! 🏃‍♂️💪`;

  // Vérifier si Web Share API est disponible (mobile principalement)
  if (platform !== 'copy' && navigator.share && certificateUrl.startsWith('http')) {
    try {
      // Récupérer l'image comme blob
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      const file = new File([blob], 'diplome.png', { type: 'image/png' });

      await navigator.share({
        title: `Diplôme - ${eventName}`,
        text: message,
        files: [file]
      });
      return;
    } catch (error) {
      console.log('Web Share API non disponible, utilisation des URLs de partage');
    }
  }

  // Fallback: URLs de partage classiques
  const urls: { [key: string]: string } = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(certificateUrl)}&quote=${encodeURIComponent(message)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(certificateUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + certificateUrl)}`
  };

  if (platform === 'copy') {
    await navigator.clipboard.writeText(certificateUrl);
    return;
  }

  const url = urls[platform];
  if (url) {
    window.open(url, '_blank', 'width=600,height=400');
  }
}

/**
 * Enregistre le partage dans la base de données pour analytics
 */
export async function trackCertificateShare(
  resultId: string,
  athleteName: string,
  certificateUrl: string,
  platform: string
): Promise<void> {
  try {
    await supabase
      .from('certificate_shares')
      .insert({
        result_id: resultId,
        athlete_name: athleteName,
        certificate_url: certificateUrl,
        platform
      });
  } catch (error) {
    console.error('Erreur lors du tracking du partage:', error);
  }
}

/**
 * Liste des variables disponibles pour les diplômes
 */
export const AVAILABLE_VARIABLES = [
  { id: 'athlete_name', label: 'Nom de l\'athlète', field: 'athlete_name', type: 'text' },
  { id: 'race_name', label: 'Nom de l\'épreuve', field: 'race_name', type: 'text' },
  { id: 'event_name', label: 'Nom de l\'événement', field: 'event_name', type: 'text' },
  { id: 'event_date', label: 'Date de l\'événement', field: 'event_date', type: 'text' },
  { id: 'finish_time', label: 'Temps officiel', field: 'finish_time', type: 'text' },
  { id: 'chip_time', label: 'Temps puce', field: 'chip_time', type: 'text' },
  { id: 'rank_scratch', label: 'Place scratch', field: 'rank_scratch', type: 'text' },
  { id: 'rank_gender', label: 'Place sexe', field: 'rank_gender', type: 'text' },
  { id: 'rank_category', label: 'Place catégorie', field: 'rank_category', type: 'text' },
  { id: 'distance', label: 'Distance parcourue', field: 'distance', type: 'text' },
  { id: 'bib_number', label: 'Numéro de dossard', field: 'bib_number', type: 'text' },
  { id: 'gender', label: 'Sexe', field: 'gender', type: 'text' },
  { id: 'category', label: 'Catégorie', field: 'category', type: 'text' },
  { id: 'club', label: 'Club', field: 'club', type: 'text' },
  { id: 'nationality', label: 'Drapeau nationalité', field: 'nationality', type: 'flag' }
];

/**
 * Polices professionnelles disponibles
 */
export const PROFESSIONAL_FONTS = [
  // Polices système sécurisées
  { name: 'Arial', family: 'Arial, sans-serif', category: 'Sans-serif classique' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif', category: 'Sans-serif classique' },
  { name: 'Verdana', family: 'Verdana, sans-serif', category: 'Sans-serif moderne' },

  // Polices Google Fonts - Élégantes et professionnelles
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'Moderne & Élégant', weight: [300, 400, 600, 700, 900] },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Élégant & Luxe', weight: [400, 700, 900] },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'Moderne & Clean', weight: [300, 400, 500, 700, 900] },
  { name: 'Oswald', family: "'Oswald', sans-serif", category: 'Sport & Dynamique', weight: [300, 400, 600, 700] },
  { name: 'Raleway', family: "'Raleway', sans-serif", category: 'Élégant & Léger', weight: [300, 400, 600, 800] },
  { name: 'Lato', family: "'Lato', sans-serif", category: 'Professionnel', weight: [300, 400, 700, 900] },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'Universel & Lisible', weight: [400, 600, 700, 800] },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", category: 'Sport & Impact', weight: [400] },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'Moderne & Géométrique', weight: [300, 400, 600, 700, 900] },
  { name: 'Inter', family: "'Inter', sans-serif", category: 'Tech & Moderne', weight: [400, 600, 700, 900] },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'Classique & Lisible', weight: [400, 700, 900] },
  { name: 'Ubuntu', family: "'Ubuntu', sans-serif", category: 'Moderne & Amical', weight: [400, 500, 700] },
  { name: 'Anton', family: "'Anton', sans-serif", category: 'Bold & Puissant', weight: [400] },
  { name: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif", category: 'Sport & Compact', weight: [400, 600, 700, 900] },
  { name: 'Exo 2', family: "'Exo 2', sans-serif", category: 'Tech & Futuriste', weight: [400, 600, 700, 900] },
  { name: 'Archivo Black', family: "'Archivo Black', sans-serif", category: 'Impact & Bold', weight: [400] },

  // Polices système élégantes
  { name: 'Georgia', family: 'Georgia, serif', category: 'Serif classique' },
  { name: 'Times New Roman', family: "'Times New Roman', serif", category: 'Serif traditionnel' },
  { name: 'Impact', family: 'Impact, sans-serif', category: 'Bold & Puissant' }
];
