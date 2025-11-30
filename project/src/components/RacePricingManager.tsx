import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LicenseType {
  id: string;
  code: string;
  name: string;
  federation: string;
}

interface PricingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  display_order: number;
}

interface RacePricing {
  id: string;
  pricing_period_id: string;
  license_type_id: string;
  price_cents: number;
  max_registrations: number | null;
  active: boolean;
}

interface RacePricingManagerProps {
  raceId: string;
  raceMaxParticipants: number | null;
}

export default function RacePricingManager({ raceId, raceMaxParticipants }: RacePricingManagerProps) {
  const [licenseTypes, setLicenseTypes] = useState<LicenseType[]>([]);
  const [periods, setPeriods] = useState<PricingPeriod[]>([]);
  const [pricings, setPricings] = useState<RacePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<{periodId: string; licenseId: string} | null>(null);

  const [periodForm, setPeriodForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });

  const [priceForm, setPriceForm] = useState({
    price: '',
    quota: '',
  });

  useEffect(() => {
    loadData();
  }, [raceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [licensesRes, periodsRes, pricingsRes] = await Promise.all([
        supabase.from('license_types').select('*').eq('active', true).order('code'),
        supabase.from('pricing_periods').select('*').eq('race_id', raceId).order('display_order'),
        supabase.from('race_pricing').select('*').eq('race_id', raceId),
      ]);

      if (licensesRes.data) setLicenseTypes(licensesRes.data);
      if (periodsRes.data) setPeriods(periodsRes.data);
      if (pricingsRes.data) setPricings(pricingsRes.data);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPeriod = async () => {
    if (!periodForm.name || !periodForm.start_date || !periodForm.end_date) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase.from('pricing_periods').insert({
        race_id: raceId,
        name: periodForm.name,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
        display_order: periods.length,
      });

      if (error) throw error;

      setPeriodForm({ name: '', start_date: '', end_date: '' });
      setShowPeriodForm(false);
      loadData();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const deletePeriod = async (periodId: string) => {
    if (!confirm('Supprimer cette période tarifaire ?')) return;

    try {
      const { error } = await supabase.from('pricing_periods').delete().eq('id', periodId);
      if (error) throw error;
      loadData();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const toggleLicenseActive = async (periodId: string, licenseId: string, currentActive: boolean) => {
    const existing = pricings.find(p => p.pricing_period_id === periodId && p.license_type_id === licenseId);

    try {
      if (existing) {
        const { error } = await supabase
          .from('race_pricing')
          .update({ active: !currentActive })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('race_pricing').insert({
          race_id: raceId,
          pricing_period_id: periodId,
          license_type_id: licenseId,
          price_cents: 0,
          active: true,
        });
        if (error) throw error;
      }
      loadData();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const updatePricing = async (periodId: string, licenseId: string) => {
    const priceCents = Math.round(parseFloat(priceForm.price || '0') * 100);
    const quota = priceForm.quota ? parseInt(priceForm.quota) : null;

    try {
      const existing = pricings.find(p => p.pricing_period_id === periodId && p.license_type_id === licenseId);

      if (existing) {
        const { error } = await supabase
          .from('race_pricing')
          .update({
            price_cents: priceCents,
            max_registrations: quota,
          })
          .eq('id', existing.id);
        if (error) throw error;
      }

      setEditingPricing(null);
      setPriceForm({ price: '', quota: '' });
      loadData();
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const getPricing = (periodId: string, licenseId: string): RacePricing | undefined => {
    return pricings.find(p => p.pricing_period_id === periodId && p.license_type_id === licenseId);
  };

  const getTotalQuota = (periodId: string): number => {
    return pricings
      .filter(p => p.pricing_period_id === periodId && p.max_registrations)
      .reduce((sum, p) => sum + (p.max_registrations || 0), 0);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-900">Tarification par période</h4>
          <p className="text-sm text-gray-600 mt-1">
            Configurez les périodes tarifaires et activez les types de licences acceptées
          </p>
        </div>
        <button
          onClick={() => setShowPeriodForm(!showPeriodForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une période</span>
        </button>
      </div>

      {showPeriodForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h5 className="font-medium text-gray-900 mb-3">Nouvelle période tarifaire</h5>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nom (ex: Tarif Early Bird)"
              value={periodForm.name}
              onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="datetime-local"
              value={periodForm.start_date}
              onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="datetime-local"
              value={periodForm.end_date}
              onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <button
              onClick={() => setShowPeriodForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={addPeriod}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {periods.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Aucune période tarifaire configurée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {periods.map((period) => {
            const totalQuota = getTotalQuota(period.id);
            const quotaExceeded = raceMaxParticipants && totalQuota > raceMaxParticipants;

            return (
              <div key={period.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-gray-900">{period.name}</h5>
                    <p className="text-sm text-gray-600">
                      Du {new Date(period.start_date).toLocaleString('fr-FR')} au{' '}
                      {new Date(period.end_date).toLocaleString('fr-FR')}
                    </p>
                    {raceMaxParticipants && (
                      <p className={`text-xs mt-1 ${quotaExceeded ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        <Users className="w-3 h-3 inline mr-1" />
                        Quotas cumulés: {totalQuota} / {raceMaxParticipants}
                        {quotaExceeded && ' ⚠️ Dépassement!'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePeriod(period.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {licenseTypes.map((license) => {
                    const pricing = getPricing(period.id, license.id);
                    const isActive = pricing?.active || false;
                    const isEditing = editingPricing?.periodId === period.id && editingPricing?.licenseId === license.id;

                    return (
                      <div key={license.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3 flex-1">
                          <button
                            onClick={() => toggleLicenseActive(period.id, license.id, isActive)}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              isActive ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                          <div>
                            <p className="font-medium text-gray-900">{license.name}</p>
                            <p className="text-xs text-gray-500">{license.federation}</p>
                          </div>
                        </div>

                        {isActive && (
                          <div className="flex items-center space-x-3">
                            {isEditing ? (
                              <>
                                <input
                                  type="number"
                                  placeholder="Prix €"
                                  value={priceForm.price}
                                  onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <input
                                  type="number"
                                  placeholder="Quota"
                                  value={priceForm.quota}
                                  onChange={(e) => setPriceForm({ ...priceForm, quota: e.target.value })}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  onClick={() => updatePricing(period.id, license.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPricing(null);
                                    setPriceForm({ price: '', quota: '' });
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">
                                    {pricing ? (
                                      pricing.price_cents === 0 ? (
                                        <span className="text-green-600 font-semibold">Gratuit</span>
                                      ) : (
                                        <>{(pricing.price_cents / 100).toFixed(2)} €</>
                                      )
                                    ) : '0.00 €'}
                                  </p>
                                  {pricing?.max_registrations && (
                                    <p className="text-xs text-gray-500">Quota: {pricing.max_registrations}</p>
                                  )}
                                  {pricing && pricing.price_cents === 0 && (
                                    <p className="text-xs text-green-600 italic">Épreuve gratuite</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingPricing({ periodId: period.id, licenseId: license.id });
                                    setPriceForm({
                                      price: pricing ? (pricing.price_cents / 100).toString() : '',
                                      quota: pricing?.max_registrations?.toString() || '',
                                    });
                                  }}
                                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  Modifier
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
