// ai-proxy edge function
// Proxies Gemini API calls server-side so the API key is never exposed to the
// browser and CORS is handled centrally.

import { corsHeaders } from "@supabase/supabase-js/cors";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

interface ProxyRequest {
  model?: string;
  contents: unknown;
  systemInstruction?: unknown;
  generationConfig?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload: ProxyRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload?.contents) {
    return new Response(JSON.stringify({ error: "Missing 'contents' in body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const model = payload.model || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${GEMINI_API_KEY}`;

  const upstreamBody: Record<string, unknown> = { contents: payload.contents };
  if (payload.systemInstruction) upstreamBody.systemInstruction = payload.systemInstruction;
  if (payload.generationConfig) upstreamBody.generationConfig = payload.generationConfig;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[ai-proxy] upstream error", err);
    return new Response(
      JSON.stringify({ error: "Upstream request failed", detail: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
