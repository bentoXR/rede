import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  X,
} from "lucide-react";
import type { ChapterData, CourseManifest, LessonData } from "../types/content";
import type { UserProgress } from "../types/progress";

interface CourseSidebarProps {
  manifest: CourseManifest;
  loadedChapters: ChapterData[];
  progress: UserProgress;
  activeLessonId: string | null;
  nextSuggestedLessonId: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onGoHome: () => void;
  onSelectLesson: (chapter: ChapterData, lesson: LessonData) => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  manifest,
  loadedChapters,
  progress,
  activeLessonId,
  nextSuggestedLessonId,
  mobileOpen,
  onCloseMobile,
  onGoHome,
  onSelectLesson,
}) => {
  const chapterById = new Map(loadedChapters.map((c) => [c.id, c]));
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of loadedChapters) init[c.id] = true;
    return init;
  });

  const allReadyLessons = loadedChapters.flatMap((c) => c.lessons);
  const completedLessonsCount = allReadyLessons.filter((l) =>
    progress.completedLessonIds.includes(l.id)
  ).length;
  const pct =
    allReadyLessons.length > 0
      ? Math.round((completedLessonsCount / allReadyLessons.length) * 100)
      : 0;

  const toggleChapter = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#FAF9F6]">
      <div className="flex items-center justify-between border-b border-[#E8E4DC] px-4 py-3 lg:hidden">
        <span className="font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
          Navegação do Curso
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-stone-200/70"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[#E8E4DC] p-3.5 space-y-3">
        <button
          type="button"
          onClick={() => {
            onGoHome();
            onCloseMobile();
          }}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-display text-xs font-extrabold transition ${
            activeLessonId === null
              ? "bg-[#18181B] text-white shadow-2xs"
              : "bg-white text-zinc-800 border border-[#E2DDD3] hover:border-zinc-400"
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span>Visão Geral (Catálogo)</span>
        </button>

        <div className="rounded-xl border border-[#E8E4DC] bg-white px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
            <span>Progresso disponível</span>
            <span className="text-blue-700">
              {completedLessonsCount}/{allReadyLessons.length} lições ({pct}%)
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFECE4]">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <p className="px-2 pb-1 font-display text-[11px] font-extrabold tracking-wider text-zinc-500 uppercase">
          Ordem Sugerida · 23 Capítulos
        </p>

        {manifest.chapters.map((summary) => {
          const fullChapter = chapterById.get(summary.id);
          const isReady = summary.ready && Boolean(fullChapter);
          const isOpen = Boolean(expanded[summary.id]);

          if (!isReady || !fullChapter) {
            return (
              <div
                key={summary.id}
                className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-zinc-500"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-200/70 font-display text-[11px] font-bold text-stone-600">
                    {String(summary.number).padStart(2, "0")}
                  </span>
                  <span className="truncate text-xs font-semibold">{summary.title}</span>
                </div>
                <span className="shrink-0 rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                  Em breve
                </span>
              </div>
            );
          }

          const chDoneCount = fullChapter.lessons.filter((l) =>
            progress.completedLessonIds.includes(l.id)
          ).length;

          return (
            <div
              key={summary.id}
              className="rounded-xl border border-[#E8E4DC] bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleChapter(summary.id)}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-2.5 text-left hover:bg-[#FCFBF8]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#18181B] font-display text-[11px] font-extrabold text-white">
                    {String(summary.number).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-extrabold text-[#111827]">
                      {fullChapter.title}
                    </p>
                    <p className="text-[10.5px] font-semibold text-zinc-500">
                      {chDoneCount}/{fullChapter.lessons.length} lições
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-[#F0ECE3] bg-[#FCFBF8] p-1.5 space-y-1">
                  {fullChapter.lessons.map((lesson) => {
                    const isActive = activeLessonId === lesson.id;
                    const isDone = progress.completedLessonIds.includes(lesson.id);
                    const isNext = nextSuggestedLessonId === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          onSelectLesson(fullChapter, lesson);
                          onCloseMobile();
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                          isActive
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-zinc-800 hover:bg-stone-200/60"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {isDone ? (
                            <CheckCircle2
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive ? "text-emerald-200" : "text-emerald-600"
                              }`}
                            />
                          ) : (
                            <BookOpen
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive ? "text-blue-200" : "text-zinc-400"
                              }`}
                            />
                          )}
                          <span className="truncate text-xs font-semibold">
                            {lesson.number} · {lesson.title}
                          </span>
                        </div>
                        {isNext && !isActive && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                            Próxima
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block lg:w-80 lg:shrink-0 border-r border-[#E8E4DC] bg-[#FAF9F6]">
        <div className="sticky top-[61px] h-[calc(100vh-61px)] overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-70 flex bg-zinc-950/45 backdrop-blur-xs lg:hidden"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="h-full w-80 max-w-[85vw] border-r border-[#E2DDD3] bg-[#FAF9F6] shadow-2xl"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
