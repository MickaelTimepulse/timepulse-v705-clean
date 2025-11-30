import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/Admin/AdminLayout';
import { DollarSign, Plus, Edit2, Calendar, FileText } from 'lucide-react';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';

interface CommissionSetting {
  id: string;
  commission_cents: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  notes: string;
  created_at: string;
}

export default function AdminCommission() {
  const [commissions, setCommissions] = useState<CommissionSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    commission_cents: 99,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    notes: '',
  });

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('timepulse_commission_settings')
      .select('*')
      .order('valid_from', { ascending: false });

    if (!error && data) {
      setCommissions(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('timepulse_commission_settings').insert({
      commission_cents: formData.commission_cents,
      is_active: true,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      notes: formData.notes,
    });

    if (error) {
      alert('Erreur lors de la création de la commission');
      return;
    }

    setShowForm(false);
    setFormData({
      commission_cents: 99,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      notes: '',
    });
    loadCommissions();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('timepulse_commission_settings')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      loadCommissions();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatAmount = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <ProtectedAdminRoute module="finance" permission="manage" title="Commission">
      <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Commissions</h1>
            <p className="text-gray-600 mt-1">
              Configuration de la commission Timepulse sur les inscriptions en ligne
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Commission
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Créer une Nouvelle Commission
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Montant de la commission (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={(formData.commission_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commission_cents: Math.round(parseFloat(e.target.value) * 100),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Valide à partir du *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Valide jusqu'au (optionnel)
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laisser vide pour une durée illimitée
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Raison du changement..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Créer la Commission
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600">
              Chargement des commissions...
            </div>
          ) : commissions.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Aucune commission configurée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Valide du
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Valide jusqu'au
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive(commission.id, commission.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            commission.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {commission.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-lg font-semibold text-pink-600">
                          {formatAmount(commission.commission_cents)}€
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {formatDate(commission.valid_from)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {commission.valid_until ? formatDate(commission.valid_until) : 'Illimité'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {commission.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive(commission.id, commission.is_active)}
                          className="text-gray-600 hover:text-pink-600"
                          title={commission.is_active ? 'Désactiver' : 'Activer'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Informations importantes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • La commission est ajoutée au montant total payé par l'athlète lors d'une inscription
              en ligne
            </li>
            <li>
              • Cette commission n'apparaît pas dans les exports CSV ni dans les statistiques de
              l'organisateur
            </li>
            <li>
              • Seule une commission peut être active à la fois pour une période donnée
            </li>
            <li>
              • Les changements de commission ne s'appliquent qu'aux nouvelles inscriptions
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
    </ProtectedAdminRoute>
  );
}
