import AdminLayout from '../components/Admin/AdminLayout';
import ProtectedAdminRoute from '../components/ProtectedAdminRoute';
import { CreditCard, TrendingUp, DollarSign } from 'lucide-react';

export default function AdminFinance() {
  return (
    <ProtectedAdminRoute module="finance" permission="view" title="Finance">
      <AdminLayout title="Finance">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
            <p className="text-gray-600 mt-1">Suivez les transactions et le chiffre d'affaires</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">CA ce mois</p>
                <p className="text-2xl font-bold text-gray-900">45,678 €</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Croissance</p>
                <p className="text-2xl font-bold text-gray-900">+18%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Module en construction</h3>
          <p className="text-gray-600">Les détails financiers seront bientôt disponibles.</p>
        </div>
      </div>
    </AdminLayout>
    </ProtectedAdminRoute>
  );
}
