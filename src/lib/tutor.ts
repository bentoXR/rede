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
  const notes = ctx.slide.notes
    .map((n) => `${"  ".repeat(n.level)}- ${n.text}`)
    .join("\n")
    .slice(0, 1400);
  const diagramText = ctx.slide.diagram?.altText ? `Diagrama: ${ctx.slide.diagram.altText}` : "";
  const quoteLine = ctx.selectedQuote
    ? `\nTrecho selecionado pelo aluno:\n"${ctx.selectedQuote}"\n`
    : "";

  return [
    `Você é um tutor objetivo de Huawei HCIA-Datacom V2.0.`,
    `Responda em PT-BR claro e direto, mantendo termos técnicos, protocolos, portas, siglas e comandos Huawei VRP em inglês. Seja conciso e use negrito nos pontos-chave.`,
    `Capítulo: ${ctx.chapterTitle} | Lição: ${ctx.lessonTitle}`,
    `Slide ${ctx.slide.slideNumber}: ${ctx.slide.title}`,
    bullets ? `Tópicos:\n${bullets}` : "",
    notes ? `Notas:\n${notes}` : "",
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

  if (!workerUrl) {
    throw new Error("Tutor IA indisponível no momento.");
  }

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
    throw new Error(`Erro ao consultar o Tutor (${res.status}): ${txt}`);
  }
  const json = (await res.json()) as { reply?: string; error?: string };
  if (json.error) throw new Error(json.error);
  return json.reply ?? "Nenhuma resposta recebida.";
}
