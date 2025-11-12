import { useEffect, useState, useRef } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { createLyraPaymentForm, renderLyraPaymentForm, type LyraPaymentFormData } from '../lib/lyra-service';

interface LyraPaymentFormProps {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export default function LyraPaymentForm({
  amount,
  orderId,
  customerEmail,
  customerFirstName,
  customerLastName,
  customerPhone,
  onSuccess,
  onError,
}: LyraPaymentFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const formInitialized = useRef(false);

  useEffect(() => {
    if (formInitialized.current) return;
    formInitialized.current = true;

    initializePaymentForm();
  }, []);

  async function initializePaymentForm() {
    try {
      setLoading(true);
      setError(null);

      const paymentData: LyraPaymentFormData = {
        amount: Math.round(amount * 100),
        currency: 'EUR',
        orderId,
        customerEmail,
        customerFirstName,
        customerLastName,
        customerPhone,
      };

      const { formToken, publicKey } = await createLyraPaymentForm(paymentData);

      await renderLyraPaymentForm('lyra-payment-form', {
        formToken,
        publicKey,
        onSuccess: handlePaymentSuccess,
        onError: handlePaymentError,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error initializing payment form:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'initialisation du paiement');
      setLoading(false);
      onError(err instanceof Error ? err.message : 'Payment initialization error');
    }
  }

  function handlePaymentSuccess(response: any) {
    console.log('Payment successful:', response);
    setPaymentSuccess(true);
    const transactionId = response.clientAnswer?.transactions?.[0]?.uuid || orderId;
    onSuccess(transactionId);
  }

  function handlePaymentError(error: any) {
    console.error('Payment error:', error);
    const errorMessage = error.clientAnswer?.orderDetails?.orderStatusLabel || 'Erreur lors du paiement';
    setError(errorMessage);
    onError(errorMessage);
  }

  if (paymentSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          Paiement réussi !
        </h3>
        <p className="text-green-700">
          Votre inscription est confirmée. Vous allez recevoir un email de confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Paiement sécurisé</h2>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Montant à payer :</strong> {amount.toFixed(2)} €
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Paiement sécurisé par Lyra Collect
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Erreur de paiement</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Chargement du formulaire de paiement...</p>
          </div>
        )}

        <div
          id="lyra-payment-form"
          className={loading ? 'hidden' : 'block'}
        ></div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Vos données bancaires sont sécurisées et cryptées.</p>
          <p className="mt-1">Aucune information bancaire n'est stockée sur nos serveurs.</p>
        </div>
      </div>
    </div>
  );
}
