import { supabase } from './supabase';

export type PaymentMethod = 'CARDS' | 'APPLE_PAY' | 'GOOGLE_PAY';

export interface LyraPaymentFormData {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  paymentMethods?: PaymentMethod[];
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
  paymentMethods?: PaymentMethod[];
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

  const formConfig: any = {
    formToken: options.formToken,
    'kr-public-key': options.publicKey,
    'kr-language': 'fr-FR',
  };

  if (options.paymentMethods && options.paymentMethods.length > 0) {
    const methodsConfig: any = {};

    if (options.paymentMethods.includes('APPLE_PAY')) {
      methodsConfig.applePay = {
        enabled: true,
      };
    }

    if (options.paymentMethods.includes('GOOGLE_PAY')) {
      methodsConfig.googlePay = {
        enabled: true,
      };
    }

    if (options.paymentMethods.includes('CARDS')) {
      methodsConfig.cards = {
        enabled: true,
      };
    }

    formConfig.paymentMethods = methodsConfig;
  }

  KR.setFormConfig(formConfig);

  await KR.onSubmit(async (response: any) => {
    if (response.clientAnswer.orderStatus === 'PAID') {
      options.onSuccess?.(response);
    } else {
      options.onError?.(response);
    }
  });

  KR.attachForm(`#${containerId}`);
}

export function isApplePayAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ApplePaySession;
}

export function isGooglePayAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'PaymentRequest' in window;
}
