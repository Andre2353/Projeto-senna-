import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Navigation2, Pause } from 'lucide-react';
import { CORRIDOR_END_Z, OPEN_WORLD_CHAPTERS, STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { engineAudio } from '../../utils/engineAudio';
import { gameRuntime } from '../../utils/runtime';
import { AudioControls } from './AudioControls';

const RPM_SEGMENTS = 18;

export function TelemetryHUD() {
  const mode = useGameStore((state) => state.mode);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const completedStages = useGameStore((state) => state.completedStages);
  const unlockedChapters = useGameStore((state) => state.unlockedChapters);
  const tacticalAlert = useGameStore((state) => state.tacticalAlert);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const togglePause = useGameStore((state) => state.togglePause);
  const enterOpenWorld = useGameStore((state) => state.enterOpenWorld);
  const enterStage = useGameStore((state) => state.enterStage);
  const openChapterCard = useGameStore((state) => state.openChapterCard);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const speedRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const rpmTextRef = useRef<HTMLSpanElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const overtakeRef = useRef<HTMLSpanElement>(null);
  const compassArrowRef = useRef<HTMLDivElement>(null);
  const compassDistRef = useRef<HTMLSpanElement>(null);
  const nearbyPortalRef = useRef<HTMLDivElement>(null);
  const nearbyPortalTextRef = useRef<HTMLSpanElement>(null);
  const hudFlashRef = useRef<HTMLDivElement>(null);
  const rpmBarRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const activeStage =
    activeStageId !== null ? STAGES.find((stage) => stage.id === activeStageId) ?? null : null;

  // 4-second onboarding guide after leaving Landing Screen (dismisses automatically on drive input)
  useEffect(() => {
    if (mode !== 'corridor') {
      setShowOnboarding(false);
      return;
    }

    setShowOnboarding(true);
    const hideTimer = window.setTimeout(() => {
      setShowOnboarding(false);
    }, 4000);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'landing' || mode === 'credits') {
      return;
    }

    let rafId = 0;

    const updateTelemetryDom = () => {
      if (showOnboarding && (gameRuntime.throttle > 0.3 || Math.abs(gameRuntime.steering) > 0.25)) {
        setShowOnboarding(false);
      }

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

      // Nearby Portal Tactile Cue in Main Corridor (< 60 units ahead)
      if (mode === 'corridor' && nearbyPortalRef.current && nearbyPortalTextRef.current) {
        const pz = gameRuntime.position.z;
        const nearby = STAGES.find((stage) => {
          const distAhead = pz - stage.portalZ;
          return distAhead >= -8 && distAhead <= 60;
        });

        if (nearby) {
          nearbyPortalRef.current.style.opacity = '1';
          nearbyPortalTextRef.current.textContent =
            nearby.portalSide === 'left'
              ? `← ENTRAR: ${nearby.circuit} ${nearby.year} (OU SIGA RETO)`
              : `ENTRAR: ${nearby.circuit} ${nearby.year} → (OU SIGA RETO)`;
        } else {
          nearbyPortalRef.current.style.opacity = '0';
        }
      } else if (nearbyPortalRef.current) {
        nearbyPortalRef.current.style.opacity = '0';
      }

      // Overtake Counter + Audio/Visual Juice Pulse
      const sinceOvertake = performance.now() - gameRuntime.overtakePulseAt;
      const isPulsing = gameRuntime.overtakePulseAt > 0 && sinceOvertake < 450;

      if (overtakeRef.current && mode === 'race' && activeStage) {
        if (activeStage.mechanic === 'defend_lead') {
          const rivalBehind = gameRuntime.opponents.every(
            (opp) => opp.z > gameRuntime.position.z
          );
          overtakeRef.current.textContent = rivalBehind ? 'POSIÇÃO: P1' : 'POSIÇÃO: P2';
        } else {
          overtakeRef.current.textContent = `ULTRAPASSAGENS ${gameRuntime.overtakesCompleted}/${activeStage.targetOvertakes}`;
        }
        overtakeRef.current.style.color = isPulsing ? '#facc15' : '';
        overtakeRef.current.style.transform =
          isPulsing && !reducedMotion ? 'scale(1.08)' : 'scale(1)';
      }

      if (hudFlashRef.current) {
        hudFlashRef.current.style.opacity =
          isPulsing && !reducedMotion ? String(Math.max(0, 1 - sinceOvertake / 450) * 0.85) : '0';
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
              ? `ALVO: CAP. ${gameRuntime.nearestMonumentId} · ${Math.round(
                  gameRuntime.nearestMonumentDistance
                )}m`
              : 'TRAJETÓRIA COMPLETA (6/6)';
        }
      }

      rafId = window.requestAnimationFrame(updateTelemetryDom);
    };

    rafId = window.requestAnimationFrame(updateTelemetryDom);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activeStage, mode, reducedMotion, showOnboarding]);

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
      {/* Subtle HUD edge flash on clean overtake */}
      <div
        ref={hudFlashRef}
        className="pointer-events-none fixed inset-0 border-2 border-yellow-400/80 opacity-0 shadow-[inset_0_0_48px_rgba(250,204,21,0.22)] transition-opacity duration-75"
      />

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
                <span
                  ref={overtakeRef}
                  className="inline-block origin-left transition-transform duration-150"
                >
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

      {/* NEARBY PORTAL TACTILE CUE */}
      <div
        ref={nearbyPortalRef}
        className="pointer-events-none fixed bottom-22 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200"
      >
        <div className="border border-yellow-400/80 bg-zinc-950/88 px-5 py-2 font-telemetry text-xs font-bold tracking-[0.18em] text-yellow-400 backdrop-blur-md">
          <span ref={nearbyPortalTextRef}>ENTRAR NO PORTAL</span>
        </div>
      </div>

      {/* 4-SECOND INSTANT ONBOARDING GUIDE */}
      <div
        className={`pointer-events-none fixed bottom-22 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${
          showOnboarding ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="border border-white/20 bg-zinc-950/85 px-6 py-2.5 font-telemetry text-xs tracking-[0.16em] text-slate-50 backdrop-blur-md">
          <span className="text-yellow-400 font-bold">W</span> ACELERAR
          <span className="mx-3 text-zinc-600">|</span>
          <span className="text-yellow-400 font-bold">A / D</span> VIRAR
          <span className="mx-3 text-zinc-600">|</span>
          <span className="text-yellow-400 font-bold">ESC</span> MENU
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

        {/* Bottom Center: Interactive 7 Portals Bar OR Prominent Open World Compass + Reopenable Chapters */}
        {mode === 'open_world' ? (
          <div className="pointer-events-auto flex items-center gap-4 border border-yellow-400/35 bg-zinc-950/85 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div
                ref={compassArrowRef}
                className="flex h-8 w-8 items-center justify-center border border-yellow-400 bg-yellow-400/15 text-yellow-400"
              >
                <Navigation2 className="h-4 w-4 fill-yellow-400" />
              </div>
              <span
                ref={compassDistRef}
                className="font-telemetry text-xs font-bold tracking-wider text-yellow-400"
              >
                ALVO: CAP. 1 · 0m
              </span>
            </div>

            <div className="flex items-center gap-1.5 border-l border-white/15 pl-3">
              {OPEN_WORLD_CHAPTERS.map((ch) => {
                const unlocked = unlockedChapters.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => openChapterCard(ch.id)}
                    title={
                      unlocked
                        ? `Reabrir: ${ch.title}`
                        : `Capítulo ${ch.id} bloqueado — siga a seta`
                    }
                    className={`flex h-6 w-6 items-center justify-center border font-telemetry text-[10px] font-semibold transition ${
                      unlocked
                        ? 'cursor-pointer border-yellow-400 bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400 hover:text-zinc-950'
                        : 'cursor-default border-white/15 text-zinc-500'
                    }`}
                  >
                    {ch.id}
                  </button>
                );
              })}
              <span className="ml-1 font-telemetry text-[11px] text-zinc-300">
                {unlockedChapters.length}/6
              </span>
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-1.5 border border-white/15 bg-zinc-950/75 px-3.5 py-2 backdrop-blur-md">
            <span className="mr-1 font-telemetry text-[10px] tracking-[0.2em] text-zinc-400">
              PORTAIS
            </span>
            {STAGES.map((stage) => {
              const isDone = completedStages.includes(stage.id);
              const isActive = activeStageId === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    engineAudio.playPortalEnter();
                    enterStage(stage.id);
                  }}
                  title={`PORTAL 0${stage.id}: ${stage.circuit} ${stage.year} (${stage.car.chassisName}) — Clique para correr`}
                  className={`group relative flex h-7 w-7 cursor-pointer items-center justify-center border font-telemetry text-[11px] font-semibold transition ${
                    isActive
                      ? 'border-yellow-400 bg-yellow-400 text-zinc-950'
                      : isDone
                        ? 'border-green-600 bg-green-600/25 text-green-400 hover:border-yellow-400'
                        : 'border-white/20 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  {stage.id}
                  <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border border-white/20 bg-zinc-950 px-2 py-0.5 font-telemetry text-[10px] text-slate-50 group-hover:block">
                    {stage.circuit} {stage.year}
                  </span>
                </button>
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
              : mode === 'race'
                ? 'WASD / SETAS · R REINICIAR · M ÁUDIO · ESC PAUSA'
                : 'WASD / SETAS · M ÁUDIO · ESC PAUSA'}
          </div>
        </div>
      </div>
    </div>
  );
}
