import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'npm:stripe@14.10.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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

    const { amount, currency, registration_data, payment_method_type } = await req.json()

    const { athlete_data, event_id, race_id, organizer_id, category, session_token, total_price_cents, commission_cents, selected_options } = registration_data

    const { data: result, error: functionError } = await supabase.rpc(
      'create_public_registration',
      {
        p_event_id: event_id,
        p_race_id: race_id,
        p_organizer_id: organizer_id,
        p_athlete_data: athlete_data,
        p_category: category,
        p_session_token: session_token,
      }
    )

    if (functionError) {
      throw new Error(`Erreur création inscription: ${functionError.message}`)
    }

    const { entry_id, athlete_id, payment_id } = result

    for (const [option_id, selection] of Object.entries(selected_options)) {
      const optionData: any = selection
      await supabase.from('registration_options').insert({
        entry_id,
        option_id,
        choice_id: optionData.choice_id || null,
        value: optionData.value || null,
        quantity: optionData.quantity || 1,
        price_paid_cents: 0,
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: [payment_method_type === 'card' ? 'card' : payment_method_type],
      metadata: {
        entry_id,
        athlete_id,
        event_id,
        race_id,
      },
    })

    await supabase
      .from('entry_payments')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        amount_organizer_cents: total_price_cents,
        timepulse_commission_cents: commission_cents,
        total_amount_cents: amount,
        payment_status: 'pending',
        payment_method: payment_method_type,
      })
      .eq('id', payment_id)

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        entry_id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Une erreur est survenue',
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