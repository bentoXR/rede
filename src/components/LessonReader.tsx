import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  Type,
} from "lucide-react";
import type { ChapterData, LessonData, SlideStep } from "../types/content";
import type { FontFamilyPref, FontSizePref, UserProgress } from "../types/progress";
import { t } from "../i18n/ui";
import { RichInteractiveText } from "./RichInteractiveText";
import { DiagramViewer } from "./DiagramViewer";
import { VrpCommandBlock } from "./VrpCommandBlock";
import { MiniChallengeCard } from "./MiniChallengeCard";
import { OfficialQuizCard } from "./OfficialQuizCard";

interface LessonReaderProps {
  chapter: ChapterData;
  lesson: LessonData;
  targetStepId: string | null;
  progress: UserProgress;
  prevEntry: { chapter: ChapterData; lesson: LessonData } | null;
  nextEntry: { chapter: ChapterData; lesson: LessonData } | null;
  onToggleLessonCompleted: (lessonId: string, allLessonStepIds: string[]) => void;
  onCompleteAndNext: (
    lessonId: string,
    allLessonStepIds: string[],
    next: { chapter: ChapterData; lesson: LessonData }
  ) => void;
  onSelectEntry: (entry: { chapter: ChapterData; lesson: LessonData }) => void;
  onChallengeResult: (challengeId: string, isCorrect: boolean) => void;
  onToggleBookmark: (stepId: string) => void;
  onAddHighlight: (item: {
    stepId: string;
    chapterId: string;
    lessonId: string;
    slideTitle: string;
    quote: string;
  }) => void;
  onRemoveHighlight: (highlightId: string) => void;
  onUpdatePrefs: (patch: Partial<{ fontFamily: FontFamilyPref; fontSize: FontSizePref }>) => void;
  onOpenTutor: (slide: SlideStep, quote?: string) => void;
}

export const LessonReader: React.FC<LessonReaderProps> = ({
  chapter,
  lesson,
  targetStepId,
  progress,
  prevEntry,
  nextEntry,
  onToggleLessonCompleted,
  onCompleteAndNext,
  onSelectEntry,
  onChallengeResult,
  onToggleBookmark,
  onAddHighlight,
  onRemoveHighlight,
  onUpdatePrefs,
  onOpenTutor,
}) => {
  const ui = t("pt");
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const allStepIds = lesson.steps.map((s) => s.id);
  const isLessonDone = progress.completedLessonIds.includes(lesson.id);

  useEffect(() => {
    if (!targetStepId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`step-${targetStepId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [lesson.id, targetStepId]);

  const readingFontClass =
    progress.prefs.fontFamily === "serif" ? "font-reading-serif" : "font-reading-sans";

  const readingSizeClass = {
    comfortable: "text-[17.5px] sm:text-[18.5px] leading-[1.78]",
    large: "text-[19px] sm:text-[20px] leading-[1.82]",
    xlarge: "text-[20.5px] sm:text-[22px] leading-[1.85]",
  }[progress.prefs.fontSize];

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 sm:px-6 py-7 sm:py-10">
      {/* Lesson Header */}
      <div className="mb-8 rounded-3xl border border-[#E6E1D6] bg-white p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-display text-xs font-extrabold text-blue-700">
              Cap. {String(chapter.number).padStart(2, "0")} · {chapter.title}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
              <Clock className="h-3.5 w-3.5" />
              {lesson.estimatedMinutes} min
            </span>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTypeMenu((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FCFBF8] px-3 py-2 text-xs font-bold text-zinc-700 hover:border-zinc-400"
              title={ui.readingFont}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Aa</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleLessonCompleted(lesson.id, allStepIds)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-display text-xs font-bold transition ${
                isLessonDone
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border border-[#E2DDD3] bg-white text-zinc-800 hover:border-zinc-400"
              }`}
            >
              <CheckCircle2
                className={`h-3.5 w-3.5 ${isLessonDone ? "text-emerald-600" : "text-zinc-400"}`}
              />
              <span>{isLessonDone ? "Concluída" : "Marcar como concluída"}</span>
            </button>

            {showTypeMenu && (
              <div className="absolute top-11 right-0 z-50 w-60 rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-xl">
                <p className="mb-2 font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
                  {ui.readingFont}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["sans", "serif"] as const).map((ff) => (
                    <button
                      key={ff}
                      type="button"
                      onClick={() => onUpdatePrefs({ fontFamily: ff })}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                        progress.prefs.fontFamily === ff
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-[#E8E4DC] bg-[#FAF9F6] text-zinc-700"
                      }`}
                    >
                      {ff === "sans" ? "Inter Sans" : "Source Serif"}
                    </button>
                  ))}
                </div>

                <p className="mt-3 mb-2 font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
                  {ui.textSize}
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ["comfortable", "18px"],
                      ["large", "20px"],
                      ["xlarge", "22px"],
                    ] as const
                  ).map(([sz, label]) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => onUpdatePrefs({ fontSize: sz })}
                      className={`rounded-xl border px-2 py-1.5 text-xs font-bold ${
                        progress.prefs.fontSize === sz
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-[#E8E4DC] bg-[#FAF9F6] text-zinc-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
          {lesson.number} · {lesson.title}
        </h1>
        <p className="mt-2 text-sm sm:text-base font-medium text-zinc-600">{lesson.summary}</p>
      </div>

      {/* Continuous vertical flow of slides, diagrams, notes, VRP blocks & challenges */}
      <div className="space-y-6">
        {lesson.steps.map((step) => {
          if (step.kind === "challenge") {
            return (
              <div key={step.id} id={`step-${step.id}`} className="scroll-mt-24">
                <MiniChallengeCard
                  challenge={step.challenge}
                  lang="pt"
                  previousAccuracy={progress.challengeResults[step.challenge.id]}
                  onResult={onChallengeResult}
                />
              </div>
            );
          }

          if (step.kind === "official-quiz") {
            return (
              <div key={step.id} id={`step-${step.id}`} className="scroll-mt-24">
                <OfficialQuizCard
                  step={step}
                  chapterId={chapter.id}
                  lang="pt"
                  highlights={progress.highlights}
                  onAddHighlight={(quote) =>
                    onAddHighlight({
                      stepId: step.id,
                      chapterId: chapter.id,
                      lessonId: lesson.id,
                      slideTitle: step.title,
                      quote,
                    })
                  }
                  onRemoveHighlight={onRemoveHighlight}
                  onAskTutorQuote={(quote) => onOpenTutor(step, quote)}
                  onSelfScore={(sid, mastered) => onChallengeResult(sid, mastered)}
                  readingFontClass={readingFontClass}
                  readingSizeClass={readingSizeClass}
                />
              </div>
            );
          }

          const isBookmarked = progress.bookmarkedStepIds.includes(step.id);

          return (
            <article
              key={step.id}
              id={`step-${step.id}`}
              className="scroll-mt-24 rounded-3xl border border-[#E8E4DC] bg-white p-6 sm:p-8 shadow-2xs"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-stone-700">
                  <span>{step.sectionTitle}</span>
                  <span className="text-stone-400">·</span>
                  <span className="text-blue-700">
                    {ui.slideWord} {step.slideNumber}
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(step.id)}
                    className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                      isBookmarked
                        ? "border-amber-400 bg-amber-50 text-amber-800"
                        : "border-[#E2DDD3] bg-[#FCFBF8] text-zinc-700 hover:border-zinc-400"
                    }`}
                    title={ui.reviewBtn}
                  >
                    <Bookmark
                      className={`h-3.5 w-3.5 ${isBookmarked ? "fill-amber-500 text-amber-600" : ""}`}
                    />
                    <span className="hidden sm:inline">{isBookmarked ? ui.saved : ui.reviewBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenTutor(step)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 font-display text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{ui.askTutor}</span>
                  </button>
                </div>
              </div>

              {step.breadcrumbs.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {step.breadcrumbs.map((b, i) => (
                    <span
                      key={i}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        step.title.toLowerCase().includes(b.toLowerCase().split(" ")[0])
                          ? "bg-blue-600 text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="mb-4 font-display text-xl sm:text-[26px] font-extrabold leading-tight text-[#111827]">
                {step.title}
              </h2>

              {step.slideBullets.length > 0 && (
                <div className="mb-5 rounded-2xl border border-[#EFECE4] bg-[#FCFBF8] p-4 sm:p-5">
                  <ul className={`space-y-3 text-[#1F2937] ${readingFontClass} ${readingSizeClass}`}>
                    {step.slideBullets.map((b, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2.5 ${
                          b.level === 1 ? "ml-5" : b.level >= 2 ? "ml-10" : ""
                        }`}
                      >
                        <span className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        <span className="flex-1">
                          <RichInteractiveText
                            text={b.text}
                            stepId={step.id}
                            lang="pt"
                            highlights={progress.highlights}
                            onAddHighlight={(quote) =>
                              onAddHighlight({
                                stepId: step.id,
                                chapterId: chapter.id,
                                lessonId: lesson.id,
                                slideTitle: step.title,
                                quote,
                              })
                            }
                            onRemoveHighlight={onRemoveHighlight}
                            onAskTutorQuote={(quote) => onOpenTutor(step, quote)}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.diagram && (
                <DiagramViewer
                  diagram={step.diagram}
                  title={step.title}
                  slideNumber={step.slideNumber}
                  lang="pt"
                />
              )}

              {step.notes.length > 0 && (
                <section className="mt-5 border-t border-[#F0ECE3] pt-5">
                  <p className="mb-3 font-display text-xs font-extrabold tracking-widest text-zinc-500 uppercase">
                    {ui.detailedNotesHeader}
                  </p>
                  <div
                    className={`space-y-3.5 text-[#1F2937] ${readingFontClass} ${readingSizeClass}`}
                  >
                    {step.notes.map((n, idx) => {
                      const indentClass =
                        n.level === 1
                          ? "ml-5 pl-3.5 border-l-2 border-[#E6E1D6]"
                          : n.level >= 2
                            ? "ml-10 pl-3.5 border-l-2 border-blue-200"
                            : "";
                      return (
                        <div key={idx} className={indentClass}>
                          <div className="flex items-start gap-2.5">
                            {n.level === 0 && (
                              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-900" />
                            )}
                            <div className="flex-1">
                              <RichInteractiveText
                                text={n.text}
                                stepId={step.id}
                                lang="pt"
                                highlights={progress.highlights}
                                onAddHighlight={(quote) =>
                                  onAddHighlight({
                                    stepId: step.id,
                                    chapterId: chapter.id,
                                    lessonId: lesson.id,
                                    slideTitle: step.title,
                                    quote,
                                  })
                                }
                                onRemoveHighlight={onRemoveHighlight}
                                onAskTutorQuote={(quote) => onOpenTutor(step, quote)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {step.vrpBlocks.map((vb, idx) => (
                <VrpCommandBlock key={idx} block={vb} lang="pt" />
              ))}
            </article>
          );
        })}
      </div>

      {/* Bottom Lesson Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-3xl border border-[#E6E1D6] bg-white p-5 shadow-2xs">
        {prevEntry ? (
          <button
            type="button"
            onClick={() => onSelectEntry(prevEntry)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2DDD3] bg-[#FCFBF8] px-4 py-3 font-display text-xs font-bold text-zinc-800 hover:border-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              Anterior: {prevEntry.lesson.number} · {prevEntry.lesson.title}
            </span>
          </button>
        ) : (
          <div />
        )}

        {nextEntry ? (
          <button
            type="button"
            onClick={() => onCompleteAndNext(lesson.id, allStepIds, nextEntry)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#18181B] px-5 py-3 font-display text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
          >
            <span>
              Concluir e ir para {nextEntry.lesson.number} · {nextEntry.lesson.title}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleLessonCompleted(lesson.id, allStepIds)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-display text-sm font-bold text-white shadow-xs transition hover:bg-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isLessonDone ? "Lição Concluída!" : "Concluir Lição"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
