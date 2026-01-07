import { useState, useEffect } from 'react';
import { Eye, Trash2, Download, Search, Filter, Edit2, Save, X, Mail, Send, Plus, Info, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatAthleteName } from '../lib/formatters';
import { loadCountries, type Country } from '../lib/countries';
import { refreshFFALicensesForRace } from '../lib/ffa-webservice';

interface Entry {
  id: string;
  athlete_id: string;
  race_id: string;
  category: string;
  status: string;
  bib_number: number | null;
  created_at: string;
  source: string;
  team_id?: string;
  management_code?: string;
  license_number?: string;
  athletes: {
    first_name: string;
    last_name: string;
    email: string;
    birthdate: string;
    gender: string;
    license_club: string | null;
    license_number: string | null;
    nationality: string | null;
    is_anonymous: boolean;
  };
  races: {
    name: string;
  };
  entry_payments: Array<{
    payment_status: string;
    amount_paid: number;
    payment_method?: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  team_type: string;
  bib_numbers: string[];
  current_members_count: number;
  captain_email: string | null;
}

interface RaceOption {
  id: string;
  label: string;
  description: string | null;
  type: string;
  is_required: boolean;
  is_question: boolean;
  price_cents: number;
  image_url: string | null;
  choices?: RaceOptionChoice[];
}

interface RaceOptionChoice {
  id: string;
  label: string;
  price_modifier_cents: number;
}

interface RegistrationOption {
  id: string;
  option_id: string;
  choice_id: string | null;
  value: string | null;
  quantity: number;
  price_paid_cents: number;
}

interface EntriesListProps {
  eventId: string;
  races: Array<{ id: string; name: string }>;
  event?: any;
}

export default function EntriesList({ eventId, races, event }: EntriesListProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRace, setFilterRace] = useState('all');

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClub, setFilterClub] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [raceOptions, setRaceOptions] = useState<RaceOption[]>([]);
  const [, setRegistrationOptions] = useState<RegistrationOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { choiceId?: string; value?: string }>>({});
  const [detailRaceOptions, setDetailRaceOptions] = useState<RaceOption[]>([]);
  const [detailRegistrationOptions, setDetailRegistrationOptions] = useState<RegistrationOption[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedEntryOptions, setSelectedEntryOptions] = useState<{
    entry: Entry | null;
    options: RaceOption[];
    registrationOptions: RegistrationOption[];
  }>({ entry: null, options: [], registrationOptions: [] });
  const [showFFARefreshModal, setShowFFARefreshModal] = useState(false);
  const [refreshingFFA, setRefreshingFFA] = useState(false);
  const [ffaRefreshResults, setFfaRefreshResults] = useState<any>(null);

  useEffect(() => {
    loadEntries();
    loadCountriesList();
  }, [eventId]);

  const loadCountriesList = async () => {
    const countriesData = await loadCountries();
    setCountries(countriesData);
  };

  const handleRefreshFFALicenses = async () => {
    if (!filterRace || filterRace === 'all') {
      alert('Veuillez sélectionner une course spécifique avant d\'actualiser les licences FFA');
      return;
    }

    setShowFFARefreshModal(true);
    setRefreshingFFA(true);
    setFfaRefreshResults(null);

    try {
      const result = await refreshFFALicensesForRace(filterRace);
      setFfaRefreshResults(result);

      // Recharger les inscriptions
      await loadEntries();
    } catch (error: any) {
      // Formater le message d'erreur pour qu'il soit lisible
      const errorMessage = error.message || 'Erreur inconnue';

      // Si c'est l'erreur PROx014 ou événement non déclaré
      if (errorMessage.includes('Événement non déclaré') || errorMessage.includes('PROx014')) {
        setFfaRefreshResults({
          total: 0,
          updated: 0,
          errors: 1,
          details: [{
            athleteName: 'Configuration événement',
            licenseNumber: 'N/A',
            status: 'error',
            message: errorMessage
          }]
        });
      } else {
        alert('Erreur lors de l\'actualisation des licences FFA : ' + errorMessage);
      }
    } finally {
      setRefreshingFFA(false);
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entries')
        .select(`
          *,
          athletes (
            id,
            first_name,
            last_name,
            email,
            birthdate,
            gender,
            license_club,
            license_number,
            license_id,
            nationality,
            is_anonymous,
            ffa_relcod,
            ffa_club_code,
            ffa_club_name,
            ffa_league,
            ffa_league_abbr,
            ffa_department,
            ffa_department_abbr,
            ffa_catcod,
            pps_number,
            pps_expiry_date
          ),
          races (name),
          entry_payments (payment_status, amount_paid, payment_method, paid_at)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;

      const allEntries = data || [];

      const { data: teamMembersData } = await supabase
        .from('team_members')
        .select('entry_id, team_id')
        .in('entry_id', allEntries.map(e => e.id));

      const teamMemberMap: Record<string, string> = {};
      if (teamMembersData) {
        teamMembersData.forEach(tm => {
          teamMemberMap[tm.entry_id] = tm.team_id;
        });
      }

      const entriesWithTeams = allEntries.map(entry => ({
        ...entry,
        team_id: teamMemberMap[entry.id] || null
      }));

      const uniqueTeamIds = [...new Set(Object.values(teamMemberMap))];
      if (uniqueTeamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name, team_type, bib_numbers, current_members_count, captain_email')
          .in('id', uniqueTeamIds);

        if (teamsData) {
          const teamsMap: Record<string, Team> = {};
          teamsData.forEach(team => {
            teamsMap[team.id] = team;
          });
          setTeams(teamsMap);
        }
      }

      setEntries(entriesWithTeams);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) return;

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      alert('Inscription supprimée avec succès');
      loadEntries();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert('Erreur lors de la suppression : ' + error.message);
    }
  };

  const handleSaveEntry = async () => {
    if (!editingEntry) return;

    setSaving(true);
    try {
      // Convertir le code pays 3 lettres (FRA) en 2 lettres (FR) pour la sauvegarde
      let nationalityForSave = editFormData.nationality as string;
      if (nationalityForSave && nationalityForSave.length === 3) {
        const country = countries.find(c => c.code === nationalityForSave);
        if (country && country.alpha2_code) {
          nationalityForSave = country.alpha2_code;
        }
      }

      const { error: athleteError } = await (supabase
        .from('athletes') as any)
        .update({
          first_name: editFormData.first_name as string,
          last_name: editFormData.last_name as string,
          email: (editFormData.email as string) || null,
          birthdate: editFormData.birthdate as string,
          gender: editFormData.gender as string,
          license_club: (editFormData.license_club as string) || null,
          license_number: (editFormData.license_number as string) || null,
          nationality: nationalityForSave || null,
          is_anonymous: (editFormData.is_anonymous as boolean) || false,
        } as any)
        .eq('id', editingEntry.athlete_id);

      if (athleteError) throw athleteError;

      const { error: entryError } = await (supabase
        .from('entries') as any)
        .update({
          category: editFormData.category as string,
          status: editFormData.status as string,
          bib_number: (editFormData.bib_number as number) || null,
        } as any)
        .eq('id', editingEntry.id);

      if (entryError) throw entryError;

      // Utiliser une fonction sécurisée pour l'upsert du paiement
      const { error: paymentError } = await supabase.rpc('upsert_entry_payment', {
        p_entry_id: editingEntry.id,
        p_payment_status: editFormData.payment_status as string,
        p_payment_method: (editFormData.payment_method as string) || null,
        p_amount_paid: parseFloat(editFormData.amount_paid as string) || 0,
        p_paid_at: editFormData.payment_status === 'paid' ? new Date().toISOString() : null,
      });

      if (paymentError) throw paymentError;

      // Supprimer les anciennes options
      console.log('=== Deleting old options for entry ===', editingEntry.id);
      const { error: deleteOptionsError, count: deletedCount } = await supabase
        .from('registration_options')
        .delete()
        .eq('entry_id', editingEntry.id)
        .select();

      if (deleteOptionsError) {
        console.error('Error deleting options:', deleteOptionsError);
        throw deleteOptionsError;
      }
      console.log('=== Deleted options count ===', deletedCount);

      // Insérer les nouvelles options
      if (Object.keys(selectedOptions).length > 0) {
        console.log('=== Inserting new options ===', selectedOptions);
        const registrationOptionsData = Object.entries(selectedOptions).map(([optionId, selection]) => {
          const option = raceOptions.find(o => o.id === optionId);
          let pricePaid = option?.price_cents || 0;

          if (selection.choiceId && option?.choices) {
            const choice = option.choices.find(c => c.id === selection.choiceId);
            if (choice) {
              pricePaid += choice.price_modifier_cents;
            }
          }

          return {
            entry_id: editingEntry.id,
            option_id: optionId,
            choice_id: selection.choiceId || null,
            value: selection.value || null,
            quantity: 1,
            price_paid_cents: pricePaid,
          };
        });

        console.log('=== Data to insert ===', registrationOptionsData);
        const { error: optionsError, data: insertedData } = await supabase
          .from('registration_options')
          .insert(registrationOptionsData as any)
          .select();

        if (optionsError) {
          console.error('Error inserting options:', optionsError);
          throw optionsError;
        }
        console.log('=== Successfully inserted options ===', insertedData);
      }

      alert('Inscription mise à jour avec succès !');
      setEditingEntry(null);
      setRaceOptions([]);
      setRegistrationOptions([]);
      setSelectedOptions({});
      loadEntries();
    } catch (error: any) {
      console.error('Error updating entry:', error);
      alert('Erreur lors de la mise à jour : ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = (entry: Entry) => {
    const email = entry.athletes.email;
    if (!email) {
      alert('Aucune adresse email renseignée pour cet athlète');
      return;
    }
    const subject = encodeURIComponent(`Votre inscription - ${entry.races.name}`);
    const body = encodeURIComponent(
      `Bonjour ${formatAthleteName(entry.athletes.first_name, entry.athletes.last_name)},\n\n` +
      `Nous vous contactons concernant votre inscription à ${entry.races.name}.\n\n` +
      `Cordialement,\nL'équipe d'organisation`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleViewOptions = async (entry: Entry) => {
    try {
      // Charger les options de la course
      const { data: options } = await supabase
        .from('race_options')
        .select(`
          *,
          race_option_choices (
            id,
            label,
            price_modifier_cents
          )
        `)
        .eq('race_id', entry.race_id)
        .order('display_order');

      // Charger les options sélectionnées pour cette inscription
      const { data: regOptions } = await supabase
        .from('registration_options')
        .select('*')
        .eq('registration_id', entry.id);

      setSelectedEntryOptions({
        entry,
        options: options || [],
        registrationOptions: regOptions || [],
      });
      setShowOptionsModal(true);
    } catch (error) {
      console.error('Error loading options:', error);
      alert('Erreur lors du chargement des options');
    }
  };

  const handleResendConfirmation = async (entry: Entry) => {
    if (!entry.athletes.email) {
      alert('Aucune adresse email renseignée pour cet athlète');
      return;
    }
    alert('Fonctionnalité de renvoi de confirmation en cours de développement.\n\nUn email de confirmation sera automatiquement envoyé à : ' + entry.athletes.email);
  };

  const loadRaceOptions = async (raceId: string) => {
    try {
      const { data, error } = await supabase
        .from('race_options')
        .select(`
          *,
          choices:race_option_choices(*)
        `)
        .eq('race_id', raceId)
        .eq('active', true)
        .order('display_order');

      if (error) throw error;
      setRaceOptions(data || []);
    } catch (err) {
      console.error('Error loading race options:', err);
    }
  };

  const loadRegistrationOptions = async (registrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('registration_options')
        .select('*')
        .eq('entry_id', registrationId);

      if (error) {
        console.error('Error loading registration options:', error);
        throw error;
      }

      console.log('=== Loaded registration options ===', data);
      setRegistrationOptions(data || []);

      // Créer le mapping des options sélectionnées
      const optionsMap: Record<string, { choiceId?: string; value?: string }> = {};
      (data || []).forEach((regOpt: any) => {
        optionsMap[regOpt.option_id] = {
          choiceId: regOpt.choice_id || undefined,
          value: regOpt.value || undefined,
        };
        console.log(`Setting option ${regOpt.option_id} to choice ${regOpt.choice_id}`);
      });
      console.log('=== Final options map ===', optionsMap);
      setSelectedOptions(optionsMap);
    } catch (err) {
      console.error('Error loading registration options:', err);
    }
  };

  const handleEditEntry = async (entry: Entry) => {
    console.log('=== Editing entry ===', entry.id);

    // Convertir le code pays 2 lettres (FR) en 3 lettres (FRA) si nécessaire
    let nationalityCode = entry.athletes.nationality || 'FRA';
    if (nationalityCode.length === 2) {
      const country = countries.find(c => c.alpha2_code === nationalityCode.toUpperCase());
      if (country) {
        nationalityCode = country.code;
      }
    }

    setEditFormData({
      first_name: entry.athletes.first_name || '',
      last_name: entry.athletes.last_name || '',
      email: entry.athletes.email || '',
      birthdate: entry.athletes.birthdate || '',
      gender: entry.athletes.gender || 'M',
      license_club: entry.athletes.license_club || '',
      license_number: entry.athletes.license_number || entry.athletes.license_id || '',
      nationality: nationalityCode,
      is_anonymous: entry.athletes.is_anonymous || false,
      category: entry.category || '',
      status: entry.status || 'confirmed',
      bib_number: entry.bib_number || '',
      payment_status: entry.entry_payments?.[0]?.payment_status || 'pending',
      payment_method: entry.entry_payments?.[0]?.payment_method || '',
      amount_paid: entry.entry_payments?.[0]?.amount_paid?.toString() || '0',
    });

    // Charger les options AVANT d'afficher le formulaire
    console.log('=== Loading options for race ===', entry.race_id);
    await loadRaceOptions(entry.race_id);
    console.log('=== Loading registration options for entry ===', entry.id);
    await loadRegistrationOptions(entry.id);

    // Maintenant qu'on a tout chargé, on ouvre le formulaire
    setEditingEntry(entry);
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      paid: 'Payé',
      pending: 'En attente',
      free: 'Gratuit',
      comped: 'Offert',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      free: 'bg-gray-100 text-gray-800',
      comped: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      confirmed: 'Confirmée',
      draft: 'Brouillon',
      cancelled: 'Annulée',
      transferred: 'Transférée',
      needs_docs: 'Docs manquants',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      confirmed: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      transferred: 'bg-blue-100 text-blue-800',
      needs_docs: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getTeamTypeIcon = (teamType: string) => {
    if (teamType === 'homme' || teamType === 'men' || teamType === 'masculin') {
      return { icon: '👨', color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Homme' };
    } else if (teamType === 'femme' || teamType === 'women' || teamType === 'féminin') {
      return { icon: '👩', color: 'bg-pink-100 text-pink-700 border-pink-300', label: 'Femme' };
    } else {
      return { icon: '👥', color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Mixte' };
    }
  };

  const uniqueClubs = Array.from(new Set(entries.map(e => e.athletes.license_club).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(entries.map(e => e.category).filter(Boolean)));
  const uniqueTeams = Array.from(new Set(entries.filter(e => e.team_id).map(e => {
    const team = e.team_id ? teams[e.team_id] : null;
    return team ? { id: team.id, name: team.name } : null;
  }).filter(Boolean))) as Array<{ id: string; name: string }>;

  const filteredEntries = entries.filter((entry) => {
    const team = entry.team_id ? teams[entry.team_id] : null;

    const searchMatch =
      searchTerm === '' ||
      entry.athletes.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes.license_club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.bib_number?.toString().includes(searchTerm) ||
      (team && team.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const raceMatch = filterRace === 'all' || entry.race_id === filterRace;
    const statusMatch = filterStatus === 'all' || entry.status === filterStatus;
    const paymentMatch =
      filterPayment === 'all' ||
      entry.entry_payments[0]?.payment_status === filterPayment;
    const genderMatch = filterGender === 'all' || entry.athletes.gender === filterGender;
    const categoryMatch = filterCategory === 'all' || entry.category === filterCategory;
    const clubMatch = filterClub === 'all' || entry.athletes.license_club === filterClub;
    const sourceMatch = filterSource === 'all' || entry.source === filterSource;
    const teamMatch = filterTeam === 'all' || entry.team_id === filterTeam;

    return searchMatch && raceMatch && statusMatch && paymentMatch && genderMatch && categoryMatch && clubMatch && sourceMatch && teamMatch;
  });

  const exportToCSV = async () => {
    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const allRaceIds = Array.from(new Set(filteredEntries.map(e => e.race_id)));
    const raceOptionsMap = new Map<string, RaceOption[]>();

    for (const raceId of allRaceIds) {
      const { data: options } = await supabase
        .from('race_options')
        .select('*')
        .eq('race_id', raceId)
        .eq('active', true)
        .order('display_order');

      if (options && options.length > 0) {
        // Récupérer les choix pour chaque option
        const optionsWithChoices = await Promise.all(
          options.map(async (option) => {
            const { data: choices } = await supabase
              .from('race_option_choices')
              .select('*')
              .eq('option_id', option.id)
              .order('display_order');

            return {
              ...option,
              choices: choices || []
            };
          })
        );

        raceOptionsMap.set(raceId, optionsWithChoices);
      }
    }

    const allOptionLabels = new Set<string>();
    raceOptionsMap.forEach(options => {
      options.forEach(opt => allOptionLabels.add(opt.label));
    });
    const sortedOptionLabels = Array.from(allOptionLabels).sort();

    const entryOptionsMap = new Map<string, RegistrationOption[]>();
    for (const entry of filteredEntries) {
      const { data: regOptions, error: optError } = await supabase
        .from('registration_options')
        .select('*')
        .eq('entry_id', entry.id);

      if (optError) {
        console.error('Erreur récupération options pour entry', entry.id, ':', optError);
      }

      if (regOptions && regOptions.length > 0) {
        console.log('Options trouvées pour', entry.athletes.first_name, entry.athletes.last_name, ':', regOptions);
        entryOptionsMap.set(entry.id, regOptions);
      }
    }

    console.log('=== DEBUG CSV EXPORT ===');
    console.log('Total entries avec options:', entryOptionsMap.size, '/', filteredEntries.length);
    console.log('Race options map:', Array.from(raceOptionsMap.entries()).map(([raceId, opts]) => ({
      raceId,
      optionsCount: opts.length,
      options: opts.map(o => ({
        id: o.id,
        label: o.label,
        choicesCount: o.choices?.length || 0,
        choices: o.choices?.map((c: any) => ({ id: c.id, label: c.label }))
      }))
    })));
    console.log('Sorted option labels:', sortedOptionLabels);
    console.log('Sample entry options:', Array.from(entryOptionsMap.entries()).slice(0, 2).map(([entryId, opts]) => ({
      entryId,
      options: opts.map(o => ({ option_id: o.option_id, choice_id: o.choice_id, value: o.value }))
    })));

    const baseHeaders = [
      'Dossard',
      'Nom',
      'Prénom',
      'Email',
      'Date de naissance',
      'Âge',
      'Genre',
      'Nationalité',
      'Club/Association',
      'N° Licence',
      'Équipe',
      'Type équipe',
      'Épreuve',
      'Catégorie',
      'Statut inscription',
      'Statut paiement',
      'Type paiement',
      'Montant payé (€)',
      'Date inscription',
      'Heure inscription',
      'Source',
      'Code gestion',
      'Type Licence FFA (RELCOD)',
      'Code Club FFA',
      'Nom Club FFA',
      'Ligue FFA (abrégé)',
      'Ligue FFA',
      'Département FFA (abrégé)',
      'Département FFA',
      'CAT FFA',
      'Numéro PSP',
      'Date Expiration PSP',
    ];

    const headers = [...baseHeaders, ...sortedOptionLabels];

    const rows = filteredEntries.map((entry) => {
      const team = entry.team_id ? teams[entry.team_id] : null;
      const registrationOptions = entryOptionsMap.get(entry.id) || [];
      const raceOptions = raceOptionsMap.get(entry.race_id) || [];

      const optionValues: Record<string, string> = {};

      registrationOptions.forEach(regOpt => {
        const option = raceOptions.find(o => o.id === regOpt.option_id);
        if (option) {
          let value = '';

          if (regOpt.choice_id) {
            // Trouver le choix dans les choices de l'option
            const choices = option.choices || [];
            const choice = choices.find((c: any) => c.id === regOpt.choice_id);
            if (choice) {
              value = choice.label;
              if (choice.price_modifier_cents && choice.price_modifier_cents !== 0) {
                value += ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(choice.price_modifier_cents / 100).toFixed(2)}€)`;
              }
            } else {
              console.warn('Choice not found for', regOpt.choice_id, 'in option', option.label);
            }
          } else if (regOpt.value) {
            value = regOpt.value;
          } else {
            value = 'Oui';
          }

          if (regOpt.price_paid_cents > 0 && !regOpt.choice_id) {
            value += ` (${(regOpt.price_paid_cents / 100).toFixed(2)}€)`;
          }

          // Si une valeur existe déjà pour cette option, on la concatène (cas des choix multiples)
          if (value) {
            if (optionValues[option.label]) {
              optionValues[option.label] += `, ${value}`;
            } else {
              optionValues[option.label] = value;
            }
          }
        } else {
          console.warn('Option not found for', regOpt.option_id, 'in race options');
        }
      });

      const country = countries.find(c => c.code === entry.athletes.nationality);
      const inscriptionDate = new Date(entry.created_at);
      const teamTypeInfo = team ? getTeamTypeIcon(team.team_type) : null;

      const payment = entry.entry_payments && entry.entry_payments.length > 0 ? entry.entry_payments[0] : null;
      const paymentStatus = payment?.payment_status || 'pending';
      const paymentMethod = payment?.payment_method ||
        (paymentStatus === 'paid' ? 'Carte bancaire' :
         paymentStatus === 'free' ? 'Gratuit' :
         paymentStatus === 'comped' ? 'Offert' : 'En attente');

      const licenseNumber = entry.athletes.license_number || entry.athletes.license_id || '';

      let amountPaid = '0';
      if (payment?.amount_paid) {
        const amount = payment.amount_paid;
        if (typeof amount === 'number') {
          amountPaid = amount.toString();
        } else {
          amountPaid = amount;
        }
      } else if (payment?.payment_status === 'free') {
        amountPaid = '0';
      }

      const baseRow = [
        entry.bib_number || '',
        entry.athletes.last_name,
        entry.athletes.first_name,
        entry.athletes.email || '',
        entry.athletes.birthdate,
        calculateAge(entry.athletes.birthdate),
        entry.athletes.gender === 'M' ? 'Homme' : entry.athletes.gender === 'F' ? 'Femme' : 'Autre',
        country ? country.name : entry.athletes.nationality || '',
        entry.athletes.license_club || entry.athletes.ffa_club_name || '',
        licenseNumber,
        team ? team.name : '',
        team && teamTypeInfo ? teamTypeInfo.label : '',
        entry.races.name,
        entry.category,
        getStatusLabel(entry.status),
        getPaymentStatusLabel(paymentStatus),
        paymentMethod,
        amountPaid,
        inscriptionDate.toLocaleDateString('fr-FR'),
        inscriptionDate.toLocaleTimeString('fr-FR'),
        entry.source === 'manual' ? 'Manuelle' : entry.source === 'online' ? 'En ligne' : entry.source,
        entry.management_code || '',
        entry.athletes.ffa_relcod || '',
        entry.athletes.ffa_club_code || '',
        entry.athletes.ffa_club_name || '',
        entry.athletes.ffa_league_abbr || '',
        entry.athletes.ffa_league || '',
        entry.athletes.ffa_department_abbr || '',
        entry.athletes.ffa_department || '',
        entry.athletes.ffa_catcod || '',
        entry.athletes.pps_number || '',
        entry.athletes.pps_expiry_date ? new Date(entry.athletes.pps_expiry_date).toLocaleDateString('fr-FR') : '',
      ];

      const optionRow = sortedOptionLabels.map(label => optionValues[label] || '');

      return [...baseRow, ...optionRow];
    });

    const csvContent = [
      headers.map(escapeCsvField).join(';'),
      ...rows.map(row => row.map(escapeCsvField).join(';'))
    ].join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode === document.body) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error cleaning up download link:', err);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Chargement des inscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message de debug très visible */}
      {!event && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="font-bold">⚠️ DEBUG: L'événement n'est pas chargé</p>
        </div>
      )}
      {event && !event.ffa_affiliated && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 px-4 py-3 rounded mb-4">
          <p className="font-bold">ℹ️ DEBUG: Événement non affilié FFA</p>
          <p className="text-sm">ffa_affiliated = {String(event.ffa_affiliated)}</p>
        </div>
      )}
      {event && event.ffa_affiliated && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded mb-4">
          <p className="font-bold">✅ DEBUG: Événement FFA détecté !</p>
          <p className="text-sm">Code CalOrg: {event.ffa_calorg_code}</p>
          <p className="text-sm font-bold">→ Le bouton BLEU devrait être visible à droite du bouton "Exporter CSV"</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Inscriptions ({filteredEntries.length})
          </h3>
          <p className="text-sm text-gray-600">
            Total : {entries.length} inscription{entries.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {event?.ffa_affiliated && (
            <button
              onClick={handleRefreshFFALicenses}
              disabled={refreshingFFA || !filterRace || filterRace === 'all'}
              title={!filterRace || filterRace === 'all' ? 'Veuillez sélectionner une épreuve spécifique' : 'Actualiser les licences FFA pour cette épreuve'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingFFA ? 'animate-spin' : ''}`} />
              {refreshingFFA ? 'Actualisation...' : 'Actualiser les licences FFA'}
            </button>
          )}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, équipe, club ou dossard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showAdvancedFilters ? 'Masquer filtres' : 'Plus de filtres'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filterRace}
            onChange={(e) => setFilterRace(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">Toutes les épreuves</option>
            {races.map((race) => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="confirmed">Confirmée</option>
            <option value="draft">Brouillon</option>
            <option value="cancelled">Annulée</option>
            <option value="needs_docs">Docs manquants</option>
            <option value="transferred">Transférée</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">Tous paiements</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="free">Gratuit</option>
            <option value="comped">Offert</option>
          </select>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="all">Tous les genres</option>
            <option value="M">Hommes</option>
            <option value="F">Femmes</option>
            <option value="X">Autre</option>
          </select>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Toutes les catégories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Club/Association</label>
              <select
                value={filterClub}
                onChange={(e) => setFilterClub(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Tous les clubs</option>
                {uniqueClubs.map((club: any) => (
                  <option key={club} value={club}>
                    {club}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Équipe</label>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Toutes les équipes</option>
                {uniqueTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source d'inscription</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">Toutes les sources</option>
                <option value="online">En ligne</option>
                <option value="manual">Manuelle</option>
                <option value="import">Importée</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <button
                onClick={() => {
                  setFilterRace('all');
                  setFilterStatus('all');
                  setFilterPayment('all');
                  setFilterGender('all');
                  setFilterCategory('all');
                  setFilterClub('all');
                  setFilterSource('all');
                  setFilterTeam('all');
                  setSearchTerm('');
                }}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Aucune inscription trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dossard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlète
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Équipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Épreuve
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => {
                  const team = entry.team_id ? teams[entry.team_id] : null;
                  const teamTypeInfo = team ? getTeamTypeIcon(team.team_type) : null;

                  return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {entry.bib_number ? `#${entry.bib_number}` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAthleteName(entry.athletes.first_name, entry.athletes.last_name)}
                      </div>
                      <div className="text-sm text-gray-500">{entry.athletes.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {team ? (
                        <>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Users className="w-4 h-4 text-purple-600" />
                            {team.name}
                          </div>
                          {teamTypeInfo && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${teamTypeInfo.color}`}>
                              <span>{teamTypeInfo.icon}</span>
                              <span>{teamTypeInfo.label}</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {entry.athletes.license_club || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entry.races.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{entry.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          entry.status
                        )}`}
                      >
                        {getStatusLabel(entry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          entry.entry_payments?.[0]?.payment_status || 'pending'
                        )}`}
                      >
                        {getPaymentStatusLabel(
                          entry.entry_payments?.[0]?.payment_status || 'pending'
                        )}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {entry.entry_payments?.[0]?.amount_paid || 0} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOptions(entry)}
                          className="text-green-600 hover:text-green-900"
                          title="Voir les options d'inscription"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedEntry(entry);
                            await loadRaceOptions(entry.race_id);
                            await loadRegistrationOptions(entry.id);
                            const { data: opts } = await supabase
                              .from('race_options')
                              .select(`*, choices:race_option_choices(*)`)
                              .eq('race_id', entry.race_id)
                              .eq('active', true);
                            setDetailRaceOptions(opts || []);
                            const { data: regOpts } = await supabase
                              .from('registration_options')
                              .select('*')
                              .eq('entry_id', entry.id);
                            setDetailRegistrationOptions(regOpts || []);
                            setShowDetailModal(true);
                          }}
                          className="text-pink-600 hover:text-pink-900"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleSendEmail(entry)}
                          className="text-green-600 hover:text-green-900"
                          title="Envoyer un email"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleResendConfirmation(entry)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Renvoyer la confirmation"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDetailModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Détails de l'inscription</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Athlète</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nom complet:</span>
                    <p className="font-medium text-gray-900">
                      {formatAthleteName(selectedEntry.athletes.first_name, selectedEntry.athletes.last_name)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.athletes.email || 'Non renseigné'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date de naissance:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedEntry.athletes.birthdate).toLocaleDateString('fr-FR')} (
                      {calculateAge(selectedEntry.athletes.birthdate)} ans)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Genre:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.athletes.gender === 'M' ? 'Homme' : 'Femme'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Club/Association:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.athletes.license_club || 'Non renseigné'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Inscription</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Épreuve:</span>
                    <p className="font-medium text-gray-900">{selectedEntry.races.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Catégorie:</span>
                    <p className="font-medium text-gray-900">{selectedEntry.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Dossard:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.bib_number ? `#${selectedEntry.bib_number}` : 'Non attribué'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.source === 'manual' ? 'Manuelle' : selectedEntry.source}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Statut:</span>
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        selectedEntry.status
                      )}`}
                    >
                      {getStatusLabel(selectedEntry.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date d'inscription:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedEntry.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Paiement</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Statut:</span>
                    <span
                      className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                        selectedEntry.entry_payments[0]?.payment_status || 'pending'
                      )}`}
                    >
                      {getPaymentStatusLabel(
                        selectedEntry.entry_payments[0]?.payment_status || 'pending'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Montant:</span>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.entry_payments[0]?.amount_paid || 0} €
                    </p>
                  </div>
                </div>
              </div>

              {detailRegistrationOptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Options choisies</h3>
                  <div className="space-y-3">
                    {detailRegistrationOptions
                      .filter((regOpt) => {
                        const option = detailRaceOptions.find(o => o.id === regOpt.option_id);
                        return option !== null && option !== undefined;
                      })
                      .map((regOpt) => {
                      const option = detailRaceOptions.find(o => o.id === regOpt.option_id);
                      const choice = regOpt.choice_id && option?.choices
                        ? option.choices.find(c => c.id === regOpt.choice_id)
                        : null;

                      return (
                        <div key={regOpt.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start gap-3">
                            {option?.image_url && (
                              <img
                                src={option.image_url}
                                alt={option.label}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{option?.label}</p>
                              {option?.description && (
                                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                              )}
                              {choice ? (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Choix:</span> {choice.label}
                                  {choice.price_modifier_cents !== 0 && (
                                    <span className="text-gray-600 ml-1">
                                      ({choice.price_modifier_cents > 0 ? '+' : ''}{(choice.price_modifier_cents / 100).toFixed(2)}€)
                                    </span>
                                  )}
                                </p>
                              ) : regOpt.value ? (
                                <p className="text-sm text-gray-700 mt-2">
                                  <span className="font-medium">Réponse:</span> {regOpt.value}
                                </p>
                              ) : null}
                              {regOpt.price_paid_cents > 0 && (
                                <p className="text-sm text-green-700 font-medium mt-1">
                                  Prix: {(regOpt.price_paid_cents / 100).toFixed(2)}€
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendEmail(selectedEntry)}
                  className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer un email
                </button>
                <button
                  onClick={() => handleResendConfirmation(selectedEntry)}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Renvoyer confirmation
                </button>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier l'inscription</h2>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations athlète</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, first_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, last_name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={editFormData.birthdate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, birthdate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, gender: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                      <option value="X">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Club/Association</label>
                    <input
                      type="text"
                      value={editFormData.license_club}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, license_club: e.target.value })
                      }
                      placeholder="Nom du club"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">N° Licence</label>
                    <input
                      type="text"
                      value={editFormData.license_number || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, license_number: e.target.value })
                      }
                      placeholder="Numéro de licence"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationalité</label>
                    <select
                      value={editFormData.nationality || 'FRA'}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, nationality: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un pays</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="edit_is_anonymous"
                      checked={editFormData.is_anonymous || false}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, is_anonymous: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_is_anonymous" className="ml-2 text-sm text-gray-700">
                      Marquer cet athlète comme anonyme (le nom ne sera pas affiché publiquement)
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="SE">Senior (SE)</option>
                      <option value="M0">Master 0 (M0)</option>
                      <option value="M1">Master 1 (M1)</option>
                      <option value="M2">Master 2 (M2)</option>
                      <option value="M3">Master 3 (M3)</option>
                      <option value="M4">Master 4 (M4)</option>
                      <option value="M5">Master 5 (M5)</option>
                      <option value="M6">Master 6 (M6)</option>
                      <option value="M7">Master 7 (M7)</option>
                      <option value="M8">Master 8 (M8)</option>
                      <option value="M9">Master 9 (M9)</option>
                      <option value="M10">Master 10 (M10)</option>
                      <option value="V1">V1 (40-49 ans)</option>
                      <option value="V2">V2 (50-59 ans)</option>
                      <option value="V3">V3 (60-69 ans)</option>
                      <option value="V4">V4 (70+ ans)</option>
                      <option value="ES">Espoir (ES)</option>
                      <option value="JU">Junior (JU)</option>
                      <option value="CA">Cadet (CA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="confirmed">Confirmée</option>
                      <option value="draft">Brouillon</option>
                      <option value="cancelled">Annulée</option>
                      <option value="transferred">Transférée</option>
                      <option value="needs_docs">Docs manquants</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de dossard
                    </label>
                    <input
                      type="number"
                      value={editFormData.bib_number}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bib_number: e.target.value })
                      }
                      placeholder="Laissez vide pour auto"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut du paiement
                    </label>
                    <select
                      value={editFormData.payment_status}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, payment_status: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="paid">Payé</option>
                      <option value="pending">En attente</option>
                      <option value="free">Gratuit</option>
                      <option value="comped">Offert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.amount_paid}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, amount_paid: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode de paiement
                    </label>
                    <select
                      value={editFormData.payment_method || ''}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, payment_method: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un mode de paiement</option>
                      <option value="card">Carte bancaire (CB)</option>
                      <option value="check">Chèque</option>
                      <option value="transfer">Virement bancaire</option>
                      <option value="cash">Espèces</option>
                      <option value="manual_organizer">Manuel par organisateur</option>
                      <option value="manual_timepulse">Manuel par Timepulse</option>
                    </select>
                  </div>
                </div>
              </div>

              {raceOptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Options de l'épreuve</h3>
                  <div className="space-y-4">
                    {raceOptions.map((option) => (
                      <div key={option.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-4">
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt={option.label}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="font-medium text-gray-900">
                                {option.label}
                                {option.is_required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {option.price_cents > 0 && (
                                <span className="text-sm text-gray-600">
                                  ({(option.price_cents / 100).toFixed(2)}€)
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                            )}

                            {option.is_question && option.choices && option.choices.length > 0 ? (
                              <>
                                {console.log(`Option ${option.label} (${option.id}): selectedValue =`, selectedOptions[option.id]?.choiceId)}
                                <select
                                  value={selectedOptions[option.id]?.choiceId || ''}
                                  onChange={(e) => {
                                    console.log('Changing option', option.label, 'to', e.target.value);
                                    setSelectedOptions({
                                      ...selectedOptions,
                                      [option.id]: { choiceId: e.target.value }
                                    });
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  required={option.is_required}
                                >
                                  <option value="">Sélectionnez une option...</option>
                                  {option.choices.map((choice) => (
                                    <option key={choice.id} value={choice.id}>
                                      {choice.label}
                                      {choice.price_modifier_cents !== 0 && (
                                        ` (${choice.price_modifier_cents > 0 ? '+' : ''}${(choice.price_modifier_cents / 100).toFixed(2)}€)`
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <input
                                type="text"
                                value={selectedOptions[option.id]?.value || ''}
                                onChange={(e) => setSelectedOptions({
                                  ...selectedOptions,
                                  [option.id]: { value: e.target.value }
                                })}
                                placeholder="Votre réponse..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                required={option.is_required}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEntry}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Options d'inscription */}
      {showOptionsModal && selectedEntryOptions.entry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Options d'inscription
              </h3>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de base */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Participant</h4>
                <p className="text-sm text-gray-700">
                  {formatAthleteName(
                    selectedEntryOptions.entry.athletes.first_name,
                    selectedEntryOptions.entry.athletes.last_name
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedEntryOptions.entry.races.name}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Montant payé :</strong>{' '}
                  {selectedEntryOptions.entry.entry_payments?.[0]?.amount_paid || 0} €
                </p>
              </div>

              {/* Options sélectionnées */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Options sélectionnées
                </h4>

                {selectedEntryOptions.registrationOptions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Aucune option sélectionnée pour cette inscription
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedEntryOptions.registrationOptions.map((regOpt) => {
                      const option = selectedEntryOptions.options.find(
                        (o) => o.id === regOpt.option_id
                      );
                      if (!option) return null;

                      let displayValue = regOpt.value || '';

                      // Si c'est un choix, afficher le label du choix
                      if (regOpt.choice_id && option.choices) {
                        const choice = option.choices.find(
                          (c: any) => c.id === regOpt.choice_id
                        );
                        if (choice) {
                          displayValue = choice.label;
                        }
                      }

                      return (
                        <div
                          key={regOpt.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {option.label}
                              </p>
                              {option.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {option.description}
                                </p>
                              )}
                              {displayValue && (
                                <p className="text-sm text-gray-700 mt-2">
                                  <strong>Valeur :</strong> {displayValue}
                                </p>
                              )}
                              {regOpt.quantity > 1 && (
                                <p className="text-sm text-gray-700">
                                  <strong>Quantité :</strong> {regOpt.quantity}
                                </p>
                              )}
                            </div>
                            {regOpt.price_paid_cents > 0 && (
                              <div className="text-right">
                                <p className="font-semibold text-pink-600">
                                  {(regOpt.price_paid_cents / 100).toFixed(2)} €
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total des options */}
              {selectedEntryOptions.registrationOptions.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">
                      Total options :
                    </span>
                    <span className="text-lg font-bold text-pink-600">
                      {(
                        selectedEntryOptions.registrationOptions.reduce(
                          (sum, opt) => sum + (opt.price_paid_cents || 0),
                          0
                        ) / 100
                      ).toFixed(2)}{' '}
                      €
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de résultats d'actualisation FFA */}
      {showFFARefreshModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Actualisation des licences FFA
              </h3>
              <button
                onClick={() => setShowFFARefreshModal(false)}
                disabled={refreshingFFA}
                className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {refreshingFFA ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                  <p className="text-lg text-gray-700">
                    Actualisation des licences en cours...
                  </p>
                  <p className="text-sm text-gray-500">
                    Cette opération peut prendre quelques minutes selon le nombre d'inscriptions.
                  </p>
                </div>
              ) : ffaRefreshResults ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total traité</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {ffaRefreshResults.total}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Actualisés</p>
                      <p className="text-2xl font-bold text-green-600">
                        {ffaRefreshResults.updated}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Erreurs</p>
                      <p className="text-2xl font-bold text-red-600">
                        {ffaRefreshResults.errors}
                      </p>
                    </div>
                  </div>

                  {ffaRefreshResults.details && ffaRefreshResults.details.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Détails par athlète
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ffaRefreshResults.details.map((detail: any, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${
                              detail.status === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {detail.athleteName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Licence : {detail.licenseNumber}
                                </p>
                                {detail.message && (
                                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                    {detail.message}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  detail.status === 'success'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {detail.status === 'success' ? 'Réussi' : 'Erreur'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {!refreshingFFA && (
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setShowFFARefreshModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
