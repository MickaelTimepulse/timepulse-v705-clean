import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Calendar, Mail, Phone, MapPin, Home, CreditCard, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import { loadCountries, type Country } from '../lib/countries';
import { checkCategoryRestriction } from '../lib/category-calculator';

interface Race {
  id: string;
  name: string;
  distance: string;
  elevation_gain: number;
  max_participants: number;
  current_participants: number;
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

interface LicenseType {
  id: string;
  name: string;
  code: string;
}

interface PricingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

interface RacePricing {
  id: string;
  license_type_id: string;
  pricing_period_id: string;
  price_cents: number;
  license_types: LicenseType;
}

interface PublicRegistrationFormProps {
  eventId: string;
  organizerId: string;
  onComplete: (data: any) => void;
  preselectedRaceId?: string;
  initialData?: any;
}

export default function PublicRegistrationForm({ eventId, organizerId, onComplete, preselectedRaceId, initialData }: PublicRegistrationFormProps) {
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>(preselectedRaceId || '');
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [pricingPeriods, setPricingPeriods] = useState<PricingPeriod[]>([]);
  const [racePricing, setRacePricing] = useState<RacePricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [eventSlug, setEventSlug] = useState<string>('');

  const [formData, setFormData] = useState(initialData?.athlete_data || {
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: 'M',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    postal_code: '',
    country_code: 'FR',
    license_type: '',
    license_id: '',
    license_club: '',
    pps_number: '',
    consent_data_processing: false,
    consent_marketing: false,
    organizer_id: '',
    nationality: 'FRA',
    is_anonymous: false,
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [ffaLicenseData, setFfaLicenseData] = useState<any>(null);
  const [ffaValidationErrors, setFfaValidationErrors] = useState<string[]>([]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, { choice_id?: string; value?: string; quantity: number }>>(initialData?.options_data || {});
  const [categoryError, setCategoryError] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [ffaVerifying, setFfaVerifying] = useState(false);
  const [ffaVerificationMessage, setFfaVerificationMessage] = useState<string>('');
  const [calorgCode, setCalorgCode] = useState<string>('');
  const [pspVerifying, setPspVerifying] = useState(false);
  const [pspVerificationMessage, setPspVerificationMessage] = useState<string>('');
  const [pspWarning, setPspWarning] = useState<string>('');
  const [regulationsAccepted, setRegulationsAccepted] = useState<boolean>(false);
  const [raceRegulations, setRaceRegulations] = useState<string>('');
  const [ageRestrictions, setAgeRestrictions] = useState<{ min_age: number; max_age: number | null } | null>(null);
  const [ageError, setAgeError] = useState<string>('');
  const [genderRestriction, setGenderRestriction] = useState<'all' | 'M' | 'F'>('all');

  const isFFALicense = () => {
    const selectedLicense = licenseTypes.find(lt => lt.id === formData.license_type);
    return selectedLicense?.code === 'FFA';
  };

  const isNonLicencie = () => {
    const selectedLicense = licenseTypes.find(lt => lt.id === formData.license_type);
    return selectedLicense?.code === 'NON_LIC';
  };

  const requiresPSP = () => {
    return !isFFALicense() && formData.license_type && calorgCode;
  };

  useEffect(() => {
    loadCountriesData();
    loadRaces();
    loadLicenseTypes();
    loadEventOrganizer();
  }, [eventId]);

  const loadEventOrganizer = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('organizer_id, slug, start_date, ffa_calorg_code, ffa_affiliated')
      .eq('id', eventId)
      .single();

    if (!error && data) {
      setFormData(prev => ({ ...prev, organizer_id: data.organizer_id }));
      setEventSlug(data.slug || '');
      setCalorgCode(data.ffa_calorg_code || '');
      if (data.start_date) {
        setEventDate(new Date(data.start_date));
      }
    }
  };

  useEffect(() => {
    if (selectedRaceId) {
      loadRaceOptions();
      loadRacePricing();
      loadLicenseTypes();
      loadPricingPeriods();
      loadRaceRegulations();
      loadAgeRestrictions();
      loadGenderRestriction();
    }
  }, [selectedRaceId]);

  const loadRaceRegulations = async () => {
    const { data, error } = await supabase
      .from('races')
      .select('regulations')
      .eq('id', selectedRaceId)
      .single();

    if (!error && data && data.regulations) {
      setRaceRegulations(data.regulations);
      setRegulationsAccepted(false);
    } else {
      setRaceRegulations('');
      setRegulationsAccepted(true);
    }
  };

  const loadCountriesData = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const loadRaces = async () => {
    const [racesRes, eventRes] = await Promise.all([
      supabase
        .from('races')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .order('distance'),
      supabase
        .from('events')
        .select('start_date')
        .eq('id', eventId)
        .single()
    ]);

    if (!racesRes.error && racesRes.data) {
      setRaces(racesRes.data);
    }

    if (!eventRes.error && eventRes.data) {
      setEventDate(new Date(eventRes.data.start_date));
    }
  };

  const loadRaceOptions = async () => {
    const { data, error } = await supabase
      .from('race_options')
      .select(`
        *,
        race_option_choices (*)
      `)
      .eq('race_id', selectedRaceId)
      .eq('active', true)
      .order('display_order');

    if (!error && data) {
      const options = data.map((opt: any) => ({
        ...opt,
        choices: (opt.race_option_choices || []).sort((a: any, b: any) => a.display_order - b.display_order)
      }));
      console.log('Loaded race options:', options);
      setRaceOptions(options);
    } else if (error) {
      console.error('Error loading race options:', error);
    }
  };

  const loadAgeRestrictions = async () => {
    if (!selectedRaceId) {
      setAgeRestrictions(null);
      return;
    }

    const { data, error } = await supabase
      .from('race_category_restrictions')
      .select(`
        category_code,
        ffa_categories (
          min_age,
          max_age
        )
      `)
      .eq('race_id', selectedRaceId);

    if (!error && data && data.length > 0) {
      const minAge = Math.min(...data.map((r: any) => r.ffa_categories.min_age));
      const maxAges = data.map((r: any) => r.ffa_categories.max_age).filter((age: any) => age !== null);
      const maxAge = maxAges.length > 0 ? Math.max(...maxAges) : null;

      setAgeRestrictions({ min_age: minAge, max_age: maxAge });
    } else {
      setAgeRestrictions(null);
    }
  };

  const loadGenderRestriction = async () => {
    if (!selectedRaceId) {
      setGenderRestriction('all');
      return;
    }

    const { data, error } = await supabase
      .from('races')
      .select('gender_restriction')
      .eq('id', selectedRaceId)
      .single();

    if (!error && data) {
      const restriction = data.gender_restriction || 'all';
      setGenderRestriction(restriction as 'all' | 'M' | 'F');

      // Ajuster le genre sélectionné si nécessaire
      if (restriction === 'M' && formData.gender !== 'M') {
        setFormData({ ...formData, gender: 'M' });
      } else if (restriction === 'F' && formData.gender !== 'F') {
        setFormData({ ...formData, gender: 'F' });
      }
    } else {
      setGenderRestriction('all');
    }
  };

  const checkAgeEligibility = (birthdate: string) => {
    if (!birthdate || !ageRestrictions || !eventDate) {
      setAgeError('');
      return true;
    }

    const birth = new Date(birthdate);

    // Pour les épreuves FFA, on calcule l'âge au 1er septembre de l'année de l'événement
    const eventYear = eventDate.getFullYear();
    const september1st = new Date(eventYear, 8, 1); // 8 = septembre (index 0)
    const referenceDate = september1st;

    const age = referenceDate.getFullYear() - birth.getFullYear();
    const monthDiff = referenceDate.getMonth() - birth.getMonth();
    const dayDiff = referenceDate.getDate() - birth.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }

    if (actualAge < ageRestrictions.min_age) {
      setAgeError(`❌ Vous devez avoir au minimum ${ageRestrictions.min_age} ans au 1er septembre ${eventYear} pour participer à cette épreuve. Vous aurez ${actualAge} ans.`);
      return false;
    }

    if (ageRestrictions.max_age !== null && actualAge > ageRestrictions.max_age) {
      setAgeError(`❌ L'âge maximum pour cette épreuve est de ${ageRestrictions.max_age} ans au 1er septembre ${eventYear}. Vous aurez ${actualAge} ans.`);
      return false;
    }

    setAgeError('');
    return true;
  };

  const loadLicenseTypes = async () => {
    if (!selectedRaceId) {
      setLicenseTypes([]);
      return;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('race_pricing')
      .select(`
        license_type_id,
        license_types (
          id,
          code,
          name,
          federation
        ),
        pricing_periods (
          id,
          name,
          start_date,
          end_date,
          active
        )
      `)
      .eq('race_id', selectedRaceId)
      .eq('active', true);

    if (!error && data) {
      const availableLicenseTypes = data
        .filter((pricing: any) => {
          const period = pricing.pricing_periods;
          if (!period || !period.active) return false;

          const startDate = new Date(period.start_date);
          const endDate = new Date(period.end_date);
          const currentDate = new Date(now);

          return currentDate >= startDate && currentDate <= endDate;
        })
        .map((pricing: any) => pricing.license_types)
        .filter((lt: any, index: number, self: any[]) =>
          lt && self.findIndex((t: any) => t?.id === lt.id) === index
        );

      setLicenseTypes(availableLicenseTypes);
    }
  };

  const loadPricingPeriods = async () => {
    if (!selectedRaceId) {
      setPricingPeriods([]);
      return;
    }

    const { data, error } = await supabase
      .from('pricing_periods')
      .select('*')
      .eq('race_id', selectedRaceId)
      .order('start_date');

    if (!error && data) {
      setPricingPeriods(data);
    }
  };

  const loadRacePricing = async () => {
    const { data, error } = await supabase
      .from('race_pricing')
      .select('*, license_types (*)')
      .eq('race_id', selectedRaceId)
      .eq('active', true);

    if (!error && data) {
      setRacePricing(data);
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const determineCategory = () => {
    if (!formData.birthdate) return 'Adulte';
    const age = calculateAge(formData.birthdate);
    const gender = formData.gender;

    if (age < 18) return 'Junior';
    if (age < 23) return 'Espoir';
    if (age < 40) return gender === 'M' ? 'Senior H' : 'Senior F';
    if (age < 50) return gender === 'M' ? 'V1 H' : 'V1 F';
    if (age < 60) return gender === 'M' ? 'V2 H' : 'V2 F';
    return gender === 'M' ? 'V3 H' : 'V3 F';
  };

  const getBaseRegistrationPrice = () => {
    const now = new Date();
    const activePeriod = pricingPeriods.find(p => {
      if (!p.active) return false;
      const startDate = new Date(p.start_date);
      const endDate = new Date(p.end_date);
      return now >= startDate && now <= endDate;
    });

    if (activePeriod && formData.license_type) {
      const pricing = racePricing.find(
        p => p.license_type_id === formData.license_type && p.pricing_period_id === activePeriod.id
      );
      if (pricing) {
        return pricing.price_cents;
      }
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    let total = getBaseRegistrationPrice();

    Object.entries(selectedOptions).forEach(([optionId, selection]) => {
      const option = raceOptions.find(o => o.id === optionId);
      if (option) {
        if (selection.choice_id) {
          const choice = option.choices.find(c => c.id === selection.choice_id);
          if (choice) {
            total += option.price_cents + choice.price_modifier_cents;
          }
        } else {
          total += option.price_cents * selection.quantity;
        }
      }
    });

    return total;
  };

  const verifyFFALicense = async () => {
    console.log('[DEBUG] ===== DÉBUT VÉRIFICATION FFA =====');
    console.log('[DEBUG] formData.license_id:', formData.license_id);
    console.log('[DEBUG] formData.last_name:', formData.last_name);
    console.log('[DEBUG] formData.first_name:', formData.first_name);
    console.log('[DEBUG] formData.birthdate:', formData.birthdate);
    console.log('[DEBUG] formData complet:', formData);
    console.log('[DEBUG] ======================================');

    if (!formData.license_id) return;

    // Validation: Un numéro de licence FFA est composé UNIQUEMENT de chiffres
    // Les numéros PSP commencent par 'P' et ne doivent PAS être acceptés ici
    const licenseNumber = formData.license_id.trim().toUpperCase();
    if (licenseNumber.startsWith('P')) {
      setFfaVerificationMessage('❌ Ce numéro commence par "P" - il s\'agit d\'un numéro PSP (Pass Prévention Santé), pas d\'une licence FFA. Les licences FFA sont composées uniquement de chiffres.');
      setFfaLicenseData(null);
      setFfaValidationErrors(['Veuillez sélectionner le type de licence "Non licencié(e) (PSP)" si vous avez un Pass Prévention Santé.']);
      setFfaVerifying(false);
      return;
    }

    // Validation: Le numéro doit contenir uniquement des chiffres
    if (!/^\d+$/.test(licenseNumber)) {
      setFfaVerificationMessage('❌ Le numéro de licence FFA doit contenir uniquement des chiffres.');
      setFfaLicenseData(null);
      setFfaValidationErrors(['Format invalide. Une licence FFA est composée de 6 à 8 chiffres.']);
      setFfaVerifying(false);
      return;
    }

    setFfaVerifying(true);
    setFfaVerificationMessage('');

    try {
      const { data: credentials } = await supabase
        .rpc('get_ffa_credentials')
        .maybeSingle();

      if (!credentials || !credentials.uid || !credentials.password) {
        setFfaVerificationMessage('❌ Configuration FFA manquante dans les paramètres admin');
        setFfaVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;

      const birthYear = formData.birthdate ? new Date(formData.birthdate).getFullYear().toString() : '';

      // Utilisation du code CalOrg réel de l'événement
      const testCalorgCode = calorgCode || '307834';
      const testEventDate = eventDate
        ? `${String(eventDate.getDate()).padStart(2, '0')}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${eventDate.getFullYear()}`
        : '01/01/2026';

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: formData.license_id,
        nom: formData.last_name.toUpperCase(),
        prenom: formData.first_name.toUpperCase(),
        sexe: formData.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: testCalorgCode,
        cmpdate: testEventDate,
      };

      console.log('[Frontend] REQUEST PAYLOAD ENVOYÉ:', requestPayload);
      console.log('[Frontend] formData.last_name:', formData.last_name);
      console.log('[Frontend] formData.first_name:', formData.first_name);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      console.log('[Frontend] FFA Response complète:', result);
      console.log('[Frontend] result.details:', result.details);
      console.log('[Frontend] result.details.test_athlete:', result.details?.test_athlete);
      console.log('[Frontend] Club reçu:', result.details?.test_athlete?.club);
      console.log('[Frontend] CSV RAW:', result.details?.csv_raw);
      console.log('[Frontend] ALL FIELDS:', result.details?.all_fields);

      if (result.error_code === 'PROx014') {
        setFfaVerificationMessage(`⚠️ ${result.message} - Veuillez remplir vos informations manuellement.`);
        setFfaLicenseData(null);
      } else if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;
        const club = athlete.club || '';
        const licenseNumber = athlete.numrel || formData.license_id;

        console.log('[Frontend] ===== DÉTAILS ATHLÈTE =====');
        console.log('[Frontend] Numéro licence:', athlete.numrel);
        console.log('[Frontend] Nom:', athlete.nom);
        console.log('[Frontend] Prénom:', athlete.prenom);
        console.log('[Frontend] Sexe FFA:', athlete.sexe);
        console.log('[Frontend] Sexe formulaire:', formData.gender);
        console.log('[Frontend] Date naissance FFA:', athlete.date_nai);
        console.log('[Frontend] Date naissance formulaire:', formData.birthdate);
        console.log('[Frontend] Club numéro:', athlete.club_numero);
        console.log('[Frontend] Club abrégé:', athlete.club_abrege);
        console.log('[Frontend] Club complet:', athlete.club_complet);
        console.log('[Frontend] Club FINAL:', club);
        console.log('[Frontend] Département:', athlete.departement);
        console.log('[Frontend] Ligue:', athlete.ligue);
        console.log('[Frontend] Athlète complet:', athlete);
        console.log('[Frontend] ==============================');

        if (!athlete.nom && !athlete.prenom && !athlete.sexe && !athlete.date_nai) {
          console.warn('[Frontend] ❌ La FFA n\'a retourné aucune donnée exploitable pour la validation');
          setFfaVerificationMessage(`❌ Impossible de vérifier votre licence. La FFA n'a pas retourné les données nécessaires.`);
          setFfaValidationErrors([
            'Vérifiez que votre numéro de licence est correct.',
            'Assurez-vous que vos informations personnelles sont à jour auprès de la FFA.',
            'Contactez votre club si le problème persiste.'
          ]);
          setFfaLicenseData(null);
          return;
        }

        const errors: string[] = [];

        const normalizedLastName = formData.last_name.trim().toUpperCase();
        const normalizedFirstName = formData.first_name.trim().toUpperCase();
        const ffaLastName = athlete.nom?.trim().toUpperCase() || '';
        const ffaFirstName = athlete.prenom?.trim().toUpperCase() || '';

        if (athlete.nom && normalizedLastName !== ffaLastName) {
          errors.push(`Le nom ne correspond pas (FFA: ${athlete.nom}, Formulaire: ${formData.last_name})`);
        }

        if (athlete.prenom && normalizedFirstName !== ffaFirstName) {
          errors.push(`Le prénom ne correspond pas (FFA: ${athlete.prenom}, Formulaire: ${formData.first_name})`);
        }

        if (athlete.sexe && formData.gender !== athlete.sexe) {
          errors.push(`Le sexe ne correspond pas (FFA: ${athlete.sexe === 'M' ? 'Homme' : 'Femme'}, Formulaire: ${formData.gender === 'M' ? 'Homme' : 'Femme'})`);
        }

        const formBirthdate = formData.birthdate.split('-').reverse().join('/');
        if (athlete.date_nai && formBirthdate !== athlete.date_nai) {
          errors.push(`La date de naissance ne correspond pas (FFA: ${athlete.date_nai}, Formulaire: ${formBirthdate})`);
        }

        if (errors.length > 0) {
          setFfaVerificationMessage(`❌ Vérification échouée - Veuillez corriger les informations ci-dessous`);
          setFfaValidationErrors(errors);
          setFfaLicenseData(null);
          return;
        }

        setFfaLicenseData(athlete);
        setFfaValidationErrors([]);

        if (club) {
          setFormData(prev => ({ ...prev, license_club: club }));
          setFfaVerificationMessage(`✓ Licence ${licenseNumber} vérifiée - Club: ${club}`);
        } else {
          setFfaVerificationMessage(`✓ Licence ${licenseNumber} vérifiée - Aucun club trouvé. Veuillez saisir votre club ci-dessous.`);
        }
      } else {
        setFfaVerificationMessage(result.message || '❌ Licence non trouvée');
        setFfaLicenseData(null);
        setFfaValidationErrors([]);
      }
    } catch (error) {
      console.error('FFA verification error:', error);
      setFfaVerificationMessage('❌ Erreur lors de la vérification');
      setFfaValidationErrors([]);
    } finally {
      setFfaVerifying(false);
    }
  };

  const verifyPSP = async () => {
    if (!formData.pps_number) return;

    if (!formData.pps_number.toUpperCase().startsWith('P')) {
      setPspVerificationMessage('❌ Le numéro PSP (Pass Prévention Santé) doit commencer par la lettre P');
      setPspWarning('Format invalide');
      return;
    }

    setPspVerifying(true);
    setPspVerificationMessage('');
    setPspWarning('');

    try {
      const { data: credentials } = await supabase
        .rpc('get_ffa_credentials')
        .maybeSingle();

      if (!credentials || !credentials.uid || !credentials.password) {
        setPspVerificationMessage('⚠️ Configuration FFA manquante - Vérification impossible');
        setPspWarning('Vous devrez fournir un justificatif médical valide ultérieurement');
        setPspVerifying(false);
        return;
      }

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ffa-verify-athlete`;

      const birthYear = formData.birthdate ? new Date(formData.birthdate).getFullYear().toString() : '';
      const testCalorgCode = calorgCode || '307834';
      const testEventDate = eventDate
        ? `${String(eventDate.getDate()).padStart(2, '0')}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${eventDate.getFullYear()}`
        : '01/01/2026';

      const requestPayload = {
        uid: credentials.uid,
        mdp: credentials.password,
        numrel: formData.pps_number,
        nom: formData.last_name.toUpperCase(),
        prenom: formData.first_name.toUpperCase(),
        sexe: formData.gender,
        date_nai: birthYear,
        cnil_web: 'O',
        cmpcod: testCalorgCode,
        cmpdate: testEventDate,
      };

      console.log('[Frontend] PSP REQUEST:', requestPayload);

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();
      console.log('[Frontend] PSP Response:', result);
      console.log('[Frontend] PSP All Fields:', result.details?.all_fields);
      console.log('[Frontend] PSP Test Athlete:', result.details?.test_athlete);

      if (result.connected && result.details?.test_athlete) {
        const athlete = result.details.test_athlete;
        const ppsExpiryDate = athlete.pps_expiry || athlete.license_expiry || athlete.dfinrel;

        console.log('[Frontend] PSP expiry data:', { pps_expiry: athlete.pps_expiry, license_expiry: athlete.license_expiry, dfinrel: athlete.dfinrel });
        console.log('[Frontend] Field [14] DFINREL from all_fields:', result.details?.all_fields?.[14]);

        if (ppsExpiryDate && ppsExpiryDate !== '00/00/0000' && ppsExpiryDate.length > 5) {
          const expiryDate = new Date(ppsExpiryDate.split('/').reverse().join('-'));
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);

          console.log('[Frontend] PSP Expiry Date:', expiryDate, 'Today:', today, 'Event Date:', eventDate);

          if (expiryDate < today) {
            setPspVerificationMessage(`❌ PSP (Pass Prévention Santé) expiré le ${ppsExpiryDate}`);
            setPspWarning('psp_expired');
          } else if (eventDate > expiryDate) {
            setPspVerificationMessage(`⚠️ PSP (Pass Prévention Santé) valide mais expire le ${ppsExpiryDate}`);
            setPspWarning('psp_expiring');
          } else {
            setPspVerificationMessage(`✓ PSP (Pass Prévention Santé) ${formData.pps_number} vérifié - Valide jusqu'au ${ppsExpiryDate}`);
            setPspWarning('');
          }
        } else {
          setPspVerificationMessage(`✓ PSP (Pass Prévention Santé) ${formData.pps_number} vérifié`);
          setPspWarning('Date d\'expiration non disponible. Assurez-vous que votre PSP (Pass Prévention Santé) a moins de 3 mois à la date de l\'épreuve.');
        }
      } else {
        setPspVerificationMessage(`⚠️ PSP (Pass Prévention Santé) non trouvé dans la base FFA`);
        setPspWarning('Votre inscription est acceptée. Vous devrez fournir un justificatif médical valide ultérieurement.');
      }
    } catch (error) {
      console.error('PPS verification error:', error);
      setPspVerificationMessage('⚠️ Erreur lors de la vérification du PPS');
      setPspWarning('Votre inscription est acceptée. Vous devrez fournir un justificatif médical valide ultérieurement.');
    } finally {
      setPspVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCategoryError('');

    console.log('🚀 Début de handleSubmit');
    console.log('📝 FormData:', formData);
    console.log('🏃 SelectedRaceId:', selectedRaceId);

    try {
      if (!formData.birthdate) {
        alert('Veuillez saisir votre date de naissance');
        setLoading(false);
        return;
      }

      if (ageError) {
        alert('Vous ne pouvez pas vous inscrire à cette épreuve car vous n\'avez pas l\'âge requis.');
        setLoading(false);
        return;
      }

      if (!formData.nationality) {
        alert('Veuillez sélectionner votre nationalité');
        setLoading(false);
        return;
      }

      if (!formData.phone) {
        alert('Veuillez saisir votre numéro de téléphone');
        setLoading(false);
        return;
      }

      if (!formData.address_line1) {
        alert('Veuillez saisir votre adresse');
        setLoading(false);
        return;
      }

      if (!formData.postal_code) {
        alert('Veuillez saisir votre code postal');
        setLoading(false);
        return;
      }

      if (!formData.city) {
        alert('Veuillez saisir votre ville');
        setLoading(false);
        return;
      }

      // Contact d'urgence obligatoire pour tous
      if (!formData.emergency_contact_name) {
        alert('Veuillez saisir le nom de votre contact d\'urgence');
        setLoading(false);
        return;
      }

      if (!formData.emergency_contact_phone) {
        alert('Veuillez saisir le numéro de téléphone de votre contact d\'urgence');
        setLoading(false);
        return;
      }

      console.log('🔍 Vérification licence FFA...', { isFFALicense: isFFALicense(), license_id: formData.license_id });

      if (isFFALicense() && !formData.license_id) {
        console.log('❌ Numéro de licence FFA manquant');
        alert('Veuillez saisir votre numéro de licence FFA');
        setLoading(false);
        return;
      }

      // Validation: Une licence FFA ne peut pas commencer par 'P' (ce serait un PPS)
      if (isFFALicense() && formData.license_id && formData.license_id.trim().toUpperCase().startsWith('P')) {
        console.log('❌ Numéro PSP (Pass Prévention Santé) saisi à la place d\'une licence FFA');
        alert('Ce numéro commence par "P" - il s\'agit d\'un numéro PPS, pas d\'une licence FFA. Veuillez sélectionner le type "Non licencié(e) (PPS)" ou saisir un numéro de licence FFA valide (uniquement des chiffres).');
        setLoading(false);
        return;
      }

      // Validation: Une licence FFA doit contenir uniquement des chiffres
      if (isFFALicense() && formData.license_id && !/^\d+$/.test(formData.license_id.trim())) {
        console.log('❌ Format de licence FFA invalide');
        alert('Le numéro de licence FFA doit contenir uniquement des chiffres (6 à 8 chiffres).');
        setLoading(false);
        return;
      }

      console.log('🔍 Vérification club...', {
        isFFALicense: isFFALicense(),
        hasPPS: formData.pps_number,
        license_club: formData.license_club
      });

      // Le club n'est obligatoire que pour les licences FFA
      // Pour les PSP (Pass Prévention Santé) (non-licenciés), le club est optionnel
      if (isFFALicense() && !formData.license_club) {
        console.log('❌ Club manquant');
        alert('Veuillez saisir votre club');
        setLoading(false);
        return;
      }

      console.log('🔍 Vérification données FFA...', { ffaLicenseData });

      if (isFFALicense() && formData.license_id && !ffaLicenseData) {
        console.log('❌ Données FFA non chargées');
        alert('Veuillez vérifier votre numéro de licence FFA');
        setLoading(false);
        return;
      }

      console.log('🔍 Vérification message FFA...', { ffaVerificationMessage });

      if (isFFALicense() && formData.license_id && !ffaVerificationMessage.includes('✓')) {
        console.log('❌ Licence FFA non vérifiée');
        alert('Votre licence FFA n\'a pas été vérifiée avec succès');
        setLoading(false);
        return;
      }

      if (requiresPSP() && !formData.pps_number) {
        alert('Veuillez saisir votre numéro PPS');
        setLoading(false);
        return;
      }

      if (requiresPSP() && formData.pps_number && !formData.pps_number.toUpperCase().startsWith('P')) {
        alert('Le numéro PSP (Pass Prévention Santé) doit commencer par la lettre P');
        setLoading(false);
        return;
      }

      console.log('✅ Validations passées, vérification catégorie...');

      const categoryCheck = await checkCategoryRestriction(
        selectedRaceId,
        formData.birthdate,
        eventDate
      );

      console.log('📊 Category check:', categoryCheck);

      if (!categoryCheck.allowed) {
        console.log('❌ Catégorie non autorisée');
        setCategoryError(categoryCheck.message || 'Catégorie non autorisée');
        setLoading(false);
        return;
      }

      console.log('✅ Catégorie autorisée, génération données...');

      const sessionToken = crypto.randomUUID();
      const category = determineCategory();
      const totalPriceCents = calculateTotalPrice();

      console.log('💰 Prix total:', totalPriceCents, 'cents');

      const { data: activeCommission } = await supabase.rpc('get_active_commission');
      const commissionCents = activeCommission || 99;

      console.log('💳 Commission:', commissionCents, 'cents');

      const registrationData = {
        event_id: eventId,
        race_id: selectedRaceId,
        organizer_id: formData.organizer_id || organizerId,
        athlete_data: { ...formData, age_category: categoryCheck.category },
        category,
        session_token: sessionToken,
      };

      console.log('📦 Données inscription:', registrationData);
      console.log('🚀 Appel onComplete...');

      onComplete({
        ...registrationData,
        total_price_cents: totalPriceCents,
        commission_cents: commissionCents,
        selected_options: selectedOptions,
        race_options: raceOptions,
      });

      console.log('✅ onComplete appelé avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de l\'inscription:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg relative">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate(eventSlug ? `/events/${eventSlug}` : '/')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour à l'événement</span>
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Inscription à l'événement</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {!preselectedRaceId && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Choix de l'épreuve</h2>

            <div className="space-y-4">
              {races.map((race) => (
                <label
                  key={race.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedRaceId === race.id
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="race"
                    value={race.id}
                    checked={selectedRaceId === race.id}
                    onChange={(e) => setSelectedRaceId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{race.name}</h3>
                      <p className="text-gray-600">
                        {race.distance} • D+ {race.elevation_gain}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {race.current_participants}/{race.max_participants} inscrits
                      </p>
                      {(() => {
                        const activePeriod = pricingPeriods.find(p => p.is_active);
                        if (activePeriod && formData.license_type) {
                          const pricing = racePricing.find(
                            p => p.license_type_id === formData.license_type &&
                                 p.pricing_period_id === activePeriod.id
                          );
                          if (pricing) {
                            return (
                              <div className="text-right">
                                {pricing.price_cents === 0 ? (
                                  <>
                                    <p className="text-lg font-semibold text-green-600 mt-1">
                                      Gratuit
                                    </p>
                                    <p className="text-xs text-green-600 italic">
                                      Épreuve gratuite
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-lg font-semibold text-pink-600 mt-1">
                                    {(pricing.price_cents / 100).toFixed(2)}€
                                  </p>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Informations personnelles</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    if (ffaValidationErrors.length > 0) {
                      setFfaValidationErrors([]);
                      setFfaVerificationMessage('');
                      setFfaLicenseData(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => {
                    setFormData({ ...formData, first_name: e.target.value });
                    if (ffaValidationErrors.length > 0) {
                      setFfaValidationErrors([]);
                      setFfaVerificationMessage('');
                      setFfaLicenseData(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date de naissance *
                </label>
                <input
                  type="date"
                  required
                  value={formData.birthdate}
                  onChange={(e) => {
                    setFormData({ ...formData, birthdate: e.target.value });
                    checkAgeEligibility(e.target.value);
                    if (ffaValidationErrors.length > 0) {
                      setFfaValidationErrors([]);
                      setFfaVerificationMessage('');
                      setFfaLicenseData(null);
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 ${
                    ageError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {ageError && (
                  <p className="mt-2 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                    {ageError}
                  </p>
                )}
                {ageRestrictions && !ageError && formData.birthdate && (
                  <p className="mt-2 text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                    ✓ Votre âge est éligible pour cette épreuve
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Genre *
                  {genderRestriction !== 'all' && (
                    <span className="ml-2 text-sm text-orange-600 font-normal">
                      (Épreuve réservée aux {genderRestriction === 'M' ? 'hommes' : 'femmes'})
                    </span>
                  )}
                </label>
                <div className="flex gap-4">
                  {genderRestriction !== 'F' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, gender: 'M' });
                        if (ffaValidationErrors.length > 0) {
                          setFfaValidationErrors([]);
                          setFfaVerificationMessage('');
                          setFfaLicenseData(null);
                        }
                      }}
                      className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                        formData.gender === 'M'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      } ${genderRestriction === 'M' ? 'ring-2 ring-blue-300' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12" fill={formData.gender === 'M' ? '#3B82F6' : '#9CA3AF'} viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A4,4 0 0,1 16,10A4,4 0 0,1 12,14A4,4 0 0,1 8,10A4,4 0 0,1 12,6M12,8A2,2 0 0,0 10,10A2,2 0 0,0 12,12A2,2 0 0,0 14,10A2,2 0 0,0 12,8M7,22V20H9V16.5C7.79,15.96 7,14.73 7,13.28V13C7,11.9 7.9,11 9,11H15C16.1,11 17,11.9 17,13V13.28C17,14.73 16.21,15.96 15,16.5V20H17V22H7Z" />
                        </svg>
                        <span className={`font-medium ${
                          formData.gender === 'M' ? 'text-blue-600' : 'text-gray-600'
                        }`}>Homme</span>
                      </div>
                    </button>
                  )}
                  {genderRestriction !== 'M' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, gender: 'F' });
                        if (ffaValidationErrors.length > 0) {
                          setFfaValidationErrors([]);
                          setFfaVerificationMessage('');
                          setFfaLicenseData(null);
                        }
                      }}
                      className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                        formData.gender === 'F'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-300 hover:border-pink-300'
                      } ${genderRestriction === 'F' ? 'ring-2 ring-pink-300' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12" fill={formData.gender === 'F' ? '#EC4899' : '#9CA3AF'} viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A4,4 0 0,1 16,10A4,4 0 0,1 12,14A4,4 0 0,1 8,10A4,4 0 0,1 12,6M12,8A2,2 0 0,0 10,10A2,2 0 0,0 12,12A2,2 0 0,0 14,10A2,2 0 0,0 12,8M7,22V20H9V15C7.79,14.5 7,13.35 7,12V11C7,10.45 7.45,10 8,10H16C16.55,10 17,10.45 17,11V12C17,13.35 16.21,14.5 15,15V20H17V22H7Z" />
                        </svg>
                        <span className={`font-medium ${
                          formData.gender === 'F' ? 'text-pink-600' : 'text-gray-600'
                        }`}>Femme</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationalité *
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Sélectionnez un pays</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Code pays à 3 lettres (ex: FRA, BEL, CHE)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4 inline mr-2" />
                  Adresse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="12 rue de la République"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="44190"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Ville *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Saisissez le nom de votre ville"
                  list="cities-datalist"
                />
                <datalist id="cities-datalist">
                  <option value="Paris" />
                  <option value="Lyon" />
                  <option value="Marseille" />
                  <option value="Toulouse" />
                  <option value="Nice" />
                  <option value="Nantes" />
                  <option value="Bordeaux" />
                  <option value="Lille" />
                  <option value="Rennes" />
                  <option value="Strasbourg" />
                  <option value="Montpellier" />
                  <option value="Bruxelles" />
                  <option value="Genève" />
                  <option value="Lausanne" />
                  <option value="Luxembourg" />
                  <option value="Monaco" />
                </datalist>
              </div>

              {formData.license_type && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Type de licence
                    </label>
                    <select
                      value={formData.license_type}
                      onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      required
                    >
                      <option value="">Sélectionner un type de profil</option>
                      {licenseTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                          {lt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isFFALicense() && (
                    <div className="animate-[slideIn_0.6s_ease-out] bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                    <label className="block text-sm font-bold text-blue-900 mb-2">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Numéro de licence FFA
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.license_id}
                        onChange={(e) => setFormData({ ...formData, license_id: e.target.value })}
                        required
                        className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        placeholder="Ex: 929636 - Obligatoire"
                      />
                      <button
                        type="button"
                        onClick={verifyFFALicense}
                        disabled={ffaVerifying || !formData.license_id || !formData.last_name || !formData.first_name || !formData.birthdate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                        title={
                          !formData.license_id ? 'Saisissez un numéro de licence' :
                          !formData.last_name ? 'Saisissez votre nom' :
                          !formData.first_name ? 'Saisissez votre prénom' :
                          !formData.birthdate ? 'Saisissez votre date de naissance' :
                          'Vérifier la licence FFA'
                        }
                      >
                        {ffaVerifying ? 'Vérification...' : 'Vérifier'}
                      </button>
                    </div>
                    {ffaVerificationMessage && (
                      <div className={`mt-3 p-4 rounded-lg border-2 ${
                        ffaVerificationMessage.includes('✓')
                          ? 'bg-green-50 border-green-500 text-green-800'
                          : 'bg-red-50 border-red-500 text-red-800'
                      }`}>
                        <p className="font-medium mb-2">
                          {ffaVerificationMessage}
                        </p>
                        {ffaValidationErrors.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {ffaValidationErrors.map((error, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-600 font-bold">•</span>
                                <span className="text-sm">{error}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {ffaValidationErrors.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded border border-red-300">
                            <p className="text-sm font-semibold text-red-900 mb-2">💡 Comment corriger :</p>
                            <ul className="text-xs text-red-800 space-y-1">
                              <li>1. Corrigez les informations dans le formulaire ci-dessus</li>
                              <li>2. Cliquez à nouveau sur le bouton "Vérifier"</li>
                              <li>3. Assurez-vous que les informations correspondent exactement à votre licence FFA</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {!calorgCode && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Code CalOrg non configuré - La vérification FFA ne sera pas possible
                      </p>
                    )}
                  </div>
                  )}

                  {requiresPSP() && (
                    <div className="animate-[slideIn_0.6s_ease-out] bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-amber-300 shadow-sm">
                      <label className="block text-sm font-bold text-amber-900 mb-2">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="w-5 h-5 text-amber-600" />
                          Numéro PSP (Pass Prévention Santé)
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.pps_number}
                          onChange={(e) => setFormData({ ...formData, pps_number: e.target.value.toUpperCase() })}
                          required
                          className="flex-1 px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm"
                          placeholder="Ex: P123456 - Doit commencer par P"
                          pattern="^P.*"
                          title="Le numéro PSP (Pass Prévention Santé) doit commencer par la lettre P"
                        />
                        <button
                          type="button"
                          onClick={verifyPSP}
                          disabled={pspVerifying || !formData.pps_number || !formData.last_name || !formData.first_name || !formData.birthdate}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                          title={
                            !formData.pps_number ? 'Saisissez un numéro PPS' :
                            !formData.last_name ? 'Saisissez votre nom' :
                            !formData.first_name ? 'Saisissez votre prénom' :
                            !formData.birthdate ? 'Saisissez votre date de naissance' :
                            'Vérifier le PPS'
                          }
                        >
                          {pspVerifying ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                      {pspVerificationMessage && (
                        <div className={`mt-3 p-4 rounded-lg border-2 ${
                          pspVerificationMessage.includes('✓')
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : 'bg-amber-50 border-amber-500 text-amber-800'
                        }`}>
                          <p className="font-medium mb-2">
                            {pspVerificationMessage}
                          </p>
                        </div>
                      )}
                      {pspWarning && (
                        <div className="mt-3 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                          <p className="text-sm font-semibold text-orange-900 mb-2">⚠️ Important :</p>
                          {pspWarning === 'pps_expired' ? (
                            <div className="text-sm text-orange-800 space-y-2">
                              <p>
                                Votre PSP (Pass Prévention Santé) est déjà expiré. Vous devez obtenir un nouveau PSP (Pass Prévention Santé) pour participer à cette épreuve FFA.{' '}
                                <a
                                  href="https://pps.athle.fr/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                                >
                                  → Créer un nouveau PSP sur www.pps.athle.fr
                                </a>
                              </p>
                              <p className="font-semibold text-green-700">
                                ✓ Vous pouvez procéder au paiement de votre inscription et pourrez revenir sur votre dossier pour mettre à jour votre PSP (Pass Prévention Santé) ultérieurement.
                              </p>
                            </div>
                          ) : pspWarning === 'pps_expiring' ? (
                            <div className="text-sm text-orange-800 space-y-2">
                              <p>
                                Votre PSP (Pass Prévention Santé) sera expiré à la date de l'épreuve. Vous devez obtenir un nouveau PSP (Pass Prévention Santé) avant la course.{' '}
                                <a
                                  href="https://pps.athle.fr/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                                >
                                  → Créer un nouveau PSP sur www.pps.athle.fr
                                </a>
                              </p>
                              <p className="font-semibold text-green-700">
                                ✓ Vous pouvez procéder au paiement de votre inscription et pourrez revenir sur votre dossier pour mettre à jour votre PSP (Pass Prévention Santé) ultérieurement.
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-orange-800">{pspWarning}</p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-amber-700 mt-2">
                        Le PSP (Pass Prévention Santé) est obligatoire pour les épreuves FFA si vous n'avez pas de licence FFA (y compris pour les non-licenciés). Il doit avoir valide (validité d.1 an) à la date de l.épreuve.{' '}
                        <a
                          href="https://pps.athle.fr/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline font-semibold"
                        >
                          → Obtenir un PSP sur www.pps.athle.fr
                        </a>
                      </p>
                      {!calorgCode && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Code CalOrg non configuré - La vérification PSP (Pass Prévention Santé) ne sera pas possible
                        </p>
                      )}
                    </div>
                  )}

                  {(isFFALicense() || requiresPSP()) && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isFFALicense() ? 'Club' : 'Club, association, entreprise'} {isFFALicense() && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.license_club}
                      onChange={(e) => setFormData({ ...formData, license_club: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      placeholder={isFFALicense() ? "Ex: AC VARADES, ATHLETIC CLUB ANGERIEN..." : "Ex: Running Club Paris, Mon Entreprise..."}
                      required={isFFALicense()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {isFFALicense()
                        ? 'Le club sera rempli automatiquement si la FFA le retourne. Sinon, saisissez-le manuellement.'
                        : 'Optionnel : indiquez votre club, association ou entreprise si applicable.'
                      }
                    </p>
                  </div>
                  )}

                  {isFFALicense() && ffaLicenseData && (
                    <>
                      <div className="md:col-span-2 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu de votre licence FFA</h3>
                        <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg overflow-hidden shadow-xl">
                          <div className="absolute inset-0" style={{ backgroundImage: 'url(/licence\ 2025\ 2026.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }}></div>
                          <div className="relative p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="text-cyan-400 text-3xl font-bold">LICENCE 2025-2026</div>
                              <div className="text-white text-2xl font-bold">{ffaLicenseData.license_type || 'Athlé Compétition'}</div>
                              <div className="text-white text-2xl font-bold mt-6">{formData.first_name.toUpperCase()} {formData.last_name.toUpperCase()}</div>
                              <div className="text-white text-lg">Né(e) le : {ffaLicenseData.date_nai || formData.birthdate?.split('-').reverse().join('/')}</div>
                              <div className="text-white text-lg">Sexe : {formData.gender === 'M' ? 'M' : 'F'}</div>
                              <div className="text-white text-lg">Nationalité : {ffaLicenseData.nationality || formData.nationality}</div>
                              <div className="text-white text-lg font-semibold mt-4">N° Club : {ffaLicenseData.club_numero || ''}</div>
                              <div className="text-white text-xl font-bold">Club : {formData.license_club}</div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <div className="text-right">
                                <div className="text-white text-5xl font-bold mb-2">{formData.license_id}</div>
                                <div className="text-cyan-400 text-lg">Expire le : {ffaLicenseData.license_expiry || '31/08/2026'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </>
                  )}
                </>
              )}

              {!formData.license_type && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Type de licence
                  </label>
                  <select
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="">Sélectionner un type de profil</option>
                    {licenseTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contact d'urgence - Affiché pour tous les types de licence */}
              <div className="md:col-span-2 mt-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg">
                <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Contact d'urgence *
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nom et prénom du contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Numéro portable du contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-3">
                  <strong>Obligatoire :</strong> Ce contact sera prévenu en cas d'urgence pendant l'événement.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              {raceRegulations && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      checked={regulationsAccepted}
                      onChange={(e) => setRegulationsAccepted(e.target.checked)}
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm text-blue-900 font-semibold">
                      J'ai lu et j'accepte le règlement sportif de l'épreuve <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="mt-3 max-h-64 overflow-y-auto bg-white rounded p-3 border border-blue-200">
                    <div
                      className="prose prose-sm max-w-none
                        [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-2
                        [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mb-2
                        [&>p]:text-gray-700 [&>p]:mb-2 [&>p]:text-sm
                        [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ul]:text-gray-700
                        [&>ol]:list-decimal [&>ol]:ml-4 [&>ol]:mb-2 [&>ol]:text-gray-700
                        [&>li]:mb-1 [&>li]:text-sm
                        [&>strong]:font-semibold [&>strong]:text-gray-900
                        [&>a]:text-blue-600 [&>a]:underline"
                      dangerouslySetInnerHTML={{ __html: raceRegulations }}
                    />
                  </div>
                </div>
              )}

              <label className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={formData.consent_data_processing}
                  onChange={(e) => setFormData({ ...formData, consent_data_processing: e.target.checked })}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  J'accepte le traitement de mes données personnelles conformément au RGPD *
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.consent_marketing}
                  onChange={(e) => setFormData({ ...formData, consent_marketing: e.target.checked })}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  J'accepte de recevoir des communications marketing de la part de l'organisateur
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  Je souhaite que mon nom reste anonyme dans la liste publique des inscrits
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Options et récapitulatif</h2>

            {raceOptions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Options disponibles</h3>
                {raceOptions.map((option) => (
                  <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex gap-4 items-start mb-3">
                      {option.image_url && (
                        <img
                          src={option.image_url}
                          alt={option.label}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {option.label}
                              {option.is_required && <span className="text-red-600 ml-1">*</span>}
                            </h4>
                            {option.description && (
                              <p className="text-sm text-gray-600">{option.description}</p>
                            )}
                          </div>
                          {option.price_cents > 0 && (
                            <span className="text-pink-600 font-medium">
                              +{(option.price_cents / 100).toFixed(2)}€
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {option.is_question && option.choices.length > 0 ? (
                      <select
                        required={option.is_required}
                        value={selectedOptions[option.id]?.choice_id || ''}
                        onChange={(e) =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [option.id]: { choice_id: e.target.value, quantity: 1 },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="">Sélectionner...</option>
                        {option.choices.map((choice) => (
                          <option key={choice.id} value={choice.id}>
                            {choice.label}
                            {choice.price_modifier_cents !== 0 &&
                              ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(
                                choice.price_modifier_cents / 100
                              ).toFixed(2)}€)`}
                            {choice.has_quantity_limit && choice.current_quantity >= choice.max_quantity && ' (Complet)'}
                          </option>
                        ))}
                      </select>
                    ) : option.type === 'reference_time' || option.type === 'custom' ? (
                      <input
                        type="text"
                        required={option.is_required}
                        value={selectedOptions[option.id]?.value || ''}
                        onChange={(e) =>
                          setSelectedOptions({
                            ...selectedOptions,
                            [option.id]: { value: e.target.value, quantity: 1 },
                          })
                        }
                        placeholder={option.type === 'reference_time' ? 'Ex: 00:45:30' : 'Votre réponse'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                      />
                    ) : (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!selectedOptions[option.id]}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOptions({
                                ...selectedOptions,
                                [option.id]: { quantity: 1 },
                              });
                            } else {
                              const newOptions = { ...selectedOptions };
                              delete newOptions[option.id];
                              setSelectedOptions(newOptions);
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">Oui, je souhaite cette option</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Épreuve:</span>
                  <span className="font-medium">{races.find(r => r.id === selectedRaceId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participant:</span>
                  <span className="font-medium">{formData.first_name} {formData.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Catégorie:</span>
                  <span className="font-medium">{determineCategory()}</span>
                </div>

                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Tarif de base:</span>
                    <span className="font-medium">{(() => {
                      const activePeriod = pricingPeriods.find(p => p.is_active);
                      if (activePeriod && formData.license_type) {
                        const pricing = racePricing.find(
                          p => p.license_type_id === formData.license_type && p.pricing_period_id === activePeriod.id
                        );
                        if (pricing) {
                          if (pricing.price_cents === 0) {
                            return <span className="text-green-600 font-semibold">Gratuit</span>;
                          }
                          return (pricing.price_cents / 100).toFixed(2) + '€';
                        }
                      }
                      return '0,00€';
                    })()}</span>
                  </div>

                  {Object.entries(selectedOptions).map(([optionId, selection]) => {
                    const option = raceOptions.find(o => o.id === optionId);
                    if (!option) return null;

                    let optionPrice = 0;
                    let label = option.label;

                    if (selection.choice_id) {
                      const choice = option.choices.find(c => c.id === selection.choice_id);
                      if (choice) {
                        optionPrice = option.price_cents + choice.price_modifier_cents;
                        label += ` - ${choice.label}`;
                      }
                    } else {
                      optionPrice = option.price_cents * selection.quantity;
                    }

                    if (optionPrice === 0) return null;

                    return (
                      <div key={optionId} className="flex justify-between text-xs">
                        <span className="text-gray-600">+ {label}</span>
                        <span className="font-medium">+{(optionPrice / 100).toFixed(2)}€</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Sous-total:</span>
                    <span>
                      {calculateTotalPrice() === 0 ? (
                        <span className="text-green-600">Gratuit</span>
                      ) : (
                        <>{(calculateTotalPrice() / 100).toFixed(2)}€</>
                      )}
                    </span>
                  </div>
                  {getBaseRegistrationPrice() === 0 && calculateTotalPrice() > 0 && (
                    <div className="text-xs text-green-600 italic text-right -mt-1">
                      Inscription gratuite + options payantes
                    </div>
                  )}
                  {calculateTotalPrice() > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Frais de service Timepulse:</span>
                        <span>0,99€</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-pink-600 mt-2 pt-2 border-t">
                        <span>Total à payer:</span>
                        <span>{((calculateTotalPrice() + 99) / 100).toFixed(2)}€</span>
                      </div>
                    </>
                  )}
                  {calculateTotalPrice() === 0 && (
                    <div className="flex justify-between text-xl font-bold text-green-600 mt-2 pt-2 border-t">
                      <span>Total à payer:</span>
                      <span>Gratuit - Épreuve gratuite</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {categoryError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Restriction de catégorie</h4>
              <p className="text-sm text-red-700">{categoryError}</p>
            </div>
          </div>
        )}

        <div className="border-t pt-8">
          {isFFALicense() && !formData.license_id ? (
            <div className="w-full p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center animate-pulse">
                    <FileText className="w-6 h-6 text-red-900" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-2">
                    ❌ Numéro de licence FFA manquant
                  </h3>
                  <p className="text-sm text-red-800 mb-4">
                    Vous avez sélectionné un type de licence FFA. Le numéro de licence est <span className="font-semibold">obligatoire</span>.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-red-700">
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    <span>Remplissez le champ "Numéro de licence FFA" ci-dessus</span>
                  </div>
                </div>
              </div>
            </div>
          ) : requiresPSP() && !formData.pps_number ? (
            <div className="w-full p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                    <FileText className="w-6 h-6 text-amber-900" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    ⚠️ Numéro PSP (Pass Prévention Santé) manquant
                  </h3>
                  <p className="text-sm text-amber-800 mb-4">
                    Un Pass Prévention Santé (PPS) est requis pour votre type de licence. Le numéro PSP (Pass Prévention Santé) est <span className="font-semibold">obligatoire</span>.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-amber-700">
                    <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                    <span>Remplissez le champ "Numéro PSP" ci-dessus (commence par P)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : isFFALicense() && formData.license_id && !ffaVerificationMessage.includes('✓') ? (
            <div className="w-full p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <FileText className="w-6 h-6 text-yellow-900" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">
                    ⚠️ Vérification de licence FFA requise
                  </h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    Vous devez vérifier votre licence FFA avant de procéder au paiement.
                    Cliquez sur le bouton <span className="font-semibold">"Vérifier"</span> dans le champ de licence ci-dessus.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-yellow-700">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    <span>Assurez-vous que vos informations correspondent exactement à votre licence</span>
                  </div>
                </div>
              </div>
            </div>
          ) : raceRegulations && !regulationsAccepted ? (
            <div className="w-full p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center animate-pulse">
                    <FileText className="w-6 h-6 text-blue-900" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    📋 Acceptation du règlement sportif requise
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Vous devez lire et accepter le règlement sportif de l'épreuve avant de procéder au paiement.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    <span>Cochez la case "J'ai lu et j'accepte le règlement sportif de l'épreuve" ci-dessus</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {(!selectedRaceId || loading) && (
                <div className="text-sm text-red-600 mb-2">
                  {!selectedRaceId && '⚠️ Aucune course sélectionnée'}
                  {loading && '⏳ Traitement en cours...'}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !selectedRaceId}
                className="w-full py-4 px-6 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold transition-all"
                onClick={() => console.log('🖱️ Bouton cliqué - loading:', loading, 'selectedRaceId:', selectedRaceId)}
              >
                <CreditCard className="w-6 h-6" />
                {loading ? 'Traitement en cours...' : 'Procéder au paiement'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
