import { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, BarChart3, Clock, Package, Eye, Trash2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';

interface CartOverview {
  id: string;
  event_name: string;
  registrant_email: string;
  registrant_name: string;
  registrant_phone: string;
  status: string;
  total_price_cents: number;
  participant_count: number;
  created_at: string;
  expires_at: string | null;
  age_seconds: number;
  abandonment_stage: string | null;
}

interface CartMetrics {
  total_carts: number;
  paid_carts: number;
  abandoned_carts: number;
  active_carts: number;
  reserved_carts: number;
  conversion_rate: number;
  avg_basket_cents: number;
  avg_items: number;
}

export default function AdminCarts() {
  const [activeTab, setActiveTab] = useState<'active' | 'abandoned' | 'analytics'>('active');
  const [carts, setCarts] = useState<CartOverview[]>([]);
  const [metrics, setMetrics] = useState<CartMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCart, setSelectedCart] = useState<CartOverview | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les paniers selon l'onglet actif
      const { data: cartsData, error: cartsError } = await supabase
        .from('admin_carts_overview')
        .select('*')
        .in('status', activeTab === 'active' ? ['active', 'reserved'] : ['expired', 'cancelled'])
        .order('created_at', { ascending: false });

      if (cartsError) throw cartsError;
      setCarts(cartsData || []);

      // Charger les métriques
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_cart_metrics', {
          p_event_id: null,
          p_date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          p_date_to: new Date().toISOString()
        });

      if (metricsError) throw metricsError;
      setMetrics(metricsData);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
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
      reserved: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const deleteCart = async (cartId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce panier ?')) return;

    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', cartId);

      if (error) throw error;

      alert('Panier supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur suppression panier:', error);
      alert('Erreur lors de la suppression du panier');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Paniers</h1>
          <p className="text-gray-600">Suivi des paniers d'inscription et analytics de conversion</p>
        </div>

        {/* KPIs */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paniers actifs</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.active_carts + metrics.reserved_carts}</p>
                </div>
                <ShoppingCart className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Taux conversion</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.conversion_rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
                  <p className="text-3xl font-bold text-gray-900">{(metrics.avg_basket_cents / 100).toFixed(0)}€</p>
                </div>
                <DollarSign className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">CA en attente</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {((metrics.active_carts + metrics.reserved_carts) * metrics.avg_basket_cents / 100).toFixed(0)}€
                  </p>
                </div>
                <Package className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'active'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Paniers en cours
              </button>
              <button
                onClick={() => setActiveTab('abandoned')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'abandoned'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="w-5 h-5 inline mr-2" />
                Paniers abandonnés
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'analytics'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline mr-2" />
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : activeTab === 'analytics' ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Statistiques de conversion</h3>

                {metrics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Total paniers créés (30j)</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.total_carts}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Paniers payés</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.paid_carts}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Paniers abandonnés</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.abandoned_carts}</p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">💡 Insights</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Moyenne de {metrics?.avg_items.toFixed(1)} participants par panier</li>
                    <li>• {metrics && metrics.conversion_rate > 50 ? '✅' : '⚠️'} Taux de conversion: {metrics?.conversion_rate.toFixed(1)}%</li>
                    <li>• Panier moyen: {metrics && (metrics.avg_basket_cents / 100).toFixed(2)}€</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {carts.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun panier {activeTab === 'active' ? 'actif' : 'abandonné'}</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé il y a</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {carts.map((cart) => (
                        <tr key={cart.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cart.event_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cart.registrant_email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {cart.participant_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {(cart.total_price_cents / 100).toFixed(2)}€
                          </td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(cart.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(cart.age_seconds)}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedCart(cart)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Voir détails"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCart(cart.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal détails panier */}
        {selectedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Détails du panier</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedCart.event_name}</p>
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
                  <p className="text-sm text-gray-600">
                    <strong>{selectedCart.registrant_name}</strong><br />
                    {selectedCart.registrant_email}<br />
                    {selectedCart.registrant_phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informations</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Participants:</span>
                      <span className="ml-2 font-medium">{selectedCart.participant_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-medium">{(selectedCart.total_price_cents / 100).toFixed(2)}€</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <span className="ml-2">{getStatusBadge(selectedCart.status)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Créé il y a:</span>
                      <span className="ml-2 font-medium">{formatDuration(selectedCart.age_seconds)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setSelectedCart(null)}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
