import React, { useEffect, useState } from "react";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { DiagramData } from "../types/content";
import type { LanguagePref } from "../types/progress";
import { t } from "../i18n/ui";

interface DiagramViewerProps {
  diagram: DiagramData;
  title: string;
  slideNumber: number;
  lang: LanguagePref;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({
  diagram,
  title,
  slideNumber,
  lang,
}) => {
  const ui = t(lang);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <figure className="my-5 overflow-hidden rounded-2xl border border-[#E8E4DC] bg-white shadow-xs transition hover:border-[#D3CCC0]">
        <button
          type="button"
          onClick={() => {
            setZoomed(false);
            setOpen(true);
          }}
          className="group relative block w-full cursor-zoom-in bg-white p-2.5 sm:p-4 text-left"
          aria-label={`Ampliar diagrama de ${title}`}
        >
          <img
            src={diagram.src}
            alt={diagram.altText || title}
            width={diagram.width}
            height={diagram.height}
            loading="lazy"
            className="mx-auto max-h-[430px] w-auto rounded-lg object-contain"
          />
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-[#E2DDD3] bg-white/95 px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-xs transition group-hover:border-blue-300 group-hover:text-blue-700">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>{ui.zoomDiagram}</span>
          </span>
        </button>
        <figcaption className="flex items-center justify-between border-t border-[#F0ECE3] bg-[#FCFBF8] px-4 py-2 text-xs font-medium text-zinc-500">
          <span>{ui.originalDiagramCaption(slideNumber)}</span>
          <span className="font-semibold text-zinc-600">{title}</span>
        </figcaption>
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-80 flex flex-col bg-zinc-950/85 p-3 sm:p-6 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mb-3 flex w-full max-w-6xl items-center justify-between rounded-xl bg-zinc-900/90 px-4 py-2.5 text-white"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{title}</p>
              <p className="text-xs text-zinc-400">{ui.originalFigureSub(slideNumber)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700"
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                <span>{zoomed ? ui.fitScreen : ui.zoom15x}</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-zinc-800 p-1.5 text-zinc-200 hover:bg-zinc-700"
                aria-label="Fechar visualização"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            onClick={() => setOpen(false)}
            className="flex flex-1 items-center justify-center overflow-auto rounded-2xl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl bg-white p-3 sm:p-5 shadow-2xl"
            >
              <img
                src={diagram.src}
                alt={diagram.altText || title}
                className={`h-auto transition-transform duration-200 ${
                  zoomed ? "w-[1150px] max-w-none" : "max-h-[80vh] max-w-full object-contain"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
