import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper pour charger les détails d'une option
async function loadOptionDetails(raceId: string, optionId: string, choiceId?: string) {
  try {
    const { data: option, error } = await supabase
      .from('race_options')
      .select(`
        label,
        price_cents,
        race_option_choices (
          id,
          label,
          price_modifier_cents
        )
      `)
      .eq('id', optionId)
      .single();

    if (error || !option) return null;

    if (choiceId && option.race_option_choices) {
      const choice = (option.race_option_choices as any[]).find(c => c.id === choiceId);
      return {
        optionName: option.label,
        choiceName: choice?.label || 'Choix sélectionné',
        priceCents: (choice?.price_modifier_cents || 0) + (option.price_cents || 0)
      };
    }

    return {
      optionName: option.label,
      choiceName: null,
      priceCents: option.price_cents || 0
    };
  } catch (error) {
    console.error('Erreur chargement option:', error);
    return null;
  }
}

interface CartItem {
  id: string;
  race_id: string;
  race_name?: string;
  license_type_name?: string;
  participant_data: {
    first_name: string;
    last_name: string;
    birthdate: string;
    gender: string;
    email: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  selected_options: Record<string, any>;
  base_price_cents: number;
  options_price_cents: number;
  total_price_cents: number;
  timepulse_commission_cents: number;
}

interface Cart {
  id: string;
  status: string;
  expires_at?: string;
  total_price_cents: number;
}

interface CartManagerProps {
  cartId: string;
  sessionToken: string;
  onCheckout: () => void;
  onClose: () => void;
}

// Composant pour afficher les options d'un item
function ItemOptions({ raceId, selectedOptions }: { raceId: string; selectedOptions: Record<string, any> }) {
  const [optionsDetails, setOptionsDetails] = useState<Array<{ optionName: string; choiceName: string | null; priceCents: number; value?: any }>>([]);

  useEffect(() => {
    const loadDetails = async () => {
      const details = await Promise.all(
        Object.entries(selectedOptions).map(async ([optionId, optionData]) => {
          const detail = await loadOptionDetails(raceId, optionId, optionData?.choice_id);
          if (!detail) return null;

          let displayValue = '';
          if (optionData?.choice_id) {
            displayValue = detail.choiceName || 'Choix sélectionné';
          } else if (optionData?.value) {
            displayValue = optionData.value;
          } else {
            displayValue = 'Oui';
          }

          if (optionData?.quantity && optionData.quantity > 1) {
            displayValue += ` (x${optionData.quantity})`;
          }

          return {
            optionName: detail.optionName,
            choiceName: displayValue,
            priceCents: detail.priceCents * (optionData?.quantity || 1)
          };
        })
      );

      setOptionsDetails(details.filter(d => d !== null) as any[]);
    };

    if (Object.keys(selectedOptions).length > 0) {
      loadDetails();
    }
  }, [raceId, selectedOptions]);

  if (optionsDetails.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-gray-700">Options:</p>
      <div className="text-xs text-blue-600 space-y-0.5">
        {optionsDetails.map((detail, idx) => (
          <p key={idx}>
            • {detail.optionName}: {detail.choiceName}
            {detail.priceCents !== 0 && (
              <span className="ml-1 font-medium">
                ({detail.priceCents > 0 ? '+' : ''}{(detail.priceCents / 100).toFixed(2)}€)
              </span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function CartManager({ cartId, sessionToken, onCheckout, onClose }: CartManagerProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [commissionCents, setCommissionCents] = useState<number>(0);
  const [raceQuotas, setRaceQuotas] = useState<Record<string, { available: number; isFull: boolean }>>({});
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [eventSlug, setEventSlug] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [firstRaceId, setFirstRaceId] = useState<string>('');

  useEffect(() => {
    loadCart();
  }, [cartId]);

  useEffect(() => {
    if (cart?.expires_at && (cart.status === 'active' || cart.status === 'reserved')) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(cart.expires_at!);
        const diff = expires.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining(0);
          clearInterval(interval);
          // Appeler la fonction d'expiration
          handleCartExpired();
        } else {
          setTimeRemaining(Math.floor(diff / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cart]);

  const handleCartExpired = async () => {
    try {
      await supabase.rpc('expire_old_carts');
      setShowExpiredModal(true);
    } catch (error) {
      console.error('Erreur expiration panier:', error);
      setShowExpiredModal(true);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);

      // Réserver le panier pour 10 minutes (démarre le timer)
      console.log('⏱️ Réservation du panier pour 10 minutes...');
      const { data: reserveResult, error: reserveError } = await supabase.rpc('reserve_cart', {
        p_cart_id: cartId
      });

      if (reserveError) {
        console.error('❌ Erreur réservation panier:', reserveError);
        throw new Error(`Erreur lors de la réservation du panier: ${reserveError.message}`);
      }

      console.log('✅ Panier réservé:', reserveResult);

      // Vérifier si la réservation a réussi
      if (reserveResult && !reserveResult.success) {
        throw new Error(reserveResult.message || 'Impossible de réserver le panier');
      }

      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(`
          *,
          events!inner(id, slug)
        `)
        .eq('id', cartId)
        .single();

      if (cartError) throw cartError;

      // Si le panier est déjà expiré, récupérer quand même les items pour la redirection
      if (cartData.status === 'expired') {
        console.log('⚠️ Panier déjà expiré détecté au chargement');
        setEventSlug(cartData.events?.slug || '');
        setEventId(cartData.events?.id || '');

        // Récupérer les items pour avoir le race_id
        const { data: itemsData } = await supabase
          .from('cart_items')
          .select('race_id')
          .eq('cart_id', cartId)
          .limit(1);

        if (itemsData && itemsData.length > 0 && itemsData[0].race_id) {
          setFirstRaceId(itemsData[0].race_id);
        }

        setShowExpiredModal(true);
        setLoading(false);
        return;
      }

      setCart(cartData);
      if (cartData.events?.slug) {
        setEventSlug(cartData.events.slug);
      }
      if (cartData.events?.id) {
        setEventId(cartData.events.id);
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          *,
          races!inner(name),
          license_types(name)
        `)
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      const enrichedItems = itemsData.map(item => ({
        ...item,
        race_name: item.races?.name,
        license_type_name: item.license_types?.name
      }));

      setItems(enrichedItems);

      // Récupérer le premier race_id pour la redirection après expiration
      if (enrichedItems.length > 0 && enrichedItems[0].race_id) {
        setFirstRaceId(enrichedItems[0].race_id);
      }

      // Calculer la somme des commissions de tous les items
      const totalCommission = enrichedItems.reduce((sum, item) => sum + (item.timepulse_commission_cents || 0), 0);
      setCommissionCents(totalCommission);

      // Vérifier les quotas disponibles pour chaque course
      await checkRaceQuotas(enrichedItems);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRaceQuotas = async (cartItems: CartItem[]) => {
    try {
      const raceIds = [...new Set(cartItems.map(item => item.race_id))];
      const quotasData: Record<string, { available: number; isFull: boolean }> = {};

      for (const raceId of raceIds) {
        const { data: race } = await supabase
          .from('races')
          .select('max_participants')
          .eq('id', raceId)
          .single();

        if (!race || !race.max_participants) {
          quotasData[raceId] = { available: 999999, isFull: false };
          continue;
        }

        const { count } = await supabase
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('race_id', raceId)
          .neq('status', 'cancelled');

        const currentCount = count || 0;
        const available = race.max_participants - currentCount;
        quotasData[raceId] = {
          available: Math.max(0, available),
          isFull: available <= 0
        };
      }

      setRaceQuotas(quotasData);
    } catch (error) {
      console.error('Erreur vérification quotas:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Recalculer le total avec commissions
      const newTotal = items
        .filter(item => item.id !== itemId)
        .reduce((sum, item) => sum + item.total_price_cents + item.timepulse_commission_cents, 0);

      await supabase
        .from('carts')
        .update({ total_price_cents: newTotal })
        .eq('id', cartId);

      await loadCart();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'article');
    }
  };

  const reserveCart = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('reserve_cart', {
        p_cart_id: cartId
      });

      if (error) throw error;

      if (!data.success) {
        alert(data.message);
        await loadCart();
        return;
      }

      alert('Panier réservé ! Vous avez 10 minutes pour finaliser le paiement.');
      await loadCart();
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      alert('Erreur lors de la réservation du panier');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    );
  }

  // Modal d'expiration du panier
  if (showExpiredModal) {
    const backgroundImages = [
      '/coureur-victoire-1.jpeg',
      '/course-pied-masse-1.jpeg',
      '/course-pied-masse-2.jpeg',
      '/tour-eiffel-coureur.jpeg',
      '/triathlete.jpeg',
      '/open-water.jpeg',
      '/course-piste-stade.jpeg'
    ];
    const randomBg = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
          {/* Image de fond */}
          <div
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${randomBg})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Clock className="w-20 h-20 text-white mx-auto mb-4 animate-pulse" />
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Temps écoulé !
                </h2>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-xl text-gray-800 font-medium mb-2">
                Malheureusement, vous n'avez pas validé votre panier à temps !
              </p>
              <p className="text-gray-600">
                Le délai de 10 minutes est dépassé et votre panier a été automatiquement vidé.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  console.log('🧹 Nettoyage du localStorage avant réinscription');
                  // Nettoyer toutes les clés liées au panier
                  if (eventId) {
                    localStorage.removeItem(`cart_${eventId}`);
                  }
                  sessionStorage.removeItem('cart_session_token');
                  // Rediriger vers la page d'inscription avec la course présélectionnée
                  const registerUrl = firstRaceId
                    ? `/events/${eventSlug}/register?race=${firstRaceId}`
                    : `/events/${eventSlug}/register`;
                  window.location.href = registerUrl;
                }}
                className="flex-1 bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Recommencer mon inscription
              </button>

              <button
                onClick={() => {
                  console.log('🧹 Nettoyage du localStorage avant retour accueil');
                  // Nettoyer toutes les clés liées au panier
                  if (eventId) {
                    localStorage.removeItem(`cart_${eventId}`);
                  }
                  sessionStorage.removeItem('cart_session_token');
                  window.location.href = '/';
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                Retour à l'accueil
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
              💡 Astuce : Préparez vos informations à l'avance pour gagner du temps !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Mon Panier</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Timer pour panier actif */}
          {cart?.status === 'active' && timeRemaining !== null && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">
                  ⏰ Temps restant: {formatTime(timeRemaining)}
                </p>
                <p className="text-xs text-red-700 font-medium">
                  Votre panier sera automatiquement vidé si le paiement n'est pas effectué dans les 10 minutes
                </p>
              </div>
            </div>
          )}

          {/* Timer si réservé */}
          {cart?.status === 'reserved' && timeRemaining !== null && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  Panier réservé - Temps restant: {formatTime(timeRemaining)}
                </p>
                <p className="text-xs text-orange-700">
                  Finalisez votre paiement avant expiration
                </p>
              </div>
            </div>
          )}

          {cart?.status === 'expired' && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">
                Panier expiré - Veuillez créer un nouveau panier
              </p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const isRaceFull = raceQuotas[item.race_id]?.isFull || false;
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg p-4 border-2 relative ${
                      isRaceFull
                        ? 'bg-red-50 border-red-300 opacity-75'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {isRaceFull && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        COURSE COMPLÈTE
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isRaceFull ? 'text-red-900' : 'text-gray-900'}`}>
                          {item.participant_data.first_name} {item.participant_data.last_name}
                        </h3>
                        <p className={`text-sm mt-1 ${isRaceFull ? 'text-red-700 font-medium' : 'text-gray-600'}`}>
                          {item.race_name} • {item.license_type_name}
                        </p>
                        {isRaceFull && (
                          <p className="text-sm text-red-700 font-bold mt-2 bg-red-100 px-3 py-2 rounded">
                            ⚠️ Cette course est complète. Veuillez retirer cette inscription pour continuer.
                          </p>
                        )}
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Email: {item.participant_data.email}</p>
                        {item.participant_data.phone && (
                          <p>Tél: {item.participant_data.phone}</p>
                        )}
                      </div>
                      <ItemOptions
                        raceId={item.race_id}
                        selectedOptions={item.selected_options}
                      />

                      {/* Détail des prix */}
                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Inscription:</span>
                          <span className="font-medium">{(item.base_price_cents / 100).toFixed(2)}€</span>
                        </div>
                        {item.timepulse_commission_cents > 0 && (
                          <div className="flex justify-between">
                            <span>Frais Timepulse:</span>
                            <span className="font-medium text-orange-600">+{(item.timepulse_commission_cents / 100).toFixed(2)}€</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">
                        {((item.total_price_cents + item.timepulse_commission_cents) / 100).toFixed(2)}€
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="mt-2 text-red-600 hover:text-red-800 flex items-center gap-1"
                        disabled={cart?.status === 'reserved'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Retirer</span>
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* Sous-total */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Sous-total inscriptions</span>
                <span className="font-medium">{((cart!.total_price_cents - commissionCents) / 100).toFixed(2)}€</span>
              </div>
              {commissionCents > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Frais de gestion Timepulse ({items.length} × 0,99€)</span>
                  <span className="font-medium text-blue-600">+{(commissionCents / 100).toFixed(2)}€</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-300">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-orange-600">
                {(cart!.total_price_cents / 100).toFixed(2)}€
              </span>
            </div>

            {cart?.status === 'active' ? (
              <>
                {Object.values(raceQuotas).some(q => q.isFull) && (
                  <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                    <p className="text-sm font-bold text-red-900 text-center">
                      ⚠️ Vous devez retirer les inscriptions pour les courses complètes avant de continuer
                    </p>
                  </div>
                )}
                <button
                  onClick={reserveCart}
                  disabled={Object.values(raceQuotas).some(q => q.isFull)}
                  className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    Object.values(raceQuotas).some(q => q.isFull)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Valider mon panier
                </button>
              </>
            ) : cart?.status === 'reserved' && timeRemaining && timeRemaining > 0 ? (
              <>
                {Object.values(raceQuotas).some(q => q.isFull) && (
                  <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                    <p className="text-sm font-bold text-red-900 text-center">
                      ⚠️ Vous devez retirer les inscriptions pour les courses complètes avant de payer
                    </p>
                  </div>
                )}
                <button
                  onClick={onCheckout}
                  disabled={Object.values(raceQuotas).some(q => q.isFull)}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    Object.values(raceQuotas).some(q => q.isFull)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Procéder au paiement
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
