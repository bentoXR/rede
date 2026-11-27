import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChapterData, CourseManifest, LessonData, SlideStep } from "./types/content";
import type {
  CloudSettings,
  FontFamilyPref,
  FontSizePref,
  LanguagePref,
  SessionDuration,
  UserProgress,
} from "./types/progress";
import {
  addHighlight,
  loadCloudSettings,
  loadProgress,
  markStepCompleted,
  recordChallengeAttempt,
  removeHighlight,
  saveCloudSettings,
  saveProgress,
  toggleBookmark,
  updateTypographyPref,
} from "./lib/storage";
import {
  buildDailySession,
  buildReviewOnlySession,
  type SessionQueueItem,
} from "./lib/sessionBuilder";
import { getCurrentUser, getSupabaseClient, syncProgressWithCloud } from "./lib/sync";
import type { TutorContextPayload } from "./lib/tutor";
import { t } from "./i18n/ui";
import { HomeDashboard } from "./components/HomeDashboard";
import { ChapterExplorer } from "./components/ChapterExplorer";
import { LessonPlayer } from "./components/LessonPlayer";
import { ReviewVaultModal } from "./components/ReviewVaultModal";
import { AiTutorDrawer } from "./components/AiTutorDrawer";
import { SettingsSyncModal } from "./components/SettingsSyncModal";

type ActiveView = "home" | "chapters" | "player";

export function App() {
  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [settings, setSettings] = useState<CloudSettings>(() => loadCloudSettings());
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [view, setView] = useState<ActiveView>("home");
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(15);
  const [activeQueue, setActiveQueue] = useState<SessionQueueItem[]>([]);
  const [activeTitle, setActiveTitle] = useState<string>("Sessão Diária");
  const [activeSessionKey, setActiveSessionKey] = useState<string>("init");
  const [activeInitialIndex, setActiveInitialIndex] = useState<number>(0);

  const [vaultOpen, setVaultOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorCtx, setTutorCtx] = useState<TutorContextPayload | null>(null);

  const lang: LanguagePref = "pt";
  const ui = t(lang);

  // Load manifest once
  useEffect(() => {
    let cancelled = false;
    async function fetchManifest() {
      try {
        const res = await fetch("./content/manifest.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const mf = (await res.json()) as CourseManifest;
        if (!cancelled) setManifest(mf);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Não foi possível carregar o manifesto da trilha HCIA."
          );
        }
      }
    }
    fetchManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load chapter JSONs always in English (teaching material stays in English while UI is in PT-BR)
  useEffect(() => {
    if (!manifest) return;
    let cancelled = false;
    async function loadChapters() {
      try {
        const readyList = manifest!.chapters.filter((c) => c.ready);
        const loaded = await Promise.all(
          readyList.map(async (c) => {
            const enRes = await fetch(`./content/${c.id}/chapter.json`);
            if (!enRes.ok) throw new Error(`Falha ao carregar ${c.id}`);
            return (await enRes.json()) as ChapterData;
          })
        );
        if (cancelled) return;
        const sorted = loaded.sort((a, b) => a.number - b.number);
        setChapters(sorted);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Não foi possível carregar o conteúdo dos capítulos do HCIA."
          );
        }
      }
    }
    loadChapters();
    return () => {
      cancelled = true;
    };
  }, [manifest]);

  const refreshCloudSession = useCallback(async () => {
    const user = await getCurrentUser(settings);
    setUserEmail(user?.email ?? null);
    if (user) {
      const synced = await syncProgressWithCloud(settings, loadProgress());
      if (synced.ok && synced.merged) {
        const saved = saveProgress(synced.merged);
        setProgress(saved);
      }
    }
  }, [settings]);

  useEffect(() => {
    refreshCloudSession();
    const client = getSupabaseClient(settings);
    if (!client) return;
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [settings, refreshCloudSession]);

  const updateAndPersist = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => saveProgress(updater(prev)));
  }, []);

  const sessionPlan = useMemo(
    () => buildDailySession(chapters, progress, selectedDuration, lang),
    [chapters, progress, selectedDuration, lang]
  );

  const handleStartDailySession = (durationOverride?: SessionDuration) => {
    const dur = durationOverride ?? selectedDuration;
    const plan = buildDailySession(chapters, progress, dur, lang);
    if (plan.items.length === 0) return;
    setActiveQueue(plan.items);
    setActiveTitle(`Sessão Diária de ${dur} min`);
    setActiveSessionKey(`daily-${dur}-${Date.now()}`);
    setActiveInitialIndex(0);
    setView("player");
    window.scrollTo({ top: 0 });
  };

  const handleOpenLesson = (chapter: ChapterData, lesson: LessonData, startIdx = 0) => {
    const queue: SessionQueueItem[] = lesson.steps.map((step) => ({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      lesson,
      step,
      isReview: false,
    }));
    setActiveQueue(queue);
    setActiveTitle(`${ui.lessonWord} ${lesson.number} · ${lesson.title}`);
    setActiveSessionKey(`lesson-${lesson.id}-${startIdx}-${Date.now()}`);
    setActiveInitialIndex(startIdx);
    setView("player");
    window.scrollTo({ top: 0 });
  };

  const handleStartReviewSession = () => {
    const plan = buildReviewOnlySession(chapters, progress);
    if (plan.items.length === 0) return;
    setActiveQueue(plan.items);
    setActiveTitle(ui.vaultTitle);
    setActiveSessionKey(`review-${Date.now()}`);
    setActiveInitialIndex(0);
    setView("player");
    window.scrollTo({ top: 0 });
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center">
          <h1 className="font-display text-lg font-extrabold text-rose-800">
            Erro ao Carregar Conteúdo
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!manifest || chapters.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-xl bg-[#18181B]" />
          <p className="font-display text-sm font-bold text-zinc-600">{ui.loadingCurriculum}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === "home" && (
        <HomeDashboard
          manifest={manifest}
          loadedChapters={chapters}
          progress={progress}
          lang={lang}
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          sessionPlan={sessionPlan}
          onStartSession={() => handleStartDailySession()}
          onOpenChapters={() => setView("chapters")}
          onOpenVault={() => setVaultOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          cloudConnectedEmail={userEmail}
        />
      )}

      {view === "chapters" && (
        <ChapterExplorer
          manifest={manifest}
          loadedChapters={chapters}
          progress={progress}
          lang={lang}
          onBack={() => setView("home")}
          onOpenLesson={(ch, l) => handleOpenLesson(ch, l, 0)}
        />
      )}

      {view === "player" && (
        <LessonPlayer
          sessionTitle={activeTitle}
          sessionKey={activeSessionKey}
          queue={activeQueue}
          initialIndex={activeInitialIndex}
          progress={progress}
          lang={lang}
          onExitHome={() => {
            setView("home");
            if (userEmail) void syncProgressWithCloud(settings, loadProgress());
          }}
          onStepCompleted={(sid, lid, allIds) =>
            updateAndPersist((prev) => markStepCompleted(prev, sid, lid, allIds))
          }
          onChallengeResult={(cid, ok) =>
            updateAndPersist((prev) => recordChallengeAttempt(prev, cid, ok))
          }
          onToggleBookmark={(sid) => updateAndPersist((prev) => toggleBookmark(prev, sid))}
          onAddHighlight={(item) => updateAndPersist((prev) => addHighlight(prev, item))}
          onRemoveHighlight={(hid) => updateAndPersist((prev) => removeHighlight(prev, hid))}
          onUpdatePrefs={(
            patch: Partial<{
              fontFamily: FontFamilyPref;
              fontSize: FontSizePref;
              language: LanguagePref;
            }>
          ) => updateAndPersist((prev) => updateTypographyPref(prev, patch))}
          onOpenTutor={(slide: SlideStep, quote?: string) => {
            const currentItem = activeQueue.find((q) => q.step.id === slide.id);
            setTutorCtx({
              chapterTitle: currentItem?.chapterTitle ?? "HCIA-Datacom",
              lessonTitle: currentItem?.lesson.title ?? slide.sectionTitle,
              slide,
              selectedQuote: quote,
            });
            setTutorOpen(true);
          }}
          onContinueMore={() => handleStartDailySession(5)}
        />
      )}

      <ReviewVaultModal
        open={vaultOpen}
        onClose={() => setVaultOpen(false)}
        chapters={chapters}
        progress={progress}
        lang={lang}
        onStartReviewSession={handleStartReviewSession}
        onJumpToStep={(ch, l, idx) => handleOpenLesson(ch, l, idx)}
        onRemoveBookmark={(sid) => updateAndPersist((prev) => toggleBookmark(prev, sid))}
        onRemoveHighlight={(hid) => updateAndPersist((prev) => removeHighlight(prev, hid))}
      />

      <AiTutorDrawer
        open={tutorOpen}
        context={tutorCtx}
        settings={settings}
        lang={lang}
        onClose={() => setTutorOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsSyncModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(next) => {
          saveCloudSettings(next);
          setSettings(next);
        }}
        progress={progress}
        onReplaceProgress={(next) => {
          const saved = saveProgress(next);
          setProgress(saved);
        }}
        userEmail={userEmail}
        lang={lang}
        onAuthChanged={() => {
          void refreshCloudSession();
        }}
      />
    </>
  );
}

export default App;
