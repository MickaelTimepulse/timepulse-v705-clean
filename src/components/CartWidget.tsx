import { useState, useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CartManager from './CartManager';

interface CartWidgetProps {
  eventId: string;
  sessionToken: string;
  onCheckout?: (cartId: string) => void;
}

export default function CartWidget({ eventId, sessionToken, onCheckout }: CartWidgetProps) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [totalCents, setTotalCents] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [bounce, setBounce] = useState(false);

  // Charger et surveiller le cartId depuis localStorage
  useEffect(() => {
    // Charger initialement
    const storedCartId = localStorage.getItem(`cart_${eventId}`);
    if (storedCartId) {
      console.log('📦 [CartWidget] Cart trouvé dans localStorage:', storedCartId);
      setCartId(storedCartId);
    }

    // Polling pour détecter la création d'un nouveau panier
    const checkInterval = setInterval(() => {
      const currentCartId = localStorage.getItem(`cart_${eventId}`);
      if (currentCartId && currentCartId !== cartId) {
        console.log('🆕 [CartWidget] Nouveau cart détecté:', currentCartId);
        setCartId(currentCartId);
      }
    }, 500); // Vérifier toutes les 500ms

    return () => clearInterval(checkInterval);
  }, [eventId, cartId]);

  // Charger les données du panier
  const loadCartData = async (id: string) => {
    try {
      console.log('🔄 [CartWidget] loadCartData pour cart:', id);

      // Récupérer le cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('total_price_cents')
        .eq('id', id)
        .single();

      if (cartError) {
        console.error('❌ [CartWidget] Erreur chargement cart:', cartError);
        return;
      }

      // Compter les items
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select('id')
        .eq('cart_id', id);

      if (itemsError) {
        console.error('❌ [CartWidget] Erreur chargement cart_items:', itemsError);
        return;
      }

      const count = itemsData?.length || 0;
      console.log('✅ [CartWidget] Mise à jour:', { count, totalCents: cartData?.total_price_cents });
      setItemCount(count);
      setTotalCents(cartData?.total_price_cents || 0);
    } catch (error) {
      console.error('❌ [CartWidget] Erreur loadCartData:', error);
    }
  };

  // Subscription Realtime sur cart_items
  useEffect(() => {
    if (!cartId) return;

    console.log('🎧 [CartWidget] Subscription cart_items pour:', cartId);

    // Charger initialement
    loadCartData(cartId);

    // Polling toutes les 2 secondes pour forcer la mise à jour
    const pollingInterval = setInterval(() => {
      console.log('🔄 [CartWidget] Polling refresh...');
      loadCartData(cartId);
    }, 2000);

    // S'abonner aux changements
    const channel = supabase
      .channel(`cart_items_${cartId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_id=eq.${cartId}`
        },
        (payload) => {
          console.log('🔔 [CartWidget] cart_items changed:', payload.eventType, payload);
          loadCartData(cartId);

          // Animation bounce lors d'ajout
          if (payload.eventType === 'INSERT') {
            setBounce(true);
            setTimeout(() => setBounce(false), 500);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [CartWidget] Subscription status:', status);
      });

    // Nettoyer l'abonnement et le polling
    return () => {
      console.log('🔌 [CartWidget] Unsubscribe cart_items');
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [cartId]);

  // S'abonner aux changements du cart (total_price)
  useEffect(() => {
    if (!cartId) return;

    const channel = supabase
      .channel(`cart_${cartId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'carts',
          filter: `id=eq.${cartId}`
        },
        (payload) => {
          console.log('Cart updated:', payload);
          if (payload.new) {
            setTotalCents((payload.new as any).total_price_cents || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cartId]);

  // Prolonger automatiquement l'expiration du panier quand l'utilisateur est actif
  useEffect(() => {
    if (!cartId) return;

    let lastActivity = Date.now();
    let extendInterval: NodeJS.Timeout;

    // Fonction pour prolonger l'expiration
    const extendExpiration = async () => {
      const timeSinceLastActivity = Date.now() - lastActivity;

      // Si l'utilisateur est actif (moins de 2 minutes sans activité)
      if (timeSinceLastActivity < 2 * 60 * 1000) {
        try {
          await supabase.rpc('extend_cart_expiration', { p_cart_id: cartId });
          console.log('⏰ [CartWidget] Expiration prolongée pour cart:', cartId);
        } catch (error) {
          console.error('❌ [CartWidget] Erreur prolongation:', error);
        }
      }
    };

    // Détecter l'activité utilisateur
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Écouter les événements d'activité
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Prolonger toutes les 3 minutes si l'utilisateur est actif
    extendInterval = setInterval(extendExpiration, 3 * 60 * 1000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(extendInterval);
    };
  }, [cartId]);

  // Gérer le checkout (fermer le widget et appeler la callback)
  const handleCheckout = () => {
    setIsCartOpen(false);
    if (onCheckout && cartId) {
      console.log('🛒 [CartWidget] Appel onCheckout avec cartId:', cartId);
      onCheckout(cartId);
    } else {
      console.warn('⚠️ [CartWidget] onCheckout ou cartId manquant');
    }
  };

  // Gérer la fermeture du panier
  const handleClose = () => {
    setIsCartOpen(false);
  };

  // Ne rien afficher si pas de cartId
  if (!cartId) {
    return null;
  }

  // Afficher le widget seulement si le panier a au moins un item
  if (itemCount === 0) {
    return null;
  }

  return (
    <>
      {/* Widget flottant */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-6 right-6 bg-orange-600 text-white rounded-full p-4 shadow-lg hover:bg-orange-700 transition-all z-40 group ${
          bounce ? 'animate-bounce' : ''
        }`}
        aria-label="Voir mon panier"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />

          {/* Badge avec nombre d'articles */}
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {itemCount}
          </div>
        </div>

        {/* Tooltip au survol */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-sm py-2 px-3 rounded whitespace-nowrap">
          {itemCount} participant{itemCount > 1 ? 's' : ''} - {(totalCents / 100).toFixed(2)}€
          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>

      {/* Modal CartManager */}
      {isCartOpen && cartId && (
        <CartManager
          cartId={cartId}
          sessionToken={sessionToken}
          onCheckout={handleCheckout}
          onClose={handleClose}
        />
      )}
    </>
  );
}
