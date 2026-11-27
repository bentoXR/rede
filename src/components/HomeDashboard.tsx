import React from "react";
import { ArrowRight, CheckCircle2, Clock, Compass, Play } from "lucide-react";
import type { ChapterData, CourseManifest, LessonData } from "../types/content";
import type { UserProgress } from "../types/progress";

interface HomeDashboardProps {
  manifest: CourseManifest;
  loadedChapters: ChapterData[];
  progress: UserProgress;
  nextSuggested: { chapter: ChapterData; lesson: LessonData } | null;
  onOpenLesson: (chapter: ChapterData, lesson: LessonData) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  manifest,
  loadedChapters,
  progress,
  nextSuggested,
  onOpenLesson,
}) => {
  const upcomingChapters = manifest.chapters.filter((c) => !c.ready);

  return (
    <div className="mx-auto max-w-4xl px-5 py-7 sm:py-9 space-y-8">
      {/* Suggested next lesson banner (keeps the thread without locking anything) */}
      {nextSuggested && (
        <section className="rounded-3xl border border-[#E6E1D6] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-blue-700 uppercase">
              <Compass className="h-3.5 w-3.5" />
              <span>Continuar na ordem sugerida</span>
            </span>
            <span className="text-xs font-semibold text-zinc-500">
              Acesso livre · pule para qualquer capítulo quando quiser
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="font-display text-xs font-bold text-blue-700">
                Cap. {String(nextSuggested.chapter.number).padStart(2, "0")} ·{" "}
                {nextSuggested.chapter.title}
              </p>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                {nextSuggested.lesson.number} · {nextSuggested.lesson.title}
              </h1>
              <p className="mt-1.5 text-sm sm:text-base font-medium text-zinc-600">
                {nextSuggested.lesson.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenLesson(nextSuggested.chapter, nextSuggested.lesson)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#18181B] px-6 py-3.5 font-display text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>Abrir Lição</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* Open catalog of ready chapters & lessons */}
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-lg font-extrabold text-[#111827]">
            Capítulos Disponíveis Agora
          </h2>
          <p className="text-xs sm:text-sm font-medium text-zinc-500">
            Clique em qualquer lição para abrir o conteúdo completo em rolagem contínua.
          </p>
        </div>

        <div className="space-y-5">
          {loadedChapters.map((chapter) => {
            const doneCount = chapter.lessons.filter((l) =>
              progress.completedLessonIds.includes(l.id)
            ).length;

            return (
              <div
                key={chapter.id}
                className="overflow-hidden rounded-3xl border border-[#E6E1D6] bg-white shadow-2xs"
              >
                <div className="border-b border-[#F0ECE3] bg-[#FCFBF8] px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#18181B] font-display text-sm font-extrabold text-white">
                        {String(chapter.number).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-extrabold text-[#111827]">
                          {chapter.title}
                        </h3>
                        <p className="text-xs font-semibold text-zinc-500">
                          Páginas {chapter.pageRange} · {doneCount}/{chapter.lessons.length} lições
                          concluídas
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-600">{chapter.description}</p>
                </div>

                <div className="divide-y divide-[#F2EFE8]">
                  {chapter.lessons.map((lesson) => {
                    const isDone = progress.completedLessonIds.includes(lesson.id);
                    const isNext = nextSuggested?.lesson.id === lesson.id;
                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 transition hover:bg-[#FCFBF8]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-xs font-extrabold text-blue-700">
                              Lição {lesson.number}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {lesson.estimatedMinutes} min
                            </span>
                            {isDone && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Concluída
                              </span>
                            )}
                            {isNext && !isDone && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                Próxima sugerida
                              </span>
                            )}
                          </div>
                          <h4 className="mt-0.5 font-display text-base font-extrabold text-[#111827]">
                            {lesson.title}
                          </h4>
                          <p className="mt-0.5 text-sm font-medium text-zinc-600">
                            {lesson.summary}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenLesson(chapter, lesson)}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#18181B] px-4 py-2.5 font-display text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Abrir</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Upcoming chapters (clean list, no lock, no technical CLI hints) */}
      {upcomingChapters.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-base font-extrabold text-[#111827]">
              Próximos Capítulos (Em breve)
            </h2>
            <p className="text-xs font-medium text-zinc-500">
              Restante da ementa Huawei HCIA-Datacom V2.0 que será adicionada em seguida.
            </p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {upcomingChapters.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#ECE7DD] bg-white/80 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 font-display text-xs font-extrabold text-stone-600">
                    {String(ch.number).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-bold text-zinc-800">
                      {ch.title}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-500">Págs. {ch.pageRange}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-stone-600">
                  Em breve
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
