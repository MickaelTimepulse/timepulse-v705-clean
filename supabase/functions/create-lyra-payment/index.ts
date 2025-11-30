import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  paymentMethods?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const LYRA_SHOP_ID = Deno.env.get("LYRA_SHOP_ID");
    const LYRA_API_KEY = Deno.env.get("LYRA_API_KEY");
    const LYRA_API_URL = Deno.env.get("LYRA_API_URL") || "https://api.lyra.com/api-payment/V4";
    const LYRA_MODE = Deno.env.get("LYRA_MODE") || "TEST";

    if (!LYRA_SHOP_ID || !LYRA_API_KEY) {
      throw new Error("Missing Lyra configuration");
    }

    const paymentRequest: PaymentRequest = await req.json();

    const {
      amount,
      currency = "EUR",
      orderId,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      paymentMethods,
    } = paymentRequest;

    const authString = btoa(`${LYRA_SHOP_ID}:${LYRA_API_KEY}`);

    const lyraPayload: any = {
      amount: amount,
      currency: currency,
      orderId: orderId,
      customer: {
        email: customerEmail,
        billingDetails: {
          firstName: customerFirstName,
          lastName: customerLastName,
          phoneNumber: customerPhone || "",
        },
      },
      formAction: "PAYMENT",
      mode: LYRA_MODE,
    };

    if (paymentMethods && paymentMethods.length > 0) {
      lyraPayload.paymentMethodsOptions = {
        enabledPaymentMethods: paymentMethods,
      };

      if (paymentMethods.includes("APPLE_PAY")) {
        lyraPayload.applePayOptions = {
          mode: "GATEWAY",
          requiredBillingContactFields: ["email", "name"],
          requiredShippingContactFields: [],
        };
      }

      if (paymentMethods.includes("GOOGLE_PAY")) {
        lyraPayload.googlePayOptions = {
          allowedCardNetworks: ["MASTERCARD", "VISA", "CB"],
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          merchantName: "TIMEPULSE",
        };
      }
    }

    console.log("Creating Lyra payment form...", { orderId, amount, currency });

    const lyraResponse = await fetch(`${LYRA_API_URL}/Charge/CreatePayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(lyraPayload),
    });

    if (!lyraResponse.ok) {
      const errorText = await lyraResponse.text();
      console.error("Lyra API error:", errorText);
      throw new Error(`Lyra API error: ${lyraResponse.status} - ${errorText}`);
    }

    const lyraData = await lyraResponse.json();

    console.log("Lyra payment form created successfully");

    return new Response(
      JSON.stringify({
        formToken: lyraData.answer.formToken,
        orderId: orderId,
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
    console.error("Error in create-lyra-payment:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
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