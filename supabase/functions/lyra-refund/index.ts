import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RefundRequest {
  entryId: string;
  amount: number;
  reason?: string;
  includeTransactionFees?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LYRA_SHOP_ID = Deno.env.get("LYRA_SHOP_ID");
    const LYRA_API_KEY = Deno.env.get("LYRA_API_KEY");
    const LYRA_API_URL = Deno.env.get("LYRA_API_URL") || "https://api.lyra.com/api-payment/V4";

    if (!LYRA_SHOP_ID || !LYRA_API_KEY) {
      throw new Error("Configuration Lyra manquante");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const refundRequest: RefundRequest = await req.json();

    const { entryId, amount, reason = "Remboursement demandé", includeTransactionFees = false } = refundRequest;

    console.log("🔄 Traitement remboursement pour entry:", entryId);

    const { data: entry, error: entryError } = await supabaseAdmin
      .from("entries")
      .select(`
        id,
        amount,
        refund_status,
        refund_amount,
        session_token,
        event_id,
        race_id,
        athlete_id,
        athletes (
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", entryId)
      .single();

    if (entryError || !entry) {
      throw new Error("Inscription non trouvée");
    }

    if (entry.refund_status && entry.refund_status !== "none") {
      throw new Error("Cette inscription a déjà été remboursée");
    }

    if (amount > entry.amount) {
      throw new Error("Le montant du remboursement ne peut pas dépasser le montant payé");
    }

    const { data: paymentTransaction, error: txError } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("entry_id", entryId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (txError) {
      console.error("Erreur recherche transaction:", txError);
    }

    if (!paymentTransaction || !paymentTransaction.transaction_id) {
      console.warn("⚠️ Aucune transaction Lyra trouvée, enregistrement du remboursement uniquement");

      const { error: updateError } = await supabaseAdmin
        .from("entries")
        .update({
          refund_status: amount >= entry.amount ? "full" : "partial",
          refund_amount: amount,
          refund_transaction_fees: includeTransactionFees,
          refund_requested_at: new Date().toISOString(),
          refund_completed_at: new Date().toISOString(),
          refund_notes: `${reason} - Pas de transaction Lyra trouvée, remboursement manuel nécessaire`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          manual: true,
          message: "Remboursement enregistré. Transaction Lyra non trouvée, traitement manuel requis dans le back-office Lyra.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("💳 Transaction Lyra trouvée:", paymentTransaction.transaction_id);

    const authString = btoa(`${LYRA_SHOP_ID}:${LYRA_API_KEY}`);
    const refundAmountCents = Math.round(amount * 100);

    const lyraRefundPayload = {
      uuid: paymentTransaction.transaction_id,
      amount: refundAmountCents,
      currency: "EUR",
      comment: reason,
    };

    console.log("📤 Envoi demande remboursement à Lyra:", lyraRefundPayload);

    const lyraResponse = await fetch(`${LYRA_API_URL}/Transaction/CancelOrRefund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(lyraRefundPayload),
    });

    if (!lyraResponse.ok) {
      const errorText = await lyraResponse.text();
      console.error("❌ Erreur API Lyra:", errorText);
      throw new Error(`Erreur Lyra: ${lyraResponse.status} - ${errorText}`);
    }

    const lyraData = await lyraResponse.json();
    console.log("✅ Réponse Lyra:", lyraData);

    if (lyraData.status !== "SUCCESS") {
      throw new Error(`Le remboursement Lyra a échoué: ${lyraData.answer?.errorMessage || "Erreur inconnue"}`);
    }

    const refundStatus = amount >= entry.amount ? "full" : "partial";

    const { error: updateError } = await supabaseAdmin
      .from("entries")
      .update({
        refund_status: refundStatus,
        refund_amount: amount,
        refund_transaction_fees: includeTransactionFees,
        refund_requested_at: new Date().toISOString(),
        refund_completed_at: new Date().toISOString(),
        refund_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", entryId);

    if (updateError) {
      console.error("❌ Erreur mise à jour inscription:", updateError);
      throw updateError;
    }

    const { error: txUpdateError } = await supabaseAdmin
      .from("payment_transactions")
      .update({
        status: "refunded",
        refund_amount: amount,
        refund_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentTransaction.id);

    if (txUpdateError) {
      console.error("⚠️ Erreur mise à jour transaction:", txUpdateError);
    }

    const athlete = entry.athletes as any;
    console.log("📧 Envoi email de confirmation à:", athlete.email);

    try {
      await supabaseAdmin.functions.invoke("send-email", {
        body: {
          to: athlete.email,
          subject: "Confirmation de remboursement - Timepulse",
          html: `
            <h2>Remboursement confirmé</h2>
            <p>Bonjour ${athlete.first_name} ${athlete.last_name},</p>
            <p>Votre remboursement de <strong>${amount.toFixed(2)} €</strong> a été traité avec succès.</p>
            <p><strong>Motif :</strong> ${reason}</p>
            <p>Le remboursement sera visible sur votre compte bancaire sous 3 à 5 jours ouvrés.</p>
            <p>Cordialement,<br>L'équipe Timepulse</p>
          `,
        },
      });
    } catch (emailError) {
      console.error("⚠️ Erreur envoi email:", emailError);
    }

    console.log("✅ Remboursement traité avec succès");

    return new Response(
      JSON.stringify({
        success: true,
        refundStatus,
        amount,
        transactionId: paymentTransaction.transaction_id,
        lyraResponse: lyraData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Erreur traitement remboursement:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur lors du remboursement",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
