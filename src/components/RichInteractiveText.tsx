import React, { useEffect, useMemo, useRef, useState } from "react";
import { Highlighter, Sparkles, X } from "lucide-react";
import { GLOSSARY_BY_KEY, HCIA_GLOSSARY } from "../data/glossary";
import type { GlossaryEntry, HighlightItem, LanguagePref } from "../types/progress";
import { GLOSSARY_CATEGORY_PT, t } from "../i18n/ui";

interface RichInteractiveTextProps {
  text: string;
  stepId: string;
  lang: LanguagePref;
  highlights: HighlightItem[];
  onAddHighlight: (quote: string) => void;
  onRemoveHighlight: (highlightId: string) => void;
  onAskTutorQuote: (quote: string) => void;
  className?: string;
}

// Build regex matching longest terms first (case-sensitive for short acronyms like AC/AP/IP, case-insensitive for words)
const SORTED_TERMS = [...HCIA_GLOSSARY]
  .flatMap((g) => [g.term, ...(g.aliases ?? [])])
  .sort((a, b) => b.length - a.length);

const TERM_REGEX = new RegExp(
  `\\b(${SORTED_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "g"
);

// Emphasize key HCIA numbers/standards (e.g., "100 m", "48 bits", "IEEE 802.3", "RFC 793", "Port number: 80")
const EMPHASIS_REGEX =
  /(\b(?:IEEE\s+802\.\d+[a-z]*|ISO\/IEC\s+\d+-\d+|RFC\s+\d+|Cat\s+\d+[a-z]?|10\/100\/1000BASE-T|40GE\/100GE|GE\/10GE\/25GE|100\s*m\b|48\s*bits|6\s*bytes|12\s*hexadecimal\s*digits|32-bit|128-bit|ports?\s+(?:numbers?:?\s*)?\d+(?:\s+and\s+\d+)?|1969|around\s+\d+\s+BCE|\d+s(?:–\d+s)?)\b)/gi;

function splitLeadIn(raw: string): { leadIn: string | null; rest: string } {
  // Match lead-ins like "Source: device..." or "1. Chassis header: used..." up to 52 chars
  const match = raw.match(/^([A-Za-z0-9()\/.,&\-\s]{2,52}?):\s+(.+)$/);
  if (!match) return { leadIn: null, rest: raw };
  // Avoid treating URLs like http://... as lead-ins
  if (match[1].toLowerCase().endsWith("http") || match[1].toLowerCase().endsWith("ftp")) {
    return { leadIn: null, rest: raw };
  }
  return { leadIn: match[1] + ":", rest: match[2] };
}

export const RichInteractiveText: React.FC<RichInteractiveTextProps> = ({
  text,
  stepId,
  lang,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  onAskTutorQuote,
  className = "",
}) => {
  const ui = t(lang);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [activeTerm, setActiveTerm] = useState<{
    entry: GlossaryEntry;
    rect: DOMRect;
    pinned: boolean;
  } | null>(null);
  const [selectionBar, setSelectionBar] = useState<{
    quote: string;
    x: number;
    y: number;
  } | null>(null);

  const stepHighlights = useMemo(
    () => highlights.filter((h) => h.stepId === stepId),
    [highlights, stepId]
  );

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTerm(null);
        setSelectionBar(null);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, []);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionBar(null);
      return;
    }
    const quote = sel.toString().trim();
    if (quote.length < 4 || quote.length > 420) {
      setSelectionBar(null);
      return;
    }
    const container = containerRef.current;
    if (!container || !sel.anchorNode || !container.contains(sel.anchorNode)) {
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionBar({
      quote,
      x: rect.left + rect.width / 2,
      y: Math.max(12, rect.top - 10),
    });
  };

  const renderInlineTokens = (segment: string, seenTerms: Set<string>, isLeadIn = false) => {
    // First split by saved user highlights
    let pieces: Array<{ str: string; highlight?: HighlightItem }> = [{ str: segment }];
    for (const h of stepHighlights) {
      const nextPieces: typeof pieces = [];
      for (const p of pieces) {
        if (p.highlight) {
          nextPieces.push(p);
          continue;
        }
        const idx = p.str.toLowerCase().indexOf(h.quote.toLowerCase());
        if (idx === -1) {
          nextPieces.push(p);
        } else {
          if (idx > 0) nextPieces.push({ str: p.str.slice(0, idx) });
          nextPieces.push({
            str: p.str.slice(idx, idx + h.quote.length),
            highlight: h,
          });
          if (idx + h.quote.length < p.str.length) {
            nextPieces.push({ str: p.str.slice(idx + h.quote.length) });
          }
        }
      }
      pieces = nextPieces;
    }

    return pieces.map((piece, pIdx) => {
      if (piece.highlight) {
        const hl = piece.highlight;
        return (
          <mark
            key={`hl-${pIdx}-${hl.id}`}
            title={ui.highlightTooltip}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveHighlight(hl.id);
            }}
            className="cursor-pointer rounded bg-[#FEF08A] px-1 py-0.5 font-medium text-[#18181B] underline decoration-amber-500/60 decoration-dashed underline-offset-4 transition hover:bg-[#FDE047]"
          >
            {piece.str}
          </mark>
        );
      }

      // Tokenize glossary terms (first occurrence per block) and key numbers/standards
      const nodes: React.ReactNode[] = [];
      let cursor = 0;
      const matches = [...piece.str.matchAll(TERM_REGEX)];

      const pushEmphasizedPlain = (plain: string, keyPrefix: string) => {
        if (!plain) return;
        if (isLeadIn) {
          nodes.push(
            <strong key={keyPrefix} className="font-bold text-[#111827]">
              {plain}
            </strong>
          );
          return;
        }
        const emParts = plain.split(EMPHASIS_REGEX);
        emParts.forEach((part, idx) => {
          if (!part) return;
          if (idx % 2 === 1) {
            nodes.push(
              <strong
                key={`${keyPrefix}-em-${idx}`}
                className="font-bold text-[#18181B]"
              >
                {part}
              </strong>
            );
          } else {
            nodes.push(<React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>);
          }
        });
      };

      for (const m of matches) {
        const matchIdx = m.index ?? 0;
        const rawWord = m[0];
        const entry = GLOSSARY_BY_KEY[rawWord.toLowerCase()];
        if (!entry) continue;
        // Skip false positives for short all-caps terms if written lowercase in prose
        if (entry.term.length <= 3 && entry.term === entry.term.toUpperCase() && rawWord !== entry.term) {
          continue;
        }
        if (seenTerms.has(entry.term)) continue;
        seenTerms.add(entry.term);

        if (matchIdx > cursor) {
          pushEmphasizedPlain(piece.str.slice(cursor, matchIdx), `${pIdx}-${cursor}`);
        }
        nodes.push(
          <button
            key={`${pIdx}-term-${matchIdx}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveTerm((prev) =>
                prev?.pinned && prev.entry.term === entry.term
                  ? null
                  : { entry, rect, pinned: true }
              );
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveTerm((prev) =>
                prev?.pinned ? prev : { entry, rect, pinned: false }
              );
            }}
            className={`inline cursor-help rounded-sm border-b-[1.5px] border-dotted border-blue-500/85 px-0.5 text-left transition-colors hover:bg-blue-50 ${
              isLeadIn ? "font-bold text-[#1E3A8A]" : "font-semibold text-[#1E40AF]"
            }`}
          >
            {rawWord}
          </button>
        );
        cursor = matchIdx + rawWord.length;
      }

      if (cursor < piece.str.length) {
        pushEmphasizedPlain(piece.str.slice(cursor), `${pIdx}-end`);
      }

      return <React.Fragment key={`p-${pIdx}`}>{nodes}</React.Fragment>;
    });
  };

  const { leadIn, rest } = splitLeadIn(text);
  const seen = new Set<string>();

  return (
    <span
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      className={`relative inline ${className}`}
    >
      {leadIn ? (
        <>
          <strong className="font-bold text-[#111827]">
            {renderInlineTokens(leadIn, seen, true)}
          </strong>{" "}
          {renderInlineTokens(rest, seen, false)}
        </>
      ) : (
        renderInlineTokens(rest, seen, false)
      )}

      {activeTerm && (
        <span
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: Math.min(Math.max(16, activeTerm.rect.left), window.innerWidth - 320),
            top:
              activeTerm.rect.bottom + 140 > window.innerHeight
                ? Math.max(12, activeTerm.rect.top - 132)
                : activeTerm.rect.bottom + 8,
            zIndex: 60,
          }}
          className="w-[300px] rounded-xl border border-[#E2DDD3] bg-white p-3.5 text-left shadow-xl shadow-stone-900/10"
        >
          <span className="mb-1 flex items-start justify-between gap-2">
            <span>
              <span className="font-display text-sm font-extrabold text-[#18181B]">
                {activeTerm.entry.term}
              </span>
              {activeTerm.entry.fullName && (
                <span className="block text-xs font-semibold text-blue-700">
                  {activeTerm.entry.fullName}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setActiveTerm(null)}
              className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label="Fechar glossário"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
          <span className="block text-[13.5px] leading-relaxed font-normal text-zinc-700">
            {activeTerm.entry.definitionPt ?? activeTerm.entry.definition}
          </span>
          <span className="mt-2 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
            {GLOSSARY_CATEGORY_PT[activeTerm.entry.category] ?? activeTerm.entry.category}
          </span>
        </span>
      )}

      {selectionBar && (
        <span
          style={{
            position: "fixed",
            left: Math.min(Math.max(120, selectionBar.x), window.innerWidth - 120),
            top: selectionBar.y,
            transform: "translate(-50%, -100%)",
            zIndex: 65,
          }}
          className="flex items-center gap-1 rounded-full border border-zinc-800 bg-[#18181B] px-2 py-1 text-xs font-semibold text-white shadow-xl"
        >
          <button
            type="button"
            onClick={() => {
              onAddHighlight(selectionBar.quote);
              setSelectionBar(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition hover:bg-zinc-800"
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-300" />
            <span>{ui.highlightAction}</span>
          </button>
          <span className="h-3.5 w-px bg-zinc-700" />
          <button
            type="button"
            onClick={() => {
              onAskTutorQuote(selectionBar.quote);
              setSelectionBar(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition hover:bg-zinc-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>{ui.askTutor}</span>
          </button>
        </span>
      )}
    </span>
  );
};
