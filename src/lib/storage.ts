import type {
  CloudSettings,
  FontFamilyPref,
  FontSizePref,
  HighlightItem,
  LanguagePref,
  UserProgress,
} from "../types/progress";
import { APP_CONFIG } from "./appConfig";

const PROGRESS_KEY = "hcia_studio_progress_v1";

export function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function createDefaultProgress(): UserProgress {
  return {
    completedStepIds: [],
    completedLessonIds: [],
    challengeResults: {},
    bookmarkedStepIds: [],
    highlights: [],
    streak: {
      current: 0,
      best: 0,
      lastStudyDate: null,
    },
    totalMinutesStudied: 0,
    lastVisitedLessonId: null,
    prefs: {
      fontFamily: "sans",
      fontSize: "comfortable",
      language: "pt",
    },
    updatedAt: new Date(0).toISOString(),
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    const def = createDefaultProgress();
    return {
      ...def,
      ...parsed,
      streak: { ...def.streak, ...(parsed.streak ?? {}) },
      prefs: { ...def.prefs, ...(parsed.prefs ?? {}) },
      completedStepIds: Array.isArray(parsed.completedStepIds) ? parsed.completedStepIds : [],
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      bookmarkedStepIds: Array.isArray(parsed.bookmarkedStepIds) ? parsed.bookmarkedStepIds : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      challengeResults: parsed.challengeResults ?? {},
    };
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): UserProgress {
  const next: UserProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

export function bumpStreak(progress: UserProgress): UserProgress {
  const today = todayIsoDate();
  const { lastStudyDate, current, best } = progress.streak;
  if (lastStudyDate === today) {
    return progress;
  }
  const nextCurrent = lastStudyDate === yesterdayIsoDate() ? current + 1 : 1;
  return {
    ...progress,
    streak: {
      current: nextCurrent,
      best: Math.max(best, nextCurrent),
      lastStudyDate: today,
    },
  };
}

export function markStepCompleted(
  progress: UserProgress,
  stepId: string,
  lessonId?: string,
  allLessonStepIds?: string[]
): UserProgress {
  const completedSet = new Set(progress.completedStepIds);
  completedSet.add(stepId);
  const completedLessons = new Set(progress.completedLessonIds);
  if (lessonId && allLessonStepIds && allLessonStepIds.every((id) => completedSet.has(id))) {
    completedLessons.add(lessonId);
  }
  return bumpStreak({
    ...progress,
    completedStepIds: Array.from(completedSet),
    completedLessonIds: Array.from(completedLessons),
    lastVisitedLessonId: lessonId ?? progress.lastVisitedLessonId,
  });
}

export function recordChallengeAttempt(
  progress: UserProgress,
  challengeId: string,
  isCorrect: boolean
): UserProgress {
  const prev = progress.challengeResults[challengeId];
  const now = new Date().toISOString();
  return bumpStreak({
    ...progress,
    challengeResults: {
      ...progress.challengeResults,
      [challengeId]: {
        attempts: (prev?.attempts ?? 0) + 1,
        correct: (prev?.correct ?? 0) + (isCorrect ? 1 : 0),
        lastAttemptAt: now,
        lastWrongAt: isCorrect ? prev?.lastWrongAt : now,
        needsReview: !isCorrect,
      },
    },
  });
}

export function toggleBookmark(progress: UserProgress, stepId: string): UserProgress {
  const exists = progress.bookmarkedStepIds.includes(stepId);
  const bookmarkedStepIds = exists
    ? progress.bookmarkedStepIds.filter((id) => id !== stepId)
    : [stepId, ...progress.bookmarkedStepIds];
  return { ...progress, bookmarkedStepIds };
}

export function addHighlight(
  progress: UserProgress,
  item: Omit<HighlightItem, "id" | "createdAt">
): UserProgress {
  const quote = item.quote.trim();
  if (quote.length < 3) return progress;
  const dup = progress.highlights.some(
    (h) => h.stepId === item.stepId && h.quote.toLowerCase() === quote.toLowerCase()
  );
  if (dup) return progress;
  const next: HighlightItem = {
    ...item,
    quote,
    id: `${item.stepId}-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  return {
    ...progress,
    highlights: [next, ...progress.highlights],
  };
}

export function removeHighlight(progress: UserProgress, highlightId: string): UserProgress {
  return {
    ...progress,
    highlights: progress.highlights.filter((h) => h.id !== highlightId),
  };
}

export function updateTypographyPref(
  progress: UserProgress,
  patch: Partial<{ fontFamily: FontFamilyPref; fontSize: FontSizePref; language: LanguagePref }>
): UserProgress {
  return {
    ...progress,
    prefs: {
      ...progress.prefs,
      ...patch,
    },
  };
}

export function markLessonCompleted(
  progress: UserProgress,
  lessonId: string,
  allLessonStepIds: string[]
): UserProgress {
  const completedSet = new Set(progress.completedStepIds);
  for (const id of allLessonStepIds) completedSet.add(id);
  const completedLessons = new Set(progress.completedLessonIds);
  completedLessons.add(lessonId);
  return bumpStreak({
    ...progress,
    completedStepIds: Array.from(completedSet),
    completedLessonIds: Array.from(completedLessons),
    lastVisitedLessonId: lessonId,
  });
}

export function toggleLessonCompleted(
  progress: UserProgress,
  lessonId: string,
  allLessonStepIds: string[]
): UserProgress {
  const isDone = progress.completedLessonIds.includes(lessonId);
  if (!isDone) {
    return markLessonCompleted(progress, lessonId, allLessonStepIds);
  }
  const removeSet = new Set(allLessonStepIds);
  return {
    ...progress,
    completedStepIds: progress.completedStepIds.filter((id) => !removeSet.has(id)),
    completedLessonIds: progress.completedLessonIds.filter((id) => id !== lessonId),
  };
}

export function loadCloudSettings(): CloudSettings {
  return {
    supabaseUrl: APP_CONFIG.supabaseUrl,
    supabaseAnonKey: APP_CONFIG.supabaseAnonKey,
    tutorWorkerUrl: APP_CONFIG.tutorWorkerUrl,
    geminiApiKey: "",
  };
}

export function mergeUserProgress(local: UserProgress, remote: UserProgress): UserProgress {
  const completedStepIds = Array.from(
    new Set([...local.completedStepIds, ...remote.completedStepIds])
  );
  const completedLessonIds = Array.from(
    new Set([...local.completedLessonIds, ...remote.completedLessonIds])
  );
  const bookmarkedStepIds = Array.from(
    new Set([...local.bookmarkedStepIds, ...remote.bookmarkedStepIds])
  );

  const highlightMap = new Map<string, HighlightItem>();
  for (const h of [...remote.highlights, ...local.highlights]) {
    const key = `${h.stepId}::${h.quote.toLowerCase()}`;
    if (!highlightMap.has(key)) {
      highlightMap.set(key, h);
    }
  }

  const challengeResults = { ...remote.challengeResults };
  for (const [cid, localRes] of Object.entries(local.challengeResults)) {
    const remRes = challengeResults[cid];
    if (!remRes || localRes.lastAttemptAt >= remRes.lastAttemptAt) {
      challengeResults[cid] = localRes;
    }
  }

  const localNewer = local.updatedAt >= remote.updatedAt;
  return {
    completedStepIds,
    completedLessonIds,
    challengeResults,
    bookmarkedStepIds,
    highlights: Array.from(highlightMap.values()),
    streak: {
      current: Math.max(local.streak.current, remote.streak.current),
      best: Math.max(local.streak.best, remote.streak.best),
      lastStudyDate:
        (local.streak.lastStudyDate ?? "") >= (remote.streak.lastStudyDate ?? "")
          ? local.streak.lastStudyDate
          : remote.streak.lastStudyDate,
    },
    totalMinutesStudied: Math.max(local.totalMinutesStudied, remote.totalMinutesStudied),
    lastVisitedLessonId: localNewer ? local.lastVisitedLessonId : remote.lastVisitedLessonId,
    prefs: localNewer ? local.prefs : remote.prefs,
    updatedAt: localNewer ? local.updatedAt : remote.updatedAt,
  };
}
