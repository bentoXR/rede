/**
 * Free Cloudflare Worker proxy for the Contextual HCIA Tutor.
 * Store your free Gemini API key as a Worker secret: `wrangler secret put GEMINI_API_KEY`
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
      const { systemContext, history = [], question } = await request.json();
      const contents = [
        ...history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: question }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemContext || "" }] },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 700,
            },
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        return Response.json({ error: text }, { status: res.status, headers: CORS_HEADERS });
      }

      const data = await res.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
        "No reply generated.";

      return Response.json({ reply }, { headers: CORS_HEADERS });
    } catch (err) {
      return Response.json(
        { error: err?.message || "Unexpected Worker error" },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  },
};
