import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SEORequest {
  pageTitle: string;
  pageContent: string;
  shortDescription?: string;
  openaiApiKey?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { pageTitle, pageContent, shortDescription, openaiApiKey: bodyApiKey }: SEORequest = await req.json();

    if (!pageTitle || !pageContent) {
      return new Response(
        JSON.stringify({ error: "pageTitle and pageContent are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = bodyApiKey || Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not found in environment or request body");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `Tu es un expert SEO pour Timepulse, une entreprise française spécialisée dans le chronométrage d'événements sportifs.

Ton rôle est de créer des meta titles et meta descriptions optimisées pour le référencement naturel (SEO) en respectant ces règles :

1. Meta Title :
   - Entre 50 et 60 caractères
   - Inclure le mot-clé principal au début
   - Terminer par " | Timepulse" (sauf si ça dépasse 60 caractères)
   - Être accrocheur et informatif

2. Meta Description :
   - Entre 150 et 160 caractères
   - Inclure le mot-clé principal naturellement
   - Appel à l'action clair
   - Mentionner la valeur ajoutée de Timepulse

3. Ton et style :
   - Professionnel mais accessible
   - Orienté sport et événementiel
   - Valoriser l'expertise et la fiabilité de Timepulse

Réponds uniquement en JSON avec ce format exact :
{
  "title": "le meta title optimisé",
  "description": "la meta description optimisée"
}`;

    const userPrompt = `Génère un meta title et une meta description SEO optimisés pour cette page :

Titre de la page : ${pageTitle}
${shortDescription ? `\nDescription courte : ${shortDescription}` : ""}

Contenu de la page :
${pageContent.substring(0, 2000)}`;

    console.log("Calling OpenAI API...");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "OpenAI API error", details: errorData }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const result = JSON.parse(openaiData.choices[0].message.content);

    console.log("SEO generated successfully:", result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-seo function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});