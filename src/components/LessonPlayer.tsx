import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Flame,
  Home,
  Sparkles,
  Type,
} from "lucide-react";
import type { SlideStep } from "../types/content";
import type { FontFamilyPref, FontSizePref, LanguagePref, UserProgress } from "../types/progress";
import type { SessionQueueItem } from "../lib/sessionBuilder";
import { t } from "../i18n/ui";
import { RichInteractiveText } from "./RichInteractiveText";
import { DiagramViewer } from "./DiagramViewer";
import { VrpCommandBlock } from "./VrpCommandBlock";
import { MiniChallengeCard } from "./MiniChallengeCard";
import { OfficialQuizCard } from "./OfficialQuizCard";

interface LessonPlayerProps {
  sessionTitle: string;
  sessionKey: string;
  queue: SessionQueueItem[];
  initialIndex?: number;
  progress: UserProgress;
  lang: LanguagePref;
  onExitHome: () => void;
  onStepCompleted: (stepId: string, lessonId: string, allLessonStepIds: string[]) => void;
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
  onUpdatePrefs: (
    patch: Partial<{ fontFamily: FontFamilyPref; fontSize: FontSizePref; language: LanguagePref }>
  ) => void;
  onOpenTutor: (slide: SlideStep, quote?: string) => void;
  onContinueMore: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  sessionTitle,
  sessionKey,
  queue,
  initialIndex = 0,
  progress,
  lang,
  onExitHome,
  onStepCompleted,
  onChallengeResult,
  onToggleBookmark,
  onAddHighlight,
  onRemoveHighlight,
  onUpdatePrefs,
  onOpenTutor,
  onContinueMore,
}) => {
  const ui = t(lang);
  const [index, setIndex] = useState(initialIndex);
  const [finished, setFinished] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [sessionChallengeStats, setSessionChallengeStats] = useState({ total: 0, correct: 0 });

  // Reset only when a NEW session starts (not when language toggles mid-slide!)
  useEffect(() => {
    setIndex(initialIndex);
    setFinished(false);
  }, [sessionKey, initialIndex]);

  const current = queue[index];

  const handleAdvance = () => {
    if (!current) return;
    const allIds = current.lesson.steps.map((s) => s.id);
    onStepCompleted(current.step.id, current.lesson.id, allIds);
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setFinished(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        handleAdvance();
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const readingFontClass =
    progress.prefs.fontFamily === "serif" ? "font-reading-serif" : "font-reading-sans";

  const readingSizeClass = {
    comfortable: "text-[17.5px] sm:text-[18.5px] leading-[1.78]",
    large: "text-[19px] sm:text-[20px] leading-[1.82]",
    xlarge: "text-[20.5px] sm:text-[22px] leading-[1.85]",
  }[progress.prefs.fontSize];

  if (finished || !current) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] px-4 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E8E4DC] bg-white p-8 sm:p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <p className="font-display text-xs font-extrabold tracking-widest text-emerald-700 uppercase">
            {ui.sessionComplete}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-[#111827]">
            {ui.greatMomentum}
          </h1>
          <p className="mt-2 text-base font-medium text-zinc-600">
            {ui.completedBlocksPrefix}
            <strong className="font-bold text-zinc-900">{queue.length}</strong>
            {ui.completedBlocksMid}
            <strong className="font-bold text-zinc-900">{sessionTitle}</strong>.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#ECE7DD] bg-[#FAF9F6] p-3.5">
              <p className="font-display text-2xl font-extrabold text-[#111827]">{queue.length}</p>
              <p className="text-xs font-semibold text-zinc-500">{ui.stepsDone}</p>
            </div>
            <div className="rounded-2xl border border-[#ECE7DD] bg-[#FAF9F6] p-3.5">
              <p className="font-display text-2xl font-extrabold text-amber-600">
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-5 w-5" />
                  {progress.streak.current}
                </span>
              </p>
              <p className="text-xs font-semibold text-zinc-500">{ui.dayStreak}</p>
            </div>
            <div className="rounded-2xl border border-[#ECE7DD] bg-[#FAF9F6] p-3.5">
              <p className="font-display text-2xl font-extrabold text-blue-700">
                {sessionChallengeStats.total > 0
                  ? `${Math.round((sessionChallengeStats.correct / sessionChallengeStats.total) * 100)}%`
                  : "100%"}
              </p>
              <p className="text-xs font-semibold text-zinc-500">{ui.challengeAcc}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onContinueMore}
              className="w-full sm:w-auto rounded-xl bg-[#18181B] px-6 py-3 font-display text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
            >
              {ui.keepGoing}
            </button>
            <button
              type="button"
              onClick={onExitHome}
              className="w-full sm:w-auto rounded-xl border border-[#E2DDD3] bg-[#FCFBF8] px-6 py-3 font-display text-sm font-bold text-zinc-800 hover:bg-zinc-100"
            >
              {ui.backHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { step, lesson, chapterId, chapterTitle, isReview, reviewReason } = current;
  const pct = Math.round(((index + 1) / queue.length) * 100);
  const isBookmarked = progress.bookmarkedStepIds.includes(step.id);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6]">
      <header className="sticky top-0 z-30 border-b border-[#E8E4DC] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onExitHome}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E2DDD3] bg-white text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-950"
              aria-label={ui.backHome}
            >
              <Home className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate font-display text-xs font-bold tracking-wide text-zinc-500 uppercase">
                {chapterTitle} · {ui.lessonWord} {lesson.number}
              </p>
              <p className="truncate font-display text-sm font-extrabold text-[#111827]">
                {lesson.title}
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowTypeMenu((s) => !s)}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E2DDD3] bg-white px-2.5 py-2 text-xs font-bold text-zinc-700 hover:border-zinc-400"
              title={ui.readingFont}
            >
              <Type className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Aa</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleBookmark(step.id)}
              className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                isBookmarked
                  ? "border-amber-400 bg-amber-50 text-amber-800"
                  : "border-[#E2DDD3] bg-white text-zinc-700 hover:border-zinc-400"
              }`}
              title={ui.reviewBtn}
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${isBookmarked ? "fill-amber-500 text-amber-600" : ""}`}
              />
              <span className="hidden sm:inline">{isBookmarked ? ui.saved : ui.reviewBtn}</span>
            </button>

            {step.kind !== "challenge" && (
              <button
                type="button"
                onClick={() => onOpenTutor(step)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 font-display text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{ui.askTutor}</span>
              </button>
            )}

            {showTypeMenu && (
              <div className="absolute top-12 right-0 z-50 w-64 rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-xl">
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

        <div className="h-1 w-full bg-[#ECE7DD]">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[780px] flex-1 px-4 py-6 sm:py-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${step.id}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {isReview && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-display text-xs font-bold text-amber-900">
                <span>
                  {reviewReason === "missed-challenge"
                    ? ui.reviewMissedBanner
                    : reviewReason === "bookmarked"
                      ? ui.reviewBookmarkBanner
                      : ui.reviewHighlightBanner}
                </span>
              </div>
            )}

            {step.kind === "challenge" ? (
              <MiniChallengeCard
                challenge={step.challenge}
                lang={lang}
                previousAccuracy={progress.challengeResults[step.challenge.id]}
                onResult={(cid, ok) => {
                  setSessionChallengeStats((prev) => ({
                    total: prev.total + 1,
                    correct: prev.correct + (ok ? 1 : 0),
                  }));
                  onChallengeResult(cid, ok);
                }}
              />
            ) : step.kind === "official-quiz" ? (
              <OfficialQuizCard
                step={step}
                chapterId={chapterId}
                lang={lang}
                highlights={progress.highlights}
                onAddHighlight={(quote) =>
                  onAddHighlight({
                    stepId: step.id,
                    chapterId,
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
            ) : (
              <article className="rounded-3xl border border-[#E8E4DC] bg-white p-6 sm:p-9 shadow-xs">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-stone-700">
                    <span>{step.sectionTitle}</span>
                    <span className="text-stone-400">·</span>
                    <span className="text-blue-700">
                      {ui.slideWord} {step.slideNumber}
                    </span>
                  </span>

                  {step.breadcrumbs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
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
                </div>

                <h1 className="mb-5 font-display text-2xl sm:text-[30px] font-extrabold leading-tight text-[#111827]">
                  {step.title}
                </h1>

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
                              lang={lang}
                              highlights={progress.highlights}
                              onAddHighlight={(quote) =>
                                onAddHighlight({
                                  stepId: step.id,
                                  chapterId,
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
                    lang={lang}
                  />
                )}

                {step.notes.length > 0 && (
                  <section className="mt-6 border-t border-[#F0ECE3] pt-5">
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
                                  lang={lang}
                                  highlights={progress.highlights}
                                  onAddHighlight={(quote) =>
                                    onAddHighlight({
                                      stepId: step.id,
                                      chapterId,
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
                  <VrpCommandBlock key={idx} block={vb} lang={lang} />
                ))}
              </article>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 z-20 border-t border-[#E8E4DC] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-4 py-3.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              setIndex((i) => Math.max(0, i - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-white px-4 py-2.5 font-display text-sm font-bold text-zinc-800 transition hover:border-zinc-400 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{ui.backBtn}</span>
          </button>

          <span className="font-display text-xs font-extrabold tracking-wide text-zinc-500">
            {ui.stepOf(index + 1, queue.length)}
          </span>

          <button
            type="button"
            onClick={handleAdvance}
            className="inline-flex items-center gap-2 rounded-xl bg-[#18181B] px-5 py-2.5 font-display text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
          >
            <span>{index + 1 === queue.length ? ui.finishSession : ui.continueBtn}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
