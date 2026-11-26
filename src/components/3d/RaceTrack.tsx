import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { OpponentSpec, StageConfig } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
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

function CircuitScenery({ stage }: { stage: StageConfig }) {
  const leftBlocksRef = useRef<THREE.InstancedMesh>(null);
  const rightBlocksRef = useRef<THREE.InstancedMesh>(null);
  const kerbLeftRef = useRef<THREE.InstancedMesh>(null);
  const kerbRightRef = useRef<THREE.InstancedMesh>(null);

  const isStreet = stage.id === 1 || stage.id === 4 || stage.id === 6;
  const isMonaco = stage.id === 1 || stage.id === 6;
  const hasHarbor = stage.id === 6;
  const finishTexture = useMemo(
    () => createCheckeredBannerTexture(stage.circuit, stage.year),
    [stage.circuit, stage.year]
  );

  useEffect(() => {
    return () => {
      finishTexture.dispose();
    };
  }, [finishTexture]);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    // Street buildings / Autodrome grandstands
    const blockCount = 48;
    if (leftBlocksRef.current && rightBlocksRef.current) {
      for (let i = 0; i < blockCount; i++) {
        const z = -i * 68 - 40;
        const heightL = isStreet ? 14 + ((i * 7) % 18) : 6 + (i % 3) * 2;
        const heightR = isStreet ? 12 + ((i * 11) % 22) : 6 + ((i + 1) % 3) * 2;
        const offsetX = isStreet ? 21 : 29;

        dummy.position.set(-offsetX, heightL / 2, z);
        dummy.scale.set(isStreet ? 10 : 12, heightL, isStreet ? 24 : 38);
        dummy.updateMatrix();
        leftBlocksRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(hasHarbor ? offsetX + 46 : offsetX, heightR / 2, z);
        dummy.scale.set(isStreet ? 10 : 12, heightR, isStreet ? 24 : 38);
        dummy.updateMatrix();
        rightBlocksRef.current.setMatrixAt(i, dummy.matrix);
      }
      leftBlocksRef.current.instanceMatrix.needsUpdate = true;
      rightBlocksRef.current.instanceMatrix.needsUpdate = true;
    }

    // Trackside kerbs (red/white alternating)
    const kerbCount = Math.floor(stage.raceDistance / 16);
    if (kerbLeftRef.current && kerbRightRef.current) {
      const color = new THREE.Color();
      for (let i = 0; i < kerbCount; i++) {
        const z = -i * 16 - 8;
        dummy.position.set(-12.2, 0.02, z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kerbLeftRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(12.2, 0.02, z);
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
  }, [hasHarbor, isStreet, stage.raceDistance]);

  const kerbCount = Math.floor(stage.raceDistance / 16);
  const trackLength = stage.raceDistance + 350;

  return (
    <group>
      {/* Surrounding terrain (urban concrete vs autodrome turf) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -trackLength / 2]} receiveShadow>
        <planeGeometry args={[900, trackLength + 400]} />
        <meshStandardMaterial
          color={isStreet ? '#1f2937' : '#14261a'}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Race Asphalt (wet specular reflection vs dry matte) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -trackLength / 2]} receiveShadow>
        <planeGeometry args={[26, trackLength + 200]} />
        <meshStandardMaterial
          color={stage.weather.wetAsphalt ? '#111827' : '#18181b'}
          roughness={stage.weather.wetAsphalt ? 0.14 : 0.85}
          metalness={stage.weather.wetAsphalt ? 0.48 : 0.1}
        />
      </mesh>

      {/* White Track Borders */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`border-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * 11.4, 0.01, -trackLength / 2]}
        >
          <planeGeometry args={[0.3, trackLength + 200]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      ))}

      {/* Kerbs */}
      <instancedMesh ref={kerbLeftRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.04, 15.8]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={kerbRightRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.04, 15.8]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>

      {/* Barriers / Guard-rails */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`wall-${side}`}
          position={[side * (isStreet ? 13.6 : 16.5), 0.65, -trackLength / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.6, 1.3, trackLength + 200]} />
          <meshStandardMaterial
            color={isStreet ? '#52525b' : '#3f3f46'}
            roughness={0.45}
            metalness={0.55}
          />
        </mesh>
      ))}

      {/* Urban Buildings / Autodrome Grandstands */}
      <instancedMesh ref={leftBlocksRef} args={[undefined, undefined, 48]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isStreet ? '#27272a' : '#1e293b'}
          roughness={0.75}
          metalness={0.2}
        />
      </instancedMesh>
      <instancedMesh ref={rightBlocksRef} args={[undefined, undefined, 48]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isStreet ? '#3f3f46' : '#1e293b'}
          roughness={0.75}
          metalness={0.2}
        />
      </instancedMesh>

      {/* Pit Lane Building & Tower for Autodromes */}
      {!isStreet && (
        <group position={[-24, 0, -140]}>
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[10, 8, 120]} />
            <meshStandardMaterial color="#18181b" roughness={0.6} metalness={0.35} />
          </mesh>
          <mesh position={[-2, 13, 45]} castShadow>
            <boxGeometry args={[6, 26, 8]} />
            <meshStandardMaterial color="#27272a" roughness={0.45} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* Monaco Tunnel Section (1984 & 1992) */}
      {isMonaco && (
        <group position={[0, 0, -1040]}>
          <mesh position={[0, 7.2, 0]}>
            <boxGeometry args={[28.5, 0.8, 240]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
          <mesh position={[-13.8, 3.6, 0]}>
            <boxGeometry args={[0.8, 7.2, 240]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          <mesh position={[13.8, 3.6, 0]}>
            <boxGeometry args={[0.8, 7.2, 240]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} />
          </mesh>
          {[-90, -45, 0, 45, 90].map((tz) => (
            <mesh key={tz} position={[0, 6.6, tz]}>
              <boxGeometry args={[6, 0.15, 2.2]} />
              <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={2.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* Monaco 1992 Mediterranean Harbor & Boats */}
      {hasHarbor && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[140, -0.02, -1450]}>
            <planeGeometry args={[240, 2900]} />
            <meshStandardMaterial color="#0369a1" roughness={0.12} metalness={0.65} />
          </mesh>
          {[-420, -760, -1420, -1890, -2340].map((bz, idx) => (
            <group key={bz} position={[34 + (idx % 3) * 14, 0.6, bz]}>
              <mesh castShadow>
                <boxGeometry args={[4.5, 1.4, 15]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.35} />
              </mesh>
              <mesh position={[0, 1.3, 1.5]}>
                <boxGeometry args={[3.2, 1.4, 6.5]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Checkered Finish Gantry */}
      <group position={[0, 0, -stage.raceDistance]}>
        <mesh position={[-13.5, 5.2, 0]}>
          <boxGeometry args={[1, 10.4, 1.2]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[13.5, 5.2, 0]}>
          <boxGeometry args={[1, 10.4, 1.2]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
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

    // Suzuka 1988 start stumble tactical alert
    if (
      stage.mechanic === 'stumble_recovery' &&
      gameRuntime.stumbleTriggered &&
      !stumbleAlertAppliedRef.current
    ) {
      stumbleAlertAppliedRef.current = true;
      showTimedAlert('QUEDA DE ROTAÇÃO — RETOMADA!', 2000);
    }

    // Interlagos 1991: 6th gear failure in second half
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

    // Donington 1993 distant subtle lightning
    if (stage.weather.lightning) {
      lightningTimerRef.current -= dt;
      if (lightningTimerRef.current <= 0) {
        gameRuntime.lightningFlash = 0.85;
        lightningTimerRef.current = 5.5 + Math.random() * 6;
      }
    }
    gameRuntime.lightningFlash = Math.max(0, gameRuntime.lightningFlash - dt * 2.8);

    // Check finish line crossing
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
