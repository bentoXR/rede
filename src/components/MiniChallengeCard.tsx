import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import type { ChallengeData } from "../types/content";
import type { LanguagePref } from "../types/progress";
import { t } from "../i18n/ui";

interface MiniChallengeCardProps {
  challenge: ChallengeData;
  lang: LanguagePref;
  onResult: (challengeId: string, isCorrect: boolean) => void;
  previousAccuracy?: { attempts: number; correct: number; needsReview: boolean };
}

const PAIR_COLORS = [
  "border-blue-500 bg-blue-50 text-blue-900",
  "border-emerald-500 bg-emerald-50 text-emerald-900",
  "border-amber-500 bg-amber-50 text-amber-900",
  "border-violet-500 bg-violet-50 text-violet-900",
  "border-rose-500 bg-rose-50 text-rose-900",
];

function deterministicShuffle<T>(arr: T[], seedStr: string): T[] {
  const copy = [...arr];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 1000003;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 48271) % 2147483647;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const MiniChallengeCard: React.FC<MiniChallengeCardProps> = ({
  challenge,
  lang,
  onResult,
  previousAccuracy,
}) => {
  const ui = t(lang);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // State per challenge type
  const [selectedSingle, setSelectedSingle] = useState<number | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<number[]>([]);
  const [activeLeftIdx, setActiveLeftIdx] = useState<number | null>(null);
  const [pairMap, setPairMap] = useState<Record<number, number>>({});
  const [orderIndices, setOrderIndices] = useState<number[]>([]);
  const [blankValues, setBlankValues] = useState<Array<string | null>>([]);
  const [activeBlank, setActiveBlank] = useState<number>(0);

  const shuffledRight = useMemo(() => {
    if (challenge.type !== "match-pairs") return [];
    const indexed = challenge.pairs.map((p, idx) => ({ idx, text: p.right }));
    const sh = deterministicShuffle(indexed, challenge.id + "-pairs");
    // Ensure not identical order if length >= 2
    if (sh.length >= 2 && sh.every((item, i) => item.idx === i)) {
      [sh[0], sh[1]] = [sh[1], sh[0]];
    }
    return sh;
  }, [challenge]);

  useEffect(() => {
    setChecked(false);
    setIsCorrect(false);
    setSelectedSingle(null);
    setSelectedMulti([]);
    setActiveLeftIdx(null);
    setPairMap({});
    setActiveBlank(0);

    if (challenge.type === "order-steps") {
      const idxs = challenge.items.map((_, i) => i);
      const sh = deterministicShuffle(idxs, challenge.id + "-order");
      if (sh.length >= 2 && sh.every((v, i) => v === challenge.correctOrder[i])) {
        [sh[0], sh[1]] = [sh[1], sh[0]];
      }
      setOrderIndices(sh);
    }
    if (challenge.type === "fill-blank") {
      setBlankValues(Array(challenge.correctTokens.length).fill(null));
    }
  }, [challenge]);

  const submitCheck = (correct: boolean) => {
    setChecked(true);
    setIsCorrect(correct);
    onResult(challenge.id, correct);
  };

  const resetChallenge = () => {
    setChecked(false);
    setIsCorrect(false);
    setSelectedSingle(null);
    setSelectedMulti([]);
    setActiveLeftIdx(null);
    setPairMap({});
    setActiveBlank(0);
    if (challenge.type === "fill-blank") {
      setBlankValues(Array(challenge.correctTokens.length).fill(null));
    }
  };

  const handleCheck = () => {
    if (challenge.type === "multiple-choice") {
      if (selectedSingle === null) return;
      submitCheck(selectedSingle === challenge.correctIndex);
    } else if (challenge.type === "multi-select") {
      if (selectedMulti.length === 0) return;
      const a = [...selectedMulti].sort((x, y) => x - y);
      const b = [...challenge.correctIndices].sort((x, y) => x - y);
      submitCheck(a.length === b.length && a.every((v, i) => v === b[i]));
    } else if (challenge.type === "match-pairs") {
      if (Object.keys(pairMap).length < challenge.pairs.length) return;
      const ok = challenge.pairs.every((_, leftIdx) => pairMap[leftIdx] === leftIdx);
      submitCheck(ok);
    } else if (challenge.type === "order-steps") {
      const ok = orderIndices.every((val, i) => val === challenge.correctOrder[i]);
      submitCheck(ok);
    } else if (challenge.type === "fill-blank") {
      if (blankValues.some((v) => v === null)) return;
      const ok = blankValues.every((v, i) => v === challenge.correctTokens[i]);
      submitCheck(ok);
    }
  };

  const canCheck = (() => {
    if (checked) return false;
    switch (challenge.type) {
      case "multiple-choice":
        return selectedSingle !== null;
      case "multi-select":
        return selectedMulti.length > 0;
      case "match-pairs":
        return Object.keys(pairMap).length === challenge.pairs.length;
      case "order-steps":
        return orderIndices.length === challenge.items.length;
      case "fill-blank":
        return blankValues.every((v) => v !== null);
    }
  })();

  const typeLabel = {
    "multiple-choice": ui.typeMultipleChoice,
    "multi-select": ui.typeMultiSelect,
    "match-pairs": ui.typeMatchPairs,
    "order-steps": ui.typeOrderSteps,
    "fill-blank": ui.typeFillBlank,
  }[challenge.type];

  return (
    <div className="rounded-2xl border-2 border-blue-200/80 bg-white p-5 sm:p-7 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-display text-xs font-extrabold tracking-wide text-blue-700 uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{typeLabel}</span>
        </span>
        {previousAccuracy && previousAccuracy.attempts > 0 && (
          <span className="text-xs font-semibold text-zinc-500">
            {ui.pastAccuracy(previousAccuracy.correct, previousAccuracy.attempts)}
          </span>
        )}
      </div>

      <h3 className="mb-5 font-display text-lg sm:text-xl font-bold leading-snug text-[#111827]">
        {challenge.prompt}
      </h3>

      {challenge.type === "multiple-choice" && (
        <div className="space-y-2.5">
          {challenge.options.map((opt, idx) => {
            const isPicked = selectedSingle === idx;
            const showRight = checked && idx === challenge.correctIndex;
            const showWrong = checked && isPicked && idx !== challenge.correctIndex;
            return (
              <button
                key={idx}
                type="button"
                disabled={checked}
                onClick={() => setSelectedSingle(idx)}
                className={`flex w-full items-start gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left text-[16px] leading-relaxed font-medium transition ${
                  showRight
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold"
                    : showWrong
                      ? "border-rose-400 bg-rose-50/80 text-rose-950"
                      : isPicked
                        ? "border-blue-600 bg-blue-50/70 text-zinc-900 font-semibold"
                        : "border-[#E8E4DC] bg-[#FCFBF8] text-zinc-800 hover:border-zinc-400 hover:bg-white"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-xs font-bold ${
                    showRight
                      ? "bg-emerald-600 text-white"
                      : showWrong
                        ? "bg-rose-600 text-white"
                        : isPicked
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-300 bg-white text-zinc-600"
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {challenge.type === "multi-select" && (
        <div className="space-y-2.5">
          {challenge.options.map((opt, idx) => {
            const isPicked = selectedMulti.includes(idx);
            const isCorrectOpt = challenge.correctIndices.includes(idx);
            const showRight = checked && isCorrectOpt;
            const showWrong = checked && isPicked && !isCorrectOpt;
            return (
              <button
                key={idx}
                type="button"
                disabled={checked}
                onClick={() =>
                  setSelectedMulti((prev) =>
                    prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                  )
                }
                className={`flex w-full items-start gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left text-[16px] leading-relaxed font-medium transition ${
                  showRight
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold"
                    : showWrong
                      ? "border-rose-400 bg-rose-50/80 text-rose-950"
                      : isPicked
                        ? "border-blue-600 bg-blue-50/70 text-zinc-900 font-semibold"
                        : "border-[#E8E4DC] bg-[#FCFBF8] text-zinc-800 hover:border-zinc-400 hover:bg-white"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${
                    isPicked || showRight
                      ? showWrong
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-blue-600 bg-blue-600 text-white"
                      : "border-zinc-400 bg-white"
                  }`}
                >
                  {isPicked || showRight ? "✓" : ""}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {challenge.type === "match-pairs" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500">{ui.matchHelp}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              {challenge.pairs.map((p, lIdx) => {
                const matchedR = pairMap[lIdx];
                const isSelected = activeLeftIdx === lIdx;
                const colorClass =
                  matchedR !== undefined
                    ? PAIR_COLORS[lIdx % PAIR_COLORS.length]
                    : isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-200"
                      : "border-[#E8E4DC] bg-[#FCFBF8] text-zinc-900 hover:border-zinc-400";
                return (
                  <button
                    key={lIdx}
                    type="button"
                    disabled={checked}
                    onClick={() => setActiveLeftIdx(lIdx)}
                    className={`w-full rounded-xl border-2 px-3.5 py-3 text-left font-display text-sm font-bold transition ${colorClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{p.left}</span>
                      {matchedR !== undefined && (
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
                          {ui.paired}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {shuffledRight.map((item) => {
                const pairedLeft = Object.entries(pairMap).find(
                  ([, rVal]) => rVal === item.idx
                )?.[0];
                const lNum = pairedLeft !== undefined ? Number(pairedLeft) : null;
                const colorClass =
                  lNum !== null
                    ? PAIR_COLORS[lNum % PAIR_COLORS.length]
                    : "border-[#E8E4DC] bg-white text-zinc-800 hover:border-blue-400";
                return (
                  <button
                    key={item.idx}
                    type="button"
                    disabled={checked}
                    onClick={() => {
                      if (activeLeftIdx === null) return;
                      setPairMap((prev) => {
                        const next = { ...prev };
                        // Clear if right was previously assigned elsewhere
                        for (const k of Object.keys(next)) {
                          if (next[Number(k)] === item.idx) delete next[Number(k)];
                        }
                        next[activeLeftIdx] = item.idx;
                        return next;
                      });
                      setActiveLeftIdx(null);
                    }}
                    className={`w-full rounded-xl border-2 px-3.5 py-3 text-left text-[14.5px] leading-snug font-medium transition ${colorClass}`}
                  >
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {challenge.type === "order-steps" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500">{ui.orderHelp}</p>
          {orderIndices.map((itemIdx, pos) => (
            <div
              key={itemIdx}
              className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${
                checked
                  ? itemIdx === challenge.correctOrder[pos]
                    ? "border-emerald-500 bg-emerald-50/70"
                    : "border-rose-400 bg-rose-50/70"
                  : "border-[#E8E4DC] bg-[#FCFBF8]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-display text-xs font-bold text-white">
                  {pos + 1}
                </span>
                <span className="text-[15.5px] font-semibold text-zinc-900">
                  {challenge.items[itemIdx]}
                </span>
              </div>
              {!checked && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={pos === 0}
                    onClick={() =>
                      setOrderIndices((prev) => {
                        const next = [...prev];
                        [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
                        return next;
                      })
                    }
                    className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-35"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pos === orderIndices.length - 1}
                    onClick={() =>
                      setOrderIndices((prev) => {
                        const next = [...prev];
                        [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
                        return next;
                      })
                    }
                    className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-35"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {challenge.type === "fill-blank" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E8E4DC] bg-[#FCFBF8] p-4 text-[17px] leading-[1.9] font-medium text-zinc-800">
            {challenge.template.split(/(\[\d+\])/g).map((part, idx) => {
              const m = part.match(/^\[(\d+)\]$/);
              if (!m) return <span key={idx}>{part}</span>;
              const slotIdx = Number(m[1]);
              const filled = blankValues[slotIdx];
              const isSlotActive = !checked && activeBlank === slotIdx;
              const slotRight = checked && filled === challenge.correctTokens[slotIdx];
              const slotWrong = checked && filled !== challenge.correctTokens[slotIdx];

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={checked}
                  onClick={() => {
                    if (filled) {
                      setBlankValues((prev) => prev.map((v, i) => (i === slotIdx ? null : v)));
                    }
                    setActiveBlank(slotIdx);
                  }}
                  className={`mx-1 inline-flex min-w-[74px] items-center justify-center rounded-lg border-2 px-3 py-0.5 font-mono text-sm font-bold transition ${
                    slotRight
                      ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                      : slotWrong
                        ? "border-rose-400 bg-rose-100 text-rose-900"
                        : isSlotActive
                          ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200"
                          : filled
                            ? "border-zinc-800 bg-zinc-900 text-white"
                            : "border-dashed border-zinc-400 bg-white text-zinc-400"
                  }`}
                >
                  {filled ?? ui.blankPlaceholder(slotIdx + 1)}
                </button>
              );
            })}
          </div>

          {!checked && (
            <div className="flex flex-wrap gap-2">
              {challenge.bank.map((tok) => {
                const usedCount = blankValues.filter((v) => v === tok).length;
                const bankTotal = challenge.bank.filter((b) => b === tok).length;
                const isExhausted = usedCount >= bankTotal;
                return (
                  <button
                    key={tok}
                    type="button"
                    disabled={isExhausted}
                    onClick={() => {
                      const target =
                        blankValues[activeBlank] === null
                          ? activeBlank
                          : blankValues.findIndex((v) => v === null);
                      if (target === -1) return;
                      const next = blankValues.map((v, i) => (i === target ? tok : v));
                      setBlankValues(next);
                      const nextEmpty = next.findIndex((v) => v === null);
                      if (nextEmpty !== -1) setActiveBlank(nextEmpty);
                    }}
                    className="rounded-xl border-2 border-[#E2DDD3] bg-white px-3.5 py-2 font-mono text-sm font-bold text-zinc-900 shadow-2xs transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-35"
                  >
                    {tok}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {!checked ? (
          <button
            type="button"
            disabled={!canCheck}
            onClick={handleCheck}
            className="rounded-xl bg-[#18181B] px-5 py-2.5 font-display text-sm font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            {ui.checkAnswer}
          </button>
        ) : (
          <button
            type="button"
            onClick={resetChallenge}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2DDD3] bg-[#FCFBF8] px-4 py-2 font-display text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{ui.tryAgain}</span>
          </button>
        )}
      </div>

      {checked && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            isCorrect
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-rose-200 bg-rose-50/90 text-rose-950"
          }`}
        >
          <div className="mb-1 flex items-center gap-2 font-display text-sm font-extrabold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{ui.spotOn}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>{ui.notQuite}</span>
              </>
            )}
          </div>
          <p className="text-[15px] leading-relaxed font-medium">{challenge.explanation}</p>
        </div>
      )}
    </div>
  );
};
