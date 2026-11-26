import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { OpponentSpec, StageConfig } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
import { getToonGradientMap } from '../../utils/performance';
import { gameRuntime } from '../../utils/runtime';
import { OpponentCar } from './OpponentCar';

function createCheckeredBannerTexture(circuit: string, year: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const squareSize = 32;
    for (let y = 0; y < 256; y += squareSize) {
      for (let x = 0; x < 1024; x += squareSize) {
        const isWhite = (x / squareSize + y / squareSize) % 2 === 0;
        ctx.fillStyle = isWhite ? '#f8fafc' : '#09090b';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.fillRect(190, 54, 644, 148);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(190, 54, 644, 148);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LINHA DE CHEGADA', 512, 108);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`${circuit} ${year}`, 512, 166);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBrazilFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(128, 18);
    ctx.lineTo(232, 80);
    ctx.lineTo(128, 142);
    ctx.lineTo(24, 80);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(128, 80, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function SuzukaFerrisWheel() {
  const wheelRef = useRef<THREE.Group>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += Math.min(delta, 0.05) * 0.14;
    }
  });

  const spokes = 12;

  return (
    <group position={[-82, 54, -760]}>
      {/* Support A-frame legs */}
      <mesh position={[-16, -26, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[2.6, 58, 2.6]} />
        <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[16, -26, 0]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[2.6, 58, 2.6]} />
        <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
      </mesh>

      <group ref={wheelRef}>
        <mesh>
          <torusGeometry args={[42, 1.3, 12, 48]} />
          <meshToonMaterial color="#f8fafc" gradientMap={gradientMap} />
        </mesh>
        <mesh>
          <torusGeometry args={[30, 0.7, 8, 36]} />
          <meshToonMaterial color="#ef4444" gradientMap={gradientMap} />
        </mesh>
        {Array.from({ length: spokes }).map((_, idx) => {
          const ang = (idx / spokes) * Math.PI * 2;
          return (
            <group key={idx} rotation={[0, 0, ang]}>
              <mesh>
                <boxGeometry args={[0.6, 84, 0.6]} />
                <meshToonMaterial color="#cbd5e1" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0, 42, 0]}>
                <boxGeometry args={[4.2, 4.8, 3.6]} />
                <meshToonMaterial
                  color={idx % 3 === 0 ? '#facc15' : idx % 3 === 1 ? '#ef4444' : '#38bdf8'}
                  gradientMap={gradientMap}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function CircuitScenery({ stage }: { stage: StageConfig }) {
  const leftBlocksRef = useRef<THREE.InstancedMesh>(null);
  const rightBlocksRef = useRef<THREE.InstancedMesh>(null);
  const kerbLeftRef = useRef<THREE.InstancedMesh>(null);
  const kerbRightRef = useRef<THREE.InstancedMesh>(null);
  const palmTrunksRef = useRef<THREE.InstancedMesh>(null);
  const palmTopsRef = useRef<THREE.InstancedMesh>(null);
  const hillsRef = useRef<THREE.InstancedMesh>(null);

  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const finishTexture = useMemo(
    () => createCheckeredBannerTexture(stage.circuit, stage.year),
    [stage.circuit, stage.year]
  );
  const brazilFlagTexture = useMemo(() => createBrazilFlagTexture(), []);

  useEffect(() => {
    return () => {
      finishTexture.dispose();
      brazilFlagTexture.dispose();
    };
  }, [brazilFlagTexture, finishTexture]);

  const isStreet = stage.id === 1 || stage.id === 4 || stage.id === 6;
  const isMonaco = stage.id === 1 || stage.id === 6;
  const hasHarbor = stage.id === 6;
  const isEstoril = stage.id === 2;
  const isSuzuka = stage.id === 3;
  const isPhoenix = stage.id === 4;
  const isInterlagos = stage.id === 5;
  const isDonington = stage.id === 7;

  const trackLength = stage.raceDistance + 240;
  const blockCount = 34;
  const kerbCount = Math.floor(stage.raceDistance / 16);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    if (leftBlocksRef.current && rightBlocksRef.current) {
      const monacoColors = ['#fed7aa', '#fca5a5', '#bfdbfe', '#fde68a', '#e2e8f0'];
      const phoenixColors = ['#475569', '#334155', '#64748b', '#94a3b8'];

      for (let i = 0; i < blockCount; i++) {
        const z = -i * 48 - 30;
        const heightL = isStreet ? 14 + ((i * 7) % 18) : 6.5 + (i % 2) * 2.5;
        const heightR = isStreet ? 12 + ((i * 11) % 24) : 6.5 + ((i + 1) % 2) * 2.5;
        const offsetX = isStreet ? 20 : 28;

        dummy.position.set(-offsetX, heightL / 2, z);
        dummy.scale.set(isStreet ? 10 : 11, heightL, isStreet ? 20 : 32);
        dummy.updateMatrix();
        leftBlocksRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(hasHarbor ? offsetX + 44 : offsetX, heightR / 2, z);
        dummy.scale.set(isStreet ? 10 : 11, heightR, isStreet ? 20 : 32);
        dummy.updateMatrix();
        rightBlocksRef.current.setMatrixAt(i, dummy.matrix);

        if (isMonaco) {
          color.set(monacoColors[i % monacoColors.length]!);
        } else if (isPhoenix) {
          color.set(phoenixColors[i % phoenixColors.length]!);
        } else if (isEstoril) {
          color.set(i % 2 === 0 ? '#f8fafc' : '#dc2626');
        } else if (isInterlagos) {
          color.set(i % 2 === 0 ? '#e2e8f0' : '#16a34a');
        } else {
          color.set('#334155');
        }

        leftBlocksRef.current.setColorAt(i, color);
        rightBlocksRef.current.setColorAt(i, color);
      }

      leftBlocksRef.current.instanceMatrix.needsUpdate = true;
      rightBlocksRef.current.instanceMatrix.needsUpdate = true;
      if (leftBlocksRef.current.instanceColor) leftBlocksRef.current.instanceColor.needsUpdate = true;
      if (rightBlocksRef.current.instanceColor) rightBlocksRef.current.instanceColor.needsUpdate = true;
    }

    if (kerbLeftRef.current && kerbRightRef.current) {
      for (let i = 0; i < kerbCount; i++) {
        const z = -i * 16 - 8;
        dummy.position.set(-12.0, 0.02, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kerbLeftRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(12.0, 0.02, z);
        dummy.updateMatrix();
        kerbRightRef.current.setMatrixAt(i, dummy.matrix);

        color.set(i % 2 === 0 ? '#ef4444' : '#f8fafc');
        kerbLeftRef.current.setColorAt(i, color);
        kerbRightRef.current.setColorAt(i, color);
      }
      kerbLeftRef.current.instanceMatrix.needsUpdate = true;
      kerbRightRef.current.instanceMatrix.needsUpdate = true;
      if (kerbLeftRef.current.instanceColor) kerbLeftRef.current.instanceColor.needsUpdate = true;
      if (kerbRightRef.current.instanceColor) kerbRightRef.current.instanceColor.needsUpdate = true;
    }

    if (isPhoenix && palmTrunksRef.current && palmTopsRef.current) {
      for (let i = 0; i < 24; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = -i * 58 - 25;
        const x = side * 15.5;
        dummy.position.set(x, 4.5, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        palmTrunksRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, 9.2, z);
        dummy.updateMatrix();
        palmTopsRef.current.setMatrixAt(i, dummy.matrix);
      }
      palmTrunksRef.current.instanceMatrix.needsUpdate = true;
      palmTopsRef.current.instanceMatrix.needsUpdate = true;
    }

    if ((isInterlagos || isDonington) && hillsRef.current) {
      for (let i = 0; i < 20; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = -i * 80 - 40;
        const radius = 38 + (i % 3) * 14;
        const height = 22 + (i % 4) * 8;
        dummy.position.set(side * (68 + (i % 3) * 18), height * 0.4, z);
        dummy.scale.set(radius, height, radius);
        dummy.updateMatrix();
        hillsRef.current.setMatrixAt(i, dummy.matrix);
      }
      hillsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [
    blockCount,
    hasHarbor,
    isDonington,
    isEstoril,
    isInterlagos,
    isMonaco,
    isPhoenix,
    isStreet,
    kerbCount,
  ]);

  return (
    <group>
      {/* Surrounding terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -trackLength / 2]} receiveShadow>
        <planeGeometry args={[900, trackLength + 400]} />
        <meshToonMaterial
          color={
            isPhoenix
              ? '#ca8a04'
              : isStreet
                ? '#334155'
                : isDonington
                  ? '#15803d'
                  : '#166534'
          }
          gradientMap={gradientMap}
        />
      </mesh>

      {/* Runoff gravel traps for Estoril, Interlagos, Suzuka */}
      {(isEstoril || isInterlagos || isSuzuka) && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-16.5, -0.02, -trackLength / 2]}>
            <planeGeometry args={[8, trackLength]} />
            <meshToonMaterial
              color={isInterlagos ? '#9a3412' : '#d6d3d1'}
              gradientMap={gradientMap}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16.5, -0.02, -trackLength / 2]}>
            <planeGeometry args={[8, trackLength]} />
            <meshToonMaterial
              color={isInterlagos ? '#9a3412' : '#d6d3d1'}
              gradientMap={gradientMap}
            />
          </mesh>
        </>
      )}

      {/* Race Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -trackLength / 2]} receiveShadow>
        <planeGeometry args={[26, trackLength + 200]} />
        <meshStandardMaterial
          color={stage.weather.wetAsphalt ? '#111827' : '#27272a'}
          roughness={stage.weather.wetAsphalt ? 0.14 : 0.82}
          metalness={stage.weather.wetAsphalt ? 0.48 : 0.1}
        />
      </mesh>

      {/* White Track Borders */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`border-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * 11.2, 0.01, -trackLength / 2]}
        >
          <planeGeometry args={[0.32, trackLength + 200]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      ))}

      {/* Kerbs */}
      <instancedMesh ref={kerbLeftRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.04, 15.8]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>
      <instancedMesh ref={kerbRightRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.04, 15.8]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>

      {/* Barriers / Guard-rails */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`wall-${side}`}
          position={[side * (isStreet ? 12.9 : 16.5), isPhoenix ? 0.5 : 0.65, -trackLength / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[isPhoenix ? 0.7 : 0.45, isPhoenix ? 1.0 : 1.25, trackLength + 200]} />
          <meshToonMaterial
            color={isPhoenix ? '#cbd5e1' : isMonaco ? '#94a3b8' : '#52525b'}
            gradientMap={gradientMap}
          />
        </mesh>
      ))}

      {/* Buildings / Grandstands */}
      <instancedMesh ref={leftBlocksRef} args={[undefined, undefined, blockCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>
      <instancedMesh ref={rightBlocksRef} args={[undefined, undefined, blockCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>

      {/* Estoril & Interlagos Timing / Broadcast Towers */}
      {(isEstoril || isInterlagos) && (
        <group position={[-22, 0, -140]}>
          <mesh position={[0, 14, 0]} castShadow>
            <boxGeometry args={[7, 28, 7]} />
            <meshToonMaterial
              color={isEstoril ? '#f8fafc' : '#1d4ed8'}
              gradientMap={gradientMap}
            />
          </mesh>
          <mesh position={[0, 26, 0]}>
            <boxGeometry args={[9, 4, 9]} />
            <meshToonMaterial
              color={isEstoril ? '#dc2626' : '#f8fafc'}
              gradientMap={gradientMap}
            />
          </mesh>
        </group>
      )}

      {/* Interlagos Brazilian Flags above Grandstands */}
      {isInterlagos &&
        [-180, -420, -680, -960, -1200].map((fz) => (
          <group key={fz} position={[-27, 13.5, fz]}>
            <mesh position={[0, -2, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 5, 8]} />
              <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 1.2, 2.2]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[5.5, 3.4]} />
              <meshBasicMaterial map={brazilFlagTexture} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

      {/* Interlagos & Donington Rolling Green Hills */}
      {(isInterlagos || isDonington) && (
        <instancedMesh ref={hillsRef} args={[undefined, undefined, 20]}>
          <coneGeometry args={[1, 1, 8]} />
          <meshToonMaterial
            color={isDonington ? '#15803d' : '#16a34a'}
            gradientMap={gradientMap}
          />
        </instancedMesh>
      )}

      {/* Phoenix Stylized Palm Trees */}
      {isPhoenix && (
        <>
          <instancedMesh ref={palmTrunksRef} args={[undefined, undefined, 24]}>
            <cylinderGeometry args={[0.3, 0.45, 9, 8]} />
            <meshToonMaterial color="#92400e" gradientMap={gradientMap} />
          </instancedMesh>
          <instancedMesh ref={palmTopsRef} args={[undefined, undefined, 24]}>
            <coneGeometry args={[3.4, 2.6, 6]} />
            <meshToonMaterial color="#16a34a" gradientMap={gradientMap} />
          </instancedMesh>
        </>
      )}

      {/* Suzuka 1988 Iconic Ferris Wheel + Crossover Bridge */}
      {isSuzuka && (
        <>
          <SuzukaFerrisWheel />
          <group position={[0, 0, -660]}>
            <mesh position={[-17, 6, 0]}>
              <boxGeometry args={[2.5, 12, 8]} />
              <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[17, 6, 0]}>
              <boxGeometry args={[2.5, 12, 8]} />
              <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 10.5, 0]}>
              <boxGeometry args={[38, 2.6, 12]} />
              <meshToonMaterial color="#3f3f46" gradientMap={gradientMap} />
            </mesh>
          </group>
        </>
      )}

      {/* Donington 1993 Iconic Dunlop Tire Bridge */}
      {isDonington && (
        <group position={[0, 0, -700]}>
          <mesh rotation={[0, 0, 0]} position={[0, 0.5, 0]}>
            <torusGeometry args={[14.5, 2.6, 14, 32, Math.PI]} />
            <meshToonMaterial color="#09090b" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 14.5, 2.7]}>
            <boxGeometry args={[14, 2.2, 0.3]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      )}

      {/* Monaco Tunnel (1984 & 1992) */}
      {isMonaco && (
        <group position={[0, 0, -560]}>
          <mesh position={[0, 7.0, 0]}>
            <boxGeometry args={[27.5, 0.8, 170]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
          <mesh position={[-13.2, 3.5, 0]}>
            <boxGeometry args={[0.8, 7.0, 170]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          <mesh position={[13.2, 3.5, 0]}>
            <boxGeometry args={[0.8, 7.0, 170]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          {[-65, -32, 0, 32, 65].map((tz) => (
            <mesh key={tz} position={[0, 6.4, tz]}>
              <boxGeometry args={[6, 0.15, 2.2]} />
              <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={3.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Monaco 1992 Mediterranean Harbor & Boats */}
      {hasHarbor && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[135, -0.02, -720]}>
            <planeGeometry args={[240, 1600]} />
            <meshStandardMaterial color="#0284c7" roughness={0.12} metalness={0.65} />
          </mesh>
          {[-180, -340, -740, -960, -1180].map((bz, idx) => (
            <group key={bz} position={[30 + (idx % 3) * 14, 0.7, bz]}>
              <mesh castShadow>
                <boxGeometry args={[4.8, 1.5, 16]} />
                <meshToonMaterial color="#f8fafc" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0, 1.4, 1.5]}>
                <boxGeometry args={[3.4, 1.5, 6.8]} />
                <meshToonMaterial
                  color={idx % 2 === 0 ? '#ef4444' : '#1d4ed8'}
                  gradientMap={gradientMap}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Checkered Finish Gantry */}
      <group position={[0, 0, -stage.raceDistance]}>
        <mesh position={[-13.5, 5.2, 0]}>
          <boxGeometry args={[1, 10.4, 1.2]} />
          <meshToonMaterial color="#18181b" gradientMap={gradientMap} />
        </mesh>
        <mesh position={[13.5, 5.2, 0]}>
          <boxGeometry args={[1, 10.4, 1.2]} />
          <meshToonMaterial color="#18181b" gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 9.2, 0]}>
          <boxGeometry args={[28, 3.2, 1.1]} />
          <meshBasicMaterial map={finishTexture} />
        </mesh>
      </group>
    </group>
  );
}

export function RaceTrack() {
  const mode = useGameStore((state) => state.mode);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const isPaused = useGameStore((state) => state.isPaused);
  const finishRace = useGameStore((state) => state.finishRace);
  const setTacticalAlert = useGameStore((state) => state.setTacticalAlert);

  const stage = useMemo(
    () => STAGES.find((item) => item.id === activeStageId) ?? null,
    [activeStageId]
  );

  const alertTimeoutRef = useRef<number | null>(null);
  const gearFailureAppliedRef = useRef(false);
  const stumbleAlertAppliedRef = useRef(false);
  const lightningTimerRef = useRef(3.5);

  const showTimedAlert = useCallback(
    (msg: string, durationMs = 2400) => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current);
      }
      setTacticalAlert(msg);
      alertTimeoutRef.current = window.setTimeout(() => {
        setTacticalAlert(null);
      }, durationMs);
    },
    [setTacticalAlert]
  );

  useEffect(() => {
    gearFailureAppliedRef.current = false;
    stumbleAlertAppliedRef.current = false;
    lightningTimerRef.current = 3.5;

    return () => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [activeStageId]);

  const handleOvertake = useCallback(
    (spec: OpponentSpec) => {
      engineAudio.playOvertake();
      if (stage?.mechanic === 'four_overtakes') {
        showTimedAlert(
          `ULTRAPASSAGEM ${gameRuntime.overtakesCompleted}/${stage.targetOvertakes}: ${spec.name}`,
          2200
        );
        gameRuntime.lightningFlash = 0.45;
      } else {
        showTimedAlert(`ULTRAPASSAGEM: ${spec.name}`, 2400);
      }
    },
    [showTimedAlert, stage]
  );

  useFrame((_, delta) => {
    if (mode !== 'race' || !stage || isPaused || gameRuntime.raceFinished) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    gameRuntime.raceElapsed += dt;

    if (
      stage.mechanic === 'stumble_recovery' &&
      gameRuntime.stumbleTriggered &&
      !stumbleAlertAppliedRef.current
    ) {
      stumbleAlertAppliedRef.current = true;
      showTimedAlert('QUEDA DE ROTAÇÃO — RETOMADA!', 2000);
    }

    if (
      stage.mechanic === 'sixth_gear_failure' &&
      !gearFailureAppliedRef.current &&
      gameRuntime.distance >= stage.raceDistance * 0.5
    ) {
      gearFailureAppliedRef.current = true;
      gameRuntime.gearLocked = true;
      gameRuntime.transmissionFailed = true;
      engineAudio.playGearFailure();
      setTacticalAlert('6TH GEAR — TRANSMISSION FAILURE');
    }

    if (stage.weather.lightning) {
      lightningTimerRef.current -= dt;
      if (lightningTimerRef.current <= 0) {
        gameRuntime.lightningFlash = 0.85;
        lightningTimerRef.current = 5.5 + Math.random() * 6;
      }
    }
    gameRuntime.lightningFlash = Math.max(0, gameRuntime.lightningFlash - dt * 2.8);

    const finishZ = -stage.raceDistance;
    if (
      gameRuntime.previousPosition.z > finishZ &&
      gameRuntime.position.z <= finishZ
    ) {
      gameRuntime.raceFinished = true;
      engineAudio.playCheckeredFlag();

      const allOpponentsBehind = gameRuntime.opponents.every(
        (opp) => opp.z > gameRuntime.position.z
      );

      const overtakesOk =
        stage.mechanic === 'defend_lead'
          ? allOpponentsBehind
          : gameRuntime.overtakesCompleted >= stage.targetOvertakes && allOpponentsBehind;

      const aheadCount = gameRuntime.opponents.filter(
        (opp) => opp.z < gameRuntime.position.z
      ).length;

      finishRace({
        status: overtakesOk ? 'victory' : 'defeat',
        stageId: stage.id,
        position: aheadCount + 1,
        overtakesCompleted: gameRuntime.overtakesCompleted,
        overtakesRequired: stage.targetOvertakes,
        elapsedSeconds: gameRuntime.raceElapsed,
      });
    }
  });

  if (mode !== 'race' || !stage) {
    return null;
  }

  return (
    <group>
      <CircuitScenery stage={stage} />
      {stage.opponents.map((spec, idx) => (
        <OpponentCar
          key={`${stage.id}-${spec.id}`}
          spec={spec}
          index={idx}
          stage={stage}
          isPaused={isPaused}
          onOvertake={handleOvertake}
        />
      ))}
    </group>
  );
}
