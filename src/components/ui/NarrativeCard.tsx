import { useEffect, useState } from 'react';
import { Award, Check, X } from 'lucide-react';
import { OPEN_WORLD_CHAPTERS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';

const AUTO_DISMISS_MS = 10000;

export function NarrativeCard() {
  const mode = useGameStore((state) => state.mode);
  const activeChapterId = useGameStore((state) => state.activeChapterId);
  const closeChapterCard = useGameStore((state) => state.closeChapterCard);
  const openCredits = useGameStore((state) => state.openCredits);

  const [hovered, setHovered] = useState(false);
  const [remainingMs, setRemainingMs] = useState(AUTO_DISMISS_MS);

  useEffect(() => {
    setRemainingMs(AUTO_DISMISS_MS);
  }, [activeChapterId]);

  useEffect(() => {
    if (mode !== 'open_world' || activeChapterId === null || hovered) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 100) {
          closeChapterCard();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeChapterId, closeChapterCard, hovered, mode]);

  if (mode !== 'open_world' || activeChapterId === null) {
    return null;
  }

  const chapter = OPEN_WORLD_CHAPTERS.find((item) => item.id === activeChapterId);
  if (!chapter) {
    return null;
  }

  const isFinalChapter = chapter.id === 6;
  const progressPct = Math.max(0, Math.min(100, (remainingMs / AUTO_DISMISS_MS) * 100));

  return (
    <div className="pointer-events-none fixed top-24 left-5 z-30 w-full max-w-sm">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="pointer-events-auto border border-white/20 bg-zinc-950/92 p-5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2"
                style={{ backgroundColor: chapter.accentColor }}
              />
              <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-yellow-400">
                {chapter.period} · CAP. {chapter.id}/6
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold tracking-tight text-slate-50">
              {chapter.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeChapterCard}
            aria-label="Fechar capítulo"
            className="cursor-pointer border border-white/15 p-1 text-zinc-400 transition hover:border-white/40 hover:text-slate-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-100">{chapter.text}</p>

        {/* Subtle auto-dismiss timer bar */}
        <div className="mt-4 h-0.5 w-full bg-zinc-800">
          <div
            className="h-full bg-yellow-400 transition-all duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-telemetry text-[10px] text-zinc-500">
            CLIQUE NO NÚMERO ABAIXO P/ REABRIR
          </span>

          <div className="flex items-center gap-2">
            {isFinalChapter && (
              <button
                type="button"
                onClick={openCredits}
                className="inline-flex cursor-pointer items-center gap-1.5 border border-yellow-400 bg-yellow-400 px-3 py-1.5 font-telemetry text-[10px] font-bold tracking-[0.14em] text-zinc-950 transition hover:bg-yellow-300"
              >
                <Award className="h-3.5 w-3.5" />
                <span>CRÉDITOS</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeChapterCard}
              className="inline-flex cursor-pointer items-center gap-1.5 border border-white/20 bg-zinc-900 px-3 py-1.5 font-telemetry text-[10px] tracking-[0.14em] text-slate-50 transition hover:border-yellow-400"
            >
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span>FECHAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
