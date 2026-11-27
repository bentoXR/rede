import React, { useEffect, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { askHciaTutor, type TutorContextPayload, type TutorMessage } from "../lib/tutor";
import type { CloudSettings, LanguagePref } from "../types/progress";
import { t } from "../i18n/ui";

interface AiTutorDrawerProps {
  open: boolean;
  context: TutorContextPayload | null;
  settings: CloudSettings;
  lang: LanguagePref;
  onClose: () => void;
}

function formatBoldSegments(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, idx) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-[#111827]">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded bg-stone-200/80 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-900"
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{p}</React.Fragment>;
  });
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  open,
  context,
  settings,
  lang,
  onClose,
}) => {
  const ui = t(lang);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
    if (context?.selectedQuote) {
      setInput(ui.tutorQuotePrefix(context.selectedQuote));
    } else {
      setInput("");
    }
  }, [context?.slide.id, context?.selectedQuote, lang]);

  if (!open || !context) return null;

  const sendQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setError(null);
    const nextHistory: TutorMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    try {
      const reply = await askHciaTutor(settings, context, messages, trimmed, lang);
      setMessages([...nextHistory, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao conectar com o tutor.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-75 flex justify-end bg-zinc-950/40 backdrop-blur-xs"
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-[#E2DDD3] bg-[#FAF9F6] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DC] bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-sm font-extrabold text-[#111827]">
                {ui.tutorTitle}
              </h2>
              <p className="text-[11.5px] font-semibold text-zinc-500">
                {ui.tutorGrounded(context.slide.slideNumber, context.slide.title)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {context.selectedQuote && (
            <div className="rounded-xl border border-amber-300/80 bg-amber-50 p-3 text-xs font-medium text-amber-950">
              <p className="font-display text-[11px] font-extrabold uppercase text-amber-800">
                {ui.selectedExcerpt}
              </p>
              <p className="mt-1 italic">"{context.selectedQuote}"</p>
            </div>
          )}

          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
                {ui.quickPromptsLabel}
              </p>
              {ui.quickPrompts.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => sendQuestion(qp)}
                  className="block w-full rounded-xl border border-[#E6E1D6] bg-white px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-800 transition hover:border-blue-400 hover:bg-blue-50/40"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-6 bg-[#18181B] font-medium text-white"
                  : "mr-3 border border-[#E6E1D6] bg-white font-medium text-zinc-800"
              }`}
            >
              <div className="whitespace-pre-wrap">
                {m.role === "assistant" ? formatBoldSegments(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 rounded-2xl border border-[#E6E1D6] bg-white p-4 text-xs font-bold text-zinc-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>{ui.tutorThinking}</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="border-t border-[#E8E4DC] bg-white p-4"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.tutorPlaceholder}
              className="flex-1 rounded-xl border border-[#E2DDD3] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-hidden focus:border-blue-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#18181B] text-white transition hover:bg-blue-700 disabled:opacity-40"
              aria-label="Enviar pergunta"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
