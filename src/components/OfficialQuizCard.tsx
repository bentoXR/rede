import React, { useState } from "react";
import { Award, CheckCircle2, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { SlideStep } from "../types/content";
import type { HighlightItem, LanguagePref } from "../types/progress";
import { RichInteractiveText } from "./RichInteractiveText";
import { t } from "../i18n/ui";

interface OfficialQuizCardProps {
  step: SlideStep;
  chapterId: string;
  lang: LanguagePref;
  highlights: HighlightItem[];
  onAddHighlight: (quote: string) => void;
  onRemoveHighlight: (id: string) => void;
  onAskTutorQuote: (quote: string) => void;
  onSelfScore: (stepId: string, mastered: boolean) => void;
  readingFontClass: string;
  readingSizeClass: string;
}

export const OfficialQuizCard: React.FC<OfficialQuizCardProps> = ({
  step,
  lang,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  onAskTutorQuote,
  onSelfScore,
  readingFontClass,
  readingSizeClass,
}) => {
  const ui = t(lang);
  const [revealed, setRevealed] = useState(false);
  const [scored, setScored] = useState<"got" | "review" | null>(null);

  return (
    <div className="rounded-2xl border-2 border-amber-300/80 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-amber-900 uppercase">
          <Award className="h-3.5 w-3.5" />
          <span>{ui.officialQuizTag(step.slideNumber)}</span>
        </span>
      </div>

      <h2 className="mb-5 font-display text-2xl font-extrabold text-[#111827]">
        {step.title}
      </h2>

      <div className={`space-y-3 text-zinc-800 ${readingFontClass} ${readingSizeClass}`}>
        {step.slideBullets.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-xl bg-[#FAF9F6] px-4 py-3 border border-[#ECE7DD] ${
              item.level > 0 ? "ml-4" : ""
            }`}
          >
            <RichInteractiveText
              text={item.text}
              stepId={step.id}
              lang={lang}
              highlights={highlights}
              onAddHighlight={onAddHighlight}
              onRemoveHighlight={onRemoveHighlight}
              onAskTutorQuote={onAskTutorQuote}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-[#ECE7DD] pt-5">
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#18181B] px-5 py-2.5 font-display text-sm font-bold text-white transition hover:bg-blue-700"
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{revealed ? ui.hideOfficialAnswer : ui.revealOfficialAnswer}</span>
        </button>

        {revealed && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/75 p-5">
            <p className="mb-2 font-display text-xs font-extrabold tracking-wider text-emerald-800 uppercase">
              {ui.officialAnswerKey}
            </p>
            <ul className={`space-y-2 text-emerald-950 ${readingFontClass} ${readingSizeClass}`}>
              {step.notes.map((n, idx) => (
                <li
                  key={idx}
                  className={n.level === 1 ? "ml-5 list-disc" : n.level >= 2 ? "ml-10 list-circle" : "font-semibold"}
                >
                  <RichInteractiveText
                    text={n.text}
                    stepId={step.id}
                    lang={lang}
                    highlights={highlights}
                    onAddHighlight={onAddHighlight}
                    onRemoveHighlight={onRemoveHighlight}
                    onAskTutorQuote={onAskTutorQuote}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-emerald-200/80 pt-3">
              <span className="text-xs font-bold text-emerald-900">{ui.howDidYouDo}</span>
              <button
                type="button"
                onClick={() => {
                  setScored("got");
                  onSelfScore(step.id, true);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition ${
                  scored === "got"
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{ui.gotIt}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setScored("review");
                  onSelfScore(step.id, false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-display text-xs font-bold transition ${
                  scored === "review"
                    ? "bg-amber-600 text-white"
                    : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-100"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{ui.reviewLater}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
