import React, { useState } from "react";
import { Check, Copy, Info, Terminal } from "lucide-react";
import type { VrpBlock, VrpTokenInfo } from "../types/content";
import type { LanguagePref } from "../types/progress";
import { t } from "../i18n/ui";

interface VrpCommandBlockProps {
  block: VrpBlock;
  lang: LanguagePref;
}

export const VrpCommandBlock: React.FC<VrpCommandBlockProps> = ({ block, lang }) => {
  const ui = t(lang);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<{
    cmdIdx: number;
    info: VrpTokenInfo;
  } | null>(null);

  const handleCopy = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const renderInteractiveLine = (code: string, tokens: VrpTokenInfo[], cmdIdx: number) => {
    if (!tokens || tokens.length === 0) {
      return <span className="text-emerald-300">{code}</span>;
    }

    // Split code cleanly around matched tokens
    const segments: Array<{ text: string; info?: VrpTokenInfo }> = [{ text: code }];
    for (const info of tokens) {
      const next: typeof segments = [];
      for (const seg of segments) {
        if (seg.info) {
          next.push(seg);
          continue;
        }
        const pos = seg.text.indexOf(info.token);
        if (pos === -1) {
          next.push(seg);
        } else {
          if (pos > 0) next.push({ text: seg.text.slice(0, pos) });
          next.push({ text: info.token, info });
          if (pos + info.token.length < seg.text.length) {
            next.push({ text: seg.text.slice(pos + info.token.length) });
          }
        }
      }
      segments.splice(0, segments.length, ...next);
    }

    return segments.map((seg, idx) => {
      if (!seg.info) {
        return <span key={idx}>{seg.text}</span>;
      }
      const isSelected =
        selectedToken?.cmdIdx === cmdIdx && selectedToken.info.token === seg.info.token;
      return (
        <button
          key={idx}
          type="button"
          onClick={() =>
            setSelectedToken(isSelected ? null : { cmdIdx, info: seg.info! })
          }
          className={`mx-0.5 inline rounded px-1.5 py-0.5 font-bold transition ${
            isSelected
              ? "bg-blue-500 text-white ring-2 ring-blue-300"
              : "bg-zinc-800 text-amber-300 underline decoration-amber-400/50 decoration-dotted underline-offset-4 hover:bg-zinc-700"
          }`}
        >
          {seg.text}
        </button>
      );
    });
  };

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-zinc-800 bg-[#16181D] text-zinc-100 shadow-md">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#1E2128] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <span className="font-display text-xs font-bold tracking-wide text-zinc-100">
            {block.title}
          </span>
        </div>
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
          {block.viewLabel}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {block.commands.map((cmd, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-black/35 px-3.5 py-2.5 font-mono text-sm leading-relaxed">
              <div className="overflow-x-auto whitespace-nowrap">
                {renderInteractiveLine(cmd.code, cmd.tokens, idx)}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(cmd.code, idx)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                aria-label="Copiar comando VRP"
              >
                {copiedIdx === idx ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {selectedToken && selectedToken.cmdIdx === idx && (
              <div className="flex items-start gap-2 rounded-xl border border-blue-500/30 bg-blue-950/50 px-3.5 py-2.5 text-xs leading-relaxed text-blue-100">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <div>
                  <span className="font-mono font-bold text-amber-300">
                    {selectedToken.info.token}
                  </span>{" "}
                  — {selectedToken.info.meaning}
                </div>
              </div>
            )}
          </div>
        ))}

        {block.commands.some((c) => c.tokens.length > 0) && !selectedToken && (
          <p className="text-[11.5px] font-medium text-zinc-400">{ui.vrpTip}</p>
        )}
      </div>
    </div>
  );
};
