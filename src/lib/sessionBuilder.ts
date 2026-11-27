import type { ChapterData, LessonData, StudyStep } from "../types/content";
import type { LanguagePref, SessionDuration, UserProgress } from "../types/progress";
import { t } from "../i18n/ui";

export interface SessionQueueItem {
  chapterId: string;
  chapterTitle: string;
  lesson: LessonData;
  step: StudyStep;
  isReview: boolean;
  reviewReason?: "missed-challenge" | "bookmarked" | "highlighted";
}

export interface DailySessionPlan {
  duration: SessionDuration;
  items: SessionQueueItem[];
  reviewCount: number;
  newCount: number;
  estimatedMinutes: number;
  headline: string;
  subline: string;
}

const STEP_BUDGET: Record<SessionDuration, { total: number; maxReviews: number }> = {
  5: { total: 5, maxReviews: 2 },
  15: { total: 13, maxReviews: 4 },
  30: { total: 24, maxReviews: 6 },
};

export function buildDailySession(
  chapters: ChapterData[],
  progress: UserProgress,
  duration: SessionDuration,
  lang: LanguagePref = "pt"
): DailySessionPlan {
  const ui = t(lang);
  const { total, maxReviews } = STEP_BUDGET[duration];
  const completed = new Set(progress.completedStepIds);
  const bookmarked = new Set(progress.bookmarkedStepIds);
  const highlightedStepIds = new Set(progress.highlights.map((h) => h.stepId));

  // Index all loaded steps in curriculum order
  const allEntries: SessionQueueItem[] = [];
  for (const ch of chapters) {
    for (const lesson of ch.lessons) {
      for (const step of lesson.steps) {
        allEntries.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          lesson,
          step,
          isReview: false,
        });
      }
    }
  }

  const byId = new Map(allEntries.map((e) => [e.step.id, e]));
  const reviewItems: SessionQueueItem[] = [];
  const usedIds = new Set<string>();

  // 1. Priority: missed challenges needing review
  for (const [cid, res] of Object.entries(progress.challengeResults)) {
    if (reviewItems.length >= maxReviews) break;
    if (!res.needsReview) continue;
    const entry = byId.get(cid);
    if (entry && !usedIds.has(entry.step.id)) {
      usedIds.add(entry.step.id);
      reviewItems.push({ ...entry, isReview: true, reviewReason: "missed-challenge" });
    }
  }

  // 2. Bookmarked slides ("Review later")
  for (const sid of bookmarked) {
    if (reviewItems.length >= maxReviews) break;
    const entry = byId.get(sid);
    if (entry && !usedIds.has(entry.step.id)) {
      usedIds.add(entry.step.id);
      reviewItems.push({ ...entry, isReview: true, reviewReason: "bookmarked" });
    }
  }

  // 3. Highlighted slides not yet queued
  for (const sid of highlightedStepIds) {
    if (reviewItems.length >= maxReviews) break;
    const entry = byId.get(sid);
    if (entry && !usedIds.has(entry.step.id) && completed.has(sid)) {
      usedIds.add(entry.step.id);
      reviewItems.push({ ...entry, isReview: true, reviewReason: "highlighted" });
    }
  }

  // 4. Fill remaining budget with upcoming uncompleted steps
  const newItems: SessionQueueItem[] = [];
  const remainingSlots = Math.max(1, total - reviewItems.length);
  for (const entry of allEntries) {
    if (newItems.length >= remainingSlots) break;
    if (!completed.has(entry.step.id) && !usedIds.has(entry.step.id)) {
      usedIds.add(entry.step.id);
      newItems.push({ ...entry, isReview: false });
    }
  }

  // If user finished everything available, populate refresher steps
  if (newItems.length === 0 && reviewItems.length === 0 && allEntries.length > 0) {
    for (const entry of allEntries.slice(0, total)) {
      reviewItems.push({ ...entry, isReview: true, reviewReason: "bookmarked" });
    }
  }

  const items = [...reviewItems, ...newItems];
  const firstNew = newItems[0] ?? items[0];
  const headline = firstNew
    ? `Cap. ${String(chapters.find((c) => c.id === firstNew.chapterId)?.number ?? 1).padStart(2, "0")} · ${firstNew.lesson.title}`
    : "HCIA-Datacom";

  const parts: string[] = [];
  if (reviewItems.length > 0) parts.push(`${reviewItems.length} ${ui.reviewTag}`);
  if (newItems.length > 0) parts.push(`${newItems.length} ${ui.newTag}`);
  const subline = parts.length > 0 ? `${parts.join(" + ")} ${ui.stepsQueued}` : ui.readyToStart;

  return {
    duration,
    items,
    reviewCount: reviewItems.length,
    newCount: newItems.length,
    estimatedMinutes: Math.max(2, Math.round(items.length * 1.1)),
    headline,
    subline,
  };
}

export function buildReviewOnlySession(
  chapters: ChapterData[],
  progress: UserProgress
): DailySessionPlan {
  const allEntries: SessionQueueItem[] = [];
  for (const ch of chapters) {
    for (const lesson of ch.lessons) {
      for (const step of lesson.steps) {
        allEntries.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          lesson,
          step,
          isReview: true,
        });
      }
    }
  }
  const byId = new Map(allEntries.map((e) => [e.step.id, e]));
  const items: SessionQueueItem[] = [];
  const seen = new Set<string>();

  for (const [cid, res] of Object.entries(progress.challengeResults)) {
    if (res.needsReview && byId.has(cid) && !seen.has(cid)) {
      seen.add(cid);
      items.push({ ...byId.get(cid)!, reviewReason: "missed-challenge" });
    }
  }
  for (const sid of progress.bookmarkedStepIds) {
    if (byId.has(sid) && !seen.has(sid)) {
      seen.add(sid);
      items.push({ ...byId.get(sid)!, reviewReason: "bookmarked" });
    }
  }
  for (const h of progress.highlights) {
    if (byId.has(h.stepId) && !seen.has(h.stepId)) {
      seen.add(h.stepId);
      items.push({ ...byId.get(h.stepId)!, reviewReason: "highlighted" });
    }
  }

  return {
    duration: 15,
    items,
    reviewCount: items.length,
    newCount: 0,
    estimatedMinutes: Math.max(2, Math.round(items.length * 1.2)),
    headline: "Cofre de Revisão Pessoal",
    subline: `${items.length} itens salvos e errados`,
  };
}
