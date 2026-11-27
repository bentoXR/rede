import React, { useState } from "react";
import { AlertCircle, Bookmark, Highlighter, Play, Trash2, X } from "lucide-react";
import type { ChapterData, LessonData, StudyStep } from "../types/content";
import type { LanguagePref, UserProgress } from "../types/progress";
import { t } from "../i18n/ui";

interface ReviewVaultModalProps {
  open: boolean;
  onClose: () => void;
  chapters: ChapterData[];
  progress: UserProgress;
  lang: LanguagePref;
  onStartReviewSession: () => void;
  onJumpToStep: (chapter: ChapterData, lesson: LessonData, stepIndex: number) => void;
  onRemoveBookmark: (stepId: string) => void;
  onRemoveHighlight: (highlightId: string) => void;
}

export const ReviewVaultModal: React.FC<ReviewVaultModalProps> = ({
  open,
  onClose,
  chapters,
  progress,
  lang,
  onStartReviewSession,
  onJumpToStep,
  onRemoveBookmark,
  onRemoveHighlight,
}) => {
  const ui = t(lang);
  const [tab, setTab] = useState<"bookmarks" | "highlights" | "missed">("bookmarks");

  if (!open) return null;

  // Lookup index
  const stepLookup = new Map<
    string,
    { chapter: ChapterData; lesson: LessonData; step: StudyStep; idx: number }
  >();
  for (const ch of chapters) {
    for (const l of ch.lessons) {
      l.steps.forEach((s, idx) => {
        stepLookup.set(s.id, { chapter: ch, lesson: l, step: s, idx });
      });
    }
  }

  const missedEntries = Object.entries(progress.challengeResults)
    .filter(([, r]) => r.needsReview)
    .map(([id]) => stepLookup.get(id))
    .filter(Boolean);

  const totalItems =
    progress.bookmarkedStepIds.length + progress.highlights.length + missedEntries.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#E2DDD3] bg-[#FAF9F6] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#E8E4DC] bg-white px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-[#111827]">
              {ui.vaultTitle}
            </h2>
            <p className="text-xs font-semibold text-zinc-500">{ui.vaultSub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-[#E8E4DC] bg-white px-6 py-2.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTab("bookmarks")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
                tab === "bookmarks" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>
                {ui.bookmarksTab} ({progress.bookmarkedStepIds.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("highlights")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
                tab === "highlights" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
              }`}
            >
              <Highlighter className="h-3.5 w-3.5" />
              <span>
                {ui.highlightsTab} ({progress.highlights.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("missed")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-bold ${
                tab === "missed" ? "bg-[#18181B] text-white" : "text-zinc-600 hover:bg-stone-100"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>
                {ui.missedTab} ({missedEntries.length})
              </span>
            </button>
          </div>

          {totalItems > 0 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartReviewSession();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 font-display text-xs font-bold text-white hover:bg-blue-700"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{ui.practiceAll}</span>
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-6">
          {tab === "bookmarks" &&
            (progress.bookmarkedStepIds.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-zinc-500">
                {ui.noBookmarks}
              </p>
            ) : (
              progress.bookmarkedStepIds.map((sid) => {
                const hit = stepLookup.get(sid);
                if (!hit) return null;
                const title =
                  hit.step.kind === "challenge" ? hit.step.challenge.prompt : hit.step.title;
                return (
                  <div
                    key={sid}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8E4DC] bg-white p-4"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onJumpToStep(hit.chapter, hit.lesson, hit.idx);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-xs font-bold text-blue-700">
                        Cap. {hit.chapter.number} · {ui.lessonWord} {hit.lesson.number}
                      </p>
                      <p className="truncate font-display text-sm font-extrabold text-[#111827]">
                        {title}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveBookmark(sid)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remover favorito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ))}

          {tab === "highlights" &&
            (progress.highlights.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-zinc-500">
                {ui.noHighlights}
              </p>
            ) : (
              progress.highlights.map((h) => {
                const hit = stepLookup.get(h.stepId);
                return (
                  <div
                    key={h.id}
                    className="rounded-2xl border border-[#E8E4DC] bg-white p-4"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!hit) return;
                          onClose();
                          onJumpToStep(hit.chapter, hit.lesson, hit.idx);
                        }}
                        className="text-xs font-bold text-blue-700 hover:underline"
                      >
                        {h.slideTitle}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveHighlight(h.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="rounded-lg bg-[#FEF08A]/70 px-3 py-2 text-sm font-medium text-[#18181B]">
                      "{h.quote}"
                    </p>
                  </div>
                );
              })
            ))}

          {tab === "missed" &&
            (missedEntries.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-zinc-500">{ui.noMissed}</p>
            ) : (
              missedEntries.map((hit) => {
                if (!hit) return null;
                const title =
                  hit.step.kind === "challenge" ? hit.step.challenge.prompt : hit.step.title;
                return (
                  <button
                    key={hit.step.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onJumpToStep(hit.chapter, hit.lesson, hit.idx);
                    }}
                    className="block w-full rounded-2xl border border-rose-200 bg-white p-4 text-left hover:border-rose-400"
                  >
                    <p className="text-xs font-bold text-rose-700">
                      Cap. {hit.chapter.number} · {ui.lessonWord} {hit.lesson.number}
                    </p>
                    <p className="mt-0.5 font-display text-sm font-extrabold text-[#111827]">
                      {title}
                    </p>
                  </button>
                );
              })
            ))}
        </div>
      </div>
    </div>
  );
};
