import { useState, useEffect } from 'react';
import { Users, Plus, Check, X, ChevronRight, ChevronDown, AlertCircle, UserPlus, CheckCircle, FileText, PersonStanding, Bike, Waves, Edit2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadCountries, type Country } from '../lib/countries';

interface RelayMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  nationality: string;
  segmentOrder?: number;
  licenseType?: string;
  licenseId?: string;
  licenseClub?: string;
  ppsNumber?: string;
  selectedOptions?: Record<string, { choice_id?: string; value?: string; quantity: number }>;
}

interface LicenseType {
  id: string;
  name: string;
  code: string;
}

interface RaceOption {
  id: string;
  type: string;
  label: string;
  description: string;
  image_url?: string;
  is_required: boolean;
  is_question: boolean;
  price_cents: number;
  choices: Array<{
    id: string;
    label: string;
    description: string;
    price_modifier_cents: number;
    has_quantity_limit: boolean;
    max_quantity: number;
    current_quantity: number;
  }>;
}

interface RelaySegment {
  id: string;
  segment_order: number;
  name: string;
  distance: number;
  discipline: string;
  custom_discipline?: string;
}

interface RacePricing {
  id: string;
  race_id: string;
  license_type_id: string;
  pricing_period_id: string;
  price_cents: number;
  license_types: LicenseType;
}

interface RelayTeamRegistrationFormProps {
  eventId?: string;
  raceId: string;
  raceName?: string;
  teamSize?: number;
  segments?: RelaySegment[];
  regulations?: string;
  licenseTypes?: LicenseType[];
  raceOptions?: RaceOption[];
  eventDate?: string;
  calorgCode?: string;
  isFFAAffiliated?: boolean;
  teamCategory?: string;
  teamPriceCents?: number;
  racePricing?: RacePricing[];
  pricingPeriods?: any[];
  initialData?: any; // Données pré-remplies (pour retour depuis paiement)
  onComplete: (teamData: any) => void;
  onBack?: () => void;
}

export default function RelayTeamRegistrationForm({
  eventId,
  raceId,
  raceName: initialRaceName,
  teamSize: initialTeamSize,
  segments: initialSegments = [],
  regulations: initialRegulations,
  licenseTypes: initialLicenseTypes = [],
  raceOptions: initialRaceOptions = [],
  eventDate: initialEventDate,
  calorgCode: initialCalorgCode,
  isFFAAffiliated: initialIsFFAAffiliated = false,
  teamCategory = 'Équipe',
  teamPriceCents = 0,
  racePricing: initialRacePricing = [],
  pricingPeriods: initialPricingPeriods = [],
  initialData,
  onComplete,
  onBack,
}: RelayTeamRegistrationFormProps) {
  const [step, setStep] = useState<'team-info' | 'members' | 'legal'>(
    initialData?.members && initialData.members.length > 0 ? 'legal' : 'team-info'
  );
  const [raceName, setRaceName] = useState(initialRaceName || '');
  const [teamSize, setTeamSize] = useState(initialTeamSize || 0);
  const [segments, setSegments] = useState<RelaySegment[]>(initialSegments);
  const [regulations, setRegulations] = useState(initialRegulations || '');
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>(initialLicenseTypes);
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>(initialRaceOptions);
  const [eventDate, setEventDate] = useState(initialEventDate);
  const [calorgCode, setCalorgCode] = useState(initialCalorgCode);
  const [teamConfig, setTeamConfig] = useState<any>(null);
  const [isFFAAffiliated, setIsFFAAffiliated] = useState(initialIsFFAAffiliated);
  const [racePricing, setRacePricing] = useState<RacePricing[]>(initialRacePricing);
  const [pricingPeriods, setPricingPeriods] = useState<any[]>(initialPricingPeriods);
  const [dataLoading, setDataLoading] = useState(!initialRaceName);
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  // Helper pour obtenir l'icône selon la discipline
  const getSportIcon = (discipline: string) => {
    const lowerDiscipline = (discipline || '').toLowerCase();
    if (lowerDiscipline.includes('natation') || lowerDiscipline.includes('swim') || lowerDiscipline === 'swimming') {
      return <Waves className="w-4 h-4 text-blue-600" />;
    }
    if (lowerDiscipline.includes('vélo') || lowerDiscipline.includes('velo') || lowerDiscipline.includes('bike') || lowerDiscipline === 'cycling') {
      return <Bike className="w-4 h-4 text-green-600" />;
    }
    if (lowerDiscipline.includes('course') || lowerDiscipline.includes('run') || lowerDiscipline === 'running' || lowerDiscipline.includes('pied')) {
      return <PersonStanding className="w-4 h-4 text-orange-600" />;
    }
    return <Users className="w-4 h-4 text-gray-600" />;
  };
  const [teamName, setTeamName] = useState(initialData?.name || '');
  const [emergencyContact, setEmergencyContact] = useState(initialData?.emergency_contact || {
    name: '',
    phone: '',
    relation: '',
  });

  const [members, setMembers] = useState<RelayMember[]>(initialData?.members || []);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberData, setEditingMemberData] = useState<Partial<RelayMember>>({});
  const [initialMemberData, setInitialMemberData] = useState<Partial<RelayMember>>({});
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [currentMember, setCurrentMember] = useState<Partial<RelayMember>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'M',
    birthDate: '',
    nationality: 'FRA',
    licenseType: '',
    licenseId: '',
    licenseClub: '',
    ppsNumber: '',
    selectedOptions: {},
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [ffaVerifying, setFfaVerifying] = useState(false);
  const [ffaVerificationMessage, setFfaVerificationMessage] = useState<string>('');
  const [pspVerifying, setPspVerifying] = useState(false);
  const [pspVerificationMessage, setPspVerificationMessage] = useState<string>('');
  const [ageRestrictions, setAgeRestrictions] = useState<{ min_age: number; max_age: number | null } | null>(null);

  useEffect(() => {
    console.log('🚀 [RELAY INIT] Composant monté avec props:');
    console.log('  - eventId:', eventId);
    console.log('  - raceId:', raceId);
    console.log('  - initialEventDate:', initialEventDate);
    console.log('  - initialRaceName:', initialRaceName);
    console.log('  - dataLoading:', dataLoading);

    loadCountriesData();
    if (!initialRaceName && eventId && raceId) {
      console.log('🔄 [RELAY INIT] Chargement des données de la course...');
      loadRaceData();
    } else if (initialEventDate) {
      console.log('✅ [RELAY INIT] EventDate déjà fournie en prop:', initialEventDate);
    } else {
      console.warn('⚠️ [RELAY INIT] Aucune eventDate fournie et pas de chargement prévu !');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, raceId]);

  const loadCountriesData = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const loadRaceData = async () => {
    try {
      setDataLoading(true);

      // Charger les infos de la course
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*, events!inner(*)')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;

      console.log('📅 [RELAY DATA] raceData.events.start_date:', raceData.events.start_date);
      console.log('📅 [RELAY DATA] raceData.events:', raceData.events);

      setRaceName(raceData.name);
      setTeamSize(raceData.team_config?.max_members || 4);
      setTeamConfig(raceData.team_config || null);
      setRegulations(raceData.regulations || '');
      setEventDate(raceData.events.start_date);
      setCalorgCode(raceData.events.ffa_calorg_code);
      setOrganizerId(raceData.events.organizer_id);

      console.log('✅ [RELAY DATA] EventDate définie:', raceData.events.start_date);

      const ffaStatus = raceData.events.ffa_affiliated || false;
      console.log('🏁 CHARGEMENT COURSE - ffa_affiliated:', raceData.events.ffa_affiliated);
      console.log('🏁 CHARGEMENT COURSE - ffa_calorg_code:', raceData.events.ffa_calorg_code);
      console.log('🏁 CHARGEMENT COURSE - isFFAAffiliated (after default):', ffaStatus);
      console.log('🏁 CHARGEMENT COURSE - Nom de la course:', raceData.name);
      console.log('🏁 CHARGEMENT COURSE - Événement:', raceData.events.name);
      setIsFFAAffiliated(ffaStatus);

      // Charger les segments de relais
      const { data: segmentsData } = await supabase
        .from('relay_segments')
        .select('*')
        .eq('race_id', raceId)
        .order('segment_order');

      if (segmentsData) {
        setSegments(segmentsData);
      }

      // D'abord charger les tarifs pour savoir quelles licences sont proposées
      const { data: pricingData } = await supabase
        .from('race_pricing')
        .select('*, license_types(*)')
        .eq('race_id', raceId);

      if (pricingData) {
        setRacePricing(pricingData as any);
        // Extraire uniquement les types de licence configurés pour cette course
        const availableLicenseTypes = pricingData
          .map(p => p.license_types)
          .filter((lt, index, self) =>
            lt && self.findIndex(t => t.id === lt.id) === index
          );
        setLicenseTypes(availableLicenseTypes);
        console.log('✅ Types de licence disponibles:', availableLicenseTypes);
      }

      // Charger les options de course avec leurs choix
      const { data: optionsData } = await supabase
        .from('race_options')
        .select(`
          *,
          choices:race_option_choices(*)
        `)
        .eq('race_id', raceId)
        .eq('active', true)
        .order('display_order');

      if (optionsData) {
        const formattedOptions = optionsData.map(opt => ({
          ...opt,
          choices: opt.choices || []
        }));
        setRaceOptions(formattedOptions as any);
        console.log('✅ Options chargées:', formattedOptions);
      }

      // Charger les périodes de tarification
      const { data: periodsData } = await supabase
        .from('pricing_periods')
        .select('*')
        .eq('race_id', raceId)
        .order('start_date');

      if (periodsData) {
        setPricingPeriods(periodsData);
      }

      // Charger les restrictions d'âge basées sur les catégories autorisées
      const { data: categoryData } = await supabase
        .from('race_category_restrictions')
        .select('category_code, ffa_categories(min_age, max_age)')
        .eq('race_id', raceId);

      if (categoryData && categoryData.length > 0) {
        const minAge = Math.min(...categoryData.map((r: any) => r.ffa_categories.min_age));
        const maxAges = categoryData.map((r: any) => r.ffa_categories.max_age).filter((age: any) => age !== null);
        const maxAge = maxAges.length > 0 ? Math.max(...maxAges) : null;
        setAgeRestrictions({ min_age: minAge, max_age: maxAge });
        console.log('✅ Restrictions d\'âge chargées:', { min_age: minAge, max_age: maxAge });
      } else {
        setAgeRestrictions(null);
        console.log('ℹ️ Aucune restriction d\'âge configurée pour cette course');
      }

    } catch (err: any) {
      console.error('Erreur chargement données relais:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Debug: Afficher les options disponibles quand on arrive sur l'étape de validation
  useEffect(() => {
    if (step === 'legal') {
      console.log('🔍 [RELAY DEBUG] Race Options:', raceOptions);
      console.log('🔍 [RELAY DEBUG] Members:', members);
    }
  }, [step, raceOptions, members]);

  // Vérification automatique de la licence FFA pour currentMember
  useEffect(() => {
    if (editingMemberId) return; // Ne pas auto-vérifier en mode édition

    if (
      isFFALicense() &&
      currentMember.licenseId &&
      currentMember.licenseId.length >= 4 &&
      currentMember.firstName &&
      currentMember.lastName &&
      currentMember.birthDate &&
      !ffaVerifying &&
      !ffaVerificationMessage.includes('✓')
    ) {
      console.log('🔄 [AUTO FFA] Déclenchement auto-vérification licence FFA');
      const timer = setTimeout(() => {
        verifyFFALicense();
      }, 500); // Petit délai pour éviter trop d'appels API pendant la saisie
      return () => clearTimeout(timer);
    }
  }, [currentMember.licenseId, currentMember.firstName, currentMember.lastName, currentMember.birthDate, currentMember.licenseType]);

  // Vérification automatique de la licence FFA en mode édition
  useEffect(() => {
    if (!editingMemberId) return; // Seulement en mode édition

    const selectedLicenseType = licenseTypes.find(lt => lt.id === editingMemberData.licenseType);
    const isFFAEdit = selectedLicenseType?.code === 'FFA';

    if (
      isFFAEdit &&
      editingMemberData.licenseId &&
      editingMemberData.licenseId.length >= 4 &&
      editingMemberData.firstName &&
      editingMemberData.lastName &&
      editingMemberData.birthDate &&
      !ffaVerifying &&
      !ffaVerificationMessage.includes('✓')
    ) {
      console.log('🔄 [AUTO FFA EDIT] Déclenchement auto-vérification licence FFA en édition');
      const timer = setTimeout(() => {
        verifyFFALicense();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editingMemberData.licenseId, editingMemberData.firstName, editingMemberData.lastName, editingMemberData.birthDate, editingMemberData.licenseType, editingMemberId]);

  const [legalAcceptances, setLegalAcceptances] = useState(initialData?.acceptances || {
    regulations: false,
    rgpd: false,
  });

  // Déterminer la catégorie d'équipe selon les règles configurées
  const determineTeamCategory = () => {
    try {
      const menCount = members.filter(m => m.gender === 'M').length;
      const womenCount = members.filter(m => m.gender === 'F').length;

      console.log('🏷️ [TEAM CATEGORY] Calcul catégorie - Hommes:', menCount, 'Femmes:', womenCount);
      console.log('🏷️ [TEAM CATEGORY] teamConfig:', teamConfig);

      // Vérifier si teamConfig contient les règles de catégories
      const categoryQuotas = teamConfig?.team_rules?.category_quotas;

      console.log('🏷️ [TEAM CATEGORY] categoryQuotas:', categoryQuotas);

      if (!categoryQuotas) {
        // Fallback sur la logique simple si pas de règles
        console.log('⚠️ [TEAM CATEGORY] Pas de règles définies, utilisation de la logique simple');
        if (menCount === members.length) return 'Équipe Homme';
        if (womenCount === members.length) return 'Équipe Femme';
        return `Équipe Mixte (${menCount} homme${menCount > 1 ? 's' : ''} et ${womenCount} femme${womenCount > 1 ? 's' : ''})`;
      }

      // Vérifier la catégorie "homme"
      if (categoryQuotas.homme) {
        const rules = categoryQuotas.homme;
        const matchHomme =
          menCount >= (rules.min_men || 0) &&
          menCount <= (rules.max_men || 999) &&
          womenCount >= (rules.min_women || 0) &&
          womenCount <= (rules.max_women || 999);

        if (matchHomme) {
          return `Équipe Homme (${menCount} homme${menCount > 1 ? 's' : ''}${womenCount > 0 ? ` et ${womenCount} femme${womenCount > 1 ? 's' : ''}` : ''})`;
        }
      }

      // Vérifier la catégorie "femme"
      if (categoryQuotas.femme) {
        const rules = categoryQuotas.femme;
        const matchFemme =
          menCount >= (rules.min_men || 0) &&
          menCount <= (rules.max_men || 999) &&
          womenCount >= (rules.min_women || 0) &&
          womenCount <= (rules.max_women || 999);

        if (matchFemme) {
          return `Équipe Femme (${womenCount} femme${womenCount > 1 ? 's' : ''}${menCount > 0 ? ` et ${menCount} homme${menCount > 1 ? 's' : ''}` : ''})`;
        }
      }

      // Vérifier la catégorie "mixte"
      if (categoryQuotas.mixte) {
        const rules = categoryQuotas.mixte;
        const matchMixte =
          menCount >= (rules.min_men || 0) &&
          menCount <= (rules.max_men || 999) &&
          womenCount >= (rules.min_women || 0) &&
          womenCount <= (rules.max_women || 999);

        if (matchMixte) {
          return `Équipe Mixte (${menCount} homme${menCount > 1 ? 's' : ''} et ${womenCount} femme${womenCount > 1 ? 's' : ''})`;
        }
      }

      // Si aucune catégorie ne correspond, retourner une description générique
      return `${menCount} homme${menCount > 1 ? 's' : ''} et ${womenCount} femme${womenCount > 1 ? 's' : ''}`;
    } catch (error) {
      console.error('❌ [TEAM CATEGORY] Erreur lors du calcul de la catégorie:', error);
      // Retour sécurisé en cas d'erreur
      return 'Équipe';
    }
  };

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const remainingMembers = teamSize - members.length;
  const isTeamComplete = members.length === teamSize;
  const canProceedToLegal = isTeamComplete;

  // Calculer le prix total de l'équipe en fonction des types de licence de chaque membre
  const calculateTeamTotalPrice = () => {
    if (members.length === 0 || racePricing.length === 0 || pricingPeriods.length === 0) {
      return { subtotal: 0, commission: 0, total: 0, inscriptionTotal: 0, optionsTotal: 0 };
    }

    // Trouver la période active
    const now = new Date();
    const activePeriod = pricingPeriods.find(p => {
      if (!p.active) return false;
      const startDate = new Date(p.start_date);
      const endDate = new Date(p.end_date);
      return now >= startDate && now <= endDate;
    });

    if (!activePeriod) {
      console.warn('⚠️ [RELAY PRICING] Aucune période active trouvée');
      return { subtotal: 0, commission: 0, total: 0, inscriptionTotal: 0, optionsTotal: 0 };
    }

    let inscriptionTotalCents = 0; // Prix d'inscription uniquement
    let optionsTotalCents = 0;     // Prix des options uniquement

    // Calculer le prix pour chaque membre selon son type de licence + options
    members.forEach((member, index) => {
      // 1. Prix d'inscription de base
      if (!member.licenseType) {
        console.warn(`⚠️ [RELAY PRICING] Membre ${index + 1} sans type de licence`);
      } else {
        const pricing = racePricing.find(
          p => p.race_id === raceId &&
               p.license_type_id === member.licenseType &&
               p.pricing_period_id === activePeriod.id
        );

        if (pricing) {
          inscriptionTotalCents += pricing.price_cents;
          console.log(`✅ [RELAY PRICING] Membre ${index + 1} (${pricing.license_types?.name}): ${pricing.price_cents / 100}€`);
        } else {
          console.warn(`⚠️ [RELAY PRICING] Pas de tarif trouvé pour membre ${index + 1}`);
        }
      }

      // 2. Prix des options sélectionnées
      if (member.selectedOptions) {
        console.log(`🔍 [PRICING OPTIONS] Membre ${index + 1} - selectedOptions:`, member.selectedOptions);
        Object.entries(member.selectedOptions).forEach(([optionId, optionData]) => {
          const raceOption = raceOptions.find(opt => opt.id === optionId);
          if (!raceOption) {
            console.warn(`⚠️ [PRICING OPTIONS] Option ${optionId} non trouvée dans raceOptions`);
            return;
          }

          console.log(`🔍 [PRICING OPTIONS] Option "${raceOption.label}" (${optionId}):`, optionData);

          // Option avec choix multiples
          if (optionData.choice_id) {
            const choice = raceOption.choices?.find(c => c.id === optionData.choice_id);
            console.log(`🔍 [PRICING OPTIONS] Choice trouvé:`, choice);
            if (choice && optionData.quantity > 0) {
              // Prix = prix de base de l'option + modificateur du choix
              const basePrice = raceOption.price_cents || 0;
              const modifier = choice.price_modifier_cents || 0;
              const totalPrice = (basePrice + modifier) * optionData.quantity;
              optionsTotalCents += totalPrice;
              console.log(`   📦 Option "${raceOption.label}" - ${choice.label} (×${optionData.quantity}): ${totalPrice / 100}€ (base: ${basePrice}, modifier: ${modifier})`);
            }
          }
          // Option simple avec prix de base
          else if (raceOption.price_cents > 0 && optionData.quantity > 0) {
            const optionPrice = raceOption.price_cents * optionData.quantity;
            optionsTotalCents += optionPrice;
            console.log(`   📦 Option "${raceOption.label}" (×${optionData.quantity}): ${optionPrice / 100}€`);
          } else {
            console.log(`   ⚠️ Option "${raceOption.label}" ignorée (price_cents: ${raceOption.price_cents}, quantity: ${optionData.quantity})`);
          }
        });
      } else {
        console.log(`⚠️ [PRICING OPTIONS] Membre ${index + 1} - Pas de selectedOptions`);
      }
    });

    const subtotalCents = inscriptionTotalCents + optionsTotalCents;

    // Commission Timepulse : 0.99€ par athlète (uniquement sur l'inscription, pas sur les options)
    const commissionCents = members.length * 99;
    const totalCents = subtotalCents + commissionCents;

    console.log(`💰 [RELAY PRICING] Inscriptions: ${inscriptionTotalCents / 100}€, Options: ${optionsTotalCents / 100}€, Sous-total: ${subtotalCents / 100}€, Commission: ${commissionCents / 100}€, Total: ${totalCents / 100}€`);

    return {
      subtotal: subtotalCents,
      commission: commissionCents,
      total: totalCents,
      inscriptionTotal: inscriptionTotalCents,
      optionsTotal: optionsTotalCents
    };
  };

  const teamPricing = calculateTeamTotalPrice();

  const isFFALicense = () => {
    const selectedLicense = licenseTypes.find(lt => lt.id === currentMember.licenseType);
    return selectedLicense?.code === 'FFA';
  };

  const requiresPSP = () => {
    // PPS obligatoire si :
    // 1. Course affiliée FFA (isFFAAffiliated = true)
    // 2. L'athlète n'a PAS de licence FFA
    // 3. Un type de licence a été sélectionné
    if (!isFFAAffiliated) {
      console.log('🔍 PSP: Course non affiliée FFA -> PSP non requis');
      return false;
    }
    if (!currentMember.licenseType) {
      console.log('🔍 PSP: Type de licence non sélectionné -> PSP non requis (pour l\'instant)');
      return false;
    }
    const hasFFALicense = isFFALicense();
    console.log('🔍 PSP: Type de licence sélectionné, licence FFA ?', hasFFALicense);
    console.log('🔍 PSP requis ?', !hasFFALicense);
    return !hasFFALicense;
  };

  const verifyFFALicense = async () => {
    const isEditMode = editingMemberId !== null;
    const data = isEditMode ? editingMemberData : currentMember;

    console.log('[DEBUG RELAY FFA] ===== DÉBUT VÉRIFICATION FFA RELAIS =====');
    console.log('[DEBUG RELAY FFA] Mode:', isEditMode ? 'ÉDITION' : 'AJOUT');
    console.log('[DEBUG RELAY FFA] data:', data);
    console.log('[DEBUG RELAY FFA] data.licenseId:', data.licenseId);
    console.log('[DEBUG RELAY FFA] data.lastName:', data.lastName);
    console.log('[DEBUG RELAY FFA] data.firstName:', data.firstName);
    console.log('[DEBUG RELAY FFA] data.birthDate:', data.birthDate);

    if (!data.licenseId || !data.lastName || !data.firstName || !data.birthDate) {
      setFfaVerificationMessage('❌ Veuillez remplir tous les champs obligatoires avant de vérifier');
      return;
    }

    const licenseNumber = data.licenseId.trim().toUpperCase();
    if (licenseNumber.startsWith('P')) {
      setFfaVerificationMessage('❌ Ce numéro commence par "P" - il s\'agit d\'un numéro PSP, pas d\'une licence FFA.');
      return;
    }

    if (!/^\d+$/.test(licenseNumber)) {
      setFfaVerificationMessage('❌ Le numéro de licence FFA doit contenir uniquement des chiffres.');
      return;
    }

    setFfaVerifying(true);
    setFfaVerificationMessage('');

    try {
      const { data: credentials } = await supabase.rpc('get_ffa_credentials').maybeSingle();
      if (!credentials || !credentials.uid || !credentials.password) {
        setFfaVerificationMessage('❌ Configuration FFA manquante');
        setFfaVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;
      const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear().toString() : '';

      // IMPORTANT : L'API FFA attend un format DD/MM/YYYY pour cmpdate
      let testEventDate = '01/01/2026';
      if (eventDate) {
        const eventDateObj = new Date(eventDate);
        testEventDate = `${String(eventDateObj.getDate()).padStart(2, '0')}/${String(eventDateObj.getMonth() + 1).padStart(2, '0')}/${eventDateObj.getFullYear()}`;
      }

      console.log('[RELAY FFA] eventDate brut:', eventDate);
      console.log('[RELAY FFA] testEventDate converti:', testEventDate);
      console.log('[RELAY FFA] birthYear:', birthYear);

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: data.licenseId,
        nom: data.lastName.toUpperCase(),
        prenom: data.firstName.toUpperCase(),
        sexe: data.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: calorgCode || '307834',
        cmpdate: testEventDate,
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      console.log('[RELAY FFA] ===== RÉPONSE COMPLÈTE =====');
      console.log('[RELAY FFA] result:', result);
      console.log('[RELAY FFA] result.connected:', result.connected);
      console.log('[RELAY FFA] result.details:', result.details);
      console.log('[RELAY FFA] result.details?.test_athlete:', result.details?.test_athlete);
      console.log('[RELAY FFA] result.details?.csv_raw:', result.details?.csv_raw);
      console.log('[RELAY FFA] result.details?.all_fields:', result.details?.all_fields);

      if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;

        console.log('[RELAY FFA] ===== DÉTAILS ATHLÈTE =====');
        console.log('[RELAY FFA] athlete complet:', athlete);
        console.log('[RELAY FFA] athlete.club:', athlete.club);
        console.log('[RELAY FFA] athlete.club_numero:', athlete.club_numero);
        console.log('[RELAY FFA] athlete.club_abrege:', athlete.club_abrege);
        console.log('[RELAY FFA] athlete.club_complet:', athlete.club_complet);
        console.log('[RELAY FFA] athlete.nom:', athlete.nom);
        console.log('[RELAY FFA] athlete.prenom:', athlete.prenom);
        console.log('[RELAY FFA] =============================');

        // Essayer plusieurs propriétés pour obtenir le club
        const club = athlete.club || athlete.club_complet || athlete.club_abrege || '';

        console.log('[RELAY FFA] Club final sélectionné:', club);

        if (isEditMode) {
          setEditingMemberData((prev: any) => ({ ...prev, licenseClub: club }));
        } else {
          setCurrentMember((prev) => ({ ...prev, licenseClub: club }));
        }

        setFfaVerificationMessage(`✓ Licence vérifiée - Club: ${club || 'Non trouvé'}`);
      } else {
        console.log('[RELAY FFA] ❌ Échec de la connexion');
        console.log('[RELAY FFA] result.message:', result.message);
        setFfaVerificationMessage(result.message || '❌ Licence non trouvée');
      }
    } catch (error) {
      console.error('FFA verification error:', error);
      setFfaVerificationMessage('❌ Erreur lors de la vérification');
    } finally {
      setFfaVerifying(false);
    }
  };

  const verifyPSP = async () => {
    const isEditMode = editingMemberId !== null;
    const data = isEditMode ? editingMemberData : currentMember;

    console.log('[DEBUG RELAY PSP] ===== DÉBUT VÉRIFICATION PSP RELAIS =====');
    console.log('[DEBUG RELAY PSP] Mode:', isEditMode ? 'ÉDITION' : 'AJOUT');
    console.log('[DEBUG RELAY PSP] data:', data);
    console.log('[DEBUG RELAY PSP] data.ppsNumber:', data.ppsNumber);
    console.log('[DEBUG RELAY PSP] data.firstName:', data.firstName);
    console.log('[DEBUG RELAY PSP] data.lastName:', data.lastName);
    console.log('[DEBUG RELAY PSP] data.birthDate:', data.birthDate);

    if (!data.ppsNumber) {
      console.log('[DEBUG RELAY PSP] Aucun numéro PSP - arrêt');
      return;
    }

    if (!data.ppsNumber.toUpperCase().startsWith('P')) {
      setPspVerificationMessage('❌ Le numéro PSP doit commencer par la lettre P');
      return;
    }

    setPspVerifying(true);
    setPspVerificationMessage('');

    try {
      const { data: credentials } = await supabase.rpc('get_ffa_credentials').maybeSingle();
      if (!credentials || !credentials.uid || !credentials.password) {
        setPspVerificationMessage('⚠️ Configuration FFA manquante - Vérification impossible');
        setPspVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;
      const birthYear = data.birthDate ? new Date(data.birthDate).getFullYear().toString() : '';

      // IMPORTANT : L'API FFA attend un format DD/MM/YYYY pour cmpdate
      let testEventDate = '01/01/2026';
      if (eventDate) {
        const eventDateObj = new Date(eventDate);
        testEventDate = `${String(eventDateObj.getDate()).padStart(2, '0')}/${String(eventDateObj.getMonth() + 1).padStart(2, '0')}/${eventDateObj.getFullYear()}`;
      }

      console.log('[RELAY PSP] eventDate brut:', eventDate);
      console.log('[RELAY PSP] testEventDate converti:', testEventDate);
      console.log('[RELAY PSP] birthYear:', birthYear);

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: data.ppsNumber,
        nom: data.lastName!.toUpperCase(),
        prenom: data.firstName!.toUpperCase(),
        sexe: data.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: calorgCode || '307834',
        cmpdate: testEventDate,
      };

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;
        const ppsExpiryDate = athlete.pps_expiry || athlete.license_expiry || athlete.dfinrel;
        setPspVerificationMessage(`✓ PSP ${data.ppsNumber} vérifié${ppsExpiryDate ? ` - Valide jusqu'au ${ppsExpiryDate}` : ''}`);
      } else {
        setPspVerificationMessage(`⚠️ PSP non trouvé dans la base FFA`);
      }
    } catch (error) {
      console.error('PSP verification error:', error);
      setPspVerificationMessage('⚠️ Erreur lors de la vérification du PSP');
    } finally {
      setPspVerifying(false);
    }
  };

  const addMember = () => {
    console.log('🔍 [VALIDATION] Début de la validation du membre');
    console.log('🔍 [VALIDATION] ageRestrictions:', ageRestrictions);
    console.log('🔍 [VALIDATION] eventDate:', eventDate);
    console.log('🔍 [VALIDATION] currentMember.birthDate:', currentMember.birthDate);

    if (!currentMember.firstName || !currentMember.lastName || !currentMember.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentMember.email!)) {
      setError('Email invalide');
      return;
    }

    // Validate birth date
    if (!currentMember.birthDate) {
      setError('La date de naissance est obligatoire');
      return;
    }

    // Validate license type selection
    if (!currentMember.licenseType) {
      setError('Veuillez sélectionner un type de licence');
      return;
    }

    // Valider l'âge selon les restrictions de la course
    if (ageRestrictions && currentMember.birthDate) {
      console.log('🔍 [VALIDATION] Validation de l\'âge en cours...');

      if (!eventDate) {
        console.error('❌ [VALIDATION] eventDate manquante mais restrictions d\'âge présentes !');
        setError('Erreur: date de l\'événement non disponible pour vérifier l\'âge');
        return;
      }

      const birthDate = new Date(currentMember.birthDate);
      const raceDate = new Date(eventDate);

      // Calculer l'âge au 1er septembre de l'année de l'événement (règle FFA)
      const eventYear = raceDate.getFullYear();
      const september1st = new Date(eventYear, 8, 1);

      const age = september1st.getFullYear() - birthDate.getFullYear();
      const monthDiff = september1st.getMonth() - birthDate.getMonth();
      const dayDiff = september1st.getDate() - birthDate.getDate();

      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
      }

      console.log('🔍 [VALIDATION] Âge calculé:', actualAge, 'ans (au 1er septembre', eventYear + ')');
      console.log('🔍 [VALIDATION] Restrictions: min =', ageRestrictions.min_age, ', max =', ageRestrictions.max_age);

      if (actualAge < ageRestrictions.min_age) {
        console.error('❌ [VALIDATION] Âge insuffisant:', actualAge, '<', ageRestrictions.min_age);
        setError(`L'âge minimum pour cette course est de ${ageRestrictions.min_age} ans. Vous aurez ${actualAge} ans au 1er septembre ${eventYear}.`);
        return;
      }

      if (ageRestrictions.max_age !== null && actualAge > ageRestrictions.max_age) {
        console.error('❌ [VALIDATION] Âge trop élevé:', actualAge, '>', ageRestrictions.max_age);
        setError(`L'âge maximum pour cette course est de ${ageRestrictions.max_age} ans. Vous aurez ${actualAge} ans au 1er septembre ${eventYear}.`);
        return;
      }

      console.log('✅ [VALIDATION] Âge valide:', actualAge, 'ans');
    } else {
      console.warn('⚠️ [VALIDATION] Aucune restriction d\'âge - validation ignorée');
    }

    // Check if email already exists
    if (members.some(m => m.email === currentMember.email)) {
      setError('Cet email est déjà utilisé par un autre membre');
      return;
    }

    // Validate license if FFA
    if (isFFALicense() && (!currentMember.licenseId || !ffaVerificationMessage.includes('✓'))) {
      console.log('❌ Validation échouée: Licence FFA non vérifiée');
      setError('Veuillez vérifier la licence FFA avant de continuer');
      return;
    }

    // Validate PSP if required
    const pspRequired = requiresPSP();
    console.log('🔍 VALIDATION PSP - requiresPSP():', pspRequired);
    console.log('🔍 VALIDATION PSP - ppsNumber:', currentMember.ppsNumber);
    console.log('🔍 VALIDATION PSP - pspVerificationMessage:', pspVerificationMessage);

    if (pspRequired) {
      if (!currentMember.ppsNumber) {
        console.log('❌ Validation échouée: PSP requis mais numéro manquant');
        setError('⚠️ Le numéro PSP est OBLIGATOIRE pour les non-licenciés FFA sur une course FFA');
        return;
      }
      if (!pspVerificationMessage.includes('✓')) {
        console.log('❌ Validation échouée: PSP requis mais non vérifié');
        setError('⚠️ Veuillez VÉRIFIER le numéro PSP avant de continuer (cliquez sur "Vérifier")');
        return;
      }
      console.log('✅ Validation PSP réussie');
    } else {
      console.log('ℹ️ PSP non requis pour cet athlète');
    }

    // Validate required options
    console.log('🔍 [VALIDATION OPTIONS] Début validation des options obligatoires');
    console.log('🔍 [VALIDATION OPTIONS] Nombre d\'options disponibles:', raceOptions.length);
    console.log('🔍 [VALIDATION OPTIONS] Options disponibles:', raceOptions.map(o => ({ id: o.id, label: o.label, required: o.is_required })));
    console.log('🔍 [VALIDATION OPTIONS] Options sélectionnées:', currentMember.selectedOptions);

    const requiredOptions = raceOptions.filter(opt => opt.is_required);
    console.log('🔍 [VALIDATION OPTIONS] Nombre d\'options obligatoires:', requiredOptions.length);
    console.log('🔍 [VALIDATION OPTIONS] Options obligatoires:', requiredOptions.map(o => ({ id: o.id, label: o.label })));

    const missingRequiredOptions = requiredOptions.filter(opt => {
      const selected = currentMember.selectedOptions?.[opt.id];
      console.log(`🔍 [VALIDATION OPTIONS] Vérification de "${opt.label}" (id: ${opt.id}):`, selected);

      // Si aucune sélection
      if (!selected) {
        console.error(`❌ [VALIDATION OPTIONS] "${opt.label}" manquante (pas de sélection)`);
        return true;
      }

      // Si quantity est 0, undefined ou null
      if (selected.quantity === 0 || selected.quantity === undefined || selected.quantity === null) {
        console.error(`❌ [VALIDATION OPTIONS] "${opt.label}" manquante (quantity = ${selected.quantity})`);
        return true;
      }

      // Si c'est une question et qu'aucun choix n'est fait
      if (opt.is_question && !selected.choice_id) {
        console.error(`❌ [VALIDATION OPTIONS] "${opt.label}" manquante (question sans choix)`);
        return true;
      }

      console.log(`✅ [VALIDATION OPTIONS] "${opt.label}" OK - quantity:`, selected.quantity, ', choice_id:', selected.choice_id);
      return false;
    });

    console.log('🔍 [VALIDATION OPTIONS] Nombre d\'options manquantes:', missingRequiredOptions.length);

    if (missingRequiredOptions.length > 0) {
      const optionNames = missingRequiredOptions.map(opt => opt.label).join(', ');
      console.error('❌ [VALIDATION OPTIONS] Options manquantes:', optionNames);
      setError(`Veuillez remplir les options obligatoires : ${optionNames}`);
      return;
    }

    console.log('✅ [VALIDATION OPTIONS] Toutes les options obligatoires sont remplies');

    const newMember: RelayMember = {
      id: `temp-${Date.now()}`,
      firstName: currentMember.firstName!,
      lastName: currentMember.lastName!,
      email: currentMember.email!,
      phone: currentMember.phone || '',
      gender: currentMember.gender!,
      birthDate: currentMember.birthDate!,
      nationality: currentMember.nationality!,
      segmentOrder: members.length + 1,
      licenseType: currentMember.licenseType,
      licenseId: currentMember.licenseId,
      licenseClub: currentMember.licenseClub,
      ppsNumber: currentMember.ppsNumber,
      selectedOptions: currentMember.selectedOptions || {},
    };

    console.log('✅ [VALIDATION] Toutes les validations passées - Ajout du membre:', newMember);
    setMembers([...members, newMember]);
    setCurrentMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'M',
      birthDate: '',
      nationality: 'FRA',
      licenseType: '',
      licenseId: '',
      licenseClub: '',
      ppsNumber: '',
      selectedOptions: {},
    });
    setFfaVerificationMessage('');
    setPspVerificationMessage('');
    setError('');
  };

  const startEditingMember = (member: RelayMember) => {
    setEditingMemberId(member.id);
    setEditingMemberData({ ...member });
    setInitialMemberData({ ...member });
    setExpandedMemberId(member.id);
    // Reset verification messages
    setFfaVerificationMessage('');
    setPspVerificationMessage('');
  };

  const cancelEditingMember = () => {
    setEditingMemberId(null);
    setEditingMemberData({});
    setInitialMemberData({});
    setError('');
    // Reset verification messages
    setFfaVerificationMessage('');
    setPspVerificationMessage('');
  };

  const saveEditingMember = () => {
    if (!editingMemberId) return;

    console.log('🔍 [EDIT VALIDATION] Début de la validation des modifications');
    console.log('🔍 [EDIT VALIDATION] editingMemberData:', editingMemberData);

    // Validate required fields
    if (!editingMemberData.firstName || !editingMemberData.lastName || !editingMemberData.email) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingMemberData.email!)) {
      setError('Email invalide');
      return;
    }

    // Validate birth date
    if (!editingMemberData.birthDate) {
      setError('La date de naissance est obligatoire');
      return;
    }

    // Validate license type selection
    if (!editingMemberData.licenseType) {
      setError('Veuillez sélectionner un type de licence');
      return;
    }

    // Valider l'âge selon les restrictions de la course
    if (ageRestrictions && editingMemberData.birthDate) {
      console.log('🔍 [EDIT VALIDATION] Validation de l\'âge en cours...');

      if (!eventDate) {
        console.error('❌ [EDIT VALIDATION] eventDate manquante mais restrictions d\'âge présentes !');
        setError('Erreur: date de l\'événement non disponible pour vérifier l\'âge');
        return;
      }

      const birthDate = new Date(editingMemberData.birthDate);
      const raceDate = new Date(eventDate);

      // Calculer l'âge au 1er septembre de l'année de l'événement (règle FFA)
      const eventYear = raceDate.getFullYear();
      const september1st = new Date(eventYear, 8, 1);

      const age = september1st.getFullYear() - birthDate.getFullYear();
      const monthDiff = september1st.getMonth() - birthDate.getMonth();
      const dayDiff = september1st.getDate() - birthDate.getDate();

      let actualAge = age;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        actualAge--;
      }

      console.log('🔍 [EDIT VALIDATION] Âge calculé:', actualAge, 'ans (au 1er septembre', eventYear + ')');
      console.log('🔍 [EDIT VALIDATION] Restrictions: min =', ageRestrictions.min_age, ', max =', ageRestrictions.max_age);

      if (actualAge < ageRestrictions.min_age) {
        console.error('❌ [EDIT VALIDATION] Âge insuffisant:', actualAge, '<', ageRestrictions.min_age);
        setError(`L'âge minimum pour cette course est de ${ageRestrictions.min_age} ans. Cette personne aura ${actualAge} ans au 1er septembre ${eventYear}.`);
        return;
      }

      if (ageRestrictions.max_age !== null && actualAge > ageRestrictions.max_age) {
        console.error('❌ [EDIT VALIDATION] Âge trop élevé:', actualAge, '>', ageRestrictions.max_age);
        setError(`L'âge maximum pour cette course est de ${ageRestrictions.max_age} ans. Cette personne aura ${actualAge} ans au 1er septembre ${eventYear}.`);
        return;
      }

      console.log('✅ [EDIT VALIDATION] Âge valide:', actualAge, 'ans');
    }

    // Check if email already exists (excluding current member)
    if (members.some(m => m.id !== editingMemberId && m.email === editingMemberData.email)) {
      setError('Cet email est déjà utilisé par un autre membre');
      return;
    }

    // Validate license if FFA (check if it's an FFA license type)
    const selectedLicenseType = licenseTypes.find(lt => lt.id === editingMemberData.licenseType);
    const isFFALicenseEdit = selectedLicenseType?.name?.toLowerCase().includes('ffa') ||
                            selectedLicenseType?.name?.toLowerCase().includes('f.f.a');

    // Détecter si le numéro de licence FFA a changé
    const licenseIdChanged = editingMemberData.licenseId !== initialMemberData.licenseId;

    if (isFFALicenseEdit) {
      if (!editingMemberData.licenseId) {
        console.log('❌ Validation échouée: Numéro de licence FFA manquant');
        setError('Veuillez renseigner le numéro de licence FFA');
        return;
      }

      // Si le numéro de licence a changé OU si pas de vérification, demander la vérification
      if (licenseIdChanged || !ffaVerificationMessage.includes('✓')) {
        console.log('❌ Validation échouée: Licence FFA modifiée ou non vérifiée');
        if (licenseIdChanged) {
          setError('⚠️ Le numéro de licence a été modifié. Veuillez le VÉRIFIER à nouveau avant d\'enregistrer (cliquez sur "Vérifier")');
        } else {
          setError('⚠️ Veuillez VÉRIFIER la licence FFA avant de continuer (cliquez sur "Vérifier")');
        }
        return;
      }
    }

    // Validate PSP if required (non-FFA license on FFA race)
    const pspRequiredEdit = isFFAAffiliated && !isFFALicenseEdit;

    // Détecter si le numéro PSP a changé
    const ppsNumberChanged = editingMemberData.ppsNumber !== initialMemberData.ppsNumber;

    console.log('🔍 [EDIT VALIDATION PSP] pspRequiredEdit:', pspRequiredEdit);
    console.log('🔍 [EDIT VALIDATION PSP] isFFAAffiliated:', isFFAAffiliated);
    console.log('🔍 [EDIT VALIDATION PSP] isFFALicenseEdit:', isFFALicenseEdit);
    console.log('🔍 [EDIT VALIDATION PSP] editingMemberData.ppsNumber:', editingMemberData.ppsNumber);
    console.log('🔍 [EDIT VALIDATION PSP] initialMemberData.ppsNumber:', initialMemberData.ppsNumber);
    console.log('🔍 [EDIT VALIDATION PSP] ppsNumberChanged:', ppsNumberChanged);
    console.log('🔍 [EDIT VALIDATION PSP] pspVerificationMessage:', pspVerificationMessage);

    if (pspRequiredEdit) {
      if (!editingMemberData.ppsNumber) {
        console.log('❌ Validation échouée: PSP requis mais numéro manquant');
        setError('⚠️ Le numéro PSP est OBLIGATOIRE pour les non-licenciés FFA sur une course FFA');
        return;
      }

      // Si le numéro PSP a changé OU si pas de vérification, demander la vérification
      if (ppsNumberChanged || !pspVerificationMessage.includes('✓')) {
        console.log('❌ Validation échouée: PSP modifié ou non vérifié');
        if (ppsNumberChanged) {
          setError('⚠️ Le numéro PSP a été modifié. Veuillez le VÉRIFIER à nouveau avant d\'enregistrer (cliquez sur "Vérifier")');
        } else {
          setError('⚠️ Veuillez VÉRIFIER le numéro PSP avant de continuer (cliquez sur "Vérifier")');
        }
        return;
      }
    }

    // Validate required options
    const requiredOptions = raceOptions.filter(opt => opt.is_required);
    const missingRequiredOptions = requiredOptions.filter(opt => {
      const selected = editingMemberData.selectedOptions?.[opt.id];
      if (!selected) return true;
      if (selected.quantity === 0 || selected.quantity === undefined || selected.quantity === null) return true;
      if (opt.is_question && !selected.choice_id) return true;
      return false;
    });

    if (missingRequiredOptions.length > 0) {
      const optionNames = missingRequiredOptions.map(opt => opt.label).join(', ');
      setError(`Veuillez remplir les options obligatoires : ${optionNames}`);
      return;
    }

    console.log('✅ [EDIT VALIDATION] Toutes les validations passées');
    console.log('💾 [SAVE MEMBER] editingMemberData:', editingMemberData);
    console.log('💾 [SAVE MEMBER] editingMemberData.selectedOptions:', editingMemberData.selectedOptions);

    // Save the edited member
    const updatedMembers = members.map(m =>
      m.id === editingMemberId
        ? { ...m, ...editingMemberData }
        : m
    );

    console.log('💾 [SAVE MEMBER] Updated member:', updatedMembers.find(m => m.id === editingMemberId));
    console.log('💾 [SAVE MEMBER] Updated member options:', updatedMembers.find(m => m.id === editingMemberId)?.selectedOptions);

    setMembers(updatedMembers);
    setEditingMemberId(null);
    setEditingMemberData({});
    setInitialMemberData({});
    setError('');
    // Reset verification messages
    setFfaVerificationMessage('');
    setPspVerificationMessage('');
  };

  const toggleMemberExpansion = (memberId: string) => {
    if (expandedMemberId === memberId) {
      setExpandedMemberId(null);
      if (editingMemberId === memberId) {
        cancelEditingMember();
      }
    } else {
      setExpandedMemberId(memberId);
    }
  };

  const removeMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    // Reorder segments
    updated.forEach((member, i) => {
      member.segmentOrder = i + 1;
    });
    setMembers(updated);
  };

  const handleTeamInfoSubmit = () => {
    if (!teamName.trim()) {
      setError('Veuillez saisir un nom d\'équipe');
      return;
    }

    if (!emergencyContact.name || !emergencyContact.phone) {
      setError('Veuillez renseigner un contact d\'urgence');
      return;
    }

    setError('');
    setStep('members');
  };

  const handleMembersSubmit = () => {
    if (!isTeamComplete) {
      setError(`Vous devez inscrire ${remainingMembers} athlète(s) supplémentaire(s)`);
      return;
    }

    setError('');
    setStep('legal');
  };

  const handleFinalSubmit = async () => {
    if (!legalAcceptances.regulations || !legalAcceptances.rgpd) {
      setError('Vous devez accepter le règlement et la politique RGPD');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create team with all data
      const teamData = {
        event_id: eventId,
        race_id: raceId,
        organizer_id: organizerId,
        name: teamName,
        members: members,
        emergency_contact: emergencyContact,
        acceptances: legalAcceptances,
        is_relay_team: true,
        total_price_cents: teamPricing.subtotal,
        commission_cents: teamPricing.commission,
        team_category: determineTeamCategory(),
      };

      onComplete(teamData);
    } catch (err: any) {
      console.error('Error submitting team:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des informations...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mb-4 inline-flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all font-medium"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Retour à la présentation</span>
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-900">Inscription Relais / Ekiden</h2>
              <p className="text-gray-600 mt-2">
                {raceName} - Équipe de {teamSize} athlètes
              </p>
            </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center space-x-2 ${step === 'team-info' ? 'text-blue-600 font-semibold' : step === 'members' || step === 'legal' ? 'text-green-600' : 'text-gray-400'}`}>
              {(step === 'members' || step === 'legal') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">1</div>
              )}
              <span className="text-sm">Équipe</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
            <div className={`flex items-center space-x-2 ${step === 'members' ? 'text-blue-600 font-semibold' : step === 'legal' ? 'text-green-600' : 'text-gray-400'}`}>
              {step === 'legal' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">2</div>
              )}
              <span className="text-sm">Athlètes ({members.length}/{teamSize})</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
            <div className={`flex items-center space-x-2 ${step === 'legal' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
              <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs">3</div>
              <span className="text-sm">Validation</span>
            </div>
          </div>
        </div>

        {/* Step 1: Team Information */}
        {step === 'team-info' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Les Rapides, Team Carquefou, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact d'urgence (pour toute l'équipe)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ce contact sera utilisé en cas d'urgence pour n'importe quel membre de l'équipe
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      if (cleaned.length <= 10) {
                        const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
                        setEmergencyContact({ ...emergencyContact, phone: formatted });
                      }
                    }}
                    placeholder="06 12 34 56 78"
                    maxLength={14}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                  <input
                    type="text"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                    placeholder="Ami, famille, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleTeamInfoSubmit}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <span>Continuer vers les athlètes</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Members Registration */}
        {step === 'members' && (
          <div className="space-y-6">
            {/* Remaining counter */}
            {!isTeamComplete && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  <Users className="w-5 h-5 inline mr-2" />
                  Encore {remainingMembers} athlète(s) à saisir
                </p>
              </div>
            )}

            {/* List of added members */}
            {members.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Athlètes inscrits ({members.length}/{teamSize})</h3>
                </div>
                <div className="divide-y">
                  {members.map((member, index) => {
                    const isExpanded = expandedMemberId === member.id;
                    const isEditing = editingMemberId === member.id;
                    const displayData = isEditing ? { ...member, ...editingMemberData } : member;

                    return (
                      <div key={member.id} className="bg-white">
                        {/* Header - Always visible */}
                        <div
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                          onClick={() => !isEditing && toggleMemberExpansion(member.id)}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                              {member.segmentOrder}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {member.firstName} {member.lastName} ({member.gender === 'M' ? 'Homme' : 'Femme'})
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.email}
                                {segments[index] && (
                                  <span className="ml-2 text-blue-600 inline-flex items-center gap-1">
                                    → {getSportIcon(segments[index].discipline)} {segments[index].name} ({segments[index].distance} km)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingMember(member);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMember(index);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            {!isEditing && (
                              isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded content - Editable */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 bg-gray-50 border-t">
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                    <input
                                      type="text"
                                      value={displayData.firstName || ''}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, firstName: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <input
                                      type="text"
                                      value={displayData.lastName || ''}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, lastName: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                      type="email"
                                      value={displayData.email || ''}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, email: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                      type="tel"
                                      value={displayData.phone || ''}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, phone: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                                    <select
                                      value={displayData.gender || 'M'}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, gender: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                      <option value="M">Homme</option>
                                      <option value="F">Femme</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                                    <input
                                      type="date"
                                      value={displayData.birthDate || ''}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, birthDate: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationalité *</label>
                                    <select
                                      value={displayData.nationality || 'FRA'}
                                      onChange={(e) => setEditingMemberData({ ...editingMemberData, nationality: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                      {countries.map((country) => (
                                        <option key={country.code} value={country.code}>
                                          {country.name} ({country.code})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Licence Type */}
                                  {licenseTypes.length > 0 && (
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Type de licence *
                                      </label>
                                      <select
                                        value={displayData.licenseType || ''}
                                        onChange={(e) => setEditingMemberData({ ...editingMemberData, licenseType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                      >
                                        <option value="">Sélectionner un type de licence</option>
                                        {licenseTypes.map((lt) => (
                                          <option key={lt.id} value={lt.id}>
                                            {lt.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {/* Licence FFA */}
                                  {displayData.licenseType && licenseTypes.find(lt => lt.id === displayData.licenseType)?.code === 'FFA' && (
                                    <>
                                      <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de licence FFA *</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={editingMemberData.licenseId || ''}
                                            onChange={(e) => {
                                              setEditingMemberData({ ...editingMemberData, licenseId: e.target.value });
                                              setFfaVerificationMessage(''); // Réinitialiser si modifié
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="123456"
                                          />
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              console.log('[BTN RELAY FFA] Cliqué !');
                                              console.log('[BTN RELAY FFA] editingMemberData:', editingMemberData);
                                              verifyFFALicense();
                                            }}
                                            disabled={ffaVerifying || !editingMemberData.licenseId || !editingMemberData.firstName || !editingMemberData.lastName || !editingMemberData.birthDate}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap text-sm"
                                          >
                                            {ffaVerifying ? 'Vérification...' : 'Vérifier'}
                                          </button>
                                        </div>
                                        {ffaVerifying && (
                                          <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-300 text-xs">
                                            <p className="text-blue-800">🔄 Vérification en cours auprès de la FFA...</p>
                                          </div>
                                        )}
                                        {ffaVerificationMessage && (
                                          <div className={`mt-2 p-2 rounded-lg text-xs ${
                                            ffaVerificationMessage.includes('✓')
                                              ? 'bg-green-50 text-green-800 border border-green-500'
                                              : 'bg-amber-50 text-amber-800 border border-amber-400'
                                          }`}>
                                            <p className="font-medium">{ffaVerificationMessage}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Club FFA {ffaVerificationMessage.includes('✓') ? '(vérifié)' : ''}
                                        </label>
                                        <input
                                          type="text"
                                          value={displayData.licenseClub || ''}
                                          onChange={(e) => setEditingMemberData({ ...editingMemberData, licenseClub: e.target.value })}
                                          placeholder="Sera rempli automatiquement après vérification"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          Le club est rempli automatiquement, mais peut être modifié
                                        </p>
                                      </div>
                                    </>
                                  )}

                                  {/* PSP */}
                                  {displayData.licenseType && licenseTypes.find(lt => lt.id === displayData.licenseType)?.code !== 'FFA' && isFFAAffiliated && (
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Numéro PSP (Pass Prévention Santé) *
                                      </label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={editingMemberData.ppsNumber || ''}
                                          onChange={(e) => setEditingMemberData({ ...editingMemberData, ppsNumber: e.target.value.toUpperCase() })}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                          placeholder="P123456"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            console.log('[BTN RELAY PSP] Cliqué !');
                                            console.log('[BTN RELAY PSP] editingMemberData:', editingMemberData);
                                            console.log('[BTN RELAY PSP] ppsNumber:', editingMemberData.ppsNumber);
                                            console.log('[BTN RELAY PSP] firstName:', editingMemberData.firstName);
                                            console.log('[BTN RELAY PSP] lastName:', editingMemberData.lastName);
                                            console.log('[BTN RELAY PSP] birthDate:', editingMemberData.birthDate);
                                            verifyPSP();
                                          }}
                                          disabled={pspVerifying || !editingMemberData.ppsNumber || !editingMemberData.firstName || !editingMemberData.lastName || !editingMemberData.birthDate}
                                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap text-sm"
                                        >
                                          {pspVerifying ? 'Vérification...' : 'Vérifier'}
                                        </button>
                                      </div>
                                      {pspVerificationMessage && (
                                        <div className={`mt-2 p-2 rounded-lg text-xs ${
                                          pspVerificationMessage.includes('✓')
                                            ? 'bg-green-50 text-green-800 border border-green-500'
                                            : 'bg-amber-50 text-amber-800 border border-amber-400'
                                        }`}>
                                          <p className="font-medium">{pspVerificationMessage}</p>
                                        </div>
                                      )}
                                      <p className="text-xs text-amber-700 mt-1">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        Obligatoire pour les non-licenciés FFA sur une course FFA
                                      </p>
                                    </div>
                                  )}

                                  {/* Options */}
                                  {raceOptions.length > 0 && (
                                    <div className="md:col-span-2 space-y-3">
                                      <h4 className="font-medium text-gray-900 text-sm border-t pt-3 mt-2">Options de course</h4>
                                      {raceOptions.map((option) => (
                                        <div key={option.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <label className="font-medium text-gray-900 text-sm">
                                                {option.label}
                                                {option.is_required && <span className="text-red-600 ml-1">*</span>}
                                              </label>
                                              {option.description && (
                                                <p className="text-xs text-gray-600">{option.description}</p>
                                              )}
                                            </div>
                                            {option.price_cents > 0 && (
                                              <span className="text-blue-600 font-medium text-sm">
                                                +{(option.price_cents / 100).toFixed(2)}€
                                              </span>
                                            )}
                                          </div>
                                          {option.is_question && option.choices.length > 0 ? (
                                            <select
                                              value={displayData.selectedOptions?.[option.id]?.choice_id || ''}
                                              onChange={(e) => {
                                                const opts = { ...displayData.selectedOptions };
                                                if (e.target.value) {
                                                  opts[option.id] = { choice_id: e.target.value, quantity: 1 };
                                                } else {
                                                  delete opts[option.id];
                                                }
                                                setEditingMemberData({ ...editingMemberData, selectedOptions: opts });
                                              }}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            >
                                              <option value="">-- Choisir --</option>
                                              {option.choices.map((choice) => (
                                                <option key={choice.id} value={choice.id}>
                                                  {choice.label} {choice.price_modifier_cents > 0 && `(+${(choice.price_modifier_cents / 100).toFixed(2)}€)`}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              type="number"
                                              min="0"
                                              max="99"
                                              value={displayData.selectedOptions?.[option.id]?.quantity || 0}
                                              onChange={(e) => {
                                                const qty = parseInt(e.target.value) || 0;
                                                const opts = { ...displayData.selectedOptions };
                                                if (qty > 0) {
                                                  opts[option.id] = { quantity: qty };
                                                } else {
                                                  delete opts[option.id];
                                                }
                                                setEditingMemberData({ ...editingMemberData, selectedOptions: opts });
                                              }}
                                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Error Message in Edit Mode */}
                                {error && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-start space-x-2">
                                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-2 border-t">
                                  <button
                                    onClick={cancelEditingMember}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    onClick={saveEditingMember}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                                  >
                                    <Save className="w-4 h-4" />
                                    <span>Enregistrer</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="font-medium text-gray-700">Téléphone:</span>
                                    <span className="ml-2 text-gray-600">{member.phone || 'Non renseigné'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Date de naissance:</span>
                                    <span className="ml-2 text-gray-600">{new Date(member.birthDate).toLocaleDateString('fr-FR')}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Nationalité:</span>
                                    <span className="ml-2 text-gray-600">{member.nationality}</span>
                                  </div>
                                  {member.licenseType && (
                                    <>
                                      <div>
                                        <span className="font-medium text-gray-700">Type de licence:</span>
                                        <span className="ml-2 text-gray-600">{licenseTypes.find(lt => lt.id === member.licenseType)?.name || member.licenseType}</span>
                                      </div>
                                      {member.licenseId && (
                                        <div>
                                          <span className="font-medium text-gray-700">N° licence:</span>
                                          <span className="ml-2 text-gray-600">{member.licenseId}</span>
                                        </div>
                                      )}
                                      {member.licenseClub && (
                                        <div>
                                          <span className="font-medium text-gray-700">Club:</span>
                                          <span className="ml-2 text-gray-600">{member.licenseClub}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {member.ppsNumber && (
                                    <div>
                                      <span className="font-medium text-gray-700">PSP:</span>
                                      <span className="ml-2 text-gray-600">{member.ppsNumber}</span>
                                    </div>
                                  )}
                                </div>
                                {member.selectedOptions && Object.keys(member.selectedOptions).length > 0 && (
                                  <div className="border-t pt-2 mt-2">
                                    <span className="font-medium text-gray-700 block mb-1">Options sélectionnées:</span>
                                    <ul className="ml-4 space-y-1">
                                      {Object.entries(member.selectedOptions).map(([optionId, selection]) => {
                                        const option = raceOptions.find(o => o.id === optionId);
                                        if (!option) return null;

                                        if (option.is_question && selection.choice_id) {
                                          const choice = option.choices.find(c => c.id === selection.choice_id);
                                          return (
                                            <li key={optionId} className="text-gray-600 text-xs">
                                              • {option.label}: <strong>{choice?.label}</strong>
                                            </li>
                                          );
                                        } else if (selection.quantity > 0) {
                                          return (
                                            <li key={optionId} className="text-gray-600 text-xs">
                                              • {option.label}: <strong>×{selection.quantity}</strong>
                                            </li>
                                          );
                                        }
                                        return null;
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add member form */}
            {!isTeamComplete && (
              <div className="border border-blue-300 rounded-lg p-6 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Ajouter un athlète
                  {segments[members.length] && (
                    <span className="ml-2 text-sm text-blue-600 font-normal flex items-center gap-1">
                      → {getSportIcon(segments[members.length].discipline)} {segments[members.length].name} ({segments[members.length].distance} km)
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={currentMember.firstName}
                      onChange={(e) => setCurrentMember({ ...currentMember, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={currentMember.lastName}
                      onChange={(e) => setCurrentMember({ ...currentMember, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={currentMember.email}
                      onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={currentMember.phone}
                      onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre *</label>
                    <select
                      value={currentMember.gender}
                      onChange={(e) => setCurrentMember({ ...currentMember, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance *</label>
                    <input
                      type="date"
                      value={currentMember.birthDate}
                      onChange={(e) => setCurrentMember({ ...currentMember, birthDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité *</label>
                    <select
                      value={currentMember.nationality}
                      onChange={(e) => setCurrentMember({ ...currentMember, nationality: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez un pays</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {licenseTypes.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Type de licence *
                      </label>
                      <select
                        value={currentMember.licenseType}
                        onChange={(e) => setCurrentMember({ ...currentMember, licenseType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Sélectionner un type de licence</option>
                        {licenseTypes.map((lt) => (
                          <option key={lt.id} value={lt.id}>
                            {lt.name}
                          </option>
                        ))}
                      </select>
                      {isFFAAffiliated && currentMember.licenseType && !isFFALicense() && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                          <p className="text-sm text-amber-900 font-medium flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Un Pass Prévention Santé (PSP) sera obligatoire pour cette course FFA
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {isFFALicense() && (
                    <>
                      <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <label className="block text-sm font-bold text-blue-900 mb-2">
                          Numéro de licence FFA *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={currentMember.licenseId}
                            onChange={(e) => {
                              setCurrentMember({ ...currentMember, licenseId: e.target.value });
                              setFfaVerificationMessage(''); // Réinitialiser le message si l'utilisateur modifie
                            }}
                            className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Ex: 929636"
                          />
                          <button
                            type="button"
                            onClick={verifyFFALicense}
                            disabled={ffaVerifying || !currentMember.licenseId}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                          >
                            {ffaVerifying ? 'Vérification...' : 'Vérifier'}
                          </button>
                        </div>
                        {ffaVerifying && (
                          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-300">
                            <p className="text-sm text-blue-800">🔄 Vérification en cours auprès de la FFA...</p>
                          </div>
                        )}
                        {ffaVerificationMessage && (
                          <div className={`mt-2 p-3 rounded-lg ${
                            ffaVerificationMessage.includes('✓')
                              ? 'bg-green-50 text-green-800 border border-green-500'
                              : 'bg-red-50 text-red-800 border border-red-500'
                          }`}>
                            <p className="text-sm font-medium">{ffaVerificationMessage}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Club FFA {ffaVerificationMessage.includes('✓') ? '(vérifié)' : ''}
                        </label>
                        <input
                          type="text"
                          value={currentMember.licenseClub || ''}
                          onChange={(e) => setCurrentMember({ ...currentMember, licenseClub: e.target.value })}
                          placeholder="Sera rempli automatiquement après vérification"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Le nom du club sera rempli automatiquement lors de la vérification de la licence
                        </p>
                      </div>
                    </>
                  )}

                  {(() => {
                    const pspRequired = requiresPSP();
                    console.log('🔍 AFFICHAGE PSP - isFFAAffiliated:', isFFAAffiliated);
                    console.log('🔍 AFFICHAGE PSP - licenseType:', currentMember.licenseType);
                    console.log('🔍 AFFICHAGE PSP - isFFALicense():', isFFALicense());
                    console.log('🔍 AFFICHAGE PSP - requiresPSP():', pspRequired);
                    return pspRequired;
                  })() && (
                    <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                      <label className="block text-sm font-bold text-amber-900 mb-2">
                        ⚠️ Numéro PSP (Pass Prévention Santé) * - OBLIGATOIRE POUR VALIDER
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentMember.ppsNumber}
                          onChange={(e) => setCurrentMember({ ...currentMember, ppsNumber: e.target.value.toUpperCase() })}
                          className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                          placeholder="Ex: P123456"
                        />
                        <button
                          type="button"
                          onClick={verifyPSP}
                          disabled={pspVerifying || !currentMember.ppsNumber}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                          {pspVerifying ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                      {pspVerificationMessage && (
                        <div className={`mt-2 p-3 rounded-lg ${
                          pspVerificationMessage.includes('✓')
                            ? 'bg-green-50 text-green-800 border border-green-500'
                            : 'bg-amber-50 text-amber-800 border border-amber-400'
                        }`}>
                          <p className="text-sm font-medium">{pspVerificationMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {raceOptions.length > 0 && (
                    <div className="md:col-span-2 border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Options pour cet athlète</h4>
                      <div className="space-y-3">
                        {raceOptions.map((option) => (
                          <div key={option.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <label className="font-medium text-gray-900">
                                  {option.label}
                                  {option.is_required && <span className="text-red-600 ml-1">*</span>}
                                </label>
                                {option.description && (
                                  <p className="text-sm text-gray-600">{option.description}</p>
                                )}
                              </div>
                              {option.price_cents > 0 && (
                                <span className="text-blue-600 font-medium">
                                  +{(option.price_cents / 100).toFixed(2)}€
                                </span>
                              )}
                            </div>
                            {option.is_question && option.choices.length > 0 ? (
                              <select
                                required={option.is_required}
                                value={currentMember.selectedOptions?.[option.id]?.choice_id || ''}
                                onChange={(e) => {
                                  const opts = { ...currentMember.selectedOptions };
                                  if (e.target.value) {
                                    opts[option.id] = { choice_id: e.target.value, quantity: 1 };
                                  } else {
                                    delete opts[option.id];
                                  }
                                  setCurrentMember({ ...currentMember, selectedOptions: opts });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Sélectionner...</option>
                                {option.choices.map((choice) => (
                                  <option key={choice.id} value={choice.id}>
                                    {choice.label}
                                    {choice.price_modifier_cents !== 0 &&
                                      ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(
                                        choice.price_modifier_cents / 100
                                      ).toFixed(2)}€)`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={!!currentMember.selectedOptions?.[option.id]}
                                  onChange={(e) => {
                                    const opts = { ...currentMember.selectedOptions };
                                    if (e.target.checked) {
                                      opts[option.id] = { quantity: 1 };
                                    } else {
                                      delete opts[option.id];
                                    }
                                    setCurrentMember({ ...currentMember, selectedOptions: opts });
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">Oui, je souhaite cette option</span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={addMember}
                  className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Ajouter cet athlète</span>
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep('team-info')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              {isTeamComplete && (
                <button
                  onClick={handleMembersSubmit}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <span>Continuer vers la validation</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Legal Acceptances & Summary */}
        {step === 'legal' && (
          <div className="space-y-6">
            {/* Team Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                <Check className="w-5 h-5 mr-2" />
                Récapitulatif de l'équipe
              </h3>
              <div className="space-y-3 text-sm text-green-800">
                <p><strong>Équipe :</strong> {teamName}</p>
                <p><strong>Catégorie :</strong> {determineTeamCategory()}</p>
                <p><strong>Nombre d'athlètes :</strong> {members.length}</p>

                {/* Détail par athlète */}
                <div className="border-t border-green-300 pt-3 mt-3">
                  <p className="font-semibold mb-2">Détail des inscriptions :</p>
                  <div className="space-y-3 ml-2">
                    {members.map((member, index) => {
                      // Trouver la période active
                      const now = new Date();
                      const activePeriod = pricingPeriods.find(p => {
                        if (!p.active) return false;
                        const startDate = new Date(p.start_date);
                        const endDate = new Date(p.end_date);
                        return now >= startDate && now <= endDate;
                      });

                      // Prix de base pour cet athlète
                      const pricing = racePricing.find(
                        p => p.race_id === raceId &&
                             p.license_type_id === member.licenseType &&
                             p.pricing_period_id === activePeriod?.id
                      );

                      const licenseTypeName = licenseTypes.find(lt => lt.id === member.licenseType)?.name || 'Non spécifié';
                      const basePrice = pricing?.price_cents || 0;

                      // Options pour cet athlète
                      const memberOptions: Array<{ label: string; price: number }> = [];
                      if (member.selectedOptions) {
                        Object.entries(member.selectedOptions).forEach(([optionId, optionData]) => {
                          const raceOption = raceOptions.find(opt => opt.id === optionId);
                          if (!raceOption) {
                            console.warn(`⚠️ Option non trouvée: ${optionId}`);
                            return;
                          }

                          if (optionData.choice_id) {
                            const choice = raceOption.choices?.find(c => c.id === optionData.choice_id);
                            if (choice && optionData.quantity > 0) {
                              // Prix = prix de base de l'option + modificateur du choix
                              const basePrice = raceOption.price_cents || 0;
                              const modifier = choice.price_modifier_cents || 0;
                              const optionPrice = (basePrice + modifier) * optionData.quantity;
                              memberOptions.push({
                                label: `${raceOption.label} : ${choice.label}`,
                                price: optionPrice
                              });
                              console.log(`📦 Option récap: ${raceOption.label} - ${choice.label} = ${optionPrice / 100}€ (base: ${basePrice}, modifier: ${modifier})`);
                            }
                          } else if (optionData.quantity > 0) {
                            const optionPrice = (raceOption.price_cents || 0) * optionData.quantity;
                            if (optionPrice > 0 || raceOption.is_required) {
                              memberOptions.push({
                                label: raceOption.label,
                                price: optionPrice
                              });
                              console.log(`📦 Option récap: ${raceOption.label} = ${optionPrice / 100}€`);
                            }
                          }
                        });
                      }

                      const segment = segments[index];
                      const genderLabel = member.gender === 'M' ? 'Homme' : 'Femme';

                      return (
                        <div key={member.id} className="bg-green-100 p-2 rounded">
                          <p className="font-medium text-green-900">
                            Coureur {index + 1} ({genderLabel}){segment ? ` - ${segment.name} (${segment.distance} km)` : ''} : {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs">Type de licence : {licenseTypeName} - {(basePrice / 100).toFixed(2)} €</p>
                          {memberOptions.length > 0 && (
                            <div className="text-xs mt-1 space-y-0.5">
                              {memberOptions.map((opt, i) => (
                                <p key={i} className="ml-2">• {opt.label} : +{(opt.price / 100).toFixed(2)} €</p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total */}
                {teamPricing.total > 0 ? (
                  <div className="border-t border-green-400 pt-3 mt-3 space-y-1">
                    <p><strong>Sous-total :</strong> {(teamPricing.subtotal / 100).toFixed(2)} €</p>
                    <p className="text-xs"><em>Frais de service Timepulse ({members.length} × 0,99€) :</em> {(teamPricing.commission / 100).toFixed(2)} €</p>
                    <p className="font-bold text-base pt-2 border-t border-green-500 mt-2"><strong>Montant total :</strong> {(teamPricing.total / 100).toFixed(2)} €</p>
                  </div>
                ) : (
                  <p><strong>Montant :</strong> Gratuit</p>
                )}

                <p className="pt-2 border-t border-green-300"><strong>Contact d'urgence :</strong> {emergencyContact.name} ({emergencyContact.phone})</p>
              </div>
            </div>

            {/* Regulations */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Règlement sportif</h3>
              <div className="max-h-60 overflow-y-auto text-sm text-gray-700 mb-4 p-4 bg-gray-50 rounded">
                {regulations || 'Aucun règlement spécifique.'}
              </div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAcceptances.regulations}
                  onChange={(e) => setLegalAcceptances({ ...legalAcceptances, regulations: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm text-gray-700">
                  <strong>Tous les membres de l'équipe acceptent</strong> le règlement sportif de cette épreuve
                </div>
              </label>
            </div>

            {/* RGPD */}
            <div className="border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Protection des données (RGPD)</h3>
              <div className="text-sm text-gray-700 mb-4 space-y-2">
                <p>Les informations recueillies font l'objet d'un traitement informatique destiné à la gestion de votre inscription.</p>
                <p>Conformément à la loi "informatique et libertés", vous pouvez exercer votre droit d'accès aux données vous concernant et les faire rectifier en contactant l'organisateur.</p>
              </div>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAcceptances.rgpd}
                  onChange={(e) => setLegalAcceptances({ ...legalAcceptances, rgpd: e.target.checked })}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm text-gray-700">
                  <strong>Tous les membres de l'équipe acceptent</strong> la politique de protection des données
                </div>
              </label>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setStep('members')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !legalAcceptances.regulations || !legalAcceptances.rgpd}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
              >
                {loading ? 'Traitement en cours...' : 'Procéder au paiement'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
