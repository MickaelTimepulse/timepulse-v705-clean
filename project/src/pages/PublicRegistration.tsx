import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PublicRegistrationForm from '../components/PublicRegistrationForm';
import { CreditCard, Check, AlertCircle, Facebook, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EmailService, RegistrationConfirmationData } from '../lib/email-service';
import { getBackgroundImageByType } from '../lib/background-images';

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

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    if (!eventId) return;

    const { data } = await supabase
      .from('events')
      .select('name, start_date, location_city, slug')
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
        organizerEmail: organizer?.email
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

  const handleRegistrationComplete = (data: any) => {
    setRegistrationData(data);
    setShowPayment(true);
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

      // Calculer le montant total
      const totalAmountCents = registrationData.total_price_cents + registrationData.commission_cents;

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
        await supabase.rpc('log_registration_attempt', {
          p_ip_address: null,
          p_session_id: sessionId,
          p_user_agent: navigator.userAgent,
          p_race_id: registrationData.race_id,
          p_event_id: registrationData.event_id,
          p_status: attemptStatus,
          p_error_code: errorCode,
          p_error_message: errorMessage || err.message,
          p_response_time_ms: responseTime
        }).catch(logErr => console.error('Erreur logging:', logErr));
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
          <PublicRegistrationForm
            eventId={eventId || ''}
            organizerId=""
            onComplete={handleRegistrationComplete}
            preselectedRaceId={preselectedRaceId || undefined}
            initialData={registrationData}
          />
        </div>
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
            onClick={() => setShowPayment(false)}
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
                <span className="text-gray-600">Montant de l'inscription:</span>
                <span className="font-medium">
                  {(registrationData.total_price_cents / 100).toFixed(2)}€
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de service:</span>
                <span className="font-medium">
                  {(registrationData.commission_cents / 100).toFixed(2)}€
                </span>
              </div>
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
