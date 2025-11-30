import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const apiUser = Deno.env.get("OXIMAILING_API_USER");
    const apiPassword = Deno.env.get("OXIMAILING_API_PASSWORD");

    if (!apiUser || !apiPassword) {
      throw new Error("OxiMailing API credentials not configured");
    }

    const { action, ...params } = await req.json();
    const basicAuth = btoa(`${apiUser}:${apiPassword}`);

    let endpoint = "";
    let method = "GET";
    let body = null;

    switch (action) {
      case "getBounces":
        endpoint = `/bounces?limit=${params.limit || 100}`;
        break;

      case "removeBounce":
        endpoint = `/bounces/${encodeURIComponent(params.email)}`;
        method = "DELETE";
        break;

      case "getSenders":
        endpoint = "/senders";
        break;

      case "addSender":
        endpoint = "/senders";
        method = "POST";
        body = JSON.stringify({ email: params.email });
        break;

      case "getStatistics":
        endpoint = "/statistics";
        if (params.dateFrom || params.dateTo) {
          const searchParams = new URLSearchParams();
          if (params.dateFrom) searchParams.append("from", params.dateFrom);
          if (params.dateTo) searchParams.append("to", params.dateTo);
          endpoint += `?${searchParams.toString()}`;
        }
        break;

      case "getEvents":
        endpoint = "/events";
        const eventParams = new URLSearchParams();
        if (params.email) eventParams.append("email", params.email);
        if (params.eventType) eventParams.append("type", params.eventType);
        if (params.dateFrom) eventParams.append("from", params.dateFrom);
        if (params.dateTo) eventParams.append("to", params.dateTo);
        if (params.limit) eventParams.append("limit", params.limit.toString());
        if (eventParams.toString()) {
          endpoint += `?${eventParams.toString()}`;
        }
        break;

      case "getBlacklist":
        endpoint = "/blacklists";
        break;

      case "addToBlacklist":
        endpoint = "/blacklists";
        method = "POST";
        body = JSON.stringify({
          email: params.email,
          reason: params.reason,
        });
        break;

      case "removeFromBlacklist":
        endpoint = `/blacklists/${encodeURIComponent(params.email)}`;
        method = "DELETE";
        break;

      case "getHistory":
        endpoint = `/history?limit=${params.limit || 50}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    const response = await fetch(`https://api.oximailing.com${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || "API request failed",
          details: data,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in OxiMailing API:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});