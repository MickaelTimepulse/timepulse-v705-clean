import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle, Loader2, Info, Upload, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateFFACategory } from '../lib/category-calculator';
import AdminLayout from '../components/Admin/AdminLayout';

interface CSVRow {
  [key: string]: string;
}

interface ParsedData {
  rows: CSVRow[];
  headers: string[];
  stats: {
    total: number;
  };
}

interface Event {
  id: string;
  name: string;
}

interface Race {
  id: string;
  name: string;
  event_id: string;
}

export default function AdminTimepulseImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRaces(selectedEventId);
    } else {
      setRaces([]);
      setSelectedRaceId('');
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('admin_get_all_events');

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setError('Aucun événement trouvé. Créez d\'abord un événement.');
      }

      // Transformer pour avoir le bon format
      const eventsData = data?.map((e: any) => ({
        id: e.id,
        name: e.name,
        start_date: e.start_date,
        status: e.status
      })) || [];

      setEvents(eventsData);
    } catch (err: any) {
      console.error('Erreur chargement événements:', err);
      setError(`Impossible de charger les événements : ${err.message}`);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadRaces = async (eventId: string) => {
    try {
      // Charger d'abord l'événement pour vérifier les permissions
      const { data: eventData, error: eventError } = await supabase
        .rpc('admin_get_all_events');

      if (eventError) {
        console.error('Error checking event:', eventError);
        return;
      }

      // Vérifier que l'événement existe dans la liste accessible
      const event = eventData?.find((e: any) => e.id === eventId);
      if (!event) {
        console.error('Event not accessible');
        return;
      }

      // Charger les races avec accès admin
      const { data, error } = await supabase
        .from('races')
        .select('id, name, event_id')
        .eq('event_id', eventId)
        .order('name');

      if (error) throw error;
      setRaces(data || []);
    } catch (err: any) {
      console.error('Erreur chargement épreuves:', err);
      setError('Impossible de charger les épreuves');
    }
  };

  // Convertir valeur vide en null
  const emptyToNull = (value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    return String(value).trim() || null;
  };

  // Convertir une date française DD/MM/YYYY en format ISO YYYY-MM-DD
  const convertFrenchDateToISO = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Format DD/MM/YYYY
    const frenchDateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (frenchDateMatch) {
      const [, day, month, year] = frenchDateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Si déjà au format ISO ou autre format, retourner tel quel
    return dateStr;
  };

  const parseCSV = (text: string): ParsedData => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Fichier vide');

    // Détecter le séparateur (virgule ou point-virgule)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    console.log('Séparateur détecté:', separator === ';' ? 'point-virgule (;)' : 'virgule (,)');

    // Parser CSV robuste qui gère les guillemets et les séparateurs
    const parseCSVLine = (line: string, sep: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === sep && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0], separator).map(h => h.replace(/^["']|["']$/g, '').trim());
    console.log('Headers détectés:', headers.slice(0, 10));

    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator).map(v => v.replace(/^["']|["']$/g, '').trim());
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return {
      rows,
      headers,
      stats: { total: rows.length }
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPreviewData(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setPreviewData(parsed);
      setSuccess(`Fichier analysé : ${parsed.stats.total} lignes détectées`);
    } catch (err: any) {
      setError(`Erreur de lecture : ${err.message}`);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recalcule les catégories FFA pour toutes les entrées d'une course
   * si celle-ci est affiliée FFA
   */
  const recalculateFFACategories = async (eventId: string, raceId: string) => {
    try {
      // Récupérer la date de l'événement
      const { data: eventData } = await supabase
        .from('events')
        .select('start_date')
        .eq('id', eventId)
        .single();

      if (!eventData?.start_date) {
        console.log('⚠️ Date d\'événement non trouvée, catégories non recalculées');
        return;
      }

      const eventDate = new Date(eventData.start_date);

      // Vérifier si la course est FFA
      const { data: raceData } = await supabase
        .from('races')
        .select('is_ffa_race, name')
        .eq('id', raceId)
        .single();

      if (!raceData?.is_ffa_race) {
        console.log('ℹ️ Course non-FFA, catégories non recalculées');
        return;
      }

      console.log(`🏃 Recalcul des catégories FFA pour "${raceData.name}"...`);

      // Récupérer toutes les entrées de cette course avec les dates de naissance
      const { data: entries } = await supabase
        .from('entries')
        .select('id, athlete_id, athletes!inner(birthdate, first_name, last_name)')
        .eq('race_id', raceId);

      if (!entries || entries.length === 0) {
        console.log('ℹ️ Aucune entrée trouvée pour recalculer');
        return;
      }

      console.log(`📊 Recalcul pour ${entries.length} participants...`);

      let updated = 0;
      for (const entry of entries) {
        const athlete = entry.athletes as any;
        if (!athlete?.birthdate) {
          console.warn(`⚠️ Pas de date de naissance pour ${athlete?.first_name} ${athlete?.last_name}`);
          continue;
        }

        // Calculer la catégorie FFA
        const category = calculateFFACategory(athlete.birthdate, eventDate);

        if (category) {
          await supabase
            .from('entries')
            .update({ category })
            .eq('id', entry.id);
          updated++;
        }
      }

      console.log(`✅ ${updated} catégories FFA recalculées sur ${entries.length} entrées`);
    } catch (err) {
      console.error('❌ Erreur lors du recalcul des catégories FFA:', err);
    }
  };

  const handleImport = async () => {
    if (!previewData || !selectedEventId || !selectedRaceId) {
      setError('Veuillez sélectionner un événement et une épreuve');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Récupérer l'ID de l'admin connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Vous devez être connecté pour importer');
        return;
      }

      // Récupérer l'organisateur de l'événement
      const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', selectedEventId)
        .single();

      if (!event) {
        setError('Événement introuvable');
        return;
      }

      // Récupérer les options disponibles pour cette course avec leurs choix
      const { data: raceOptions, error: optionsError } = await supabase
        .from('race_options')
        .select('id, label, type, price_cents')
        .eq('race_id', selectedRaceId)
        .eq('active', true);

      if (optionsError) {
        console.error('Erreur chargement options:', optionsError);
      }

      const optionsMap = new Map(raceOptions?.map(opt => [opt.label.toLowerCase(), opt]) || []);

      const totalRows = previewData.rows.length;
      setImportProgress({ current: 0, total: totalRows });

      // Délai initial réduit pour permettre le rendu de la barre
      await new Promise(resolve => setTimeout(resolve, 100));

      for (let i = 0; i < previewData.rows.length; i++) {
        const row = previewData.rows[i];

        // Mise à jour de la progression
        setImportProgress({ current: i + 1, total: totalRows });

        // Log progression tous les 50 enregistrements (au lieu de 10)
        if (i % 50 === 0 || i === totalRows - 1) {
          console.log(`📊 Import: ${i + 1}/${totalRows} (${Math.round(((i + 1) / totalRows) * 100)}%)`);
        }

        // Forcer le rendu uniquement tous les 20 enregistrements (au lieu de 5)
        if (i % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        try {
          // Extraire les données essentielles
          const email = row.email || row.Email || row.EMAIL || row.e_mail || row.E_mail ||
                        row['E-mail'] || row['e-mail'] || row.mail || row.Mail || '';

          if (!email) {
            // Afficher les clés disponibles pour debug
            console.log('Colonnes disponibles:', Object.keys(row).slice(0, 10));
            errors.push(`Email manquant - Colonnes: ${Object.keys(row).slice(0, 5).join(', ')}`);
            continue;
          }

          // Extraire nom, prénom et date de naissance AVANT de vérifier les doublons
          const firstName = row.first_name || row.prenom || row.Prénom || row['Prénom'] || '';
          const lastName = row.last_name || row.nom || row.Nom || row['Nom'] || '';
          const birthdateRaw = row.birth_date || row.birthdate || row.naissance || row['Date de naissance'] || '';
          const birthdate = convertFrenchDateToISO(birthdateRaw);

          if (!firstName || !lastName) {
            errors.push(`${email}: Nom ou prénom manquant`);
            continue;
          }

          // OPTIMISATION: Chercher d'abord si l'athlète existe déjà (nom + prénom + date de naissance)
          // Cela évite de créer des doublons d'athlètes et vérifie l'inscription
          const { data: existingAthletes, error: searchError } = await supabase
            .from('athletes')
            .select('id, email, first_name, last_name, birthdate')
            .ilike('first_name', firstName)
            .ilike('last_name', lastName);

          if (searchError) {
            console.error('Error searching athletes:', searchError);
          }

          let athleteId: string | null = null;
          let shouldSkip = false;

          // Si on trouve des athlètes correspondants
          if (existingAthletes && existingAthletes.length > 0) {
            // Filtrer pour trouver une correspondance exacte (nom + prénom + date de naissance)
            for (const athlete of existingAthletes) {
              const sameFirstName = athlete.first_name?.toLowerCase().trim() === firstName.toLowerCase().trim();
              const sameLastName = athlete.last_name?.toLowerCase().trim() === lastName.toLowerCase().trim();
              const sameBirthdate = athlete.birthdate === birthdate;

              if (sameFirstName && sameLastName && sameBirthdate) {
                // Athlète trouvé ! Vérifier s'il est déjà inscrit à cette course
                const { data: existingEntry, error: entryError } = await supabase
                  .from('entries')
                  .select('id')
                  .eq('race_id', selectedRaceId)
                  .eq('athlete_id', athlete.id)
                  .maybeSingle();

                if (entryError) {
                  console.error('Error checking entry:', entryError);
                }

                if (existingEntry) {
                  console.log(`⏭️ Doublon ignoré: ${firstName} ${lastName} (${birthdate}) - déjà inscrit avec ID ${athlete.id}`);
                  shouldSkip = true;
                  break;
                }

                // L'athlète existe mais n'est pas inscrit, on le réutilise
                console.log(`🔄 Réutilisation athlète existant: ${firstName} ${lastName} (ID: ${athlete.id})`);
                athleteId = athlete.id;
                break;
              }
            }
          }

          if (shouldSkip) {
            skipped++;
            continue;
          }

          // Préparer les données de l'athlète
          const genderValue = (row.gender || row.sexe || row.Sexe || '').toString().toUpperCase();
          const gender = genderValue === 'M' || genderValue === 'H' || genderValue === 'MALE' || genderValue === 'HOMME' ? 'M' : 'F';

          // Convertir la date du certificat médical
          const certDateRaw = row.medical_certificate_date || row.date_certificat || row['Date Certificat'] || row.certificat_medical || '';
          const certDate = convertFrenchDateToISO(certDateRaw);

          // Convertir la date de validité PPS
          const ppsDateRaw = row.pps_valid_until || row.pps_date || row['Date validité PPS'] || '';
          const ppsDate = convertFrenchDateToISO(ppsDateRaw);

          // Nettoyer le numéro PPS - Si pas de date, on ignore le numéro (contrainte PPS)
          const ppsNumberRaw = emptyToNull(row.pps_number || row.pps || row.num_pps || row['Numéro PPS'] || row.numero_pps);
          const ppsNumber = (ppsNumberRaw && ppsDate) ? ppsNumberRaw : null;

          const athleteData = {
            email: email,
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            birthdate: birthdate || null,
            nationality: row.nationality || row.nationalite || row.nationalité || row.Nationalité || row['Nationalité'] || 'FRA',
            phone: emptyToNull(row.phone || row.mobile || row.Mobile || row.telephone || row.Téléphone || row['Téléphone'] || row.tel),
            city: emptyToNull(row.city || row.ville || row.Ville || row['Ville']),
            postal_code: emptyToNull(row.postal_code || row.zip || row.code_postal || row.CP || row.cp || row['CP']),
            license_number: emptyToNull(row.license_number || row.num_licence || row.licence || row.Licence || row['N° de licence']),
            license_club: emptyToNull(row.license_club || row.club || row.Club || row['Club/Asso'] || row.club_licence),
            license_type: emptyToNull(row.license_type || row.type_licence || row['Type de licence']),
            federation: emptyToNull(row.federation || row.fédération || row.Fédération),
            league: emptyToNull(row.league || row.ligue || row.Ligue || row['Ligue du club']),
            club_number: emptyToNull(row.club_number || row.num_club || row.numero_club || row['N° du club']),
            pps_number: ppsNumber,
            pps_valid_until: ppsNumber ? ppsDate : null, // Cohérence : les deux ou aucun
            medical_certificate_date: certDate || null,
          };

          // Informations d'équipe (si course par équipe)
          const teamData = {
            team_name: row.team_name || row.equipe || row.Equipe || row.Équipe || row['Equipe'] || row.nom_equipe || null,
            team_type: row.team_type || row['Type équipe'] || row.type_equipe || row.team_gender || null,
          };

          // Créer un nouvel athlète (si pas déjà trouvé par nom+prénom+date)
          // IMPORTANT: On permet plusieurs athlètes avec le même email car une personne peut
          // inscrire plusieurs participants (ex: parent inscrivant ses enfants)
          if (!athleteId) {
            // Créer un nouvel athlète
            console.log(`➕ Création nouvel athlète: ${email} - ${firstName} ${lastName} (${birthdate})`);
            const { data: newAthlete, error: athleteError } = await supabase
              .from('athletes')
              .insert({
                email: athleteData.email,
                first_name: athleteData.first_name,
                last_name: athleteData.last_name,
                gender: athleteData.gender,
                birthdate: athleteData.birthdate,
                nationality: athleteData.nationality,
                phone: athleteData.phone,
                city: athleteData.city,
                postal_code: athleteData.postal_code,
                license_number: athleteData.license_number,
                license_club: athleteData.license_club,
                license_type: athleteData.license_type,
                federation: athleteData.federation,
                league: athleteData.league,
                club_number: athleteData.club_number,
                pps_number: athleteData.pps_number,
                pps_valid_until: athleteData.pps_valid_until,
              })
              .select()
              .single();

            if (athleteError) {
              errors.push(`${athleteData.email}: Erreur création athlète - ${athleteError.message}`);
              continue;
            }
            athleteId = newAthlete.id;
          }

          // Préparer les notes avec les informations d'équipe et certificat médical
          let notesText = '';
          if (athleteData.medical_certificate_date) {
            notesText += `Certificat médical: ${athleteData.medical_certificate_date}\n`;
          }
          if (teamData.team_name) {
            notesText += `Équipe: ${teamData.team_name}\n`;
          }
          if (teamData.team_type) {
            const teamTypeLabels: { [key: string]: string } = {
              'M': 'Équipe Hommes',
              'F': 'Équipe Femmes',
              'X': 'Équipe Mixte',
              'male': 'Équipe Hommes',
              'female': 'Équipe Femmes',
              'mixed': 'Équipe Mixte',
              'homme': 'Équipe Hommes',
              'femme': 'Équipe Femmes',
              'mixte': 'Équipe Mixte',
            };
            const teamTypeLabel = teamTypeLabels[teamData.team_type.toLowerCase()] || `Type: ${teamData.team_type}`;
            notesText += `${teamTypeLabel}\n`;
          }
          if (row.notes || row.remarques || row.commentaires) {
            notesText += row.notes || row.remarques || row.commentaires;
          }

          // Insérer l'inscription
          const entryAmount = parseFloat(row.amount || row.tarif || row['Montant payé'] || row.tarif_inscription || row.montant || '0');
          const { data: newEntry, error: insertError } = await supabase
            .from('entries')
            .insert({
              athlete_id: athleteId,
              event_id: selectedEventId,
              race_id: selectedRaceId,
              organizer_id: event.organizer_id,
              category: row.category || row.categorie || 'SE',
              source: 'bulk_import',
              status: 'confirmed',
              bib_number: row.bib_number || row.num_dossard || row['N° dossard'] || row.dossard ? parseInt(row.bib_number || row.num_dossard || row['N° dossard'] || row.dossard) : null,
              notes: notesText.trim() || null,
              created_by: user.id,
              created_by_type: 'timepulse_staff',
            })
            .select()
            .single();

          if (insertError) {
            // Gestion spécifique de l'erreur de doublon
            if (insertError.message?.includes('entries_unique_athlete_race')) {
              console.error(`❌ DOUBLON NON DÉTECTÉ: ${firstName} ${lastName} (athlete_id: ${athleteId}, race_id: ${selectedRaceId})`);
              errors.push(`${email} (${firstName} ${lastName}): Doublon détecté lors de l'insertion - athlète déjà inscrit`);
              skipped++;
            } else {
              errors.push(`${email}: ${insertError.message}`);
            }
            continue;
          }

          // Importer les options (temps de référence, taille t-shirt, etc.)
          const optionsToImport: any[] = [];

          for (const [key, value] of Object.entries(row)) {
            if (!value) continue;

            const normalizedKey = key.toLowerCase();
            let optionPrice = 0;

            // Chercher le prix de l'option dans une colonne dédiée
            const priceKey = `${key}_prix`;
            const priceValue = row[priceKey] || row[`${key}_price`] || row[`prix_${key}`];
            if (priceValue) {
              optionPrice = Math.round(parseFloat(priceValue) * 100); // Convertir en centimes
            }

            // Détection des colonnes d'options
            if (normalizedKey.includes('temps') || normalizedKey.includes('reference') || normalizedKey.includes('time')) {
              const option = optionsMap.get('temps de référence') || optionsMap.get('temps reference') || optionsMap.get('reference time');
              if (option) {
                optionsToImport.push({
                  registration_id: newEntry.id,
                  option_id: option.id,
                  value: String(value),
                  quantity: 1,
                  price_paid_cents: optionPrice || option.price_cents || 0
                });
              }
            }

            if (normalizedKey.includes('taille') || normalizedKey.includes('t-shirt') || normalizedKey.includes('tshirt') || normalizedKey.includes('size')) {
              const option = optionsMap.get('taille t-shirt') || optionsMap.get('taille tshirt') || optionsMap.get('t-shirt size');
              if (option) {
                // Chercher un choix correspondant à la valeur
                let choiceId = null;
                let choicePrice = optionPrice;

                if (option.race_option_choices && option.race_option_choices.length > 0) {
                  const matchingChoice = option.race_option_choices.find(
                    (c: any) => c.name.toLowerCase() === String(value).toLowerCase()
                  );
                  if (matchingChoice) {
                    choiceId = matchingChoice.id;
                    choicePrice = matchingChoice.price_cents || option.price_cents || 0;
                  }
                }

                optionsToImport.push({
                  registration_id: newEntry.id,
                  option_id: option.id,
                  choice_id: choiceId,
                  value: String(value),
                  quantity: 1,
                  price_paid_cents: choicePrice
                });
              }
            }

            if (normalizedKey.includes('commentaire') || normalizedKey.includes('comment') || normalizedKey.includes('note')) {
              const option = optionsMap.get('commentaire') || optionsMap.get('commentaires') || optionsMap.get('notes');
              if (option) {
                optionsToImport.push({
                  registration_id: newEntry.id,
                  option_id: option.id,
                  value: String(value),
                  quantity: 1,
                  price_paid_cents: optionPrice || 0
                });
              }
            }
          }

          // Insérer les options si présentes
          if (optionsToImport.length > 0) {
            await supabase
              .from('registration_options')
              .insert(optionsToImport);
          }

          // Créer l'entrée de paiement si un montant est spécifié
          if (entryAmount > 0) {
            await supabase
              .from('entry_payments')
              .insert({
                entry_id: newEntry.id,
                payment_status: 'paid',
                amount_paid: entryAmount,
                payment_method: 'import',
                payment_date: new Date().toISOString(),
              });
            console.log(`💰 Paiement enregistré: ${entryAmount}€`);
          }

          imported++;
          console.log(`✅ Inscription créée pour ${email}:`, newEntry.id);
        } catch (err: any) {
          console.error(`❌ Erreur pour ${email}:`, err);
          errors.push(`${email}: ${err.message}`);
        }
      }

      console.log(`📊 Résumé import: ${imported} importés, ${skipped} ignorés, ${errors.length} erreurs`);

      // Recalculer les catégories FFA si la course est affiliée FFA
      console.log('🔄 Vérification des catégories FFA...');
      await recalculateFFACategories(selectedEventId, selectedRaceId);

      setSuccess(`Import terminé : ${imported} inscriptions importées, ${skipped} doublons ignorés. Catégories FFA recalculées.`);
      if (errors.length > 0) {
        setError(`${errors.length} erreurs : ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Import CSV/Excel
              </h1>
              <p className="text-slate-600">
                Importez vos inscriptions depuis l'ancien site Timepulse.fr
              </p>
            </div>
            <FileSpreadsheet className="h-12 w-12 text-blue-600" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Comment utiliser cet outil :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Exportez vos inscriptions depuis l'ancien site en format CSV</li>
                  <li>Téléchargez le fichier CSV ci-dessous</li>
                  <li>Prévisualisez les données détectées</li>
                  <li>Sélectionnez l'événement et l'épreuve de destination</li>
                  <li>Validez l'import</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-100 rounded-md border border-blue-300">
                  <p className="font-semibold text-blue-900 mb-1">⚠️ Gestion automatique :</p>
                  <ul className="text-xs space-y-1 text-blue-900">
                    <li><strong>• Doublons d'emails acceptés :</strong> Permet d'inscrire plusieurs personnes avec le même email (ex: parent inscrivant ses enfants)</li>
                    <li><strong>• Détection des doublons :</strong> Seuls les vrais doublons (même nom + prénom + date de naissance) sont ignorés</li>
                    <li><strong>• Catégories FFA :</strong> Les catégories FFA seront automatiquement recalculées après l'import basées sur la date de l'événement</li>
                  </ul>
                </div>
                <p className="mt-3 font-semibold">Colonnes de base acceptées :</p>
                <p className="text-xs mt-1 mb-2">
                  <strong>Identité :</strong> email, first_name/prenom, last_name/nom, gender/sexe (M/F/H/Homme/Femme), birth_date/birthdate/naissance<br />
                  <strong>Contact :</strong> phone/telephone/mobile/tel, city/ville, postal_code/zip/cp<br />
                  <strong>Nationalité :</strong> nationality/nationalite (code ISO 3 lettres, ex: FRA)<br />
                  <strong>Licence :</strong> license_number/num_licence, license_club/club, license_type/type_licence<br />
                  <strong>Fédération :</strong> federation, league/ligue, club_number/num_club<br />
                  <strong>PPS et Certificat :</strong> pps_number/pps/num_pps, medical_certificate_date/date_certificat/certificat_medical<br />
                  <strong>Équipe :</strong> team_name/equipe/nom_equipe, team_type/type_equipe (M/F/X/Homme/Femme/Mixte)<br />
                  <strong>Course :</strong> bib_number/num_dossard, category/categorie, amount/tarif/montant, notes/remarques/commentaires
                </p>
                <p className="mt-2 font-semibold">Options acceptées (détection automatique) :</p>
                <p className="text-xs mt-1">
                  <strong>Temps de référence :</strong> colonnes contenant "temps", "reference" ou "time"<br />
                  <strong>Taille T-shirt :</strong> colonnes contenant "taille", "t-shirt", "tshirt" ou "size"<br />
                  <strong>Commentaires :</strong> colonnes contenant "commentaire", "comment" ou "note"<br />
                  <strong>Prix des options :</strong> ajoutez "_prix" ou "_price" après le nom (ex: taille_tshirt_prix)<br />
                  <span className="text-blue-900 italic">Les options doivent d'abord être créées dans la configuration de l'épreuve</span>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Erreur</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Succès</p>
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fichier CSV/Excel
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center px-6 py-12 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">
                      {file ? file.name : 'Cliquez pour télécharger un fichier CSV'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Format accepté: .csv
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {previewData && (
              <div className="border border-slate-200 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Aperçu des données
                  </h3>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {previewData.stats.total}
                    </div>
                    <div className="text-sm text-slate-600">lignes détectées</div>
                  </div>

                  {importing && importProgress.total > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">
                          Import en cours...
                        </span>
                        <span className="text-sm font-bold text-blue-600">
                          {importProgress.current} / {importProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-blue-600 h-3 transition-all duration-300 ease-out"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-blue-700 mt-2 text-center">
                        {Math.round((importProgress.current / importProgress.total) * 100)}% terminé
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Colonnes détectées:</p>
                    <div className="flex flex-wrap gap-2">
                      {previewData.headers.map((header, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700"
                        >
                          {header}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Assurez-vous qu'une colonne "email" ou similaire est présente
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-2">Sélectionner la destination</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1">Événement</label>
                          <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full px-3 py-2 border border-orange-300 rounded bg-white text-slate-900"
                            disabled={loadingEvents}
                          >
                            <option value="">
                              {loadingEvents ? 'Chargement...' : events.length === 0 ? 'Aucun événement disponible' : 'Sélectionner...'}
                            </option>
                            {events.map((event) => (
                              <option key={event.id} value={event.id}>
                                {event.name}
                              </option>
                            ))}
                          </select>
                          {loadingEvents && (
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Chargement des événements...
                            </p>
                          )}
                          {!loadingEvents && events.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              Aucun événement trouvé
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Épreuve</label>
                          <select
                            value={selectedRaceId}
                            onChange={(e) => setSelectedRaceId(e.target.value)}
                            className="w-full px-3 py-2 border border-orange-300 rounded bg-white text-slate-900"
                            disabled={!selectedEventId || races.length === 0}
                          >
                            <option value="">
                              {!selectedEventId ? 'Sélectionnez d\'abord un événement' : races.length === 0 ? 'Aucune épreuve disponible' : 'Sélectionner...'}
                            </option>
                            {races.map((race) => (
                              <option key={race.id} value={race.id}>
                                {race.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          {previewData.headers.map((header, index) => (
                            <th key={index} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {previewData.rows.slice(0, 50).map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            {previewData.headers.map((header, colIndex) => (
                              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewData.stats.total > 50 && (
                    <p className="text-sm text-slate-600 text-center mt-4">
                      Affichage des 50 premières lignes sur {previewData.stats.total}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    onClick={handleImport}
                    disabled={importing || !selectedEventId || !selectedRaceId}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center text-lg font-semibold"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Importer {previewData.stats.total} inscriptions
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
