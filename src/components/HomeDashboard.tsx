import React from "react";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
import type { ChapterData, CourseManifest } from "../types/content";
import type { LanguagePref, SessionDuration, UserProgress } from "../types/progress";
import type { DailySessionPlan } from "../lib/sessionBuilder";
import { t } from "../i18n/ui";

interface HomeDashboardProps {
  manifest: CourseManifest;
  loadedChapters: ChapterData[];
  progress: UserProgress;
  lang: LanguagePref;
  selectedDuration: SessionDuration;
  onSelectDuration: (d: SessionDuration) => void;
  sessionPlan: DailySessionPlan;
  onStartSession: () => void;
  onOpenChapters: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  cloudConnectedEmail: string | null;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  manifest,
  loadedChapters,
  progress,
  lang,
  selectedDuration,
  onSelectDuration,
  sessionPlan,
  onStartSession,
  onOpenChapters,
  onOpenVault,
  onOpenSettings,
  cloudConnectedEmail,
}) => {
  const ui = t(lang);

  const readyStepTotal = loadedChapters.reduce(
    (sum, ch) => sum + ch.lessons.reduce((lSum, l) => lSum + l.steps.length, 0),
    0
  );
  const completedReadySteps = progress.completedStepIds.length;
  const readyPct =
    readyStepTotal > 0 ? Math.min(100, Math.round((completedReadySteps / readyStepTotal) * 100)) : 0;

  const reviewVaultCount =
    progress.bookmarkedStepIds.length +
    progress.highlights.length +
    Object.values(progress.challengeResults).filter((r) => r.needsReview).length;

  const durations: Array<{ min: SessionDuration; tag: string; desc: string }> = [
    { min: 5, tag: ui.dur5Tag, desc: ui.dur5Desc },
    { min: 15, tag: ui.dur15Tag, desc: ui.dur15Desc },
    { min: 30, tag: ui.dur30Tag, desc: ui.dur30Desc },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#18181B] font-display text-sm font-extrabold text-white shadow-xs">
            HC
          </div>
          <div>
            <p className="font-display text-base font-extrabold text-[#111827]">HCIA Studio</p>
            <p className="text-xs font-semibold text-zinc-500">
              {manifest.courseTitle} · {ui.editionLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1.5 font-display text-xs font-extrabold text-amber-900"
            title={ui.dayStreak}
          >
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
            <span>{progress.streak.current}d</span>
          </div>

          <button
            type="button"
            onClick={onOpenVault}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD3] bg-white px-3 py-1.5 font-display text-xs font-bold text-zinc-800 transition hover:border-zinc-400"
          >
            <Bookmark className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {ui.vault} ({reviewVaultCount})
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD3] bg-white px-3 py-1.5 font-display text-xs font-bold text-zinc-800 transition hover:border-zinc-400"
            title={ui.settingsTitle}
          >
            <Cloud
              className={`h-3.5 w-3.5 ${cloudConnectedEmail ? "text-emerald-600" : "text-zinc-500"}`}
            />
            <span className="hidden sm:inline">
              {cloudConnectedEmail ? ui.synced : ui.syncAndAi}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-4 pb-16">
        <section className="rounded-3xl border border-[#E6E1D6] bg-white p-6 sm:p-10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-blue-700 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{ui.dailySessionMode}</span>
            </span>
            <span className="text-xs font-bold text-zinc-500">{ui.zeroFriction}</span>
          </div>

          <h1 className="mt-4 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
            {ui.heroQuestion}
          </h1>
          <p className="mt-2 max-w-2xl text-[16.5px] leading-relaxed font-medium text-zinc-600">
            {ui.heroDescPrefix}
            <strong className="font-bold text-zinc-900">{ui.heroDescHighlight}</strong>
            {ui.heroDescSuffix}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {durations.map((d) => {
              const active = selectedDuration === d.min;
              return (
                <button
                  key={d.min}
                  type="button"
                  onClick={() => onSelectDuration(d.min)}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    active
                      ? "border-[#18181B] bg-[#FCFBF8] shadow-xs ring-2 ring-zinc-900/10"
                      : "border-[#E8E4DC] bg-white hover:border-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-extrabold text-[#111827]">
                      {d.min} min
                    </span>
                    <Clock className={`h-4 w-4 ${active ? "text-blue-600" : "text-zinc-400"}`} />
                  </div>
                  <p className="mt-1 font-display text-xs font-extrabold text-blue-700 uppercase">
                    {d.tag}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-zinc-500">{d.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#ECE7DD] bg-[#FAF9F6] p-4 sm:p-5">
            <div>
              <p className="font-display text-xs font-extrabold tracking-wider text-zinc-500 uppercase">
                {ui.upNext}
              </p>
              <p className="mt-1 font-display text-lg font-extrabold text-[#111827]">
                {sessionPlan.headline}
              </p>
              <p className="text-sm font-semibold text-zinc-600">{sessionPlan.subline}</p>
            </div>

            <button
              type="button"
              onClick={onStartSession}
              disabled={sessionPlan.items.length === 0}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#18181B] px-7 py-4 font-display text-base font-extrabold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-40"
            >
              <span>{ui.startSession(selectedDuration)}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E8E4DC] bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h2 className="font-display text-sm font-extrabold text-[#111827]">
                  {ui.curriculumProgress}
                </h2>
              </div>
              <span className="font-display text-sm font-extrabold text-blue-700">{readyPct}%</span>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#EFECE4]">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${readyPct}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-zinc-600">
              <span>{ui.convertedSteps(completedReadySteps, readyStepTotal)}</span>
              <span>
                {ui.chaptersReady(
                  manifest.chapters.filter((c) => c.ready).length,
                  manifest.chapters.length
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenChapters}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2DDD3] bg-[#FCFBF8] px-4 py-2.5 font-display text-sm font-bold text-zinc-900 transition hover:border-zinc-400 hover:bg-white"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{ui.browseAll}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-[#E8E4DC] bg-white p-6">
            <h2 className="font-display text-sm font-extrabold text-[#111827]">
              {ui.readyNowTitle}
            </h2>
            <p className="mt-1 text-xs font-semibold text-zinc-500">{ui.readyNowDesc}</p>
            <div className="mt-3.5 space-y-2.5">
              {loadedChapters.map((ch) => {
                const steps = ch.lessons.flatMap((l) => l.steps);
                const doneCount = steps.filter((s) =>
                  progress.completedStepIds.includes(s.id)
                ).length;
                const doneAll = steps.length > 0 && doneCount === steps.length;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={onOpenChapters}
                    className="flex w-full items-center justify-between rounded-xl border border-[#ECE7DD] bg-[#FAF9F6] px-3.5 py-2.5 text-left transition hover:border-blue-400 hover:bg-white"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-display text-sm font-bold text-[#111827]">
                        {String(ch.number).padStart(2, "0")} · {ch.title}
                      </p>
                      <p className="text-xs font-semibold text-zinc-500">
                        {ui.lessonsAndSteps(ch.lessons.length, doneCount, steps.length)}
                      </p>
                    </div>
                    {doneAll ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
