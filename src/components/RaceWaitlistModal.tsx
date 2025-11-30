import { useState, useEffect } from 'react';
import { Clock, Users, Mail, X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RaceWaitlistModalProps {
  raceId: string;
  eventId: string;
  raceName: string;
  availability: {
    spots_remaining: number;
    waitlist_count: number;
    total_capacity: number;
    reserved_spots: number;
    confirmed_entries: number;
  };
  onClose: () => void;
  hasBibExchange?: boolean;
}

export default function RaceWaitlistModal({
  raceId,
  eventId,
  raceName,
  availability,
  onClose,
  hasBibExchange = false
}: RaceWaitlistModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    subscribe_to_bib_exchange: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [waitlistInfo, setWaitlistInfo] = useState<{
    position: number;
    estimated_wait_minutes: number;
  } | null>(null);
  const [error, setError] = useState('');

  // Calculer le temps d'attente estimé
  const estimatedWaitMinutes =
    (availability.reserved_spots * 10) + // 10 min par panier actif
    ((availability.waitlist_count + 1) * 5); // 5 min par personne devant

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier que tous les champs sont remplis
      if (!formData.email || !formData.first_name || !formData.last_name) {
        setError('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      // Vérifier le format de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Veuillez saisir un email valide');
        setLoading(false);
        return;
      }

      // Ajouter à la file d'attente
      const sessionToken = sessionStorage.getItem('cart_session_token') || crypto.randomUUID();

      const { data, error: waitlistError } = await supabase.rpc('add_to_waitlist', {
        p_race_id: raceId,
        p_event_id: eventId,
        p_email: formData.email,
        p_first_name: formData.first_name,
        p_last_name: formData.last_name,
        p_phone: formData.phone || null,
        p_session_token: sessionToken,
        p_subscribe_to_bib_exchange: formData.subscribe_to_bib_exchange
      });

      if (waitlistError) throw waitlistError;

      setWaitlistInfo({
        position: data.position,
        estimated_wait_minutes: data.estimated_wait_minutes
      });

      setSuccess(true);

      // Envoyer un email de confirmation (optionnel)
      // TODO: Implémenter avec l'edge function send-email

    } catch (err: any) {
      console.error('Erreur ajout file d\'attente:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success && waitlistInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vous êtes en liste d'attente !
            </h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-900">
                  Position : {waitlistInfo.position}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Temps estimé : {formatWaitTime(waitlistInfo.estimated_wait_minutes)}
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Nous vous préviendrons par email dès qu'une place se libère.
              {formData.subscribe_to_bib_exchange && (
                <span className="block mt-2 text-sm text-green-600">
                  ✓ Vous êtes inscrit(e) à la newsletter de la bourse aux dossards
                </span>
              )}
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Course complète : {raceName}
          </h2>
          <p className="text-gray-600">
            Cette course a atteint sa capacité maximale ({availability.total_capacity} places).
          </p>
        </div>

        {/* Informations sur les places */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Places confirmées :</span>
            <span className="font-semibold text-gray-900">{availability.confirmed_entries}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Places réservées (paniers) :</span>
            <span className="font-semibold text-orange-600">{availability.reserved_spots}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Personnes en attente :</span>
            <span className="font-semibold text-blue-600">{availability.waitlist_count}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Temps d'attente estimé :</span>
              <span className="font-bold text-lg text-blue-600">
                {formatWaitTime(estimatedWaitMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Explication */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Les places dans les paniers peuvent ne pas être payées (10 min de délai)</li>
            <li>• Si une place se libère, nous vous prévenons par email</li>
            <li>• Vous aurez 10 minutes pour finaliser votre inscription</li>
            <li>• Le temps estimé inclut les paniers en cours + les personnes devant vous</li>
          </ul>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          {/* Newsletter bourse aux dossards */}
          {hasBibExchange && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subscribe_to_bib_exchange}
                  onChange={(e) => setFormData({ ...formData, subscribe_to_bib_exchange: e.target.checked })}
                  className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">
                      Newsletter Bourse aux dossards
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Recevez des alertes quand des dossards sont disponibles à la revente pour cette course
                  </p>
                </div>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Inscription...' : 'M\'inscrire sur la liste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
