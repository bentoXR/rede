import type { SlideStep } from "../types/content";
import type { CloudSettings, LanguagePref } from "../types/progress";

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorContextPayload {
  chapterTitle: string;
  lessonTitle: string;
  slide: SlideStep;
  selectedQuote?: string;
}

function buildContextPrompt(ctx: TutorContextPayload): string {
  const bullets = ctx.slide.slideBullets.map((b) => `- ${b.text}`).join("\n");
  const notes = ctx.slide.notes.map((n) => `${"  ".repeat(n.level)}- ${n.text}`).join("\n");
  const diagramText = ctx.slide.diagram?.altText ? `Diagram labels: ${ctx.slide.diagram.altText}` : "";
  const quoteLine = ctx.selectedQuote
    ? `\nHighlighted excerpt the student clicked on:\n"${ctx.selectedQuote}"\n`
    : "";

  const langRule =
    "Respond in natural, clear Brazilian Portuguese (PT-BR), keeping important networking terms, protocols, ports, acronyms, and Huawei VRP commands in English.";

  return [
    `You are an encouraging, precise Huawei HCIA-Datacom V2.0 tutor.`,
    `Ground your explanation in the official Huawei slide below. ${langRule} Use concise bold emphasis and practical intuition.`,
    ``,
    `Chapter: ${ctx.chapterTitle}`,
    `Lesson: ${ctx.lessonTitle}`,
    `Slide ${ctx.slide.slideNumber}: ${ctx.slide.title}`,
    bullets ? `Slide bullets:\n${bullets}` : "",
    notes ? `Official Huawei speaker notes:\n${notes}` : "",
    diagramText,
    quoteLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function askHciaTutor(
  settings: CloudSettings,
  ctx: TutorContextPayload,
  history: TutorMessage[],
  question: string,
  _lang: LanguagePref = "pt"
): Promise<string> {
  const systemContext = buildContextPrompt(ctx);
  const workerUrl = settings.tutorWorkerUrl.trim();
  const apiKey = settings.geminiApiKey.trim();

  if (workerUrl) {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemContext,
        history,
        question,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro no Tutor Worker (${res.status}): ${txt}`);
    }
    const json = (await res.json()) as { reply?: string; error?: string };
    if (json.error) throw new Error(json.error);
    return json.reply ?? "Nenhuma resposta recebida.";
  }

  if (apiKey) {
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: question }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContext }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 700,
          },
        }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro na API Gemini (${res.status}): ${txt}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    return reply || "Nenhuma resposta recebida do Gemini.";
  }

  throw new Error("TUTOR_NOT_CONFIGURED");
}
