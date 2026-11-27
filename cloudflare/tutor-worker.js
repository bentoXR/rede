/**
 * Free Cloudflare Worker proxy for the Contextual HCIA Tutor.
 * Store your free Gemini API key as a Worker secret: `wrangler secret put GEMINI_API_KEY`
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

async function callGemini(modelId, apiKey, systemContext, contents) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContext }] },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 450,
        },
      }),
    }
  );
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }
    if (!env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY secret is not configured on Worker." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    try {
      const { systemContext = "", history = [], question = "" } = await request.json();
      const trimmedContext = String(systemContext).slice(0, 2800);
      const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

      const contents = [
        ...recentHistory.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content || "").slice(0, 1200) }],
        })),
        { role: "user", parts: [{ text: String(question).slice(0, 1200) }] },
      ];

      let res = null;
      for (const modelId of MODELS) {
        res = await callGemini(modelId, env.GEMINI_API_KEY, trimmedContext, contents);
        if (res.ok || (res.status !== 503 && res.status !== 429)) {
          break;
        }
      }

      if (!res.ok) {
        const text = await res.text();
        return Response.json({ error: text }, { status: res.status, headers: CORS_HEADERS });
      }

      const data = await res.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
        "Nenhuma resposta gerada.";

      return Response.json({ reply }, { headers: CORS_HEADERS });
    } catch (err) {
      return Response.json(
        { error: err?.message || "Unexpected Worker error" },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  },
};
