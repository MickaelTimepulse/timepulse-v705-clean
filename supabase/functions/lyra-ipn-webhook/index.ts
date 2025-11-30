import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const LYRA_API_KEY = Deno.env.get("LYRA_API_KEY");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const formData = await req.formData();
    const vadsSignature = formData.get("signature");
    const vadsOrderId = formData.get("vads_order_id");
    const vadsTransId = formData.get("vads_trans_id");
    const vadsTransStatus = formData.get("vads_trans_status");
    const vadsAmount = formData.get("vads_amount");
    const vadsPaymentMethod = formData.get("vads_card_brand");

    console.log("Lyra IPN received:", {
      orderId: vadsOrderId,
      transId: vadsTransId,
      status: vadsTransStatus,
      amount: vadsAmount,
    });

    if (!vadsOrderId) {
      throw new Error("Missing order ID in IPN");
    }

    const paymentStatus = vadsTransStatus === "AUTHORISED" ? "paid" : "failed";

    const { data: existingTransaction } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("order_id", vadsOrderId as string)
      .maybeSingle();

    if (existingTransaction) {
      const { error: updateError } = await supabaseAdmin
        .from("payment_transactions")
        .update({
          transaction_id: vadsTransId as string,
          status: paymentStatus,
          payment_method: vadsPaymentMethod as string,
          lyra_response: Object.fromEntries(formData.entries()),
          paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", vadsOrderId as string);

      if (updateError) {
        console.error("Error updating payment transaction:", updateError);
        throw updateError;
      }

      if (paymentStatus === "paid" && existingTransaction.entry_id) {
        const { error: entryError } = await supabaseAdmin
          .from("entries")
          .update({
            status: "confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTransaction.entry_id);

        if (entryError) {
          console.error("Error updating entry status:", entryError);
        }

        console.log("Entry confirmed:", existingTransaction.entry_id);
      }
    }

    console.log("IPN processed successfully");

    return new Response("OK", {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error processing Lyra IPN:", error);

    return new Response("ERROR", {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
      },
    });
  }
});