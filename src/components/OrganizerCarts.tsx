import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Clock, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CartOverview {
  id: string;
  event_name: string;
  registrant_email: string;
  registrant_name: string;
  status: string;
  total_price_cents: number;
  participant_count: number;
  created_at: string;
  expires_at: string | null;
  age_seconds: number;
}

interface OrganizerCartsProps {
  eventId: string;
}

export default function OrganizerCarts({ eventId }: OrganizerCartsProps) {
  const [carts, setCarts] = useState<CartOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState<CartOverview | null>(null);

  useEffect(() => {
    loadCarts();
  }, [eventId]);

  const loadCarts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizer_carts_overview')
        .select('*')
        .eq('event_id', eventId)
        .in('status', ['active', 'reserved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCarts(data || []);
    } catch (error) {
      console.error('Erreur chargement paniers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-100 text-blue-800',
      reserved: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'active' ? 'En cours' : 'Réservé'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 text-sm">Chargement des paniers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Paniers actifs</p>
              <p className="text-2xl font-bold text-blue-900">{carts.filter(c => c.status === 'active').length}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Paniers réservés</p>
              <p className="text-2xl font-bold text-orange-900">{carts.filter(c => c.status === 'reserved').length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total participants</p>
              <p className="text-2xl font-bold text-purple-900">
                {carts.reduce((sum, cart) => sum + cart.participant_count, 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Liste des paniers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {carts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun panier en attente</p>
            <p className="text-sm text-gray-500 mt-2">Les paniers en cours d'inscription apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscripteur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé il y a
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {cart.registrant_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cart.registrant_email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {cart.participant_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {(cart.total_price_cents / 100).toFixed(2)}€
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(cart.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDuration(cart.age_seconds)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => setSelectedCart(cart)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Détails</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Détails du panier</h3>
                  <p className="text-sm text-gray-600 mt-1">ID: {selectedCart.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => setSelectedCart(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Inscripteur</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Nom:</strong> {selectedCart.registrant_name}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Email:</strong> {selectedCart.registrant_email}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations du panier</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="text-blue-600 font-medium">Participants</span>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{selectedCart.participant_count}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <span className="text-green-600 font-medium">Total</span>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {(selectedCart.total_price_cents / 100).toFixed(2)}€
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <span className="text-orange-600 font-medium">Statut</span>
                    <p className="mt-2">{getStatusBadge(selectedCart.status)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <span className="text-purple-600 font-medium">Créé il y a</span>
                    <p className="text-xl font-bold text-purple-900 mt-1">
                      {formatDuration(selectedCart.age_seconds)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Information</h4>
                <p className="text-sm text-yellow-800">
                  Ce panier est en cours de remplissage par l'inscripteur. Les inscriptions seront créées une fois le paiement effectué.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedCart(null)}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
