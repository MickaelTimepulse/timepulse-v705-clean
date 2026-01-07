import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PublicRegistrationForm from '../components/PublicRegistrationForm';
import RelayTeamRegistrationForm from '../components/RelayTeamRegistrationForm';
import CartWidget from '../components/CartWidget';
import { CreditCard, Check, AlertCircle, Facebook, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EmailService, RegistrationConfirmationData } from '../lib/email-service';
import { getBackgroundImageByType } from '../lib/background-images';
import { calculateFFACategory } from '../lib/category-calculator';

export default function PublicRegistration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedRaceId = searchParams.get('race');
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [isRelayRace, setIsRelayRace] = useState(false);
  const [sessionToken] = useState(() => {
    let token = sessionStorage.getItem('cart_session_token');
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem('cart_session_token', token);
    }
    return token;
  });

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  useEffect(() => {
    if (preselectedRaceId) {
      checkIfRelayRace(preselectedRaceId);
    }
  }, [preselectedRaceId]);

  const checkIfRelayRace = async (raceId: string) => {
    try {
      // Vérifier s'il y a des segments de relais pour cette course
      const { data, error } = await supabase
        .from('relay_segments')
        .select('id')
        .eq('race_id', raceId)
        .limit(1);

      if (data && data.length > 0) {
        setIsRelayRace(true);
      } else {
        setIsRelayRace(false);
      }
    } catch (err) {
      console.error('Error checking if relay race:', err);
      setIsRelayRace(false);
    }
  };

  const loadEventData = async () => {
    if (!eventId) return;

    const { data } = await supabase
      .from('events')
      .select('name, start_date, city, slug')
      .eq('id', eventId)
      .single();

    if (data) {
      setEventData(data);
    }
  };

  const sendConfirmationEmail = async (entryId: string, registrationData: any) => {
    try {
      console.log('🔍 [EMAIL CONFIRM] Start - entry_id:', entryId);

      const { data: entryData, error: entryError } = await supabase
        .from('entries')
        .select(`
          *,
          athlete:athletes(*),
          race:races(name, race_date),
          event:events(name, organizer_id, organizers(name, email))
        `)
        .eq('id', entryId)
        .single();

      console.log('📦 [EMAIL CONFIRM] Entry data loaded:', {
        hasData: !!entryData,
        hasError: !!entryError,
        error: entryError
      });

      if (entryError || !entryData) {
        console.error('❌ [EMAIL CONFIRM] Erreur récupération données inscription:', entryError);
        return;
      }

      const athlete = entryData.athlete as any;
      const race = entryData.race as any;
      const event = entryData.event as any;
      const organizer = event.organizers as any;

      let registrationStatus: 'confirmed' | 'pending_documents' | 'documents_invalid' = 'confirmed';
      let statusMessage = '';
      let requiresPPSUpdate = false;

      const isNonLicencie = athlete.license_type?.includes('Non licencié');
      if (isNonLicencie && athlete.pps_number) {
        const ppsExpiryDate = new Date(athlete.pps_expiry_date);
        const raceDate = new Date(race.race_date);
        const threeMonthsBeforeRace = new Date(raceDate);
        threeMonthsBeforeRace.setMonth(threeMonthsBeforeRace.getMonth() - 3);

        if (ppsExpiryDate < threeMonthsBeforeRace) {
          registrationStatus = 'pending_documents';
          statusMessage = 'Votre PSP (Pass Prévention Santé) expire avant l\'année précédant l\'épreuve. Vous devrez fournir un PSP valide.';
          requiresPPSUpdate = true;

          await supabase
            .from('entries')
            .update({
              registration_status: 'pending_documents',
              status_message: statusMessage
            })
            .eq('id', entryId);
        }
      }

      const emailData: RegistrationConfirmationData = {
        athleteFirstName: athlete.first_name,
        athleteLastName: athlete.last_name,
        athleteEmail: athlete.email,
        eventName: event.name,
        raceName: race.name,
        raceDate: new Date(race.race_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        bibNumber: entryData.bib_number,
        registrationStatus,
        statusMessage,
        managementCode: entryData.management_code,
        licenseType: athlete.license_type || 'Non spécifié',
        ppsNumber: athlete.pps_number,
        ppsExpiryDate: athlete.pps_expiry_date ? new Date(athlete.pps_expiry_date).toLocaleDateString('fr-FR') : undefined,
        requiresPPSUpdate,
        amount: entryData.amount ? entryData.amount / 100 : undefined,
        paymentStatus: entryData.payment_status || 'paid',
        organizerName: organizer?.name || 'L\'organisateur',
        organizerEmail: organizer?.email,
        // Ajouter les infos du responsable si inscription de groupe
        isGroupRegistration: entryData.is_group_registration || false,
        registrantName: entryData.registrant_name,
        registrantEmail: entryData.registrant_email
      };

      console.log('📧 [EMAIL CONFIRM] Email data prepared:', {
        athleteEmail: athlete.email,
        eventName: event.name,
        managementCode: entryData.management_code
      });

      const emailService = EmailService.getInstance();
      const htmlContent = emailService.generateRegistrationConfirmationEmail(emailData);

      console.log('📤 [EMAIL CONFIRM] Sending email...');

      const emailResult = await emailService.sendEmailWithAnonymousKey({
        to: athlete.email,
        subject: `Confirmation d'inscription - ${event.name}`,
        html: htmlContent,
        from: 'inscriptions@timepulse.fr',
        fromName: 'Timepulse',
        metadata: {
          type: 'registration_confirmation',
          entry_id: entryId,
          event_id: event.id,
          race_id: race.id,
          athlete_id: athlete.id,
          bib_number: entryData.bib_number
        }
      });

      console.log('📨 [EMAIL CONFIRM] Email result:', emailResult);

      if (emailResult.success) {
        await supabase
          .from('entries')
          .update({ confirmation_email_sent_at: new Date().toISOString() })
          .eq('id', entryId);
        console.log('✅ [EMAIL CONFIRM] Email envoyé avec succès - Message ID:', emailResult.messageId);
      } else {
        console.error('⚠️ [EMAIL CONFIRM] Email non envoyé - Erreur:', emailResult.error);
        console.error('⚠️ [EMAIL CONFIRM] Détails:', emailResult.details);
      }
    } catch (error) {
      console.error('❌ [EMAIL CONFIRM] Exception lors de l\'envoi:', error);
      throw error;
    }
  };

  const sendGroupSummaryEmail = async (entries: any[], registrationData: any) => {
    try {
      console.log('🔍 [EMAIL GROUP SUMMARY] Start');

      // Récupérer les infos de l'événement
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('name, organizers(name, email)')
        .eq('id', registrationData.event_id)
        .single();

      if (eventError || !eventData) {
        console.error('❌ [EMAIL GROUP SUMMARY] Erreur récupération event:', eventError);
        return;
      }

      const event = eventData as any;
      const organizer = event.organizers as any;

      // Préparer le HTML de la liste des participants
      let participantsList = '';
      let totalAmount = 0;

      for (const entry of entries) {
        totalAmount += registrationData.total_price_cents / entries.length;
        participantsList += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <strong>${entry.first_name} ${entry.last_name}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              ${entry.email}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
              ${entry.bib_number ? `#${entry.bib_number}` : '-'}
            </td>
          </tr>
        `;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/timepulse-logo.png`;
      const bgUrl = `${supabaseUrl}/storage/v1/object/public/email-assets/email-header-bg.jpeg`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
          <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

            <!-- Header -->
            <div style="position: relative; padding: 50px 20px; text-align: center; background-image: url('${bgUrl}'); background-size: cover; background-position: center;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(219, 39, 119, 0.92) 0%, rgba(147, 51, 234, 0.92) 100%);"></div>
              <div style="position: relative; z-index: 1;">
                <img src="${logoUrl}" alt="Timepulse" style="height: 70px; max-width: 280px; margin: 0 auto 15px; display: block; filter: brightness(0) invert(1);">
                <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 17px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Récapitulatif Inscription Groupe</p>
              </div>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">

              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Bonjour ${registrationData.registrant_name},</h2>

              <div style="background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0;">
                ✓ INSCRIPTION GROUPE CONFIRMÉE
              </div>

              <p style="margin: 20px 0; font-size: 16px;">
                Votre inscription de groupe pour <strong>${event.name}</strong> a été confirmée avec succès !
              </p>

              <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0;">📊 Résumé</h3>
                <p style="margin: 5px 0;"><strong>Nombre de participants :</strong> ${entries.length}</p>
                <p style="margin: 5px 0;"><strong>Montant total payé :</strong> ${(totalAmount / 100).toFixed(2)} €</p>
              </div>

              <h3 style="color: #1f2937; margin: 30px 0 15px 0;">👥 Liste des participants inscrits</h3>

              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Nom</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Email</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Dossard</th>
                  </tr>
                </thead>
                <tbody>
                  ${participantsList}
                </tbody>
              </table>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <h4 style="color: #d97706; margin: 0 0 10px 0;">📧 Emails individuels</h4>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  Chaque participant a reçu un email individuel avec ses informations d'inscription et votre nom en tant que responsable du groupe.
                </p>
              </div>

              <!-- Organizer Contact -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <h4 style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Organisateur</h4>
                <p style="margin: 0; color: #1f2937; font-weight: 500;">${organizer?.name || 'L\'organisateur'}</p>
                ${organizer?.email ? `<p style="margin: 5px 0 0 0; color: #6b7280;"><a href="mailto:${organizer.email}" style="color: #3b82f6; text-decoration: none;">${organizer.email}</a></p>` : ''}
              </div>

            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Timepulse - Votre partenaire chronométrage
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>

          </div>
        </body>
        </html>
      `;

      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendEmailWithAnonymousKey({
        to: registrationData.registrant_email,
        subject: `Récapitulatif inscription groupe - ${event.name}`,
        html: htmlContent,
        from: 'inscriptions@timepulse.fr',
        fromName: 'Timepulse',
        metadata: {
          type: 'group_registration_summary',
          event_id: registrationData.event_id,
          registration_group_id: registrationData.registration_group_id,
          participants_count: entries.length
        }
      });

      console.log('📨 [EMAIL GROUP SUMMARY] Email result:', emailResult);

      if (emailResult.success) {
        console.log('✅ [EMAIL GROUP SUMMARY] Email envoyé avec succès');
      } else {
        console.error('⚠️ [EMAIL GROUP SUMMARY] Email non envoyé - Erreur:', emailResult.error);
      }
    } catch (error) {
      console.error('❌ [EMAIL GROUP SUMMARY] Exception:', error);
      throw error;
    }
  };

  const handleRegistrationComplete = (data: any) => {
    setRegistrationData(data);
    setShowPayment(true);
  };

  const handleCartCheckout = async (cartId: string) => {
    try {
      console.log('🛒 [CART CHECKOUT] Début checkout pour cart:', cartId);

      // Charger les données du panier
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (cartError || !cart) {
        console.error('❌ Erreur chargement cart:', cartError);
        alert('Erreur lors du chargement du panier');
        return;
      }

      // Préparer les données pour le paiement
      // Note: cart.total_price_cents INCLUT DÉJÀ les commissions
      const cartData = {
        event_id: eventId,
        cart_id: cartId,
        session_token: cart.session_token,
        total_price_cents: cart.total_price_cents,
        commission_cents: 0, // Déjà inclus dans total_price_cents
        is_cart_checkout: true
      };

      console.log('💳 [CART CHECKOUT] Données paiement:', cartData);
      setRegistrationData(cartData);
      setShowPayment(true);
    } catch (error) {
      console.error('❌ [CART CHECKOUT] Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handlePayment = async (method: 'card' | 'apple_pay' | 'google_pay') => {
    if (!registrationData) return;

    setProcessing(true);
    setError('');

    const startTime = Date.now();
    let attemptStatus = 'success';
    let errorCode = null;
    let errorMessage = null;

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { supabase } = await import('../lib/supabase');

      // Récupérer l'IP et créer un session_id
      const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);

      // Vérifier le rate limit AVANT de tenter l'inscription
      const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
        'check_rate_limit',
        {
          p_ip_address: null, // L'IP sera récupérée côté serveur via edge function si nécessaire
          p_session_id: sessionId,
          p_max_attempts: 5,
          p_window_minutes: 10
        }
      );

      if (rateLimitError) {
        console.error('Erreur vérification rate limit:', rateLimitError);
      }

      if (rateLimitCheck?.is_limited) {
        attemptStatus = 'rate_limited';
        errorCode = 'rate_limit_exceeded';
        errorMessage = `Trop de tentatives. Veuillez réessayer dans ${rateLimitCheck.seconds_until_retry} secondes.`;
        throw new Error(errorMessage);
      }

      // Calculer le montant total
      const totalAmountCents = registrationData.total_price_cents + registrationData.commission_cents;

      // PAIEMENT DEPUIS LE PANIER
      if (registrationData.is_cart_checkout) {
        console.log('🛒 [CART] Paiement depuis le panier détecté');
        console.log('🛒 [CART] Cart ID:', registrationData.cart_id);
        console.log('🛒 [CART] Montant total:', totalAmountCents, 'cents');

        // TODO: Implémenter la finalisation du panier
        // Pour l'instant, afficher juste un message
        alert('Le paiement depuis le panier n\'est pas encore implémenté. Les inscriptions sont enregistrées dans votre panier.');
        setSuccess(true);
        setProcessing(false);
        return;
      }

      // INSCRIPTION GROUPÉE
      if (registrationData.is_group_registration && registrationData.participants) {
        console.log('🎯 [GROUP] Inscription groupée détectée');
        console.log('🎯 [GROUP] Nombre participants:', registrationData.participants.length);
        console.log('🎯 [GROUP] Organisateur:', registrationData.registrant_name, registrationData.registrant_email);

        const { data: result, error: functionError } = await supabase.rpc(
          'register_group_with_quota_check',
          {
            p_race_id: registrationData.race_id,
            p_event_id: registrationData.event_id,
            p_organizer_id: registrationData.organizer_id,
            p_registration_group_id: registrationData.registration_group_id,
            p_registrant_name: registrationData.registrant_name,
            p_registrant_email: registrationData.registrant_email,
            p_registrant_phone: registrationData.registrant_phone,
            p_participants: registrationData.participants,
            p_total_amount_cents: totalAmountCents,
          }
        );

        if (functionError) throw functionError;

        if (!result.success) {
          if (result.error === 'already_registered') {
            attemptStatus = 'already_registered';
            errorCode = 'already_registered';
            errorMessage = result.message;
            throw new Error(errorMessage);
          } else if (result.error === 'race_full') {
            attemptStatus = 'quota_exceeded';
            errorCode = 'race_full';
            errorMessage = result.message;
            throw new Error(errorMessage);
          } else if (result.error === 'registration_not_open') {
            attemptStatus = 'failed';
            errorCode = 'registration_not_open';
            errorMessage = 'Les inscriptions ne sont pas encore ouvertes pour cet événement.';
            throw new Error(errorMessage);
          } else if (result.error === 'registration_closed') {
            attemptStatus = 'failed';
            errorCode = 'registration_closed';
            errorMessage = 'Les inscriptions sont fermées pour cet événement.';
            throw new Error(errorMessage);
          } else if (result.error === 'registration_not_configured') {
            attemptStatus = 'failed';
            errorCode = 'registration_not_configured';
            errorMessage = 'Les dates d\'inscription ne sont pas configurées. Contactez l\'organisateur.';
            throw new Error(errorMessage);
          } else {
            attemptStatus = 'failed';
            errorCode = result.error || 'unknown_error';
            errorMessage = result.message || 'Une erreur est survenue lors de l\'inscription groupée.';
            throw new Error(errorMessage);
          }
        }

        console.log('✅ [GROUP] Inscription groupée réussie!');
        console.log('✅ [GROUP] Participants inscrits:', result.participants_registered);
        console.log('✅ [GROUP] Places restantes:', result.places_remaining);
        console.log('✅ [GROUP] Entries créées:', result.entries);

        // Logger la tentative réussie
        const responseTime = Date.now() - startTime;
        await supabase.rpc('log_registration_attempt', {
          p_ip_address: null,
          p_session_id: sessionId,
          p_user_agent: navigator.userAgent,
          p_race_id: registrationData.race_id,
          p_event_id: registrationData.event_id,
          p_status: 'success',
          p_error_code: null,
          p_error_message: null,
          p_response_time_ms: responseTime
        });

        // Envoyer les emails de confirmation pour chaque participant
        try {
          console.log('📧 [GROUP] Envoi emails confirmation individuels...');
          const entries = JSON.parse(result.entries);
          for (const entry of entries) {
            console.log('📧 [GROUP] Email pour:', entry.first_name, entry.last_name, '(entry_id:', entry.entry_id, ')');
            await sendConfirmationEmail(entry.entry_id, registrationData);
          }
          console.log('✅ [GROUP] Tous les emails individuels envoyés');

          // Envoyer un email récapitulatif au responsable avec TOUS les participants
          console.log('📧 [GROUP] Envoi email récapitulatif au responsable...');
          await sendGroupSummaryEmail(entries, registrationData);
          console.log('✅ [GROUP] Email récapitulatif envoyé au responsable');
        } catch (emailError) {
          console.error('❌ [GROUP] Erreur envoi emails:', emailError);
        }

        setSuccess(true);
        return;
      }

      // INSCRIPTION RELAIS/ÉQUIPE
      if (registrationData.is_relay_team && registrationData.members) {
        console.log('🏃‍♂️ [RELAY] Inscription équipe relais détectée');
        console.log('🏃‍♂️ [RELAY] Nombre de membres:', registrationData.members.length);
        console.log('🏃‍♂️ [RELAY] Nom équipe:', registrationData.name);
        console.log('🏃‍♂️ [RELAY] Prix total:', totalAmountCents, 'cents');

        try {
          // Pour chaque membre, créer un athlète et une entrée
          const entries = [];

          for (const member of registrationData.members) {
            // Créer/récupérer l'athlète
            // Chercher UNIQUEMENT par identité (nom + prénom + date naissance)
            // L'email peut être en double (cas où le responsable utilise son email pour toute l'équipe)
            const { data: existingAthlete } = await supabase
              .from('athletes')
              .select('id, email')
              .ilike('first_name', member.firstName)
              .ilike('last_name', member.lastName)
              .eq('birthdate', member.birthDate)
              .maybeSingle();

            let athleteId;

            if (existingAthlete) {
              athleteId = existingAthlete.id;
              console.log(`♻️ [RELAY] Athlète existant trouvé pour ${member.firstName} ${member.lastName}`);

              // Mettre à jour les infos de l'athlète
              const updateData: any = {
                first_name: member.firstName,
                last_name: member.lastName,
                phone: member.phone,
                gender: member.gender,
                birthdate: member.birthDate,
                nationality: member.nationality || 'FRA',
                license_number: member.licenseId || null,
                license_club: member.licenseClub || null,
                license_type: member.licenseType || null,
              };

              // Mettre à jour l'email seulement s'il est fourni et différent
              if (member.email && member.email !== existingAthlete.email) {
                updateData.email = member.email;
              }

              // Pour respecter la contrainte check_pps_coherence:
              // Soit les deux sont NULL, soit les deux sont NOT NULL
              // Comme on ne gère pas la date d'expiration dans ce formulaire, on ne met PAS le PPS
              updateData.pps_number = null;
              updateData.pps_valid_until = null;

              await supabase
                .from('athletes')
                .update(updateData)
                .eq('id', athleteId);
            } else {
              // Créer un nouvel athlète
              console.log(`➕ [RELAY] Création nouvel athlète ${member.firstName} ${member.lastName}`);

              const insertData: any = {
                first_name: member.firstName,
                last_name: member.lastName,
                email: member.email,
                phone: member.phone,
                gender: member.gender,
                birthdate: member.birthDate,
                nationality: member.nationality || 'FRA',
                license_number: member.licenseId || null,
                license_club: member.licenseClub || null,
                license_type: member.licenseType || null,
              };

              // Pour respecter la contrainte check_pps_coherence:
              // Soit les deux sont NULL, soit les deux sont NOT NULL
              // Comme on ne gère pas la date d'expiration dans ce formulaire, on ne met PAS le PPS
              insertData.pps_number = null;
              insertData.pps_valid_until = null;

              const { data: newAthlete, error: athleteError } = await supabase
                .from('athletes')
                .insert(insertData)
                .select()
                .single();

              if (athleteError) {
                console.error('❌ [RELAY] Erreur création athlète:', athleteError);
                throw athleteError;
              }
              athleteId = newAthlete.id;
            }

            // Générer un code de gestion unique
            const managementCode = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();

            // Récupérer la date de l'événement pour calculer la catégorie
            const { data: raceData } = await supabase
              .from('races')
              .select('race_date')
              .eq('id', registrationData.race_id)
              .single();

            const eventDate = raceData?.race_date ? new Date(raceData.race_date) : new Date();
            const category = calculateFFACategory(member.birthDate, eventDate);

            // Créer l'entrée
            // Vérifier si l'athlète est déjà inscrit à cette course
            const { data: existingEntry } = await supabase
              .from('entries')
              .select('id, management_code')
              .eq('athlete_id', athleteId)
              .eq('race_id', registrationData.race_id)
              .maybeSingle();

            let entry;

            if (existingEntry) {
              // Si c'est le même code de gestion, c'est un retry (réutiliser l'entrée)
              if (existingEntry.management_code === managementCode) {
                console.log(`⚠️ [RELAY] Entrée existante réutilisée pour ${member.firstName} ${member.lastName}`);
                entry = existingEntry;
              } else {
                // Différent code de gestion = athlète déjà inscrit dans une autre équipe
                throw new Error(`${member.firstName} ${member.lastName} est déjà inscrit(e) à cette course dans une autre équipe.`);
              }
            } else {
              // Créer une nouvelle entrée
              const { data: newEntry, error: entryError } = await supabase
                .from('entries')
                .insert({
                  athlete_id: athleteId,
                  race_id: registrationData.race_id,
                  event_id: registrationData.event_id,
                  organizer_id: registrationData.organizer_id,
                  category: category || 'SE',
                  status: 'confirmed',
                  registration_status: 'confirmed',
                  payment_status: 'paid',
                  source: 'online',
                  amount: totalAmountCents / registrationData.members.length,
                  management_code: managementCode,
                  registration_date: new Date().toISOString(),
                })
                .select()
                .single();

              if (entryError) throw entryError;
              entry = newEntry;
            }

            // Sauvegarder les options sélectionnées (tailles de t-shirt, etc.)
            if (member.selectedOptions && Object.keys(member.selectedOptions).length > 0) {
              console.log(`📋 [RELAY OPTIONS] Sauvegarde options pour ${member.firstName} ${member.lastName}:`, member.selectedOptions);

              const registrationOptions = Object.entries(member.selectedOptions).map(([optionId, optionData]: [string, any]) => ({
                entry_id: entry.id,
                option_id: optionId,
                choice_id: optionData.choice_id || null,
                value: optionData.value || null,
                quantity: optionData.quantity || 1,
                price_paid_cents: optionData.price_paid_cents || 0,
              }));

              const { error: optionsError } = await supabase
                .from('registration_options')
                .insert(registrationOptions);

              if (optionsError) {
                console.error(`❌ [RELAY OPTIONS] Erreur sauvegarde options:`, optionsError);
                // Ne pas bloquer l'inscription si les options ne peuvent pas être sauvegardées
              } else {
                console.log(`✅ [RELAY OPTIONS] Options sauvegardées:`, registrationOptions.length);
              }
            }

            entries.push({
              entry_id: entry.id,
              athlete_id: athleteId,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email,
            });
          }

          console.log('✅ [RELAY] Tous les membres inscrits:', entries.length);

          // Créer l'équipe dans la table teams
          console.log('👥 [RELAY] Création de l\'équipe:', registrationData.name);

          // Déterminer le type d'équipe simple (homme/femme/mixte) depuis la catégorie
          let teamType = 'mixte';
          if (registrationData.team_category) {
            const category = registrationData.team_category.toLowerCase();
            if (category.includes('homme') && !category.includes('femme')) {
              teamType = 'homme';
            } else if (category.includes('femme') && !category.includes('homme')) {
              teamType = 'femme';
            }
          }

          // Préparer les métadonnées avec le contact d'urgence
          const metadata: any = {
            registration_source: 'online',
            event_id: registrationData.event_id,
            organizer_id: registrationData.organizer_id,
          };

          if (registrationData.emergency_contact) {
            metadata.emergency_contact = {
              name: registrationData.emergency_contact.name,
              phone: registrationData.emergency_contact.phone,
              relation: registrationData.emergency_contact.relation,
            };
          }

          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert({
              name: registrationData.name,
              race_id: registrationData.race_id,
              team_type: teamType,
              status: 'complete',
              payment_mode: 'team',
              min_members: registrationData.members.length,
              max_members: registrationData.members.length,
              current_members_count: registrationData.members.length,
              payment_status: 'paid',
              total_amount: totalAmountCents / 100,
              metadata: metadata,
            })
            .select()
            .single();

          if (teamError) {
            console.error('❌ [RELAY] Erreur création équipe:', teamError);
            throw teamError;
          }

          console.log('✅ [RELAY] Équipe créée avec ID:', teamData.id);

          // Créer les liens team_members pour chaque entrée
          const teamMembers = entries.map((entry, index) => ({
            team_id: teamData.id,
            entry_id: entry.entry_id,
            role: index === 0 ? 'captain' : 'member',
            position: index + 1,
            status: 'validated',
          }));

          const { error: membersError } = await supabase
            .from('team_members')
            .insert(teamMembers);

          if (membersError) {
            console.error('❌ [RELAY] Erreur création team_members:', membersError);
            throw membersError;
          }

          console.log('✅ [RELAY] Liens team_members créés');

          // Envoyer les emails de confirmation
          try {
            for (const entry of entries) {
              console.log('📧 [RELAY] Email pour:', entry.firstName, entry.lastName);
              await sendConfirmationEmail(entry.entry_id, registrationData);
            }
            console.log('✅ [RELAY] Tous les emails envoyés');

            // Envoyer un email récapitulatif au responsable
            await sendGroupSummaryEmail(entries, registrationData);
          } catch (emailError) {
            console.error('❌ [RELAY] Erreur envoi emails:', emailError);
          }

          setSuccess(true);
          return;
        } catch (err: any) {
          console.error('❌ [RELAY] Erreur inscription relais:', err);
          throw err;
        }
      }

      // INSCRIPTION SIMPLE (code existant)
      console.log('👤 [SIMPLE] Inscription simple');

      // Vérifier que athlete_data existe
      if (!registrationData.athlete_data) {
        throw new Error('Données d\'inscription invalides. Veuillez réessayer.');
      }

      // Préparer les données de l'athlète
      const athleteData = {
        first_name: registrationData.athlete_data.first_name,
        last_name: registrationData.athlete_data.last_name,
        birthdate: registrationData.athlete_data.birthdate,
        gender: registrationData.athlete_data.gender,
        email: registrationData.athlete_data.email,
        phone: registrationData.athlete_data.phone,
        nationality: registrationData.athlete_data.country || 'FR',
        license_number: registrationData.athlete_data.license_number,
        license_club: registrationData.athlete_data.license_club,
      };

      // Préparer les données de l'inscription
      const entryData = {
        status: 'confirmed',
        source: 'online',
        session_token: null,
        amount_cents: totalAmountCents,
        is_refundable: true,
      };

      // Préparer les options si présentes
      let optionsArray = null;
      if (registrationData.selected_options && Object.keys(registrationData.selected_options).length > 0) {
        optionsArray = Object.entries(registrationData.selected_options).map(([optionId, selection]: [string, any]) => ({
          option_id: optionId,
          price_cents: 0,
        }));
      }

      // Appeler la fonction PostgreSQL atomique
      const { data: result, error: functionError } = await supabase.rpc(
        'register_athlete_with_quota_check',
        {
          p_race_id: registrationData.race_id,
          p_event_id: registrationData.event_id,
          p_organizer_id: registrationData.organizer_id,
          p_athlete_data: athleteData,
          p_entry_data: entryData,
          p_options: optionsArray,
        }
      );

      if (functionError) throw functionError;

      // Vérifier le résultat
      if (!result.success) {
        if (result.error === 'already_registered') {
          attemptStatus = 'already_registered';
          errorCode = 'already_registered';
          errorMessage = 'already_registered';
          // Passer le prénom pour le message personnalisé
          throw {
            message: errorMessage,
            firstName: result.first_name || registrationData.athlete_data.first_name,
            isAlreadyRegistered: true
          };
        } else if (result.error === 'race_full') {
          attemptStatus = 'quota_exceeded';
          errorCode = 'race_full';
          errorMessage = 'Cette course est complète. Il ne reste plus de places disponibles.';
          throw new Error(errorMessage);
        } else if (result.error === 'registration_not_open') {
          attemptStatus = 'failed';
          errorCode = 'registration_not_open';
          errorMessage = 'Les inscriptions ne sont pas encore ouvertes pour cet événement.';
          throw new Error(errorMessage);
        } else if (result.error === 'registration_closed') {
          attemptStatus = 'failed';
          errorCode = 'registration_closed';
          errorMessage = 'Les inscriptions sont fermées pour cet événement.';
          throw new Error(errorMessage);
        } else if (result.error === 'registration_not_configured') {
          attemptStatus = 'failed';
          errorCode = 'registration_not_configured';
          errorMessage = 'Les dates d\'inscription ne sont pas configurées. Contactez l\'organisateur.';
          throw new Error(errorMessage);
        } else if (result.error === 'race_not_found') {
          attemptStatus = 'failed';
          errorCode = 'race_not_found';
          errorMessage = 'Course non trouvée. Veuillez réessayer.';
          throw new Error(errorMessage);
        } else {
          attemptStatus = 'failed';
          errorCode = result.error || 'unknown_error';
          errorMessage = result.message || 'Une erreur est survenue lors de l\'inscription.';
          throw new Error(errorMessage);
        }
      }

      // Succès : afficher le message avec les places restantes
      console.log(`Inscription réussie ! Places restantes : ${result.places_remaining}`);

      // Logger la tentative réussie
      const responseTime = Date.now() - startTime;
      await supabase.rpc('log_registration_attempt', {
        p_ip_address: null,
        p_session_id: sessionId,
        p_user_agent: navigator.userAgent,
        p_race_id: registrationData.race_id,
        p_event_id: registrationData.event_id,
        p_status: 'success',
        p_error_code: null,
        p_error_message: null,
        p_response_time_ms: responseTime
      });

      // Envoyer l'email de confirmation
      try {
        console.log('📧 Envoi email de confirmation pour entry_id:', result.entry_id);
        await sendConfirmationEmail(result.entry_id, registrationData);
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);

      // Gérer le cas spécial de l'inscription en double
      if (err.isAlreadyRegistered) {
        const firstName = err.firstName || 'Participant';
        setError(`already_registered:${firstName}`);
      } else {
        setError(err.message || 'Une erreur est survenue');
      }

      // Logger la tentative échouée
      const responseTime = Date.now() - startTime;
      const sessionId = sessionStorage.getItem('session_id');

      if (supabase && sessionId) {
        const { error: logError } = await supabase.rpc('log_registration_attempt', {
          p_ip_address: null,
          p_session_id: sessionId,
          p_user_agent: navigator.userAgent,
          p_race_id: registrationData.race_id,
          p_event_id: registrationData.event_id,
          p_status: attemptStatus,
          p_error_code: errorCode,
          p_error_message: errorMessage || err.message,
          p_response_time_ms: responseTime
        });
        if (logError) {
          console.error('Erreur logging:', logError);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    const eventUrl = eventData?.slug
      ? `${window.location.origin}/events/${eventData.slug}`
      : window.location.origin;
    const shareText = eventData
      ? `Je viens de m'inscrire à ${eventData.name} ! Rejoins-moi pour cette aventure sportive 🏃‍♂️`
      : "Je viens de m'inscrire à un événement sportif ! Rejoins-moi !";

    const handleFacebookShare = () => {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
        '_blank',
        'width=600,height=400'
      );
    };

    const handleWhatsAppShare = () => {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + eventUrl)}`,
        '_blank'
      );
    };

    const handleSnapchatShare = () => {
      window.open(
        `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(eventUrl)}`,
        '_blank'
      );
    };

    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Image de fond avec opacité 50% */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${getBackgroundImageByType('running')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.5
          }}
        />
        <div className="max-w-lg w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <Check className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Félicitations ! 🎉
            </h2>

            <p className="text-xl text-gray-700 mb-2">
              Votre inscription est confirmée
            </p>

            <p className="text-gray-600 mb-8">
              Merci pour votre confiance ! Vous allez recevoir un email de confirmation avec tous les détails de votre inscription.
            </p>

            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Partagez avec vos amis !
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Invitez vos amis à vous rejoindre pour vivre cette aventure ensemble
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleFacebookShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="font-medium">Facebook</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={handleSnapchatShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Snap</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate(eventData?.slug ? `/events/${eventData.slug}` : '/')}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 font-semibold text-lg transition"
            >
              Retour à l'événement
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!showPayment) {
    return (
      <div className="min-h-screen relative py-12 px-4">
        {/* Image de fond triathlon HD avec opacité 50% */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?auto=compress&cs=tinysrgb&w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: 0.5
          }}
        />
        <div className="relative z-10">
          {isRelayRace ? (
            <RelayTeamRegistrationForm
              eventId={eventId || ''}
              raceId={preselectedRaceId || ''}
              initialData={registrationData}
              onComplete={handleRegistrationComplete}
              onBack={() => {
                if (eventData?.slug) {
                  navigate(`/events/${eventData.slug}`);
                } else if (eventId) {
                  navigate(`/events/${eventId}`);
                }
              }}
            />
          ) : (
            <PublicRegistrationForm
              eventId={eventId || ''}
              organizerId=""
              onComplete={handleRegistrationComplete}
              preselectedRaceId={preselectedRaceId || undefined}
              initialData={registrationData}
            />
          )}
        </div>
        {/* Widget panier flottant */}
        {eventId && (
          <CartWidget
            eventId={eventId}
            sessionToken={sessionToken}
            onCheckout={handleCartCheckout}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-12 px-4">
      {/* Image de fond TRIATHLON HD avec opacité 50% */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2524739/pexels-photo-2524739.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: 0.5
        }}
      />
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => {
              console.log('🔙 Retour au formulaire avec conservation des données');
              setShowPayment(false);
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour au formulaire</span>
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Paiement sécurisé</h2>

          {error && (
            <>
              {error.startsWith('already_registered:') ? (
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-900 mb-3">
                        Hey {error.split(':')[1]} ! 👋
                      </h3>
                      <p className="text-lg text-blue-800 mb-2">
                        Tu sembles très motivé(e)… au point de vouloir t'inscrire deux fois 😄
                      </p>
                      <p className="text-blue-700 mb-4">
                        Pas besoin, ton inscription est déjà bien enregistrée !
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          On se retrouve sur la course ! 🏃‍♂️
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 mt-4 italic">
                        L'équipe Timepulse
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(eventData?.slug ? `/events/${eventData.slug}` : '/')}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-semibold transition"
                    >
                      Retour à l'événement
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}
            </>
          )}

          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total inscription(s) et option(s):</span>
                <span className="font-medium">
                  {(registrationData.total_price_cents / 100).toFixed(2)}€
                </span>
              </div>
              {registrationData.commission_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de service:</span>
                  <span className="font-medium">
                    {(registrationData.commission_cents / 100).toFixed(2)}€
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-pink-600">
                  <span>Total à payer:</span>
                  <span>
                    {((registrationData.total_price_cents + registrationData.commission_cents) / 100).toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Choisissez votre méthode de paiement</h3>

            <button
              onClick={() => handlePayment('card')}
              disabled={processing}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <CreditCard className="w-6 h-6 text-gray-600" />
              <span className="font-medium">Carte bancaire</span>
            </button>

            <button
              onClick={() => handlePayment('apple_pay')}
              disabled={processing}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">

              </div>
              <span className="font-medium">Apple Pay</span>
            </button>

            <button
              onClick={() => handlePayment('google_pay')}
              disabled={processing}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">G</span>
              </div>
              <span className="font-medium">Google Pay</span>
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Paiement sécurisé par Stripe</p>
            <p className="mt-1">Vos informations bancaires sont protégées</p>
          </div>

          {processing && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Traitement du paiement en cours...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
