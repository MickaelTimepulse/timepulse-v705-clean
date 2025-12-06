import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  ArrowLeft,
  Trash2,
  Eye,
  X,
  Mountain,
  Upload,
  Clock,
  Link2,
  Copy,
  Ban,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit2,
  Mic,
  Handshake,
} from 'lucide-react';
import OrganizerLayout from '../components/OrganizerLayout';
import { supabase } from '../lib/supabase';
import { auditService } from '../lib/audit-service';
import ElevationProfile from '../components/ElevationProfile';
import { parseGPXFile, type GPXData } from '../lib/gpx-parser';
import RacePricingManager from '../components/RacePricingManager';
import RaceOptionsManager from '../components/RaceOptionsManager';
import RaceCategoryManager from '../components/RaceCategoryManager';
import RaceTeamConfig from '../components/RaceTeamConfig';
import OrganizerTeamsManager from '../components/OrganizerTeamsManager';
import { SPORT_LABELS, getSportImage, getSportLabel, type SportType } from '../lib/sport-images';
import ManualEntryForm from '../components/ManualEntryForm';
import EntriesList from '../components/EntriesList';
import ImagePositionEditor from '../components/ImagePositionEditor';
import ResultsImporter from '../components/ResultsImporter';
import { formatAthleteName } from '../lib/formatters';
import { verifyCalorgCode } from '../lib/ffa-webservice';
import EventCharacteristicsPicker from '../components/EventCharacteristicsPicker';
import RichTextEditor from '../components/Admin/RichTextEditor';
import OrganizerSpeakerConfig from '../components/OrganizerSpeakerConfig';
import OrganizerEventPartners from '../components/OrganizerEventPartners';

// Helper pour récupérer l'utilisateur actuel (admin ou organisateur)
async function getCurrentUser(): Promise<{ id: string; isAdmin: boolean; organizerId?: string } | null> {
  // Vérifier Supabase Auth
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  // Vérifier si c'est un admin (via metadata)
  const metadata = session.user.user_metadata;
  if (metadata?.admin_id && metadata?.admin_role) {
    console.log('[getCurrentUser] Admin detected:', metadata.admin_id);
    return { id: metadata.admin_id, isAdmin: true };
  }

  // Sinon c'est un organisateur classique
  console.log('[getCurrentUser] Regular organizer:', session.user.id);
  return { id: session.user.id, isAdmin: false };
}

export default function OrganizerEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('races');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [races, setRaces] = useState<any[]>([]);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const [raceSubTab, setRaceSubTab] = useState<{[key: string]: string}>({});
  const [raceRegulations, setRaceRegulations] = useState<{[key: string]: string}>({});
  const [savingRegulations, setSavingRegulations] = useState<string | null>(null);
  const [showCreateRaceModal, setShowCreateRaceModal] = useState(false);
  const [showEditRaceModal, setShowEditRaceModal] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [creatingRace, setCreatingRace] = useState(false);
  const [raceFormData, setRaceFormData] = useState({
    name: '',
    distance: '',
    elevation_gain: '',
    start_time: '',
    max_participants: '',
    description: '',
    sport_type: 'running' as SportType,
    custom_sport_type: '',
    show_public_entries_list: true,
    gender_restriction: 'all' as 'all' | 'M' | 'F',
  });
  const [uploadingGPX, setUploadingGPX] = useState<string | null>(null);
  const [gpxData, setGpxData] = useState<{[key: string]: GPXData}>({});
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [raceFinancialData, setRaceFinancialData] = useState<{[key: string]: {maxRevenue: number, currentRevenue: number, registrationCount: number}}>({});
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    slug: '',
    start_date: '',
    end_date: '',
    city: '',
    postal_code: '',
    full_address: '',
    description: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    registration_url: '',
    status: 'active',
    carpooling_enabled: false,
    volunteer_enabled: false,
    ffa_affiliated: false,
    ffa_calorg_code: '',
  });
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePositionX, setImagePositionX] = useState<number>(50);
  const [imagePositionY, setImagePositionY] = useState<number>(50);
  const [showBibConfigModal, setShowBibConfigModal] = useState(false);
  const [selectedRaceForBibs, setSelectedRaceForBibs] = useState<string | null>(null);
  const [bibConfig, setBibConfig] = useState({
    mode: 'BATCH',
    strategy: 'REG_ORDER',
    range_global_from: '',
    range_global_to: '',
    range_male_from: '',
    range_male_to: '',
    range_female_from: '',
    range_female_to: '',
    split_by_gender: false,
    reuse_freed_numbers: false,
  });
  const [savingBibConfig, setSavingBibConfig] = useState(false);
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showCreateInvitationModal, setShowCreateInvitationModal] = useState(false);
  const [verifyingCalorg, setVerifyingCalorg] = useState(false);
  const [calorgVerificationMessage, setCalorgVerificationMessage] = useState<string>('');
  const [showEditInvitationModal, setShowEditInvitationModal] = useState(false);
  const [editingInvitationId, setEditingInvitationId] = useState<string | null>(null);
  const [showInvitationUsagesModal, setShowInvitationUsagesModal] = useState(false);
  const [selectedInvitationUsages, setSelectedInvitationUsages] = useState<any[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [invitationFormData, setInvitationFormData] = useState({
    company_name: '',
    race_id: '',
    applies_to_all_races: false,
    max_uses: '',
    valid_from: '',
    valid_until: '',
    notes: '',
  });
  const [creatingInvitation, setCreatingInvitation] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [showCreatePromoCodeModal, setShowCreatePromoCodeModal] = useState(false);
  const [showEditPromoCodeModal, setShowEditPromoCodeModal] = useState(false);
  const [editingPromoCodeId, setEditingPromoCodeId] = useState<string | null>(null);
  const [showPromoCodeUsagesModal, setShowPromoCodeUsagesModal] = useState(false);
  const [selectedPromoCodeUsages, setSelectedPromoCodeUsages] = useState<any[]>([]);
  const [loadingPromoUsages, setLoadingPromoUsages] = useState(false);
  const [promoCodeFormData, setPromoCodeFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    usage_type: 'multiple',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    race_id: '',
    applies_to_all_races: true,
  });
  const [creatingPromoCode, setCreatingPromoCode] = useState(false);

  useEffect(() => {
    loadEvent();
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setAdminUserId(currentUser.id);

      // Si c'est un admin, on ne charge pas d'organizer
      if (currentUser.isAdmin) {
        console.log('[loadUserData] Admin user, no organizer to load');
        return;
      }

      // Pour un organisateur classique, charger ses données
      const { data: organizer } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (organizer) {
        setOrganizerId(organizer.id);
        console.log('[loadUserData] Organizer loaded:', organizer.id);
      }
    }
  };

  const loadFinancialData = async (racesList: any[]) => {
    const financialMap: {[key: string]: {maxRevenue: number, currentRevenue: number, registrationCount: number}} = {};

    for (const race of racesList) {
      const { data: pricingData } = await supabase
        .from('race_pricing')
        .select('price_cents, max_registrations, active')
        .eq('race_id', race.id)
        .eq('active', true);

      const { data: entriesData } = await supabase
        .from('entries')
        .select('id, status')
        .eq('race_id', race.id)
        .eq('status', 'confirmed');

      const { data: registrationsData } = await supabase
        .from('registrations')
        .select('price_paid, status')
        .eq('race_id', race.id)
        .in('status', ['pending', 'confirmed']);

      console.log('Race:', race.name, 'Entries:', entriesData?.length, 'Registrations:', registrationsData?.length);

      let maxRevenue = 0;
      if (pricingData && pricingData.length > 0) {
        for (const pricing of pricingData) {
          const quota = pricing.max_registrations || race.max_participants || 0;
          maxRevenue += (pricing.price_cents / 100) * quota;
        }
      }

      let currentRevenue = 0;
      const registrationCount = entriesData?.length || 0;
      if (registrationsData && registrationsData.length > 0) {
        currentRevenue = registrationsData.reduce((sum, reg) => {
          const price = parseFloat(reg.price_paid || '0');
          console.log('Price paid:', reg.price_paid, 'Parsed:', price, 'Sum:', sum + price);
          return sum + (isNaN(price) ? 0 : price);
        }, 0);
      }

      console.log('Race:', race.name, 'Current revenue:', currentRevenue);

      financialMap[race.id] = {
        maxRevenue,
        currentRevenue,
        registrationCount,
      };
    }

    console.log('Final financialMap:', financialMap);
    setRaceFinancialData(financialMap);
  };

  const loadEvent = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        navigate('/organizer/login');
        return;
      }

      console.log('[loadEvent] Current user:', currentUser);

      let userId: string = currentUser.id;
      let userIsAdmin = currentUser.isAdmin;
      let organizer = null;

      setIsAdmin(userIsAdmin);
      setCurrentUserId(userId);

      // Si ce n'est pas un admin, charger les données de l'organisateur
      if (!userIsAdmin) {
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        organizer = organizerData;

        if (!organizer) {
          console.error('[loadEvent] No organizer found for user:', userId);
          setError('Vous devez être un organisateur pour accéder à cette page');
          setLoading(false);
          return;
        }
      }

      let eventData;

      if (organizer) {
        // Charger l'événement pour l'organisateur
        const { data, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .eq('organizer_id', organizer.id)
          .single();

        if (eventError) {
          setError('Événement introuvable');
          return;
        }
        eventData = data;
      } else if (userIsAdmin) {
        // Admin peut voir tous les événements
        const { data, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) {
          setError('Événement introuvable');
          return;
        }
        eventData = data;
      } else {
        setError('Accès non autorisé');
        return;
      }

      setEvent(eventData);

      const { data: racesData } = await supabase
        .from('races')
        .select('*')
        .eq('event_id', id)
        .order('distance', { ascending: true });

      setRaces(racesData || []);

      const gpxDataMap: {[key: string]: GPXData} = {};
      const regulationsMap: {[key: string]: string} = {};
      for (const race of racesData || []) {
        if (race.elevation_profile) {
          gpxDataMap[race.id] = race.elevation_profile;
        }
        if (race.regulations) {
          regulationsMap[race.id] = race.regulations;
        }
      }
      setGpxData(gpxDataMap);
      setRaceRegulations(regulationsMap);

      await loadFinancialData(racesData || []);
      await loadInvitations();
      await loadPromoCodes();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          races:race_id (
            name
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select(`
          *,
          races:race_id (
            name
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (err) {
      console.error('Error loading promo codes:', err);
    }
  };

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRace(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Non authentifié');

      const slug = raceFormData.slug || raceFormData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data, error } = await supabase
        .from('races')
        .insert([
          {
            event_id: id,
            name: raceFormData.name,
            distance: raceFormData.distance ? parseFloat(raceFormData.distance) : null,
            elevation_gain: raceFormData.elevation_gain ? parseInt(raceFormData.elevation_gain) : null,
            start_time: raceFormData.start_time || null,
            max_participants: raceFormData.max_participants ? parseInt(raceFormData.max_participants) : null,
            description: raceFormData.description || null,
            sport_type: raceFormData.sport_type,
            custom_sport_type: raceFormData.sport_type === 'other' ? raceFormData.custom_sport_type : null,
            show_public_entries_list: raceFormData.show_public_entries_list,
            gender_restriction: raceFormData.gender_restriction,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setRaces([...races, data]);
      setShowCreateRaceModal(false);
      setRaceFormData({
        name: '',
        distance: '',
        elevation_gain: '',
        start_time: '',
        max_participants: '',
        description: '',
        sport_type: 'running',
        custom_sport_type: '',
        show_public_entries_list: true,
        gender_restriction: 'all',
      });
    } catch (err: any) {
      alert('Erreur lors de la création de l\'épreuve : ' + err.message);
    } finally {
      setCreatingRace(false);
    }
  };

  const handleEditRace = (race: any) => {
    setEditingRaceId(race.id);
    setRaceFormData({
      name: race.name,
      distance: race.distance?.toString() || '',
      elevation_gain: race.elevation_gain?.toString() || '',
      start_time: race.start_time || '',
      max_participants: race.max_participants?.toString() || '',
      description: race.description || '',
      sport_type: race.sport_type || 'running',
      custom_sport_type: race.custom_sport_type || '',
      show_public_entries_list: race.show_public_entries_list !== false,
      gender_restriction: race.gender_restriction || 'all',
    });
    setShowEditRaceModal(true);
  };

  const handleUpdateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRaceId) return;

    setCreatingRace(true);
    try {
      const { error } = await supabase
        .from('races')
        .update({
          name: raceFormData.name,
          distance: raceFormData.distance ? parseFloat(raceFormData.distance) : null,
          elevation_gain: raceFormData.elevation_gain ? parseInt(raceFormData.elevation_gain) : null,
          start_time: raceFormData.start_time || null,
          max_participants: raceFormData.max_participants ? parseInt(raceFormData.max_participants) : null,
          description: raceFormData.description || null,
          sport_type: raceFormData.sport_type,
          show_public_entries_list: raceFormData.show_public_entries_list,
          custom_sport_type: raceFormData.sport_type === 'other' ? raceFormData.custom_sport_type : null,
          gender_restriction: raceFormData.gender_restriction,
        })
        .eq('id', editingRaceId);

      if (error) throw error;

      // Logger l'action si c'est un admin
      if (isAdmin && currentUserId && id) {
        const oldRace = races.find(r => r.id === editingRaceId);
        if (oldRace) {
          const changes: any = {};
          if (oldRace.name !== raceFormData.name) {
            changes.name = { from: oldRace.name, to: raceFormData.name };
          }
          if (oldRace.distance?.toString() !== raceFormData.distance) {
            changes.distance = { from: oldRace.distance, to: raceFormData.distance };
          }

          if (Object.keys(changes).length > 0) {
            await auditService.logEventAction(
              id,
              'race_updated',
              currentUserId,
              { ...changes, race_name: raceFormData.name },
              `Modification de la course "${raceFormData.name}" par un administrateur`
            );
          }
        }
      }

      const updatedRaces = races.map(race =>
        race.id === editingRaceId
          ? {
              ...race,
              name: raceFormData.name,
                distance: raceFormData.distance ? parseFloat(raceFormData.distance) : null,
              elevation_gain: raceFormData.elevation_gain ? parseInt(raceFormData.elevation_gain) : null,
              start_time: raceFormData.start_time || null,
              max_participants: raceFormData.max_participants ? parseInt(raceFormData.max_participants) : null,
              description: raceFormData.description || null,
              sport_type: raceFormData.sport_type,
              custom_sport_type: raceFormData.sport_type === 'other' ? raceFormData.custom_sport_type : null,
              gender_restriction: raceFormData.gender_restriction,
            }
          : race
      );
      setRaces(updatedRaces);
      setShowEditRaceModal(false);
      setEditingRaceId(null);
      setRaceFormData({
        name: '',
        distance: '',
        elevation_gain: '',
        start_time: '',
        max_participants: '',
        description: '',
        sport_type: 'running',
        custom_sport_type: '',
        show_public_entries_list: true,
        gender_restriction: 'all',
      });
    } catch (err: any) {
      alert('Erreur lors de la mise à jour de l\'épreuve : ' + err.message);
    } finally {
      setCreatingRace(false);
    }
  };

  const handleSaveRegulations = async (raceId: string, content: string) => {
    setSavingRegulations(raceId);
    try {
      const { error } = await supabase
        .from('races')
        .update({ regulations: content })
        .eq('id', raceId);

      if (error) throw error;

      setRaceRegulations({
        ...raceRegulations,
        [raceId]: content
      });

      alert('Règlement sauvegardé avec succès !');
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde du règlement : ' + err.message);
    } finally {
      setSavingRegulations(null);
    }
  };

  const handleGPXUpload = async (raceId: string, file: File) => {
    setUploadingGPX(raceId);
    try {
      const gpxParsedData = await parseGPXFile(file);

      const filePath = `${raceId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('race-gpx')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('race-gpx')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('races')
        .update({
          gpx_file_url: publicUrl,
          elevation_profile: gpxParsedData,
        })
        .eq('id', raceId);

      if (updateError) throw updateError;

      setGpxData({ ...gpxData, [raceId]: gpxParsedData });

      setRaces(races.map(r => r.id === raceId ? {
        ...r,
        gpx_file_url: publicUrl,
        elevation_profile: gpxParsedData,
      } : r));

      alert('Tracé GPX importé avec succès !');
    } catch (err: any) {
      alert('Erreur lors de l\'import du GPX : ' + err.message);
    } finally {
      setUploadingGPX(null);
    }
  };

  const handleOpenEditModal = async () => {
    setEventFormData({
      name: event.name || '',
      slug: event.slug || '',
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      city: event.city || '',
      postal_code: event.postal_code || '',
      full_address: event.full_address || '',
      description: event.description || '',
      website: event.website || '',
      contact_email: event.contact_email || '',
      contact_phone: event.contact_phone || '',
      registration_url: event.registration_url || '',
      status: event.status || 'published',
      carpooling_enabled: event.carpooling_enabled || false,
      volunteer_enabled: event.volunteer_enabled || false,
      ffa_affiliated: event.ffa_affiliated || false,
      ffa_calorg_code: event.ffa_calorg_code || '',
    });
    setImageFile(null);
    setImagePreview(event.image_url || null);
    setImagePositionX(event.image_position_x || 50);
    setImagePositionY(event.image_position_y || 50);

    const { data } = await supabase
      .from('event_characteristics')
      .select('characteristic_type_id')
      .eq('event_id', event.id);

    setSelectedCharacteristics(data?.map(c => c.characteristic_type_id) || []);
    setShowEditEventModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5 MB');
        return;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('Seuls les formats JPEG et PNG sont acceptés');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingEvent(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Non authentifié');

      const slug = eventFormData.slug || eventFormData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      let imageUrl = event.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `events/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('organizer-logos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('organizer-logos')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('events')
        .update({
          name: eventFormData.name,
          slug: slug,
          start_date: eventFormData.start_date,
          end_date: eventFormData.end_date || eventFormData.start_date,
          city: eventFormData.city,
          postal_code: eventFormData.postal_code,
          full_address: eventFormData.full_address || null,
          description: eventFormData.description || null,
          website: eventFormData.website || null,
          contact_email: eventFormData.contact_email || null,
          contact_phone: eventFormData.contact_phone || null,
          registration_url: eventFormData.registration_url || null,
          status: eventFormData.status,
          carpooling_enabled: eventFormData.carpooling_enabled || false,
          volunteer_enabled: eventFormData.volunteer_enabled || false,
          ffa_affiliated: eventFormData.ffa_affiliated || false,
          ffa_calorg_code: eventFormData.ffa_affiliated ? eventFormData.ffa_calorg_code : null,
          image_url: imageUrl,
          image_position_x: imagePositionX,
          image_position_y: imagePositionY,
          organizer_id: event.organizer_id,
        })
        .eq('id', id);

      if (error) throw error;

      await supabase
        .from('event_characteristics')
        .delete()
        .eq('event_id', id);

      if (selectedCharacteristics.length > 0) {
        const characteristicsData = selectedCharacteristics.map(charId => ({
          event_id: id,
          characteristic_type_id: charId,
        }));

        await supabase
          .from('event_characteristics')
          .insert(characteristicsData);
      }

      // Logger l'action si c'est un admin
      if (isAdmin && currentUserId && id) {
        const changes: any = {};

        // Détecter les changements
        if (event.name !== eventFormData.name) {
          changes.name = { from: event.name, to: eventFormData.name };
        }
        if (event.start_date !== eventFormData.start_date) {
          changes.start_date = { from: event.start_date, to: eventFormData.start_date };
        }
        if (event.city !== eventFormData.city) {
          changes.city = { from: event.city, to: eventFormData.city };
        }
        if (event.status !== eventFormData.status) {
          changes.status = { from: event.status, to: eventFormData.status };
        }

        if (Object.keys(changes).length > 0) {
          await auditService.logEventAction(
            id,
            'event_updated',
            currentUserId,
            changes,
            'Modification de l\'événement par un administrateur'
          );
        }
      }

      await loadEvent();
      setShowEditEventModal(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      alert('Erreur lors de la mise à jour de l\'événement : ' + err.message);
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleVerifyCalorgCode = async () => {
    if (!eventFormData.ffa_calorg_code) {
      setCalorgVerificationMessage('❌ Veuillez saisir un code CalOrg');
      return;
    }

    setVerifyingCalorg(true);
    setCalorgVerificationMessage('');

    try {
      const result = await verifyCalorgCode(eventFormData.ffa_calorg_code);
      setCalorgVerificationMessage(result.message);

      if (result.valid && result.competition) {
        console.log('Competition info:', result.competition);
      }
    } catch (error) {
      console.error('CalOrg verification error:', error);
      setCalorgVerificationMessage('❌ Erreur lors de la vérification');
    } finally {
      setVerifyingCalorg(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvitation(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Non authentifié');

      const invitationCode = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('invitations')
        .insert([{
          event_id: id,
          race_id: invitationFormData.applies_to_all_races ? null : invitationFormData.race_id || null,
          company_name: invitationFormData.company_name,
          invitation_code: invitationCode,
          invitation_type: 'partner',
          status: 'active',
          max_uses: invitationFormData.max_uses ? parseInt(invitationFormData.max_uses) : null,
          current_uses: 0,
          applies_to_all_races: invitationFormData.applies_to_all_races,
          valid_from: invitationFormData.valid_from ? new Date(invitationFormData.valid_from).toISOString() : null,
          valid_until: invitationFormData.valid_until ? new Date(invitationFormData.valid_until).toISOString() : null,
          notes: invitationFormData.notes || null,
          created_by: organizerId,
        }]);

      if (error) throw error;

      await loadInvitations();
      setShowCreateInvitationModal(false);
      setInvitationFormData({
        company_name: '',
        race_id: '',
        applies_to_all_races: false,
        max_uses: '',
        valid_from: '',
        valid_until: '',
        notes: '',
      });
    } catch (err: any) {
      alert('Erreur lors de la création de l\'invitation : ' + err.message);
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleEditInvitation = (invitation: any) => {
    setEditingInvitationId(invitation.id);
    setInvitationFormData({
      company_name: invitation.company_name || '',
      race_id: invitation.race_id || '',
      applies_to_all_races: invitation.applies_to_all_races || false,
      max_uses: invitation.max_uses?.toString() || '',
      valid_from: invitation.valid_from ? new Date(invitation.valid_from).toISOString().slice(0, 16) : '',
      valid_until: invitation.valid_until ? new Date(invitation.valid_until).toISOString().slice(0, 16) : '',
      notes: invitation.notes || '',
    });
    setShowEditInvitationModal(true);
  };

  const handleUpdateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitationId) return;

    setCreatingInvitation(true);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          company_name: invitationFormData.company_name,
          race_id: invitationFormData.applies_to_all_races ? null : invitationFormData.race_id || null,
          applies_to_all_races: invitationFormData.applies_to_all_races,
          max_uses: invitationFormData.max_uses ? parseInt(invitationFormData.max_uses) : null,
          valid_from: invitationFormData.valid_from ? new Date(invitationFormData.valid_from).toISOString() : null,
          valid_until: invitationFormData.valid_until ? new Date(invitationFormData.valid_until).toISOString() : null,
          notes: invitationFormData.notes || null,
        })
        .eq('id', editingInvitationId);

      if (error) throw error;

      await loadInvitations();
      setShowEditInvitationModal(false);
      setEditingInvitationId(null);
      setInvitationFormData({
        company_name: '',
        race_id: '',
        applies_to_all_races: false,
        max_uses: '',
        valid_from: '',
        valid_until: '',
        notes: '',
      });
    } catch (err: any) {
      alert('Erreur lors de la modification : ' + err.message);
    } finally {
      setCreatingInvitation(false);
    }
  };

  const handleViewInvitationUsages = async (invitationId: string) => {
    setLoadingUsages(true);
    setShowInvitationUsagesModal(true);

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          first_name,
          last_name,
          email,
          registration_date,
          status,
          races:race_id (
            name
          )
        `)
        .eq('invitation_id', invitationId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      setSelectedInvitationUsages(data || []);
    } catch (err) {
      console.error('Error loading invitation usages:', err);
      setSelectedInvitationUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette invitation ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      await loadInvitations();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      await loadInvitations();
    } catch (err: any) {
      alert('Erreur lors de l\'annulation : ' + err.message);
    }
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/inscription/${event.slug}?invitation=${code}`;
    navigator.clipboard.writeText(link);
    alert('Lien d\'invitation copié dans le presse-papiers !');
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromoCode(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('promo_codes')
        .insert([{
          event_id: id,
          race_id: promoCodeFormData.applies_to_all_races ? null : promoCodeFormData.race_id || null,
          code: promoCodeFormData.code.toUpperCase(),
          description: promoCodeFormData.description || null,
          discount_type: promoCodeFormData.discount_type,
          discount_value: promoCodeFormData.discount_type === 'percentage'
            ? parseInt(promoCodeFormData.discount_value)
            : parseInt(promoCodeFormData.discount_value) * 100,
          usage_type: promoCodeFormData.usage_type,
          max_uses: promoCodeFormData.usage_type === 'unlimited' ? null : parseInt(promoCodeFormData.max_uses) || null,
          current_uses: 0,
          valid_from: promoCodeFormData.valid_from ? new Date(promoCodeFormData.valid_from).toISOString() : null,
          valid_until: promoCodeFormData.valid_until ? new Date(promoCodeFormData.valid_until).toISOString() : null,
          active: true,
          created_by: organizerId,
        }]);

      if (error) throw error;

      await loadPromoCodes();
      setShowCreatePromoCodeModal(false);
      setPromoCodeFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        usage_type: 'multiple',
        max_uses: '',
        valid_from: '',
        valid_until: '',
        race_id: '',
        applies_to_all_races: true,
      });
      alert('Code promo créé avec succès !');
    } catch (err: any) {
      alert('Erreur lors de la création : ' + err.message);
    } finally {
      setCreatingPromoCode(false);
    }
  };

  const handleEditPromoCode = (promoCode: any) => {
    setEditingPromoCodeId(promoCode.id);
    setPromoCodeFormData({
      code: promoCode.code || '',
      description: promoCode.description || '',
      discount_type: promoCode.discount_type || 'percentage',
      discount_value: promoCode.discount_type === 'fixed_amount'
        ? (promoCode.discount_value / 100).toString()
        : promoCode.discount_value.toString(),
      usage_type: promoCode.usage_type || 'multiple',
      max_uses: promoCode.max_uses?.toString() || '',
      valid_from: promoCode.valid_from ? new Date(promoCode.valid_from).toISOString().slice(0, 16) : '',
      valid_until: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().slice(0, 16) : '',
      race_id: promoCode.race_id || '',
      applies_to_all_races: !promoCode.race_id,
    });
    setShowEditPromoCodeModal(true);
  };

  const handleUpdatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromoCodeId) return;

    setCreatingPromoCode(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          description: promoCodeFormData.description || null,
          discount_type: promoCodeFormData.discount_type,
          discount_value: promoCodeFormData.discount_type === 'percentage'
            ? parseInt(promoCodeFormData.discount_value)
            : parseInt(promoCodeFormData.discount_value) * 100,
          usage_type: promoCodeFormData.usage_type,
          max_uses: promoCodeFormData.usage_type === 'unlimited' ? null : parseInt(promoCodeFormData.max_uses) || null,
          valid_from: promoCodeFormData.valid_from ? new Date(promoCodeFormData.valid_from).toISOString() : null,
          valid_until: promoCodeFormData.valid_until ? new Date(promoCodeFormData.valid_until).toISOString() : null,
          race_id: promoCodeFormData.applies_to_all_races ? null : promoCodeFormData.race_id || null,
        })
        .eq('id', editingPromoCodeId);

      if (error) throw error;

      await loadPromoCodes();
      setShowEditPromoCodeModal(false);
      setEditingPromoCodeId(null);
      setPromoCodeFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        usage_type: 'multiple',
        max_uses: '',
        valid_from: '',
        valid_until: '',
        race_id: '',
        applies_to_all_races: true,
      });
      alert('Code promo modifié avec succès !');
    } catch (err: any) {
      alert('Erreur lors de la modification : ' + err.message);
    } finally {
      setCreatingPromoCode(false);
    }
  };

  const handleViewPromoCodeUsages = async (promoCodeId: string) => {
    setLoadingPromoUsages(true);
    setShowPromoCodeUsagesModal(true);

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          first_name,
          last_name,
          email,
          registration_date,
          status,
          amount_paid_cents,
          races:race_id (
            name
          )
        `)
        .eq('promo_code_id', promoCodeId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      setSelectedPromoCodeUsages(data || []);
    } catch (err) {
      console.error('Error loading promo code usages:', err);
      setSelectedPromoCodeUsages([]);
    } finally {
      setLoadingPromoUsages(false);
    }
  };

  const handleTogglePromoCodeStatus = async (promoCodeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !currentStatus })
        .eq('id', promoCodeId);

      if (error) throw error;
      await loadPromoCodes();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDeletePromoCode = async (promoCodeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', promoCodeId);

      if (error) throw error;
      await loadPromoCodes();
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code promo copié dans le presse-papiers !');
  };

  const handleDeleteEvent = async () => {
    if (deleteConfirmText !== event.name) {
      return;
    }

    try {
      setDeleting(true);
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      navigate('/organizer/dashboard');
    } catch (err: any) {
      alert('Erreur lors de la suppression: ' + err.message);
      setDeleting(false);
    }
  };

  const handleOpenBibConfig = (raceId: string) => {
    setSelectedRaceForBibs(raceId);
    loadBibConfig(raceId);
    setShowBibConfigModal(true);
  };

  const loadBibConfig = async (raceId: string) => {
    try {
      const { data } = await supabase
        .from('race_bib_config')
        .select('*')
        .eq('race_id', raceId)
        .maybeSingle();

      if (data) {
        setBibConfig({
          mode: data.mode || 'BATCH',
          strategy: data.strategy || 'REG_ORDER',
          range_global_from: data.range_global_from?.toString() || '',
          range_global_to: data.range_global_to?.toString() || '',
          range_male_from: data.range_male_from?.toString() || '',
          range_male_to: data.range_male_to?.toString() || '',
          range_female_from: data.range_female_from?.toString() || '',
          range_female_to: data.range_female_to?.toString() || '',
          split_by_gender: !!(data.range_male_from && data.range_female_from),
          reuse_freed_numbers: data.reuse_freed_numbers || false,
        });
      } else {
        setBibConfig({
          mode: 'BATCH',
          strategy: 'REG_ORDER',
          range_global_from: '1',
          range_global_to: '500',
          range_male_from: '',
          range_male_to: '',
          range_female_from: '',
          range_female_to: '',
          split_by_gender: false,
          reuse_freed_numbers: false,
        });
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de la config:', err);
    }
  };

  const handleSaveBibConfig = async () => {
    if (!selectedRaceForBibs) return;

    setSavingBibConfig(true);
    try {
      const configData = {
        race_id: selectedRaceForBibs,
        mode: bibConfig.mode,
        strategy: bibConfig.strategy,
        range_global_from: bibConfig.split_by_gender ? null : (bibConfig.range_global_from ? parseInt(bibConfig.range_global_from) : null),
        range_global_to: bibConfig.split_by_gender ? null : (bibConfig.range_global_to ? parseInt(bibConfig.range_global_to) : null),
        range_male_from: bibConfig.split_by_gender ? (bibConfig.range_male_from ? parseInt(bibConfig.range_male_from) : null) : null,
        range_male_to: bibConfig.split_by_gender ? (bibConfig.range_male_to ? parseInt(bibConfig.range_male_to) : null) : null,
        range_female_from: bibConfig.split_by_gender ? (bibConfig.range_female_from ? parseInt(bibConfig.range_female_from) : null) : null,
        range_female_to: bibConfig.split_by_gender ? (bibConfig.range_female_to ? parseInt(bibConfig.range_female_to) : null) : null,
        reuse_freed_numbers: bibConfig.reuse_freed_numbers,
      };

      const { error } = await supabase
        .from('race_bib_config')
        .upsert([configData], { onConflict: 'race_id' });

      if (error) throw error;

      alert('Configuration des dossards enregistrée avec succès !');
      setShowBibConfigModal(false);
    } catch (err: any) {
      alert('Erreur lors de l\'enregistrement : ' + err.message);
    } finally {
      setSavingBibConfig(false);
    }
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </OrganizerLayout>
    );
  }

  if (error || !event) {
    return (
      <OrganizerLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Événement introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Cet événement n\'existe pas ou vous n\'avez pas les droits pour y accéder.'}</p>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </OrganizerLayout>
    );
  }

  const eventTabs = [
    { id: 'event-info', label: 'Informations générales', icon: Settings, color: 'blue' },
    { id: 'invitations', label: 'Invitations partenaires', icon: Link2, color: 'teal' },
    { id: 'promo-codes', label: 'Codes promo', icon: DollarSign, color: 'emerald' },
    { id: 'partners', label: 'Partenaires', icon: Handshake, color: 'amber' },
    { id: 'speaker', label: 'Module Speaker', icon: Mic, color: 'rose' },
    ...(event?.volunteer_enabled ? [{ id: 'volunteers', label: 'Bénévoles', icon: Users, color: 'cyan' }] : []),
    ...(event?.carpooling_enabled ? [{ id: 'carpooling', label: 'Co-voiturage', icon: Users, color: 'sky' }] : []),
    { id: 'bib-exchange', label: 'Bourse aux dossards', icon: Users, color: 'indigo' },
  ];

  const raceTabs = [
    { id: 'races', label: 'Gestion des épreuves', icon: Calendar, color: 'violet' },
    { id: 'registrations', label: 'Inscriptions', icon: Users, color: 'purple' },
    { id: 'results', label: 'Résultats', icon: TrendingUp, color: 'fuchsia' },
  ];

  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200',
      teal: isActive ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-teal-50 text-teal-600 hover:bg-teal-100 border-teal-200',
      emerald: isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200',
      cyan: isActive ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-200',
      sky: isActive ? 'bg-sky-100 text-sky-700 border-sky-300' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200',
      indigo: isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200',
      violet: isActive ? 'bg-violet-100 text-violet-700 border-violet-300' : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-200',
      purple: isActive ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200',
      fuchsia: isActive ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300' : 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-100 border-fuchsia-200',
      rose: isActive ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200',
      amber: isActive ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200',
      lime: isActive ? 'bg-lime-100 text-lime-700 border-lime-300' : 'bg-lime-50 text-lime-600 hover:bg-lime-100 border-lime-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getRaceSubTabColor = (tabId: string, isActive: boolean) => {
    const colors = {
      info: isActive ? 'bg-blue-100 text-blue-700 border-b-3 border-blue-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-b-3 border-transparent',
      pricing: isActive ? 'bg-emerald-100 text-emerald-700 border-b-3 border-emerald-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-b-3 border-transparent',
      bibs: isActive ? 'bg-amber-100 text-amber-700 border-b-3 border-amber-500' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-b-3 border-transparent',
      options: isActive ? 'bg-violet-100 text-violet-700 border-b-3 border-violet-500' : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-b-3 border-transparent',
      categories: isActive ? 'bg-rose-100 text-rose-700 border-b-3 border-rose-500' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-b-3 border-transparent',
      regulations: isActive ? 'bg-cyan-100 text-cyan-700 border-b-3 border-cyan-500' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-b-3 border-transparent',
    };
    return colors[tabId as keyof typeof colors] || colors.info;
  };

  const getFillRate = (registrations: number, max: number) => {
    if (!max || max === 0) return 0;
    return Math.round((registrations / max) * 100);
  };

  const getTotalRegistrations = () => {
    return Object.values(raceFinancialData).reduce((sum, race) => sum + race.registrationCount, 0);
  };

  const getTotalMaxParticipants = () => {
    return races.reduce((sum, race) => sum + (race.max_participants || 0), 0);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Actif', class: 'bg-green-100 text-green-800' },
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800' },
      published: { label: 'Publié', class: 'bg-blue-100 text-blue-800' },
      open: { label: 'Ouvert', class: 'bg-green-100 text-green-800' },
      closed: { label: 'Fermé', class: 'bg-red-100 text-red-800' },
      full: { label: 'Complet', class: 'bg-orange-100 text-orange-800' },
      cancelled: { label: 'Annulé', class: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/organizer/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-600 mt-1">Gestion complète de votre événement</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
            >
              <Settings className="w-4 h-4" />
              <span>Modifier l'événement</span>
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              <span>Aperçu</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{getTotalRegistrations()}</p>
            <p className="text-sm text-gray-600">Inscrits / {getTotalMaxParticipants() || 'Illimité'}</p>
            {getTotalMaxParticipants() > 0 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((getTotalRegistrations() / getTotalMaxParticipants() * 100), 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Object.values(raceFinancialData).reduce((sum, race) => sum + race.currentRevenue, 0).toFixed(2)} €
            </p>
            <p className="text-sm text-gray-600">CA réalisé</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{getFillRate(getTotalRegistrations(), getTotalMaxParticipants())}%</p>
            <p className="text-sm text-gray-600">Taux de remplissage</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-pink-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{races.length}</p>
            <p className="text-sm text-gray-600">Épreuves</p>
          </div>
        </div>

        {/* Section Événement */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Paramètres de l'Événement</h2>
              <p className="text-sm text-gray-600">Configuration générale, invitations, promotions et services</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap gap-1.5 px-4 py-2" aria-label="Event Tabs">
                {eventTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition-all border-2 ${
                        getTabColorClasses(tab.color, activeTab === tab.id)
                      } ${activeTab === tab.id ? 'shadow-md' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'event-info' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-blue-600" />
                          Informations de l'événement
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Modifiez les informations principales de votre événement
                        </p>
                      </div>
                      <button
                        onClick={handleOpenEditModal}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier l'événement
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Nom de l'événement</p>
                        <p className="font-semibold text-gray-900">{event.name}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Lieu</p>
                        <p className="font-semibold text-gray-900">{event.location}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(event.start_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Statut</p>
                        <div className="mt-1">{getStatusBadge(event.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'invitations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Invitations partenaires</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Créez des liens d'inscription gratuits pour vos partenaires
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCreateInvitationModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Créer une invitation</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">Contenu invitations à venir...</p>
                </div>
              )}

              {activeTab === 'promo-codes' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-700">Contenu codes promo à venir...</p>
                </div>
              )}

              {activeTab === 'volunteers' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Gestion des Bénévoles</h3>
                    <p className="text-green-700 mb-4">
                      Créez des postes bénévoles (ravitaillements, sécurité, signalisation...), recevez les inscriptions et gérez votre équipe le jour J. Fiches de poste automatiques avec localisation GPS.
                    </p>
                    <button
                      onClick={() => navigate(`/organizer/events/${id}/volunteers`)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Accéder à la gestion des bénévoles
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'carpooling' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Gestion des Co-voiturages</h3>
                    <p className="text-blue-700 mb-4">
                      Consultez et gérez toutes les offres de co-voiturage pour cet événement. Vous pouvez modifier les informations, annuler des offres si nécessaire et voir la liste des passagers.
                    </p>
                    <button
                      onClick={() => navigate(`/organizer/events/${id}/carpooling`)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Accéder à la gestion des co-voiturages
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'bib-exchange' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-pink-900 mb-2 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Bourse aux Dossards
                    </h3>
                    <p className="text-pink-700 mb-4">
                      Permettez aux participants de revendre leurs dossards en toute sécurité. Configurez les paramètres, suivez les transactions et gérez les transferts automatiques. Les vendeurs sont remboursés automatiquement (moins 5€ de frais Timepulse).
                    </p>
                    <button
                      onClick={() => navigate(`/organizer/events/${id}/bib-exchange`)}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      Accéder à la bourse aux dossards
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'partners' && event && (
                <OrganizerEventPartners eventId={event.id} />
              )}

              {activeTab === 'speaker' && event && (
                <OrganizerSpeakerConfig
                  eventId={event.id}
                  organizerId={event.organizer_id}
                />
              )}
            </div>
          </div>
        </div>

        {/* Section Épreuves */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 shadow-lg border-2 border-pink-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion des Épreuves</h2>
              <p className="text-sm text-gray-600">Configuration des courses, tarifs, dossards et inscriptions</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap gap-1.5 px-4 py-2" aria-label="Race Tabs">
                {raceTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition-all border-2 ${
                        getTabColorClasses(tab.color, activeTab === tab.id)
                      } ${activeTab === tab.id ? 'shadow-md' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'races' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Épreuves ({races.length})</h3>
                  <button
                    onClick={() => setShowCreateRaceModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle épreuve</span>
                  </button>
                </div>

                {races.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune épreuve</h3>
                    <p className="text-gray-600 mb-6">Commencez par créer votre première épreuve pour cet événement</p>
                    <button
                      onClick={() => setShowCreateRaceModal(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Créer ma première épreuve</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {races.map((race) => {
                      const isExpanded = expandedRaceId === race.id;
                      const currentSubTab = raceSubTab[race.id] || 'info';

                      return (
                        <div key={race.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{race.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span>{race.distance} km</span>
                                  {race.elevation_gain && (
                                    <span className="flex items-center">
                                      <Mountain className="w-4 h-4 mr-1 text-pink-600" />
                                      {race.elevation_gain}m D+
                                    </span>
                                  )}
                                  {race.start_time && <span>{race.start_time}</span>}
                                </div>
                              </div>
                              {getStatusBadge(race.status || 'active')}
                            </div>

                            {race.max_participants && (
                              <div className="mb-4 space-y-3">
                                <div>
                                  <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                                    <span className="flex items-center">
                                      <Users className="w-4 h-4 mr-1" />
                                      Jauge d'inscriptions
                                    </span>
                                    <span className="font-medium">
                                      {raceFinancialData[race.id]?.registrationCount || 0} / {race.max_participants} ({((raceFinancialData[race.id]?.registrationCount || 0) / race.max_participants * 100).toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(((raceFinancialData[race.id]?.registrationCount || 0) / race.max_participants * 100), 100)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {raceFinancialData[race.id] && raceFinancialData[race.id].maxRevenue > 0 && (
                                  <div>
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                                      <span className="flex items-center">
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        Jauge financière
                                      </span>
                                      <span className="font-medium">
                                        {raceFinancialData[race.id].currentRevenue.toFixed(2)} € / {raceFinancialData[race.id].maxRevenue.toFixed(2)} € ({((raceFinancialData[race.id].currentRevenue / raceFinancialData[race.id].maxRevenue) * 100).toFixed(0)}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(((raceFinancialData[race.id].currentRevenue / raceFinancialData[race.id].maxRevenue) * 100), 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setExpandedRaceId(isExpanded ? null : race.id);
                                  if (!isExpanded) {
                                    setRaceSubTab({...raceSubTab, [race.id]: 'info'});
                                  }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 text-sm"
                              >
                                {isExpanded ? 'Fermer' : 'Gérer l\'épreuve'}
                              </button>
                              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                Voir les inscrits
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50">
                              <div className="flex gap-1 p-2 bg-white">
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'info'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('info', currentSubTab === 'info')
                                  }`}
                                >
                                  Informations
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'pricing'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('pricing', currentSubTab === 'pricing')
                                  }`}
                                >
                                  Tarifs
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'bibs'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('bibs', currentSubTab === 'bibs')
                                  }`}
                                >
                                  Dossards
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'options'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('options', currentSubTab === 'options')
                                  }`}
                                >
                                  Options
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'categories'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('categories', currentSubTab === 'categories')
                                  }`}
                                >
                                  Catégories
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'regulations'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('regulations', currentSubTab === 'regulations')
                                  }`}
                                >
                                  Règlement
                                </button>
                                <button
                                  onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'teams'})}
                                  className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                    getRaceSubTabColor('teams', currentSubTab === 'teams')
                                  }`}
                                >
                                  Configuration Équipes
                                </button>
                                {race.is_team_race && (
                                  <button
                                    onClick={() => setRaceSubTab({...raceSubTab, [race.id]: 'teams-manage'})}
                                    className={`px-4 py-2.5 text-xs font-semibold transition-all rounded-t-lg ${
                                      getRaceSubTabColor('teams-manage', currentSubTab === 'teams-manage')
                                    }`}
                                  >
                                    Gestion Équipes
                                  </button>
                                )}
                              </div>

                              <div className="p-6">
                                {currentSubTab === 'info' && (
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-semibold text-gray-900">Détails de l'épreuve</h4>
                                      <button
                                        onClick={() => handleEditRace(race)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 text-sm"
                                      >
                                        <Settings className="w-4 h-4" />
                                        <span>Modifier les informations</span>
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                      <div>
                                        <span className="text-gray-600">Distance:</span>
                                        <span className="ml-2 font-medium">{race.distance} km</span>
                                      </div>
                                      {race.elevation_gain && (
                                        <div>
                                          <span className="text-gray-600">Dénivelé:</span>
                                          <span className="ml-2 font-medium flex items-center">
                                            <Mountain className="w-4 h-4 mr-1 text-pink-600" />
                                            {race.elevation_gain}m D+
                                          </span>
                                        </div>
                                      )}
                                      {race.start_time && (
                                        <div>
                                          <span className="text-gray-600">Heure de départ:</span>
                                          <span className="ml-2 font-medium">{race.start_time}</span>
                                        </div>
                                      )}
                                      {race.max_participants && (
                                        <div>
                                          <span className="text-gray-600">Participants max:</span>
                                          <span className="ml-2 font-medium">{race.max_participants}</span>
                                        </div>
                                      )}
                                      {race.gender_restriction && race.gender_restriction !== 'all' && (
                                        <div>
                                          <span className="text-gray-600">Restriction de genre:</span>
                                          <span className="ml-2 font-medium">
                                            {race.gender_restriction === 'M' ? 'Hommes uniquement' : 'Femmes uniquement'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-6">
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900 flex items-center">
                                          <Mountain className="w-5 h-5 mr-2 text-pink-600" />
                                          Tracé GPX et profil d'altitude
                                        </h4>
                                        <label className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 cursor-pointer">
                                          {uploadingGPX === race.id ? (
                                            <>
                                              <span className="animate-spin">⏳</span>
                                              <span>Import en cours...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-4 h-4" />
                                              <span>{race.gpx_file_url ? 'Remplacer le tracé' : 'Importer un tracé GPX'}</span>
                                            </>
                                          )}
                                          <input
                                            type="file"
                                            accept=".gpx"
                                            className="hidden"
                                            disabled={uploadingGPX === race.id}
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleGPXUpload(race.id, file);
                                            }}
                                          />
                                        </label>
                                      </div>

                                      {gpxData[race.id] ? (
                                        <ElevationProfile data={gpxData[race.id]} />
                                      ) : (
                                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                                          <Mountain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                          <p className="text-gray-600 mb-2">Aucun tracé GPX importé</p>
                                          <p className="text-sm text-gray-500">
                                            Importez un fichier GPX pour afficher le profil d'altitude et permettre aux participants de visualiser le parcours.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {currentSubTab === 'pricing' && (
                                  <RacePricingManager
                                    raceId={race.id}
                                    raceMaxParticipants={race.max_participants}
                                  />
                                )}

                                {currentSubTab === 'bibs' && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-4">Configuration des dossards</h4>
                                    <p className="text-gray-600 text-sm mb-4">
                                      Définissez les plages de numéros de dossards pour cette épreuve.
                                    </p>
                                    <button
                                      onClick={() => handleOpenBibConfig(race.id)}
                                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                                    >
                                      Configurer les dossards
                                    </button>
                                  </div>
                                )}

                                {currentSubTab === 'options' && (
                                  <RaceOptionsManager
                                    raceId={race.id}
                                    raceName={race.name}
                                  />
                                )}

                                {currentSubTab === 'categories' && (
                                  <RaceCategoryManager
                                    raceId={race.id}
                                    isFfaRace={race.is_ffa_race || false}
                                    onFfaToggle={async (isFfa) => {
                                      const { error } = await supabase
                                        .from('races')
                                        .update({ is_ffa_race: isFfa })
                                        .eq('id', race.id);

                                      if (!error) {
                                        setRaces(races.map(r =>
                                          r.id === race.id ? { ...r, is_ffa_race: isFfa } : r
                                        ));
                                      }
                                    }}
                                  />
                                )}

                                {currentSubTab === 'regulations' && (
                                  <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                      <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Règlement sportif de l'épreuve</p>
                                        <p>Le règlement sera affiché sur la page de l'événement et <strong>devra être accepté par l'athlète avant de valider son inscription</strong>. Sans acceptation, l'athlète ne pourra pas accéder au paiement.</p>
                                      </div>
                                    </div>

                                    <RichTextEditor
                                      value={raceRegulations[race.id] || ''}
                                      onChange={(value) => setRaceRegulations({
                                        ...raceRegulations,
                                        [race.id]: value
                                      })}
                                      placeholder="Saisissez ou collez le règlement sportif de l'épreuve ici. Vous pouvez utiliser du HTML pour la mise en page."
                                      label="Contenu du règlement sportif"
                                      showAI={false}
                                    />

                                    <div className="flex justify-end gap-3">
                                      <button
                                        onClick={() => setRaceRegulations({
                                          ...raceRegulations,
                                          [race.id]: ''
                                        })}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                      >
                                        Effacer
                                      </button>
                                      <button
                                        onClick={() => handleSaveRegulations(race.id, raceRegulations[race.id] || '')}
                                        disabled={savingRegulations === race.id}
                                        className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                      >
                                        {savingRegulations === race.id ? (
                                          <>
                                            <span className="animate-spin">⏳</span>
                                            Sauvegarde...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4" />
                                            Sauvegarder le règlement
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {currentSubTab === 'teams' && (
                                  <RaceTeamConfig
                                    raceId={race.id}
                                    isTeamRace={race.is_team_race || false}
                                    teamConfig={race.team_config || {
                                      enabled: false,
                                      min_members: 2,
                                      max_members: 6,
                                      team_types: ['mixte'],
                                      allow_mixed_gender: true,
                                      require_full_team: false,
                                      payment_mode: 'team',
                                      allow_individual_payment: true,
                                      modify_deadline_days: 7,
                                      allow_multi_registration: false,
                                      bib_format: 'suffix',
                                      auto_assign_bibs: true,
                                    }}
                                    onChange={async (isTeamRace, teamConfig) => {
                                      const { error } = await supabase
                                        .from('races')
                                        .update({
                                          is_team_race: isTeamRace,
                                          team_config: teamConfig,
                                          team_rules: teamConfig.team_rules || null,
                                        })
                                        .eq('id', race.id);

                                      if (error) {
                                        console.error('Error updating team config:', error);
                                      } else {
                                        await loadEvent();
                                      }
                                    }}
                                  />
                                )}

                                {currentSubTab === 'teams-manage' && race.is_team_race && (
                                  <OrganizerTeamsManager
                                    raceId={race.id}
                                    raceName={race.name}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'registrations' && (
              <div className="space-y-6">
                {!showManualEntryForm ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Gestion des inscriptions</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/organizer/entries?eventId=${id}`)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                          Vue pleine page
                        </button>
                        <button
                          onClick={() => setShowManualEntryForm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          Nouvelle inscription manuelle
                        </button>
                      </div>
                    </div>
                    <EntriesList eventId={id!} races={races} />
                  </>
                ) : (
                  organizerId && adminUserId && (
                    <ManualEntryForm
                      eventId={id!}
                      races={races}
                      organizerId={organizerId}
                      adminUserId={adminUserId}
                      onClose={() => setShowManualEntryForm(false)}
                      onSuccess={() => {
                        setShowManualEntryForm(false);
                        loadEvent();
                      }}
                    />
                  )
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Import des Résultats</h3>
                  <p className="text-sm text-gray-600">
                    Importez les résultats des épreuves depuis différents formats (CSV, Excel, FFA E@logica, HTML, Elogica XML)
                  </p>
                </div>

                {races.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Créez d'abord une épreuve pour importer les résultats</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {races.map((race) => (
                      <div key={race.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900">{race.name}</h4>
                          <p className="text-sm text-gray-600">{race.distance} km</p>
                        </div>
                        <div className="p-6">
                          <ResultsImporter
                            raceId={race.id}
                            onImportComplete={() => {
                              alert('Résultats importés avec succès !');
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invitations partenaires</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Créez des liens d'inscription gratuits pour vos partenaires
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateInvitationModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle invitation
                  </button>
                </div>

                {invitations.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucune invitation créée pour le moment</p>
                    <button
                      onClick={() => setShowCreateInvitationModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                    >
                      Créer la première invitation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation) => {
                      const isActive = invitation.status === 'active';
                      const isExpired = invitation.valid_until && new Date(invitation.valid_until) < new Date();
                      const isExhausted = invitation.max_uses && invitation.current_uses >= invitation.max_uses;

                      let statusColor = 'bg-green-100 text-green-800';
                      let statusIcon = <CheckCircle className="w-4 h-4" />;
                      let statusText = 'Actif';

                      if (invitation.status === 'cancelled') {
                        statusColor = 'bg-gray-100 text-gray-800';
                        statusIcon = <Ban className="w-4 h-4" />;
                        statusText = 'Annulé';
                      } else if (isExpired) {
                        statusColor = 'bg-orange-100 text-orange-800';
                        statusIcon = <AlertCircle className="w-4 h-4" />;
                        statusText = 'Expiré';
                      } else if (isExhausted) {
                        statusColor = 'bg-red-100 text-red-800';
                        statusIcon = <XCircle className="w-4 h-4" />;
                        statusText = 'Épuisé';
                      }

                      return (
                        <div key={invitation.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {invitation.company_name}
                                </h4>
                                <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                                  {statusIcon}
                                  {statusText}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>
                                  <strong>Épreuve:</strong>{' '}
                                  {invitation.applies_to_all_races
                                    ? 'Toutes les épreuves'
                                    : invitation.races?.name || 'Non spécifié'}
                                </p>
                                <p>
                                  <strong>Utilisations:</strong>{' '}
                                  {invitation.current_uses} / {invitation.max_uses || '∞'}
                                </p>
                                {(invitation.valid_from || invitation.valid_until) && (
                                  <p>
                                    <strong>Période de validité:</strong>{' '}
                                    {invitation.valid_from
                                      ? `Du ${new Date(invitation.valid_from).toLocaleDateString('fr-FR')} `
                                      : 'À partir de maintenant '}
                                    {invitation.valid_until
                                      ? `au ${new Date(invitation.valid_until).toLocaleDateString('fr-FR')}`
                                      : 'sans limite'}
                                  </p>
                                )}
                                {invitation.notes && (
                                  <p>
                                    <strong>Notes:</strong> {invitation.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              {invitation.current_uses > 0 && (
                                <button
                                  onClick={() => handleViewInvitationUsages(invitation.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                  title="Voir les utilisations"
                                >
                                  <Users className="w-4 h-4" />
                                  Voir ({invitation.current_uses})
                                </button>
                              )}
                              {isActive && !isExpired && !isExhausted && (
                                <button
                                  onClick={() => copyInvitationLink(invitation.invitation_code)}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                  title="Copier le lien"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copier
                                </button>
                              )}
                              {isActive && (
                                <>
                                  <button
                                    onClick={() => handleEditInvitation(invitation)}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelInvitation(invitation.id)}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                                    title="Annuler l'invitation"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Annuler
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteInvitation(invitation.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isActive && !isExpired && !isExhausted && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={`${window.location.origin}/inscription/${event.slug}?invitation=${invitation.invitation_code}`}
                                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'promo-codes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Codes promotionnels</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Créez des codes promo pour offrir des réductions sur les inscriptions
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreatePromoCodeModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
                  >
                    <Plus className="w-5 h-5" />
                    Créer un code promo
                  </button>
                </div>

                {promoCodes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Aucun code promo créé</p>
                    <p className="text-sm text-gray-500">
                      Créez des codes promo pour offrir des réductions à vos participants
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {promoCodes.map((promo) => {
                      const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
                      const isNotStarted = promo.valid_from && new Date(promo.valid_from) > new Date();
                      const isExhausted = promo.usage_type !== 'unlimited' && promo.max_uses && promo.current_uses >= promo.max_uses;
                      const isActive = promo.active && !isExpired && !isNotStarted && !isExhausted;

                      let statusColor = 'bg-green-100 text-green-800';
                      let statusIcon = <CheckCircle className="w-4 h-4" />;
                      let statusText = 'Actif';

                      if (!promo.active) {
                        statusColor = 'bg-gray-100 text-gray-800';
                        statusIcon = <Ban className="w-4 h-4" />;
                        statusText = 'Désactivé';
                      } else if (isExpired) {
                        statusColor = 'bg-orange-100 text-orange-800';
                        statusIcon = <AlertCircle className="w-4 h-4" />;
                        statusText = 'Expiré';
                      } else if (isNotStarted) {
                        statusColor = 'bg-blue-100 text-blue-800';
                        statusIcon = <Clock className="w-4 h-4" />;
                        statusText = 'Programmé';
                      } else if (isExhausted) {
                        statusColor = 'bg-red-100 text-red-800';
                        statusIcon = <XCircle className="w-4 h-4" />;
                        statusText = 'Épuisé';
                      }

                      return (
                        <div key={promo.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <code className="px-4 py-2 bg-gray-100 text-gray-900 font-mono font-bold text-lg rounded-lg">
                                  {promo.code}
                                </code>
                                <span className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                                  {statusIcon}
                                  {statusText}
                                </span>
                              </div>

                              {promo.description && (
                                <p className="text-gray-700 mb-3">{promo.description}</p>
                              )}

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Réduction:</strong>{' '}
                                  {promo.discount_type === 'percentage'
                                    ? `${promo.discount_value}%`
                                    : `${(promo.discount_value / 100).toFixed(2)}€`}
                                </div>
                                <div>
                                  <strong>Épreuve:</strong>{' '}
                                  {promo.race_id ? promo.races?.name : 'Toutes les épreuves'}
                                </div>
                                <div>
                                  <strong>Utilisations:</strong>{' '}
                                  {promo.usage_type === 'unlimited'
                                    ? `${promo.current_uses} (illimité)`
                                    : `${promo.current_uses} / ${promo.max_uses}`}
                                </div>
                                {(promo.valid_from || promo.valid_until) && (
                                  <div>
                                    <strong>Période de validité:</strong>{' '}
                                    {promo.valid_from
                                      ? `Du ${new Date(promo.valid_from).toLocaleDateString('fr-FR')} `
                                      : 'À partir de maintenant '}
                                    {promo.valid_until
                                      ? `au ${new Date(promo.valid_until).toLocaleDateString('fr-FR')}`
                                      : 'sans limite'}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              {promo.current_uses > 0 && (
                                <button
                                  onClick={() => handleViewPromoCodeUsages(promo.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                  title="Voir les utilisations"
                                >
                                  <Users className="w-4 h-4" />
                                  Voir ({promo.current_uses})
                                </button>
                              )}
                              <button
                                onClick={() => copyPromoCode(promo.code)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                title="Copier le code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPromoCode(promo)}
                                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTogglePromoCodeStatus(promo.id, promo.active)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                  promo.active
                                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                                title={promo.active ? 'Désactiver' : 'Activer'}
                              >
                                {promo.active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeletePromoCode(promo.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'volunteers' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Gestion des Bénévoles</h3>
                  <p className="text-green-700 mb-4">
                    Créez des postes bénévoles (ravitaillements, sécurité, signalisation...), recevez les inscriptions et gérez votre équipe le jour J. Fiches de poste automatiques avec localisation GPS.
                  </p>
                  <button
                    onClick={() => navigate(`/organizer/events/${id}/volunteers`)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    Accéder à la gestion des bénévoles
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'carpooling' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Gestion des Co-voiturages</h3>
                  <p className="text-blue-700 mb-4">
                    Consultez et gérez toutes les offres de co-voiturage pour cet événement. Vous pouvez modifier les informations, annuler des offres si nécessaire et voir la liste des passagers.
                  </p>
                  <button
                    onClick={() => navigate(`/organizer/events/${id}/carpooling`)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Accéder à la gestion des co-voiturages
                  </button>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      </div>

      {showPreview && event && (
        <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
          <div className="min-h-screen">
            <div className="bg-white shadow-sm sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Mode Aperçu
                  </div>
                  <span className="text-gray-600 text-sm">
                    Voici comment votre événement apparaîtra aux participants
                  </span>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  <X className="w-4 h-4" />
                  <span>Retour à la gestion</span>
                </button>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-96">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${event.image_position_x || 50}% ${event.image_position_y || 50}%`
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-4xl">
                      <h1 className="text-5xl font-bold mb-4">{event.name}</h1>
                      <div className="flex flex-wrap gap-6 text-lg">
                        {event.start_date && (
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            {new Date(event.start_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                        {(event.city || event.postal_code) && (
                          <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2" />
                            {event.city}{event.city && event.postal_code ? ', ' : ''}{event.postal_code}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos de l'événement</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {event.description || 'Description de l\'événement à venir...'}
                        </p>
                      </div>

                      {event.full_address && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Lieu de départ</h3>
                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 text-pink-600 mr-3 mt-1" />
                            <div className="flex-1">
                              <p className="text-gray-700">{event.full_address}</p>
                              <p className="text-gray-600 mb-2">{event.city} {event.postal_code}</p>
                              <a
                                href={`https://waze.com/ul?q=${encodeURIComponent(`${event.full_address}, ${event.city} ${event.postal_code}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-[#33CCFF] text-white rounded-lg hover:bg-[#2BB8E8] transition-colors text-sm font-medium"
                              >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                Ouvrir dans Waze
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="space-y-4">
                      {races.length > 0 && (
                        <>
                          {races.map((race) => (
                            <div
                              key={race.id}
                              className="relative bg-white rounded-xl shadow-lg overflow-hidden"
                              style={{
                                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${getSportImage(race.sport_type as SportType)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                              <div className="p-5 text-white">
                                <h3 className="text-xl font-bold mb-3">{race.name}</h3>

                                <div className="space-y-2 mb-4">
                                  {race.distance && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mountain className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">{race.distance} km</span>
                                    </div>
                                  )}

                                  {race.elevation_gain && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <TrendingUp className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">D+ {race.elevation_gain} m</span>
                                    </div>
                                  )}

                                  {race.start_time && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      <span className="font-medium">
                                        {new Date(`2000-01-01T${race.start_time}`).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  )}

                                  {race.max_participants && (
                                    <div className="text-sm">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 flex-shrink-0" />
                                          <span className="font-medium">0 / {race.max_participants}</span>
                                        </div>
                                        <span className="text-xs font-semibold">0%</span>
                                      </div>
                                      <div className="w-full bg-white/20 rounded-full h-1.5">
                                        <div
                                          className="bg-white h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: '0%' }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {gpxData[race.id] && (
                                  <div className="mb-4">
                                    <ElevationProfile data={gpxData[race.id]} height={60} compact={true} />
                                  </div>
                                )}

                                {event.status === 'published' && (
                                  <a
                                    href={event.registration_url || '#'}
                                    target={event.registration_url ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="block w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-2.5 px-4 rounded-lg text-center transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                                  >
                                    S'inscrire
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {(event.contact_email || event.contact_phone || event.website) && (
                        <div className="bg-gray-50 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
                          <div className="space-y-3 text-sm">
                            {event.contact_email && (
                              <div>
                                <p className="text-gray-600 mb-1">Email</p>
                                <a href={`mailto:${event.contact_email}`} className="text-pink-600 hover:underline">
                                  {event.contact_email}
                                </a>
                              </div>
                            )}
                            {event.contact_phone && (
                              <div>
                                <p className="text-gray-600 mb-1">Téléphone</p>
                                <a href={`tel:${event.contact_phone}`} className="text-pink-600 hover:underline">
                                  {event.contact_phone}
                                </a>
                              </div>
                            )}
                            {event.website && (
                              <div>
                                <p className="text-gray-600 mb-1">Site web</p>
                                <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline break-all">
                                  {event.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Supprimer l'événement
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Cette action est irréversible. Toutes les données liées à cet événement seront définitivement supprimées.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pour confirmer, tapez le nom de l'événement : <span className="font-bold text-gray-900">{event.name}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nom de l'événement"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleteConfirmText !== event.name || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateInvitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Créer une invitation partenaire</h2>
                <button
                  onClick={() => setShowCreateInvitationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateInvitation} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise / Partenaire *
                </label>
                <input
                  type="text"
                  required
                  value={invitationFormData.company_name}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Société XYZ, Mairie de..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ce nom sera visible dans votre liste d'invitations
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitationFormData.applies_to_all_races}
                    onChange={(e) => setInvitationFormData({
                      ...invitationFormData,
                      applies_to_all_races: e.target.checked,
                      race_id: e.target.checked ? '' : invitationFormData.race_id
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Valable pour toutes les épreuves
                  </span>
                </label>

                {!invitationFormData.applies_to_all_races && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épreuve concernée *
                    </label>
                    <select
                      required={!invitationFormData.applies_to_all_races}
                      value={invitationFormData.race_id}
                      onChange={(e) => setInvitationFormData({ ...invitationFormData, race_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez une épreuve</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.name} ({race.distance} km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'utilisations maximum
                </label>
                <input
                  type="number"
                  min="1"
                  value={invitationFormData.max_uses}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, max_uses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Laisser vide pour illimité"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Le lien sera désactivé une fois le nombre d'utilisations atteint
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={invitationFormData.valid_from}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Le lien sera valable à partir de cette date
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={invitationFormData.valid_until}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Le lien ne sera plus valable après cette date
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={invitationFormData.notes}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Notes internes..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Comment ça fonctionne ?</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Un lien unique sera généré pour cette invitation</li>
                      <li>Les personnes utilisant ce lien ne paieront pas d'inscription</li>
                      <li>Le lien peut être partagé par email, SMS ou tout autre moyen</li>
                      <li>Vous pouvez suivre le nombre d'utilisations en temps réel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateInvitationModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingInvitation}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingInvitation ? 'Création...' : 'Créer l\'invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditInvitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier l'invitation</h2>
                <button
                  onClick={() => {
                    setShowEditInvitationModal(false);
                    setEditingInvitationId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateInvitation} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise / Partenaire *
                </label>
                <input
                  type="text"
                  required
                  value={invitationFormData.company_name}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Société XYZ, Mairie de..."
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={invitationFormData.applies_to_all_races}
                    onChange={(e) => setInvitationFormData({
                      ...invitationFormData,
                      applies_to_all_races: e.target.checked,
                      race_id: e.target.checked ? '' : invitationFormData.race_id
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Valable pour toutes les épreuves
                  </span>
                </label>

                {!invitationFormData.applies_to_all_races && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épreuve concernée *
                    </label>
                    <select
                      required={!invitationFormData.applies_to_all_races}
                      value={invitationFormData.race_id}
                      onChange={(e) => setInvitationFormData({ ...invitationFormData, race_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez une épreuve</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.name} ({race.distance} km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'utilisations maximum
                </label>
                <input
                  type="number"
                  min="1"
                  value={invitationFormData.max_uses}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, max_uses: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Laisser vide pour illimité"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={invitationFormData.valid_from}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={invitationFormData.valid_until}
                    onChange={(e) => setInvitationFormData({ ...invitationFormData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={invitationFormData.notes}
                  onChange={(e) => setInvitationFormData({ ...invitationFormData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Notes internes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditInvitationModal(false);
                    setEditingInvitationId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingInvitation}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingInvitation ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvitationUsagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Utilisations de l'invitation</h2>
                <button
                  onClick={() => {
                    setShowInvitationUsagesModal(false);
                    setSelectedInvitationUsages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingUsages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : selectedInvitationUsages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune utilisation pour cette invitation
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Total : {selectedInvitationUsages.length} inscription(s)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Épreuve</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvitationUsages.map((usage) => (
                          <tr key={usage.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {formatAthleteName(usage.first_name, usage.last_name)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {usage.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {usage.races?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(usage.registration_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                usage.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                usage.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {usage.status === 'confirmed' ? 'Confirmé' :
                                 usage.status === 'pending' ? 'En attente' :
                                 usage.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowInvitationUsagesModal(false);
                  setSelectedInvitationUsages([]);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePromoCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Créer un code promotionnel</h2>
                <button
                  onClick={() => setShowCreatePromoCodeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePromoCode} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code promo *
                </label>
                <input
                  type="text"
                  required
                  value={promoCodeFormData.code}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono"
                  placeholder="Ex: PROMO2024"
                  maxLength={20}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Le code sera automatiquement en majuscules
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={promoCodeFormData.description}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Promo lancement 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de réduction *
                  </label>
                  <select
                    required
                    value={promoCodeFormData.discount_type}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, discount_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_amount">Montant fixe (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur de la réduction *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={promoCodeFormData.discount_type === 'percentage' ? '100' : undefined}
                    value={promoCodeFormData.discount_value}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, discount_value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={promoCodeFormData.discount_type === 'percentage' ? '10' : '5'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {promoCodeFormData.discount_type === 'percentage' ? 'De 1 à 100%' : 'Montant en euros'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promoCodeFormData.applies_to_all_races}
                    onChange={(e) => setPromoCodeFormData({
                      ...promoCodeFormData,
                      applies_to_all_races: e.target.checked,
                      race_id: e.target.checked ? '' : promoCodeFormData.race_id
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Valable pour toutes les épreuves
                  </span>
                </label>

                {!promoCodeFormData.applies_to_all_races && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épreuve concernée *
                    </label>
                    <select
                      required={!promoCodeFormData.applies_to_all_races}
                      value={promoCodeFormData.race_id}
                      onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, race_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez une épreuve</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.name} ({race.distance} km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'utilisation *
                </label>
                <select
                  required
                  value={promoCodeFormData.usage_type}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, usage_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="single">Usage unique</option>
                  <option value="multiple">Usages multiples</option>
                  <option value="unlimited">Illimité</option>
                </select>
              </div>

              {promoCodeFormData.usage_type !== 'unlimited' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'utilisations maximum *
                  </label>
                  <input
                    type="number"
                    required={promoCodeFormData.usage_type !== 'unlimited'}
                    min="1"
                    value={promoCodeFormData.max_uses}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, max_uses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: 50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={promoCodeFormData.valid_from}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={promoCodeFormData.valid_until}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreatePromoCodeModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingPromoCode}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingPromoCode ? 'Création...' : 'Créer le code promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditPromoCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier le code promotionnel</h2>
                <button
                  onClick={() => {
                    setShowEditPromoCodeModal(false);
                    setEditingPromoCodeId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdatePromoCode} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code promo
                </label>
                <input
                  type="text"
                  disabled
                  value={promoCodeFormData.code}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Le code ne peut pas être modifié
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={promoCodeFormData.description}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Promo lancement 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de réduction *
                  </label>
                  <select
                    required
                    value={promoCodeFormData.discount_type}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, discount_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_amount">Montant fixe (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur de la réduction *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={promoCodeFormData.discount_type === 'percentage' ? '100' : undefined}
                    value={promoCodeFormData.discount_value}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, discount_value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promoCodeFormData.applies_to_all_races}
                    onChange={(e) => setPromoCodeFormData({
                      ...promoCodeFormData,
                      applies_to_all_races: e.target.checked,
                      race_id: e.target.checked ? '' : promoCodeFormData.race_id
                    })}
                    className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Valable pour toutes les épreuves
                  </span>
                </label>

                {!promoCodeFormData.applies_to_all_races && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épreuve concernée *
                    </label>
                    <select
                      required={!promoCodeFormData.applies_to_all_races}
                      value={promoCodeFormData.race_id}
                      onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, race_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionnez une épreuve</option>
                      {races.map((race) => (
                        <option key={race.id} value={race.id}>
                          {race.name} ({race.distance} km)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'utilisation *
                </label>
                <select
                  required
                  value={promoCodeFormData.usage_type}
                  onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, usage_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="single">Usage unique</option>
                  <option value="multiple">Usages multiples</option>
                  <option value="unlimited">Illimité</option>
                </select>
              </div>

              {promoCodeFormData.usage_type !== 'unlimited' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'utilisations maximum *
                  </label>
                  <input
                    type="number"
                    required={promoCodeFormData.usage_type !== 'unlimited'}
                    min="1"
                    value={promoCodeFormData.max_uses}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, max_uses: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={promoCodeFormData.valid_from}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={promoCodeFormData.valid_until}
                    onChange={(e) => setPromoCodeFormData({ ...promoCodeFormData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPromoCodeModal(false);
                    setEditingPromoCodeId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingPromoCode}
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingPromoCode ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPromoCodeUsagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Utilisations du code promo</h2>
                <button
                  onClick={() => {
                    setShowPromoCodeUsagesModal(false);
                    setSelectedPromoCodeUsages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingPromoUsages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : selectedPromoCodeUsages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune utilisation pour ce code promo
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Total : {selectedPromoCodeUsages.length} utilisation(s)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Épreuve</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant payé</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPromoCodeUsages.map((usage) => (
                          <tr key={usage.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {formatAthleteName(usage.first_name, usage.last_name)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {usage.email}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {usage.races?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(usage.registration_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {(usage.amount_paid_cents / 100).toFixed(2)}€
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                usage.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                usage.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {usage.status === 'confirmed' ? 'Confirmé' :
                                 usage.status === 'pending' ? 'En attente' :
                                 usage.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowPromoCodeUsagesModal(false);
                  setSelectedPromoCodeUsages([]);
                }}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateRaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Créer une nouvelle épreuve</h2>
                <button
                  onClick={() => setShowCreateRaceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRace} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={raceFormData.name}
                  onChange={(e) => setRaceFormData({ ...raceFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Trail 25 km"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de sport *
                </label>
                <select
                  required
                  value={raceFormData.sport_type}
                  onChange={(e) => setRaceFormData({ ...raceFormData, sport_type: e.target.value as SportType, custom_sport_type: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {Object.entries(SPORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Détermine l'image par défaut de l'épreuve
                </p>
              </div>

              {raceFormData.sport_type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du sport personnalisé *
                  </label>
                  <input
                    type="text"
                    required
                    value={raceFormData.custom_sport_type}
                    onChange={(e) => setRaceFormData({ ...raceFormData, custom_sport_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: Swimrun, Course d'orientation, etc."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Saisissez le nom du sport pour cette épreuve
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={raceFormData.distance}
                    onChange={(e) => setRaceFormData({ ...raceFormData, distance: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dénivelé positif (m)
                  </label>
                  <input
                    type="number"
                    value={raceFormData.elevation_gain}
                    onChange={(e) => setRaceFormData({ ...raceFormData, elevation_gain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="1200"
                  />
                  <p className="mt-1 text-xs text-gray-500">Laisser vide si un fichier GPX est intégré (calcul automatique)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={raceFormData.start_time}
                  onChange={(e) => setRaceFormData({ ...raceFormData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants max
                </label>
                <input
                  type="number"
                  value={raceFormData.max_participants}
                  onChange={(e) => setRaceFormData({ ...raceFormData, max_participants: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={raceFormData.description}
                  onChange={(e) => setRaceFormData({ ...raceFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Décrivez l'épreuve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restriction de genre
                </label>
                <select
                  value={raceFormData.gender_restriction}
                  onChange={(e) => setRaceFormData({ ...raceFormData, gender_restriction: e.target.value as 'all' | 'M' | 'F' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">Mixte (Hommes et Femmes)</option>
                  <option value="M">Hommes uniquement</option>
                  <option value="F">Femmes uniquement</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Si vous sélectionnez "Hommes uniquement" ou "Femmes uniquement", seul le genre correspondant pourra s'inscrire à cette épreuve.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="show_public_entries_list_create"
                  checked={raceFormData.show_public_entries_list}
                  onChange={(e) => setRaceFormData({ ...raceFormData, show_public_entries_list: e.target.checked })}
                  className="mt-1 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="show_public_entries_list_create" className="text-sm text-gray-700">
                  <span className="font-medium">Afficher la liste des inscrits publiquement</span>
                  <p className="text-gray-500 mt-1">Les visiteurs pourront voir la liste des participants inscrits à cette épreuve sur la page publique de l'événement.</p>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRaceModal(false)}
                  disabled={creatingRace}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingRace}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingRace ? 'Création...' : 'Créer l\'épreuve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditRaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier l'épreuve</h2>
                <button
                  onClick={() => {
                    setShowEditRaceModal(false);
                    setEditingRaceId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateRace} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={raceFormData.name}
                  onChange={(e) => setRaceFormData({ ...raceFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Trail 25 km"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de sport *
                </label>
                <select
                  required
                  value={raceFormData.sport_type}
                  onChange={(e) => setRaceFormData({ ...raceFormData, sport_type: e.target.value as SportType, custom_sport_type: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {Object.entries(SPORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Détermine l'image par défaut de l'épreuve
                </p>
              </div>

              {raceFormData.sport_type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du sport personnalisé *
                  </label>
                  <input
                    type="text"
                    required
                    value={raceFormData.custom_sport_type}
                    onChange={(e) => setRaceFormData({ ...raceFormData, custom_sport_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: Swimrun, Course d'orientation, etc."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Saisissez le nom du sport pour cette épreuve
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={raceFormData.distance}
                    onChange={(e) => setRaceFormData({ ...raceFormData, distance: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dénivelé positif (m)
                  </label>
                  <input
                    type="number"
                    value={raceFormData.elevation_gain}
                    onChange={(e) => setRaceFormData({ ...raceFormData, elevation_gain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="1200"
                  />
                  <p className="mt-1 text-xs text-gray-500">Laisser vide si un fichier GPX est intégré (calcul automatique)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure de départ
                </label>
                <input
                  type="time"
                  value={raceFormData.start_time}
                  onChange={(e) => setRaceFormData({ ...raceFormData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participants max
                </label>
                <input
                  type="number"
                  value={raceFormData.max_participants}
                  onChange={(e) => setRaceFormData({ ...raceFormData, max_participants: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={raceFormData.description}
                  onChange={(e) => setRaceFormData({ ...raceFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Décrivez l'épreuve..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restriction de genre
                </label>
                <select
                  value={raceFormData.gender_restriction}
                  onChange={(e) => setRaceFormData({ ...raceFormData, gender_restriction: e.target.value as 'all' | 'M' | 'F' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">Mixte (Hommes et Femmes)</option>
                  <option value="M">Hommes uniquement</option>
                  <option value="F">Femmes uniquement</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Si vous sélectionnez "Hommes uniquement" ou "Femmes uniquement", seul le genre correspondant pourra s'inscrire à cette épreuve.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="show_public_entries_list_edit"
                  checked={raceFormData.show_public_entries_list}
                  onChange={(e) => setRaceFormData({ ...raceFormData, show_public_entries_list: e.target.checked })}
                  className="mt-1 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="show_public_entries_list_edit" className="text-sm text-gray-700">
                  <span className="font-medium">Afficher la liste des inscrits publiquement</span>
                  <p className="text-gray-500 mt-1">Les visiteurs pourront voir la liste des participants inscrits à cette épreuve sur la page publique de l'événement.</p>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRaceModal(false);
                    setEditingRaceId(null);
                  }}
                  disabled={creatingRace}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingRace}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {creatingRace ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Modifier l'événement</h2>
                <button
                  onClick={() => setShowEditEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateEvent} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de l'événement (format paysage ou portrait)
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">
                    Formats acceptés: JPEG, PNG. Taille max: 5 MB
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    📐 Dimensions recommandées : 1200 x 630 px (format paysage) ou 800 x 1200 px (format portrait)
                  </p>
                </div>
              </div>

              {imagePreview && (
                <ImagePositionEditor
                  imageUrl={imagePreview}
                  positionX={imagePositionX}
                  positionY={imagePositionY}
                  onPositionChange={(x, y) => {
                    setImagePositionX(x);
                    setImagePositionY(y);
                  }}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de publication *
                </label>
                <select
                  required
                  value={eventFormData.status}
                  onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="draft">Brouillon (non visible publiquement)</option>
                  <option value="published">Publié (visible publiquement)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'événement *
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ex: Trail des Crêtes 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={eventFormData.slug}
                  onChange={(e) => setEventFormData({ ...eventFormData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Généré automatiquement si vide"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Laissez vide pour générer automatiquement depuis le nom
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventFormData.start_date}
                    onChange={(e) => setEventFormData({ ...eventFormData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={eventFormData.end_date}
                    onChange={(e) => setEventFormData({ ...eventFormData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.city}
                    onChange={(e) => setEventFormData({ ...eventFormData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: Chamonix"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.postal_code}
                    onChange={(e) => setEventFormData({ ...eventFormData, postal_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Ex: 74400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  value={eventFormData.full_address}
                  onChange={(e) => setEventFormData({ ...eventFormData, full_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Adresse du lieu de départ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Décrivez votre événement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={eventFormData.website}
                    onChange={(e) => setEventFormData({ ...eventFormData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    value={eventFormData.contact_email}
                    onChange={(e) => setEventFormData({ ...eventFormData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="contact@exemple.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone de contact
                </label>
                <input
                  type="tel"
                  value={eventFormData.contact_phone}
                  onChange={(e) => setEventFormData({ ...eventFormData, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Affiliation FFA</h3>

                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventFormData.ffa_affiliated || false}
                      onChange={(e) => setEventFormData({ ...eventFormData, ffa_affiliated: e.target.checked })}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Cet événement est affilié à la FFA
                    </span>
                  </label>
                </div>

                {eventFormData.ffa_affiliated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code CalOrg FFA <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={eventFormData.ffa_calorg_code || ''}
                          onChange={(e) => {
                            setEventFormData({ ...eventFormData, ffa_calorg_code: e.target.value });
                            setCalorgVerificationMessage('');
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Ex: 308518"
                          maxLength={20}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCalorgCode}
                          disabled={verifyingCalorg || !eventFormData.ffa_calorg_code}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                          {verifyingCalorg ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                      {calorgVerificationMessage && (
                        <p className={`text-sm mt-2 ${calorgVerificationMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                          {calorgVerificationMessage}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        Code de votre épreuve sur{' '}
                        <a
                          href="https://calorg.athle.fr"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          calorg.athle.fr
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6 mt-6">
                <EventCharacteristicsPicker
                  selectedCharacteristics={selectedCharacteristics}
                  onChange={setSelectedCharacteristics}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL d'inscription externe
                </label>
                <input
                  type="url"
                  value={eventFormData.registration_url}
                  onChange={(e) => setEventFormData({ ...eventFormData, registration_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Si vous utilisez un système d'inscription externe
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={eventFormData.carpooling_enabled || false}
                    onChange={(e) => setEventFormData({ ...eventFormData, carpooling_enabled: e.target.checked })}
                    className="mt-1 w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Activer le module co-voiturage</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Permettre aux participants de proposer et rejoindre des co-voiturages pour se rendre à l'événement
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={eventFormData.volunteer_enabled || false}
                    onChange={(e) => setEventFormData({ ...eventFormData, volunteer_enabled: e.target.checked })}
                    className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Activer le module gestion des bénévoles</span>
                    <p className="text-xs text-gray-600 mt-1">
                      Créer des postes bénévoles, recevoir les inscriptions et gérer votre équipe sur le terrain. Fiches de poste automatiques incluses.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
                  disabled={updatingEvent}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updatingEvent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {updatingEvent ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBibConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Configuration des dossards</h2>
              <button
                onClick={() => setShowBibConfigModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mode d'attribution
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="mode"
                      value="LIVE"
                      checked={bibConfig.mode === 'LIVE'}
                      onChange={(e) => setBibConfig({ ...bibConfig, mode: e.target.value })}
                      className="w-4 h-4 text-pink-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">LIVE (attribution immédiate)</div>
                      <div className="text-sm text-gray-600">Le dossard est attribué automatiquement à l'inscription</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="mode"
                      value="BATCH"
                      checked={bibConfig.mode === 'BATCH'}
                      onChange={(e) => setBibConfig({ ...bibConfig, mode: e.target.value })}
                      className="w-4 h-4 text-pink-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">BATCH (attribution différée)</div>
                      <div className="text-sm text-gray-600">Les dossards sont attribués manuellement en lot</div>
                    </div>
                  </label>
                </div>
              </div>

              {bibConfig.mode === 'BATCH' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Stratégie d'attribution
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="strategy"
                        value="REG_ORDER"
                        checked={bibConfig.strategy === 'REG_ORDER'}
                        onChange={(e) => setBibConfig({ ...bibConfig, strategy: e.target.value })}
                        className="w-4 h-4 text-pink-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Ordre d'inscription</div>
                        <div className="text-sm text-gray-600">Premier inscrit = premier dossard</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="strategy"
                        value="ALPHABETICAL"
                        checked={bibConfig.strategy === 'ALPHABETICAL'}
                        onChange={(e) => setBibConfig({ ...bibConfig, strategy: e.target.value })}
                        className="w-4 h-4 text-pink-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Alphabétique</div>
                        <div className="text-sm text-gray-600">Tri par nom puis prénom</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={bibConfig.split_by_gender}
                    onChange={(e) => setBibConfig({ ...bibConfig, split_by_gender: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Séparer Hommes / Femmes</span>
                </label>

                {!bibConfig.split_by_gender ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Plage globale</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">De</label>
                        <input
                          type="number"
                          value={bibConfig.range_global_from}
                          onChange={(e) => setBibConfig({ ...bibConfig, range_global_from: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">À</label>
                        <input
                          type="number"
                          value={bibConfig.range_global_to}
                          onChange={(e) => setBibConfig({ ...bibConfig, range_global_to: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plage Hommes</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">De</label>
                          <input
                            type="number"
                            value={bibConfig.range_male_from}
                            onChange={(e) => setBibConfig({ ...bibConfig, range_male_from: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">À</label>
                          <input
                            type="number"
                            value={bibConfig.range_male_to}
                            onChange={(e) => setBibConfig({ ...bibConfig, range_male_to: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="250"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plage Femmes</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">De</label>
                          <input
                            type="number"
                            value={bibConfig.range_female_from}
                            onChange={(e) => setBibConfig({ ...bibConfig, range_female_from: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="251"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">À</label>
                          <input
                            type="number"
                            value={bibConfig.range_female_to}
                            onChange={(e) => setBibConfig({ ...bibConfig, range_female_to: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                            placeholder="500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={bibConfig.reuse_freed_numbers}
                    onChange={(e) => setBibConfig({ ...bibConfig, reuse_freed_numbers: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Réutiliser les numéros libérés</span>
                </label>
                <p className="text-xs text-gray-600 mt-1 ml-8">
                  En cas d'annulation, le dossard peut être réattribué à un autre participant
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex space-x-3 border-t">
              <button
                onClick={() => setShowBibConfigModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveBibConfig}
                disabled={savingBibConfig}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50"
              >
                {savingBibConfig ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  );
}
