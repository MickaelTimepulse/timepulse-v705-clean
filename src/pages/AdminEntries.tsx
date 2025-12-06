import { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { FileText, Download, Filter, Calendar, Users, DollarSign, Eye, Search, X, RotateCcw, Mail, Info, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToCSV, exportToElogica, exportStats, exportEmails, exportBibLabels, ExportEntry } from '../lib/excel-export';
import { emailService } from '../lib/email-service';
import { formatAthleteName } from '../lib/formatters';
import EntriesCSVImporter from '../components/EntriesCSVImporter';

export default function AdminEntries() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundWithFees, setRefundWithFees] = useState(false);
  const [refundNotes, setRefundNotes] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedEntryOptions, setSelectedEntryOptions] = useState<{
    entry: any | null;
    options: any[];
    registrationOptions: any[];
  }>({ entry: null, options: [], registrationOptions: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0
  });
  const [entriesWithOptions, setEntriesWithOptions] = useState<Map<string, any[]>>(new Map());
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedRaceForImport, setSelectedRaceForImport] = useState<{ raceId: string; eventId: string } | null>(null);
  const [races, setRaces] = useState<any[]>([]);

  useEffect(() => {
    loadEntries();
    loadEvents();
    loadRaces();
  }, []);

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('id, name, slug')
      .order('created_at', { ascending: false });

    setEvents(data || []);
  }

  async function loadRaces() {
    const { data } = await supabase
      .from('races')
      .select('id, name, event_id, events(name)')
      .order('created_at', { ascending: false });

    setRaces(data || []);
  }

  async function loadEntries() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('admin_get_all_entries');

      if (error) throw error;

      const formattedEntries = (data || []).map((entry: any) => ({
        ...entry,
        id: entry.id,
        race_id: entry.race_id,
        event_id: entry.event_id,
        event_organizer_id: entry.event_organizer_id,
        bib_number: entry.bib_number,
        payment_status: entry.status,
        status: entry.status,
        category_label: entry.category,
        total_price: entry.amount || 0,
        amount: entry.amount || 0,
        paid_at: entry.paid_at,
        refund_status: entry.refund_status || 'none',
        refund_amount: entry.refund_amount || 0,
        management_code: entry.management_code,
        license_type: entry.license_type,
        pps_number: entry.pps_number,
        pps_expiry_date: entry.pps_expiry_date,
        created_at: entry.created_at,
        registration_date: entry.registration_date,
        events: {
          name: entry.event_name,
          slug: '',
          city: entry.event_city
        },
        races: {
          name: entry.race_name
        },
        athletes: {
          first_name: entry.first_name,
          last_name: entry.last_name,
          gender: entry.gender,
          birth_date: entry.birthdate,
          email: entry.email,
          phone_mobile: entry.phone_mobile,
          nationality_code: entry.nationality_code,
          license_number: entry.license_number,
          license_id: entry.license_number,
          license_type: entry.license_type,
          club: entry.club
        }
      }));

      setEntries(formattedEntries);

      // Charger les options pour toutes les inscriptions
      await loadEntriesOptions(formattedEntries);

      const total = formattedEntries.length;
      const confirmed = formattedEntries.filter(e => e.status === 'confirmed').length;
      const pending = formattedEntries.filter(e => e.status === 'pending').length;
      const cancelled = formattedEntries.filter(e => e.status === 'cancelled').length;
      const revenue = formattedEntries
        .filter(e => e.status === 'confirmed')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      setStats({ total, confirmed, pending, cancelled, revenue });
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEntriesOptions(entries: any[]) {
    try {
      const entryIds = entries.map(e => e.id);

      // Charger toutes les options sélectionnées
      const { data: regOptions } = await supabase
        .from('registration_options')
        .select(`
          *,
          race_options (
            label,
            type
          ),
          race_option_choices (
            label
          )
        `)
        .in('entry_id', entryIds);

      // Organiser les options par entry_id
      const optionsMap = new Map<string, any[]>();
      (regOptions || []).forEach((opt: any) => {
        const existing = optionsMap.get(opt.entry_id) || [];
        optionsMap.set(opt.entry_id, [...existing, opt]);
      });

      setEntriesWithOptions(optionsMap);
    } catch (error) {
      console.error('Error loading entries options:', error);
    }
  }

  function handleExportCSV() {
    const exportData: ExportEntry[] = filteredEntries.map(entry => ({
      bibNumber: entry.bib_number || 0,
      firstName: entry.athletes?.first_name || '',
      lastName: entry.athletes?.last_name || '',
      gender: entry.athletes?.gender || '',
      birthDate: entry.athletes?.birth_date || '',
      nationality: entry.athletes?.nationality_code || '',
      email: entry.athletes?.email || '',
      phone: entry.athletes?.phone_mobile || '',
      category: entry.category_label || '',
      raceName: entry.races?.name || '',
      price: entry.total_price || 0,
      status: entry.payment_status || '',
      registrationDate: entry.created_at || '',
      licenseNumber: entry.athletes?.license_number,
      club: entry.athletes?.club,
      ppsNumber: entry.pps_number || entry.athletes?.pps_number,
      ppsExpiryDate: entry.pps_expiry_date || entry.athletes?.pps_expiry_date,
      emergencyContact: entry.emergency_contact_name,
      emergencyPhone: entry.emergency_contact_phone
    }));

    exportToCSV(exportData, `inscriptions-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  }

  function handleExportElogica() {
    const exportData: ExportEntry[] = filteredEntries
      .filter(entry => entry.payment_status === 'confirmed')
      .map(entry => ({
        bibNumber: entry.bib_number || 0,
        firstName: entry.athletes?.first_name || '',
        lastName: entry.athletes?.last_name || '',
        gender: entry.athletes?.gender || '',
        birthDate: entry.athletes?.birth_date || '',
        nationality: entry.athletes?.nationality_code || '',
        email: entry.athletes?.email || '',
        phone: entry.athletes?.phone_mobile || '',
        category: entry.category_label || '',
        raceName: entry.races?.name || '',
        price: entry.total_price || 0,
        status: entry.payment_status || '',
        registrationDate: entry.created_at || '',
        licenseNumber: entry.athletes?.license_number,
        club: entry.athletes?.club,
        ppsNumber: entry.pps_number || entry.athletes?.pps_number,
        ppsExpiryDate: entry.pps_expiry_date || entry.athletes?.pps_expiry_date
      }));

    exportToElogica(exportData, `elogica-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  }

  function handleExportStats() {
    const confirmedEntries = filteredEntries.filter(e => e.payment_status === 'confirmed');
    const totalRevenue = confirmedEntries.reduce((sum, e) => sum + (e.total_price || 0), 0);

    const entriesByRace = Array.from(
      confirmedEntries.reduce((map, entry) => {
        const raceName = entry.races?.name || 'Non défini';
        map.set(raceName, (map.get(raceName) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).map(([raceName, count]) => ({ raceName, count }));

    const entriesByGender = Array.from(
      confirmedEntries.reduce((map, entry) => {
        const gender = entry.athletes?.gender || 'Non défini';
        map.set(gender, (map.get(gender) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).map(([gender, count]) => ({ gender, count }));

    const entriesByCategory = Array.from(
      confirmedEntries.reduce((map, entry) => {
        const category = entry.category_label || 'Non défini';
        map.set(category, (map.get(category) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).map(([category, count]) => ({ category, count }));

    exportStats({
      totalEntries: filteredEntries.length,
      confirmedEntries: confirmedEntries.length,
      pendingEntries: filteredEntries.filter(e => e.payment_status === 'pending').length,
      totalRevenue,
      entriesByRace,
      entriesByGender,
      entriesByCategory
    }, `stats-${new Date().toISOString().split('T')[0]}.csv`);

    setShowExportMenu(false);
  }

  function handleExportEmails() {
    const exportData: ExportEntry[] = filteredEntries
      .filter(entry => entry.payment_status === 'confirmed' && entry.athletes?.email)
      .map(entry => ({
        bibNumber: entry.bib_number || 0,
        firstName: entry.athletes?.first_name || '',
        lastName: entry.athletes?.last_name || '',
        gender: entry.athletes?.gender || '',
        birthDate: entry.athletes?.birth_date || '',
        nationality: entry.athletes?.nationality_code || '',
        email: entry.athletes?.email || '',
        phone: entry.athletes?.phone_mobile || '',
        category: entry.category_label || '',
        raceName: entry.races?.name || '',
        price: entry.total_price || 0,
        status: entry.payment_status || '',
        registrationDate: entry.created_at || '',
        ppsNumber: entry.pps_number || entry.athletes?.pps_number,
        ppsExpiryDate: entry.pps_expiry_date || entry.athletes?.pps_expiry_date
      }));

    exportEmails(exportData, `emails-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  }

  const handleViewOptions = async (entry: any) => {
    try {
      // Charger les informations de la course avec le prix
      const { data: raceData } = await supabase
        .from('races')
        .select('id, name, base_price')
        .eq('id', entry.race_id)
        .single();

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

      // Charger les options sélectionnées pour cette inscription avec leurs détails
      const { data: regOptions } = await supabase
        .from('registration_options')
        .select(`
          *,
          race_options!registration_options_option_id_fkey (
            label,
            type
          ),
          race_option_choices!registration_options_choice_id_fkey (
            label
          )
        `)
        .eq('entry_id', entry.id);

      console.log('Entry:', entry);
      console.log('Race data:', raceData);
      console.log('Race options:', options);
      console.log('Registration options:', regOptions);

      setSelectedEntryOptions({
        entry: { ...entry, race: raceData },
        options: options || [],
        registrationOptions: regOptions || [],
      });
      setShowOptionsModal(true);
    } catch (error) {
      console.error('Error loading options:', error);
      alert('Erreur lors du chargement des options');
    }
  };

  function handleExportBibLabels() {
    const exportData: ExportEntry[] = filteredEntries
      .filter(entry => entry.payment_status === 'confirmed')
      .map(entry => ({
        bibNumber: entry.bib_number || 0,
        firstName: entry.athletes?.first_name || '',
        lastName: entry.athletes?.last_name || '',
        gender: entry.athletes?.gender || '',
        birthDate: entry.athletes?.birth_date || '',
        nationality: entry.athletes?.nationality_code || '',
        email: entry.athletes?.email || '',
        phone: entry.athletes?.phone_mobile || '',
        category: entry.category_label || '',
        raceName: entry.races?.name || '',
        price: entry.total_price || 0,
        status: entry.payment_status || '',
        registrationDate: entry.created_at || '',
        ppsNumber: entry.pps_number || entry.athletes?.pps_number,
        ppsExpiryDate: entry.pps_expiry_date || entry.athletes?.pps_expiry_date
      }));

    exportBibLabels(exportData, `etiquettes-${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  }

  async function handleResendConfirmationEmail(entry: any) {
    if (!entry.athletes?.email) {
      alert('Aucun email trouvé pour cet athlète');
      return;
    }

    try {
      setSendingEmail(entry.id);

      const { data: eventData } = await supabase
        .from('events')
        .select('start_date')
        .eq('id', entry.event_id)
        .single();

      const { data: organizerData } = await supabase
        .from('organizers')
        .select('organization_name, contact_email')
        .eq('id', entry.event_organizer_id)
        .single();

      const { data: athleteData } = await supabase
        .from('athletes')
        .select('license_type, pps_expiry_date')
        .eq('id', entry.athlete_id)
        .single();

      const ppsExpiryDate = entry.pps_expiry_date || athleteData?.pps_expiry_date;
      const hasPPS = entry.pps_number || athleteData?.pps_expiry_date;
      const isNonLicencie = athleteData?.license_type?.includes('Non licencié') ||
                            !athleteData?.license_type ||
                            hasPPS;

      const needsPPSUpdate = isNonLicencie &&
        ppsExpiryDate &&
        eventData?.start_date &&
        new Date(ppsExpiryDate) < new Date(eventData.start_date);

      const emailHtml = emailService.generateRegistrationConfirmationEmail({
        athleteFirstName: entry.athletes.first_name,
        athleteLastName: entry.athletes.last_name,
        athleteEmail: entry.athletes.email,
        eventName: entry.events?.name || 'Événement',
        raceName: entry.races?.name || 'Course',
        raceDate: eventData?.start_date ? new Date(eventData.start_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'Date à confirmer',
        bibNumber: entry.bib_number?.toString(),
        registrationStatus: entry.status === 'confirmed' ? 'confirmed' : 'pending_documents',
        managementCode: entry.management_code || 'N/A',
        licenseType: athleteData?.license_type || entry.license_type || 'Non renseigné',
        ppsNumber: entry.pps_number,
        ppsExpiryDate: ppsExpiryDate ? new Date(ppsExpiryDate).toLocaleDateString('fr-FR') : undefined,
        requiresPPSUpdate: needsPPSUpdate,
        amount: entry.amount,
        paymentStatus: entry.status,
        organizerName: organizerData?.organization_name || 'Organisateur',
        organizerEmail: organizerData?.contact_email
      });

      const result = await emailService.sendEmail({
        to: entry.athletes.email,
        subject: `Confirmation d'inscription - ${entry.events?.name}`,
        html: emailHtml
      });

      if (result.success) {
        alert(`Email de confirmation renvoyé avec succès à ${entry.athletes.email}`);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      alert('Erreur lors de l\'envoi de l\'email de confirmation');
    } finally {
      setSendingEmail(null);
    }
  }

  async function handleRefund() {
    if (!selectedEntry) return;

    try {
      setProcessingRefund(true);

      const refundAmountValue = refundType === 'full'
        ? selectedEntry.amount
        : parseFloat(refundAmount);

      if (refundType === 'partial' && (!refundAmount || refundAmountValue <= 0)) {
        alert('Veuillez saisir un montant de remboursement valide');
        return;
      }

      if (refundAmountValue > selectedEntry.amount) {
        alert('Le montant du remboursement ne peut pas dépasser le montant payé');
        return;
      }

      console.log('🔄 Traitement du remboursement via Lyra API...');

      const { data, error } = await supabase.functions.invoke('lyra-refund', {
        body: {
          entryId: selectedEntry.id,
          amount: refundAmountValue,
          reason: refundNotes || 'Remboursement demandé par l\'organisateur',
          includeTransactionFees: refundWithFees,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du remboursement');
      }

      if (data.manual) {
        alert('⚠️ ' + data.message);
      } else {
        alert('✅ Remboursement traité avec succès via Lyra Collect !\n\nMontant : ' + refundAmountValue.toFixed(2) + ' €\nStatut : ' + (data.refundStatus === 'full' ? 'Remboursement complet' : 'Remboursement partiel') + '\n\nLe client recevra le montant sous 3 à 5 jours ouvrés.');
      }

      setShowRefundModal(false);
      setSelectedEntry(null);
      setRefundType('full');
      setRefundAmount('');
      setRefundWithFees(false);
      setRefundNotes('');
      loadEntries();
    } catch (error: any) {
      console.error('❌ Erreur lors du remboursement:', error);
      alert('❌ Erreur lors du remboursement : ' + (error.message || 'Erreur inconnue') + '\n\nVeuillez vérifier les logs ou traiter le remboursement manuellement dans le back-office Lyra.');
    } finally {
      setProcessingRefund(false);
    }
  }

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.athletes?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.athletes?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.bib_number?.toString().includes(searchTerm);

    const matchesEvent = filterEvent === 'all' || entry.event_id === filterEvent;
    const matchesStatus = filterStatus === 'all' || entry.payment_status === filterStatus;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEvent, filterStatus]);

  return (
    <AdminLayout title="Inscriptions">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inscriptions</h1>
            <p className="text-gray-600 mt-1">Vue globale de toutes les inscriptions de la plateforme</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              <span>Importer CSV</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700"
              >
                <Download className="w-5 h-5" />
                <span>Exporter</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <div className="p-2">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Excel complet (.csv)
                    </button>
                    <button
                      onClick={handleExportElogica}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Format Elogica (chrono)
                    </button>
                    <button
                      onClick={handleExportStats}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Statistiques (.csv)
                    </button>
                    <button
                      onClick={handleExportEmails}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Liste emails
                    </button>
                    <button
                      onClick={handleExportBibLabels}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Étiquettes dossards
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total inscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Toutes les inscriptions</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(0) : 0}% du total</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(0) : 0}% du total</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Annulées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(0) : 0}% du total</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-900">{stats.revenue.toFixed(0)} €</p>
                <p className="text-xs text-gray-500 mt-1">Paiements confirmés</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher (nom, email, dossard...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Tous les événements</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="confirmed">Confirmées</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulées</option>
            </select>

            {(searchTerm || filterEvent !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterEvent('all');
                  setFilterStatus('all');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des inscriptions...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune inscription trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dossard</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement / Course</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inscription</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="font-bold text-gray-900">#{entry.bib_number || '-'}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.athletes?.first_name} {entry.athletes?.last_name}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{entry.athletes?.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm font-medium text-gray-900">{entry.events?.name}</div>
                        <div className="text-xs text-blue-600 mt-0.5">{entry.races?.name}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.amount?.toFixed(2)} €
                        </div>
                        {entry.refund_status !== 'none' && (
                          <div className="text-xs text-red-600">
                            Remb: {entry.refund_amount?.toFixed(2)} €
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.payment_status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : entry.payment_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.payment_status === 'confirmed' ? 'Confirmée' :
                             entry.payment_status === 'pending' ? 'En attente' : 'Annulée'}
                          </span>
                        </div>
                        {entry.refund_status !== 'none' && (
                          <div className="mt-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {entry.refund_status === 'full' ? 'Remb. complet' : 'Remb. partiel'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(entry.registration_date || entry.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(entry.registration_date || entry.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {entry.paid_at ? new Date(entry.paid_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewOptions(entry)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Voir les options d'inscription"
                          >
                            <Info className="w-4 h-4" />
                            <span className="hidden xl:inline">Options</span>
                          </button>
                          {entry.payment_status === 'confirmed' && (
                            <button
                              onClick={() => handleResendConfirmationEmail(entry)}
                              disabled={sendingEmail === entry.id}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Renvoyer le mail de confirmation"
                            >
                              <Mail className="w-4 h-4" />
                              <span className="hidden xl:inline">
                                {sendingEmail === entry.id ? 'Envoi...' : 'Email'}
                              </span>
                            </button>
                          )}
                          {entry.payment_status === 'confirmed' && entry.refund_status === 'none' && (
                            <button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowRefundModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                              title="Rembourser l'inscription"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span className="hidden xl:inline">Rembourser</span>
                            </button>
                          )}
                          {entry.refund_status !== 'none' && (
                            <span className="text-gray-400 text-xs">Remboursé</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredEntries.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredEntries.length)} sur {filteredEntries.length} inscription{filteredEntries.length > 1 ? 's' : ''}
                {entries.length !== filteredEntries.length && ` (${entries.length} au total)`}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Première
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Dernière
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRefundModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Remboursement</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Participant</p>
                <p className="font-medium">
                  {selectedEntry.athletes?.first_name} {selectedEntry.athletes?.last_name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Montant payé</p>
                <p className="font-medium text-lg">{selectedEntry.amount?.toFixed(2)} €</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de remboursement
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="full"
                      checked={refundType === 'full'}
                      onChange={(e) => setRefundType(e.target.value as 'full')}
                      className="mr-2"
                    />
                    <span>Remboursement complet ({selectedEntry.amount?.toFixed(2)} €)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="partial"
                      checked={refundType === 'partial'}
                      onChange={(e) => setRefundType(e.target.value as 'partial')}
                      className="mr-2"
                    />
                    <span>Remboursement partiel</span>
                  </label>
                </div>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant à rembourser (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedEntry.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={refundWithFees}
                    onChange={(e) => setRefundWithFees(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Inclure les frais de transaction (~1.4% + 0.25€)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Raison du remboursement..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important :</strong> Cette action enregistre le remboursement dans le système.
                  Vous devez ensuite traiter le remboursement manuellement dans votre back-office Lyra Collect.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedEntry(null);
                  setRefundType('full');
                  setRefundAmount('');
                  setRefundWithFees(false);
                  setRefundNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={processingRefund}
              >
                Annuler
              </button>
              <button
                onClick={handleRefund}
                disabled={processingRefund || (refundType === 'partial' && !refundAmount)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRefund ? 'Traitement...' : 'Confirmer le remboursement'}
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
                <h4 className="font-semibold text-gray-900 mb-3">Participant</h4>
                <p className="text-sm text-gray-700 font-medium">
                  {formatAthleteName(
                    selectedEntryOptions.entry.athletes?.first_name,
                    selectedEntryOptions.entry.athletes?.last_name
                  )}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEntryOptions.entry.races?.name}
                </p>

                {/* Statut */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedEntryOptions.entry.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : selectedEntryOptions.entry.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEntryOptions.entry.status === 'confirmed' ? 'Confirmée' :
                     selectedEntryOptions.entry.status === 'pending' ? 'En attente' : 'Annulée'}
                  </span>
                </div>
              </div>

              {/* Informations licence et club */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Licence & Club</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Type de licence</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(() => {
                        const licenseType = selectedEntryOptions.entry.license_type || selectedEntryOptions.entry.athletes?.license_type;
                        const licenseNumber = selectedEntryOptions.entry.license_number || selectedEntryOptions.entry.athletes?.license_number;
                        const federationCodes = ['FFA', 'FFTRI', 'FFME', 'UFOLEP', 'FSGT', 'FFN'];
                        const fedNames: { [key: string]: string } = {
                          'FFA': 'Licence FFA (Athlétisme)',
                          'FFTRI': 'Licence FFTRI (Triathlon)',
                          'FFME': 'Licence FFME (Montagne)',
                          'UFOLEP': 'Licence UFOLEP',
                          'FSGT': 'Licence FSGT',
                          'FFN': 'Licence FFN (Natation)'
                        };

                        // Si licenseType est un code fédéral (FFA, FFTRI, etc)
                        if (licenseType && federationCodes.includes(licenseType.toUpperCase())) {
                          return fedNames[licenseType.toUpperCase()] || `Licence ${licenseType}`;
                        }
                        // Si on a un type de licence explicite (COMP, LOISR, etc)
                        else if (licenseType && !federationCodes.includes(licenseType)) {
                          return licenseType;
                        }
                        // Si license_number contient un code fédéral
                        else if (licenseNumber && federationCodes.includes(licenseNumber.toUpperCase())) {
                          return fedNames[licenseNumber.toUpperCase()] || `Licence ${licenseNumber}`;
                        }
                        else if (licenseNumber === 'non') {
                          return 'Non licencié';
                        }
                        else if (selectedEntryOptions.entry.pps_number) {
                          return 'Pass Prévention Santé (PPS)';
                        }
                        else if (licenseNumber && /^\d{6,7}$/.test(licenseNumber)) {
                          // Si c'est un numéro à 6-7 chiffres, c'est probablement FFA
                          return 'Licence FFA (Athlétisme)';
                        }
                        else {
                          return 'Non renseigné';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">N° de licence</span>
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {(() => {
                        const licenseNumber = selectedEntryOptions.entry.license_number || selectedEntryOptions.entry.athletes?.license_number;
                        const ppsNumber = selectedEntryOptions.entry.pps_number;
                        const federationCodes = ['FFA', 'FFTRI', 'FFME', 'UFOLEP', 'FSGT', 'FFN', 'non'];

                        // Si c'est un code fédéral seul, ne pas l'afficher comme numéro
                        if (licenseNumber && federationCodes.includes(licenseNumber.toUpperCase())) {
                          return '-';
                        }
                        // Si c'est "non", ne pas afficher
                        else if (licenseNumber === 'non') {
                          return '-';
                        }
                        // Tout le reste est un vrai numéro (numérique ou alphanumérique)
                        else if (licenseNumber) {
                          return licenseNumber;
                        }
                        else if (ppsNumber) {
                          return ppsNumber;
                        }
                        else {
                          return '-';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Club/Asso</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedEntryOptions.entry.club || selectedEntryOptions.entry.athletes?.club || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Détail des prix */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900 mb-3">Détail des tarifs</h4>

                {/* Prix de la course */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Inscription à la course</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {(() => {
                      const totalAmount = selectedEntryOptions.entry.amount || 0;
                      const optionsTotal = selectedEntryOptions.registrationOptions.reduce(
                        (sum: number, opt: any) => sum + ((opt.price_paid_cents || 0) / 100),
                        0
                      );
                      return (totalAmount - optionsTotal).toFixed(2);
                    })()} €
                  </span>
                </div>

                {/* Options */}
                {selectedEntryOptions.registrationOptions.length > 0 && (
                  <>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <p className="text-xs text-gray-600 mb-2">Options sélectionnées :</p>
                      {selectedEntryOptions.registrationOptions.map((regOpt: any) => {
                        // Déterminer la valeur à afficher selon le type d'option
                        let displayValue = '';
                        let optionLabel = regOpt.race_options?.label || 'Option';

                        // Si c'est un choix (tshirt, shuttle, etc.)
                        if (regOpt.race_option_choices?.label) {
                          displayValue = regOpt.race_option_choices.label;
                        }
                        // Si c'est une valeur libre (temps de référence, etc.)
                        else if (regOpt.value) {
                          displayValue = regOpt.value;
                        }

                        return (
                          <div key={regOpt.id} className="flex justify-between items-start text-sm mb-1">
                            <span className="text-gray-700">
                              • {optionLabel}
                              {displayValue && ` : ${displayValue}`}
                              {regOpt.quantity > 1 && ` (×${regOpt.quantity})`}
                            </span>
                            <span className="font-medium text-gray-900">
                              {((regOpt.price_paid_cents || 0) / 100).toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total options */}
                    <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Total options</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedEntryOptions.registrationOptions.reduce(
                          (sum: number, opt: any) => sum + ((opt.price_paid_cents || 0) / 100),
                          0
                        ).toFixed(2)} €
                      </span>
                    </div>
                  </>
                )}

                {/* Total */}
                <div className="border-t-2 border-blue-300 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total payé</span>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedEntryOptions.entry.amount?.toFixed(2) || '0.00'} €
                  </span>
                </div>
              </div>

              {/* État du dossier */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">État du dossier</h4>
                <div className="space-y-3">
                  {/* Dossier valide */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Dossier valide</span>
                    <div className="flex items-center gap-2">
                      {selectedEntryOptions.entry.status === 'confirmed' ? (
                        <>
                          <span className="text-green-600 font-bold text-xl">✓</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Validé
                          </span>
                        </>
                      ) : selectedEntryOptions.entry.status === 'pending' ? (
                        <>
                          <span className="text-yellow-600 font-bold text-xl">⏳</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            En attente
                          </span>
                        </>
                      ) : selectedEntryOptions.entry.status === 'needs_docs' ? (
                        <>
                          <span className="text-orange-600 font-bold text-xl">📄</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Documents manquants
                          </span>
                        </>
                      ) : selectedEntryOptions.entry.status === 'documents_invalid' ? (
                        <>
                          <span className="text-red-600 font-bold text-xl">⚠</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Documents invalides
                          </span>
                        </>
                      ) : selectedEntryOptions.entry.status === 'rejected' || selectedEntryOptions.entry.status === 'cancelled' ? (
                        <>
                          <span className="text-red-600 font-bold text-xl">✗</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {selectedEntryOptions.entry.status === 'rejected' ? 'Refusé' : 'Annulé'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-600 font-bold text-xl">•</span>
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            {selectedEntryOptions.entry.status}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Statut de paiement */}
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="text-sm text-gray-700">Statut paiement</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedEntryOptions.entry.payment_status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : selectedEntryOptions.entry.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedEntryOptions.entry.payment_status === 'confirmed' ? 'Payé' :
                       selectedEntryOptions.entry.payment_status === 'pending' ? 'En attente' : 'Non payé'}
                    </span>
                  </div>

                  {selectedEntryOptions.entry.requires_document_renewal && (
                    <div className="flex items-start gap-2 text-sm pt-2 border-t border-purple-200">
                      <span className="text-orange-600 font-semibold">⚠️</span>
                      <div>
                        <span className="text-orange-800 font-medium">Document à renouveler</span>
                        {selectedEntryOptions.entry.renewal_document_type && (
                          <span className="text-gray-600 ml-1">
                            ({selectedEntryOptions.entry.renewal_document_type})
                          </span>
                        )}
                        {selectedEntryOptions.entry.renewal_deadline && (
                          <div className="text-xs text-orange-600 mt-1">
                            Échéance : {new Date(selectedEntryOptions.entry.renewal_deadline).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEntryOptions.entry.status_message && (
                    <div className="pt-2 border-t border-purple-200">
                      <p className="text-xs text-gray-600 italic">
                        {selectedEntryOptions.entry.status_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Descriptions complètes des options */}
              {selectedEntryOptions.registrationOptions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Descriptions des options
                  </h4>
                  <div className="space-y-3">
                    {selectedEntryOptions.registrationOptions.map((regOpt: any) => {
                      const option = selectedEntryOptions.options.find(
                        (o: any) => o.id === regOpt.option_id
                      );
                      if (!option || !option.description) return null;

                      return (
                        <div
                          key={regOpt.id}
                          className="bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <p className="font-medium text-gray-900 mb-1">
                            {option.label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {option.description}
                          </p>
                        </div>
                      );
                    })}
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

      {showImportModal && !selectedRaceForImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Sélectionner une course
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choisissez la course pour laquelle vous souhaitez importer les inscriptions
              </p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {races.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune course disponible
                </p>
              ) : (
                <div className="space-y-2">
                  {races.map((race: any) => (
                    <button
                      key={race.id}
                      onClick={() => {
                        setSelectedRaceForImport({
                          raceId: race.id,
                          eventId: race.event_id
                        });
                      }}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-pink-300 transition"
                    >
                      <p className="font-medium text-gray-900">{race.name}</p>
                      <p className="text-sm text-gray-600">
                        {race.events?.name || 'Événement'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && selectedRaceForImport && (
        <EntriesCSVImporter
          raceId={selectedRaceForImport.raceId}
          eventId={selectedRaceForImport.eventId}
          onImportComplete={() => {
            setShowImportModal(false);
            setSelectedRaceForImport(null);
            loadEntries();
          }}
          onClose={() => {
            setShowImportModal(false);
            setSelectedRaceForImport(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
