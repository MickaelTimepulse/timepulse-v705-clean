import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14.10.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, stripe-signature',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    if (!signature) {
      throw new Error('Signature manquante')
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Webhook reçu:', event.type)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { entry_id } = paymentIntent.metadata

      const { error: updateError } = await supabase
        .from('entry_payments')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_charge_id: paymentIntent.charges.data[0]?.id || null,
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (updateError) {
        console.error('Erreur mise à jour paiement:', updateError)
        throw updateError
      }

      const { error: entryError } = await supabase
        .from('entries')
        .update({
          status: 'confirmed',
        })
        .eq('id', entry_id)

      if (entryError) {
        console.error('Erreur mise à jour inscription:', entryError)
        throw entryError
      }

      const { data: entryData, error: fetchError } = await supabase
        .from('entries')
        .select('race_id, bib_number')
        .eq('id', entry_id)
        .single()

      if (!fetchError && entryData && !entryData.bib_number) {
        await supabase.rpc('auto_assign_bib_number', {
          p_entry_id: entry_id,
          p_race_id: entryData.race_id,
        })
      }

      console.log('Paiement confirmé pour inscription:', entry_id)
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      await supabase
        .from('entry_payments')
        .update({
          payment_status: 'pending',
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      console.log('Paiement échoué:', paymentIntent.id)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Erreur webhook:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur webhook',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})