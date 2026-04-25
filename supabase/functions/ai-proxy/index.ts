// Gemini proxy edge function — keeps API key server-side and avoids CORS issues.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = await req.json();
    // Accept either the configured model or fall back to a current default.
    // Map deprecated names to supported ones if necessary.
    let model: string = payload.model || DEFAULT_MODEL;
    // Map deprecated v1beta model names to currently supported ones
    if (model === "gemini-1.5-flash" || model === "gemini-1.5-pro") {
      model = DEFAULT_MODEL;
    }
    // Validate key format — Google API keys start with "AIza"
    if (!GEMINI_API_KEY.startsWith("AIza")) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY has invalid format (must start with 'AIza'). Please update the secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const upstreamBody: Record<string, unknown> = {
      contents: payload.contents,
    };
    if (payload.systemInstruction) upstreamBody.systemInstruction = payload.systemInstruction;
    if (payload.generationConfig) upstreamBody.generationConfig = payload.generationConfig;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
