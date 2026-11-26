import { useEffect, useRef } from 'react';
import { ArrowRight, Compass, Pause } from 'lucide-react';
import { CORRIDOR_END_Z, OPEN_WORLD_CHAPTERS, STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';
import { AudioControls } from './AudioControls';

const RPM_SEGMENTS = 18;

export function TelemetryHUD() {
  const mode = useGameStore((state) => state.mode);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const completedStages = useGameStore((state) => state.completedStages);
  const unlockedChapters = useGameStore((state) => state.unlockedChapters);
  const tacticalAlert = useGameStore((state) => state.tacticalAlert);
  const togglePause = useGameStore((state) => state.togglePause);
  const enterOpenWorld = useGameStore((state) => state.enterOpenWorld);

  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const rpmTextRef = useRef<HTMLSpanElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const overtakeRef = useRef<HTMLSpanElement>(null);
  const compassArrowRef = useRef<HTMLDivElement>(null);
  const compassDistRef = useRef<HTMLSpanElement>(null);
  const rpmBarRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const activeStage =
    activeStageId !== null ? STAGES.find((stage) => stage.id === activeStageId) ?? null : null;

  useEffect(() => {
    if (mode === 'landing' || mode === 'credits') {
      return;
    }

    let rafId = 0;

    const updateTelemetryDom = () => {
      if (speedRef.current) {
        speedRef.current.textContent = String(Math.round(Math.abs(gameRuntime.speed))).padStart(
          3,
          '0'
        );
      }

      if (gearRef.current) {
        const g = gameRuntime.gear;
        if (g === 0) {
          gearRef.current.textContent = 'R';
        } else if (gameRuntime.gearLocked) {
          gearRef.current.textContent = '06 LOCK';
        } else {
          gearRef.current.textContent = String(g).padStart(2, '0');
        }
      }

      if (rpmTextRef.current) {
        rpmTextRef.current.textContent = `${Math.round(gameRuntime.rpm)} RPM`;
      }

      const rpmNorm = Math.max(0, Math.min(1, (gameRuntime.rpm - 2800) / 10700));
      const litCount = Math.round(rpmNorm * RPM_SEGMENTS);
      for (let i = 0; i < RPM_SEGMENTS; i++) {
        const bar = rpmBarRefs.current[i];
        if (!bar) continue;
        const isLit = i < litCount;
        if (!isLit) {
          bar.style.backgroundColor = '#27272a';
        } else if (i >= 14) {
          bar.style.backgroundColor = '#ef4444';
        } else if (i >= 10) {
          bar.style.backgroundColor = '#facc15';
        } else {
          bar.style.backgroundColor = '#16a34a';
        }
      }

      if (distanceRef.current) {
        if (mode === 'corridor') {
          const total = Math.abs(CORRIDOR_END_Z);
          const cur = Math.min(total, Math.round(gameRuntime.distance));
          distanceRef.current.textContent = `${cur}m / ${total}m`;
        } else if (mode === 'race' && activeStage) {
          const cur = Math.min(activeStage.raceDistance, Math.round(gameRuntime.distance));
          distanceRef.current.textContent = `${cur}m / ${activeStage.raceDistance}m`;
        } else {
          distanceRef.current.textContent = `${Math.round(gameRuntime.distance)}m`;
        }
      }

      if (overtakeRef.current && mode === 'race' && activeStage) {
        if (activeStage.mechanic === 'defend_lead') {
          const rivalBehind = gameRuntime.opponents.every(
            (opp) => opp.z > gameRuntime.position.z
          );
          overtakeRef.current.textContent = rivalBehind ? 'POSIÇÃO: P1' : 'POSIÇÃO: P2';
        } else {
          overtakeRef.current.textContent = `ULTRAPASSAGENS ${gameRuntime.overtakesCompleted}/${activeStage.targetOvertakes}`;
        }
      }

      if (mode === 'open_world') {
        if (compassArrowRef.current) {
          compassArrowRef.current.style.transform = `rotate(${Math.round(
            (gameRuntime.compassAngle * 180) / Math.PI
          )}deg)`;
        }
        if (compassDistRef.current) {
          compassDistRef.current.textContent =
            gameRuntime.nearestMonumentId !== null
              ? `CAP. ${gameRuntime.nearestMonumentId} · ${Math.round(
                  gameRuntime.nearestMonumentDistance
                )}m`
              : 'TRAJETÓRIA COMPLETA';
        }
      }

      rafId = window.requestAnimationFrame(updateTelemetryDom);
    };

    rafId = window.requestAnimationFrame(updateTelemetryDom);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activeStage, mode]);

  if (mode === 'landing' || mode === 'credits') {
    return null;
  }

  const contextLabel =
    mode === 'corridor'
      ? 'CORREDOR DOS PORTAIS'
      : mode === 'race' && activeStage
        ? `${activeStage.circuit} ${activeStage.year} · ${activeStage.car.chassisName}`
        : 'MUNDO ABERTO — A TRAJETÓRIA';

  return (
    <div className="pointer-events-none fixed inset-0 z-10 box-border p-5">
      {/* TOP BAR */}
      <div className="absolute top-5 right-5 left-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="border border-white/15 bg-zinc-950/75 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 bg-yellow-400" />
              <span className="font-telemetry text-xs font-semibold tracking-[0.2em] text-slate-50">
                {contextLabel}
              </span>
            </div>
            {mode === 'race' && activeStage && (
              <div className="mt-1 flex items-center gap-3 font-telemetry text-[11px] text-zinc-400">
                <span ref={overtakeRef}>
                  {activeStage.mechanic === 'defend_lead'
                    ? 'POSIÇÃO: P1'
                    : `ULTRAPASSAGENS 0/${activeStage.targetOvertakes}`}
                </span>
                <span className="text-zinc-600">|</span>
                <span>{activeStage.car.teamName.toUpperCase()}</span>
              </div>
            )}
          </div>

          {tacticalAlert && (
            <div className="border border-red-500/70 bg-zinc-950/85 px-4 py-1.5 font-telemetry text-xs font-bold tracking-[0.18em] text-yellow-400 backdrop-blur-md">
              {tacticalAlert}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5">
          <div className="border border-white/15 bg-zinc-950/75 px-3.5 py-2 font-telemetry text-xs text-zinc-200 backdrop-blur-md">
            <span className="mr-2 text-zinc-500">DIST</span>
            <span ref={distanceRef} className="text-slate-50">
              0m
            </span>
          </div>

          {(mode === 'corridor' || mode === 'race') && (
            <button
              type="button"
              onClick={enterOpenWorld}
              className="inline-flex cursor-pointer items-center gap-1.5 border border-yellow-400/50 bg-zinc-950/75 px-3.5 py-2 font-telemetry text-[11px] font-semibold tracking-[0.16em] text-yellow-400 backdrop-blur-md transition hover:border-yellow-400 hover:bg-yellow-400 hover:text-zinc-950"
            >
              <span>IR PARA A HISTÓRIA</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => togglePause(true)}
            title="Pausa / Configurações (ESC)"
            className="inline-flex cursor-pointer items-center gap-1.5 border border-white/15 bg-zinc-950/75 px-3 py-2 font-telemetry text-[11px] text-zinc-200 backdrop-blur-md transition hover:border-white/40 hover:text-yellow-400"
          >
            <Pause className="h-3.5 w-3.5" />
            <span>ESC</span>
          </button>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-4">
        {/* Bottom Left: Speed, RPM Telemetry Bars & Highlighted Gear */}
        <div className="flex items-end gap-3 border border-white/15 bg-zinc-950/75 px-3.5 py-2.5 backdrop-blur-md">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                ref={speedRef}
                className="font-telemetry text-3xl font-bold leading-none tracking-tight text-slate-50"
              >
                000
              </span>
              <span className="font-telemetry text-[11px] tracking-widest text-zinc-400">
                KM/H
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: RPM_SEGMENTS }).map((_, index) => (
                <span
                  key={index}
                  ref={(el) => {
                    rpmBarRefs.current[index] = el;
                  }}
                  className="h-2 w-1.5 bg-zinc-800 transition-colors duration-75"
                />
              ))}
            </div>

            <div className="mt-1 flex items-center justify-between font-telemetry text-[10px] text-zinc-500">
              <span>RPM</span>
              <span ref={rpmTextRef}>3200 RPM</span>
            </div>
          </div>

          <div className="border-l border-white/15 pl-3 text-right">
            <p className="font-telemetry text-[10px] tracking-[0.2em] text-zinc-400">GEAR</p>
            <span
              ref={gearRef}
              className="font-telemetry text-xl font-bold leading-tight text-yellow-400"
            >
              01
            </span>
          </div>
        </div>

        {/* Bottom Center: 7 Portals Strip OR 6 Chapters + Compass */}
        {mode === 'open_world' ? (
          <div className="flex items-center gap-4 border border-white/15 bg-zinc-950/75 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div
                ref={compassArrowRef}
                className="flex h-6 w-6 items-center justify-center border border-yellow-400/50 text-yellow-400"
              >
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span ref={compassDistRef} className="font-telemetry text-[11px] text-zinc-200">
                CAP. 1 · 0m
              </span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-white/15 pl-3">
              {OPEN_WORLD_CHAPTERS.map((ch) => {
                const unlocked = unlockedChapters.includes(ch.id);
                return (
                  <span
                    key={ch.id}
                    className={`flex h-5 w-5 items-center justify-center border font-telemetry text-[10px] ${
                      unlocked
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                        : 'border-white/15 text-zinc-500'
                    }`}
                  >
                    {ch.id}
                  </span>
                );
              })}
              <span className="ml-1 font-telemetry text-[11px] text-zinc-400">
                {unlockedChapters.length}/6
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-white/15 bg-zinc-950/75 px-4 py-2 backdrop-blur-md">
            <span className="mr-1 font-telemetry text-[10px] tracking-[0.2em] text-zinc-400">
              PORTAIS
            </span>
            {STAGES.map((stage) => {
              const isDone = completedStages.includes(stage.id);
              const isActive = activeStageId === stage.id;
              return (
                <div
                  key={stage.id}
                  title={`${stage.circuit} ${stage.year}`}
                  className={`flex h-6 w-7 items-center justify-center border font-telemetry text-[11px] font-semibold ${
                    isActive
                      ? 'border-yellow-400 bg-yellow-400 text-zinc-950'
                      : isDone
                        ? 'border-green-600 bg-green-600/25 text-green-400'
                        : 'border-white/15 text-zinc-400'
                  }`}
                >
                  {stage.id}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Right: Audio Controls + Key Guide */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          <AudioControls />
          <div className="border border-white/15 bg-zinc-950/75 px-3 py-1 font-telemetry text-[10px] tracking-wider text-zinc-400 backdrop-blur-md">
            {mode === 'open_world'
              ? 'WASD / SETAS · ESPAÇO DRIFT · M ÁUDIO · ESC PAUSA'
              : 'WASD / SETAS · M ÁUDIO · ESC PAUSA'}
          </div>
        </div>
      </div>
    </div>
  );
}
