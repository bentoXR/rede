import React, { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Lock,
  Play,
} from "lucide-react";
import type { ChapterData, CourseManifest, LessonData } from "../types/content";
import type { LanguagePref, UserProgress } from "../types/progress";
import { t } from "../i18n/ui";

interface ChapterExplorerProps {
  manifest: CourseManifest;
  loadedChapters: ChapterData[];
  progress: UserProgress;
  lang: LanguagePref;
  onBack: () => void;
  onOpenLesson: (chapter: ChapterData, lesson: LessonData) => void;
}

export const ChapterExplorer: React.FC<ChapterExplorerProps> = ({
  manifest,
  loadedChapters,
  progress,
  lang,
  onBack,
  onOpenLesson,
}) => {
  const ui = t(lang);
  const [expandedId, setExpandedId] = useState<string>("ch01");
  const byId = new Map(loadedChapters.map((c) => [c.id, c]));

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="sticky top-0 z-20 border-b border-[#E8E4DC] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E2DDD3] bg-white px-3.5 py-2 font-display text-sm font-bold text-zinc-800 hover:border-zinc-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{ui.backToDaily}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
              {ui.curriculumHeader}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="font-display text-3xl font-extrabold text-[#111827]">{ui.roadmapTitle}</h1>
        <p className="mt-1.5 text-base font-medium text-zinc-600">
          {ui.roadmapDescPrefix}
          <code className="rounded bg-stone-200/70 px-1.5 py-0.5 text-xs font-bold text-zinc-900">
            python3 tools/extract_hcia.py --all
          </code>
          {ui.roadmapDescSuffix}
        </p>

        <div className="mt-6 space-y-3">
          {manifest.chapters.map((summary) => {
            const fullChapter = byId.get(summary.id);
            const isExpanded = expandedId === summary.id && Boolean(fullChapter);
            const allSteps = fullChapter ? fullChapter.lessons.flatMap((l) => l.steps) : [];
            const doneCount = allSteps.filter((s) =>
              progress.completedStepIds.includes(s.id)
            ).length;
            const displayTitle = fullChapter?.title ?? summary.title;

            return (
              <div
                key={summary.id}
                className={`overflow-hidden rounded-2xl border bg-white transition ${
                  summary.ready ? "border-[#E6E1D6]" : "border-[#EFECE4] opacity-80"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    summary.ready &&
                    setExpandedId((prev) => (prev === summary.id ? "" : summary.id))
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#FCFBF8]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-extrabold ${
                        summary.ready
                          ? "bg-[#18181B] text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {String(summary.number).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-extrabold text-[#111827]">
                        {displayTitle}
                      </p>
                      <p className="text-xs font-semibold text-zinc-500">
                        {ui.pagesLabel(summary.pageRange, summary.pageCount)}
                        {summary.ready && fullChapter
                          ? ` · ${ui.lessonsAndSteps(fullChapter.lessons.length, doneCount, allSteps.length)}`
                          : ` · ${ui.pendingConversion}`}
                      </p>
                    </div>
                  </div>

                  {summary.ready ? (
                    isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
                    )
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-500">
                      <Lock className="h-3 w-3" />
                      <span>{ui.phase2}</span>
                    </span>
                  )}
                </button>

                {isExpanded && fullChapter && (
                  <div className="border-t border-[#F0ECE3] bg-[#FCFBF8] px-5 py-4 space-y-2.5">
                    <p className="mb-3 text-sm font-medium text-zinc-600">
                      {fullChapter.description}
                    </p>
                    {fullChapter.lessons.map((lesson) => {
                      const lDone = lesson.steps.filter((s) =>
                        progress.completedStepIds.includes(s.id)
                      ).length;
                      const lComplete = lesson.steps.length > 0 && lDone === lesson.steps.length;
                      return (
                        <div
                          key={lesson.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E8E4DC] bg-white p-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-xs font-extrabold text-blue-700">
                                {ui.lessonWord} {lesson.number}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                                <Clock className="h-3 w-3" />
                                {lesson.estimatedMinutes} min
                              </span>
                              {lComplete && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {ui.doneBadge}
                                </span>
                              )}
                            </div>
                            <h3 className="mt-0.5 font-display text-base font-extrabold text-[#111827]">
                              {lesson.title}
                            </h3>
                            <p className="mt-0.5 text-sm font-medium text-zinc-600">
                              {lesson.summary}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenLesson(fullChapter, lesson)}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#18181B] px-4 py-2.5 font-display text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>{lDone > 0 && !lComplete ? ui.resumeBtn : ui.openBtn}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
