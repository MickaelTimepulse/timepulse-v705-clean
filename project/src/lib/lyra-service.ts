import { supabase } from './supabase';

export interface LyraPaymentFormData {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
}

export interface LyraFormToken {
  formToken: string;
  publicKey: string;
}

export interface LyraPaymentResult {
  success: boolean;
  transactionId?: string;
  orderId?: string;
  status?: string;
  errorMessage?: string;
}

const LYRA_PUBLIC_KEY = import.meta.env.VITE_LYRA_PUBLIC_KEY;

export async function createLyraPaymentForm(
  paymentData: LyraPaymentFormData
): Promise<LyraFormToken> {
  try {
    const { data, error } = await supabase.functions.invoke('create-lyra-payment', {
      body: paymentData,
    });

    if (error) {
      throw new Error(`Erreur lors de la création du formulaire de paiement: ${error.message}`);
    }

    if (!data?.formToken) {
      throw new Error('Token de formulaire non reçu');
    }

    return {
      formToken: data.formToken,
      publicKey: LYRA_PUBLIC_KEY || '',
    };
  } catch (error) {
    console.error('Error creating Lyra payment form:', error);
    throw error;
  }
}

export async function verifyLyraPayment(
  orderId: string
): Promise<LyraPaymentResult> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-lyra-payment', {
      body: { orderId },
    });

    if (error) {
      throw new Error(`Erreur lors de la vérification du paiement: ${error.message}`);
    }

    return data as LyraPaymentResult;
  } catch (error) {
    console.error('Error verifying Lyra payment:', error);
    throw error;
  }
}

export function loadLyraScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="lyra"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://static.lyra.com/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Lyra script'));

    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://static.lyra.com/static/js/krypton-client/V4.0/stable/kr-payment-form.min.css';
    document.head.appendChild(link);
  });
}

export interface LyraFormOptions {
  formToken: string;
  publicKey: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

export async function renderLyraPaymentForm(
  containerId: string,
  options: LyraFormOptions
): Promise<void> {
  await loadLyraScript();

  if (!(window as any).KR) {
    throw new Error('Lyra SDK not loaded');
  }

  const KR = (window as any).KR;

  KR.setFormConfig({
    formToken: options.formToken,
    'kr-public-key': options.publicKey,
    'kr-language': 'fr-FR',
  });

  await KR.onSubmit(async (response: any) => {
    if (response.clientAnswer.orderStatus === 'PAID') {
      options.onSuccess?.(response);
    } else {
      options.onError?.(response);
    }
  });

  KR.attachForm(`#${containerId}`);
}
