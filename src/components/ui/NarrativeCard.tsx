import { Award, Check, X } from 'lucide-react';
import { OPEN_WORLD_CHAPTERS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';

export function NarrativeCard() {
  const mode = useGameStore((state) => state.mode);
  const activeChapterId = useGameStore((state) => state.activeChapterId);
  const closeChapterCard = useGameStore((state) => state.closeChapterCard);
  const openCredits = useGameStore((state) => state.openCredits);

  if (mode !== 'open_world' || activeChapterId === null) {
    return null;
  }

  const chapter = OPEN_WORLD_CHAPTERS.find((item) => item.id === activeChapterId);
  if (!chapter) {
    return null;
  }

  const isFinalChapter = chapter.id === 6;

  return (
    <div className="pointer-events-none fixed top-20 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 px-6">
      <div className="pointer-events-auto border border-white/15 bg-zinc-950/88 p-7 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2"
                style={{ backgroundColor: chapter.accentColor }}
              />
              <span className="font-telemetry text-[11px] font-semibold tracking-[0.22em] text-yellow-400">
                {chapter.period} · CAPÍTULO {chapter.id}/6
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-50">
              {chapter.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeChapterCard}
            aria-label="Fechar capítulo"
            className="cursor-pointer border border-white/15 p-1.5 text-zinc-400 transition hover:border-white/40 hover:text-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-200">{chapter.text}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          {isFinalChapter && (
            <button
              type="button"
              onClick={openCredits}
              className="inline-flex cursor-pointer items-center gap-2 border border-yellow-400 bg-yellow-400 px-4 py-2 font-telemetry text-xs font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-yellow-300"
            >
              <Award className="h-4 w-4" />
              <span>VER CRÉDITOS</span>
            </button>
          )}

          <button
            type="button"
            onClick={closeChapterCard}
            className="inline-flex cursor-pointer items-center gap-2 border border-white/20 bg-zinc-900 px-4 py-2 font-telemetry text-xs tracking-[0.16em] text-slate-50 transition hover:border-yellow-400"
          >
            <Check className="h-4 w-4 text-green-500" />
            <span>CONTINUAR ACELERANDO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
