import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Cloud, Flame, Menu } from "lucide-react";
import type { ChapterData, CourseManifest, LessonData, SlideStep } from "./types/content";
import type { FontFamilyPref, FontSizePref, UserProgress } from "./types/progress";
import {
  addHighlight,
  loadCloudSettings,
  loadProgress,
  markLessonCompleted,
  recordChallengeAttempt,
  removeHighlight,
  saveProgress,
  toggleBookmark,
  toggleLessonCompleted,
  updateTypographyPref,
} from "./lib/storage";
import { getCurrentUser, getSupabaseClient, syncProgressWithCloud } from "./lib/sync";
import type { TutorContextPayload } from "./lib/tutor";
import { t } from "./i18n/ui";
import { CourseSidebar } from "./components/CourseSidebar";
import { HomeDashboard } from "./components/HomeDashboard";
import { LessonReader } from "./components/LessonReader";
import { ReviewVaultModal } from "./components/ReviewVaultModal";
import { AiTutorDrawer } from "./components/AiTutorDrawer";
import { AuthModal } from "./components/AuthModal";

export function App() {
  const [manifest, setManifest] = useState<CourseManifest | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const settings = useMemo(() => loadCloudSettings(), []);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<{
    chapterId: string;
    lessonId: string;
  } | null>(null);
  const [targetStepId, setTargetStepId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [vaultOpen, setVaultOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorCtx, setTutorCtx] = useState<TutorContextPayload | null>(null);

  const ui = t("pt");

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
        setChapters(loaded.sort((a, b) => a.number - b.number));
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o conteúdo dos capítulos do HCIA."
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

  const updateAndPersist = useCallback(
    (updater: (prev: UserProgress) => UserProgress) => {
      setProgress((prev) => {
        const saved = saveProgress(updater(prev));
        if (userEmail) {
          void syncProgressWithCloud(settings, saved);
        }
        return saved;
      });
    },
    [settings, userEmail]
  );

  const flatLessons = useMemo(() => {
    const list: Array<{ chapter: ChapterData; lesson: LessonData }> = [];
    for (const ch of chapters) {
      for (const l of ch.lessons) {
        list.push({ chapter: ch, lesson: l });
      }
    }
    return list;
  }, [chapters]);

  const nextSuggested = useMemo(() => {
    if (flatLessons.length === 0) return null;
    return (
      flatLessons.find((entry) => !progress.completedLessonIds.includes(entry.lesson.id)) ??
      flatLessons[0]
    );
  }, [flatLessons, progress.completedLessonIds]);

  const activeEntry = useMemo(() => {
    if (!selectedLesson) return null;
    const idx = flatLessons.findIndex(
      (e) => e.chapter.id === selectedLesson.chapterId && e.lesson.id === selectedLesson.lessonId
    );
    if (idx === -1) return null;
    return {
      ...flatLessons[idx],
      prev: idx > 0 ? flatLessons[idx - 1] : null,
      next: idx + 1 < flatLessons.length ? flatLessons[idx + 1] : null,
    };
  }, [flatLessons, selectedLesson]);

  const handleOpenLesson = (chapter: ChapterData, lesson: LessonData, stepId?: string) => {
    setSelectedLesson({ chapterId: chapter.id, lessonId: lesson.id });
    setTargetStepId(stepId ?? null);
    if (!stepId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const reviewVaultCount =
    progress.bookmarkedStepIds.length +
    progress.highlights.length +
    Object.values(progress.challengeResults).filter((r) => r.needsReview).length;

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
    <div className="flex min-h-screen flex-col bg-[#FAF9F6]">
      {/* Global Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E4DC] bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2DDD3] bg-white text-zinc-800 hover:border-zinc-400 lg:hidden"
              aria-label="Abrir navegação do curso"
            >
              <Menu className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedLesson(null);
                setTargetStepId(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#18181B] font-display text-xs font-extrabold text-white shadow-xs">
                HC
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-extrabold text-[#111827]">
                  HCIA Studio
                </p>
                <p className="hidden sm:block truncate text-[11px] font-semibold text-zinc-500">
                  {manifest.courseTitle} · {ui.editionLabel}
                </p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 font-display text-xs font-extrabold text-amber-900"
              title={ui.dayStreak}
            >
              <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
              <span>{progress.streak.current}d</span>
            </div>

            <button
              type="button"
              onClick={() => setVaultOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD3] bg-white px-3 py-1.5 font-display text-xs font-bold text-zinc-800 transition hover:border-zinc-400"
            >
              <Bookmark className="h-3.5 w-3.5 text-amber-600" />
              <span>
                {ui.vault} ({reviewVaultCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD3] bg-white px-3 py-1.5 font-display text-xs font-bold text-zinc-800 transition hover:border-zinc-400"
            >
              <Cloud
                className={`h-3.5 w-3.5 ${userEmail ? "text-emerald-600" : "text-zinc-500"}`}
              />
              <span className="max-w-[120px] truncate">
                {userEmail ? userEmail.split("@")[0] : "Entrar"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split: Fixed Course Sidebar + Scrollable Content */}
      <div className="flex flex-1">
        <CourseSidebar
          manifest={manifest}
          loadedChapters={chapters}
          progress={progress}
          activeLessonId={activeEntry?.lesson.id ?? null}
          nextSuggestedLessonId={nextSuggested?.lesson.id ?? null}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onGoHome={() => {
            setSelectedLesson(null);
            setTargetStepId(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onSelectLesson={(ch, l) => handleOpenLesson(ch, l)}
        />

        <main className="flex-1 min-w-0">
          {activeEntry ? (
            <LessonReader
              chapter={activeEntry.chapter}
              lesson={activeEntry.lesson}
              targetStepId={targetStepId}
              progress={progress}
              prevEntry={activeEntry.prev}
              nextEntry={activeEntry.next}
              onToggleLessonCompleted={(lid, allIds) =>
                updateAndPersist((prev) => toggleLessonCompleted(prev, lid, allIds))
              }
              onCompleteAndNext={(lid, allIds, next) => {
                updateAndPersist((prev) => markLessonCompleted(prev, lid, allIds));
                handleOpenLesson(next.chapter, next.lesson);
              }}
              onSelectEntry={(entry) => handleOpenLesson(entry.chapter, entry.lesson)}
              onChallengeResult={(cid, ok) =>
                updateAndPersist((prev) => recordChallengeAttempt(prev, cid, ok))
              }
              onToggleBookmark={(sid) => updateAndPersist((prev) => toggleBookmark(prev, sid))}
              onAddHighlight={(item) => updateAndPersist((prev) => addHighlight(prev, item))}
              onRemoveHighlight={(hid) => updateAndPersist((prev) => removeHighlight(prev, hid))}
              onUpdatePrefs={(patch: Partial<{ fontFamily: FontFamilyPref; fontSize: FontSizePref }>) =>
                updateAndPersist((prev) => updateTypographyPref(prev, patch))
              }
              onOpenTutor={(slide: SlideStep, quote?: string) => {
                setTutorCtx({
                  chapterTitle: activeEntry.chapter.title,
                  lessonTitle: activeEntry.lesson.title,
                  slide,
                  selectedQuote: quote,
                });
                setTutorOpen(true);
              }}
            />
          ) : (
            <HomeDashboard
              manifest={manifest}
              loadedChapters={chapters}
              progress={progress}
              nextSuggested={nextSuggested}
              onOpenLesson={(ch, l) => handleOpenLesson(ch, l)}
            />
          )}
        </main>
      </div>

      <ReviewVaultModal
        open={vaultOpen}
        onClose={() => setVaultOpen(false)}
        chapters={chapters}
        progress={progress}
        lang="pt"
        onJumpToStep={(ch, l, stepId) => handleOpenLesson(ch, l, stepId)}
        onRemoveBookmark={(sid) => updateAndPersist((prev) => toggleBookmark(prev, sid))}
        onRemoveHighlight={(hid) => updateAndPersist((prev) => removeHighlight(prev, hid))}
      />

      <AiTutorDrawer
        open={tutorOpen}
        context={tutorCtx}
        settings={settings}
        lang="pt"
        onClose={() => setTutorOpen(false)}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        settings={settings}
        progress={progress}
        onReplaceProgress={(next) => {
          const saved = saveProgress(next);
          setProgress(saved);
        }}
        userEmail={userEmail}
        onAuthChanged={() => {
          void refreshCloudSession();
        }}
      />
    </div>
  );
}

export default App;
