import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CORRIDOR_HALF_WIDTH } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { StageConfig } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
import { segmentCrossesPortalZ } from '../../utils/gameMath';
import { gameRuntime } from '../../utils/runtime';

interface PortalGateProps {
  stage: StageConfig;
  completed: boolean;
}

function createPortalSignTexture(stage: StageConfig, completed: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = completed ? '#16a34a' : '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = completed ? '#16a34a' : '#facc15';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(
      completed ? `PORTAL 0${stage.id} // ✓ CONCLUÍDA` : `PORTAL 0${stage.id} // CORRER AGORA`,
      26,
      52
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(`${stage.circuit} ${stage.year}`, 26, 118);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 22px monospace';
    ctx.fillText(`${stage.car.teamName.toUpperCase()} · ${stage.car.chassisName}`, 26, 160);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function PortalGate({ stage, completed }: PortalGateProps) {
  const enterStage = useGameStore((state) => state.enterStage);
  const portalFieldRef = useRef<THREE.MeshBasicMaterial>(null);
  const statusLedRef = useRef<THREE.MeshStandardMaterial>(null);
  const triggeredRef = useRef(false);

  const isLeft = stage.portalSide === 'left';
  const sideSign = isLeft ? -1 : 1;
  const bayCenterX = sideSign * 20.5;
  const minHitX = isLeft ? -26.5 : CORRIDOR_HALF_WIDTH + 0.5;
  const maxHitX = isLeft ? -(CORRIDOR_HALF_WIDTH + 0.5) : 26.5;

  const signTexture = useMemo(
    () => createPortalSignTexture(stage, completed),
    [completed, stage]
  );

  useEffect(() => {
    triggeredRef.current = false;
    return () => {
      signTexture.dispose();
    };
  }, [signTexture]);

  useFrame((state) => {
    const pulse = Math.sin(state.clock.elapsedTime * 3.8 + stage.id);
    if (portalFieldRef.current) {
      portalFieldRef.current.opacity = completed ? 0.18 : 0.24 + pulse * 0.08;
    }
    if (statusLedRef.current) {
      statusLedRef.current.emissiveIntensity = completed ? 1.8 : 2.2 + pulse * 1.1;
    }

    if (triggeredRef.current || gameRuntime.activeStageId !== null) {
      return;
    }

    const hit = segmentCrossesPortalZ(
      gameRuntime.previousPosition.x,
      gameRuntime.previousPosition.z,
      gameRuntime.position.x,
      gameRuntime.position.z,
      stage.portalZ,
      minHitX,
      maxHitX
    );

    if (hit) {
      triggeredRef.current = true;
      engineAudio.playPortalEnter();
      enterStage(stage.id);
    }
  });

  const accentHex = completed ? '#16a34a' : '#facc15';

  return (
    <group position={[0, 0, stage.portalZ]}>
      {/* Lateral Deceleration & Circuit Exit Lane Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sideSign * 20.6, 0.005, 8]} receiveShadow>
        <planeGeometry args={[14.5, 62]} />
        <meshStandardMaterial color="#1f2937" roughness={0.76} metalness={0.14} />
      </mesh>

      {/* Painted Hatched Entry Stripes & Directional Exit Chevrons */}
      {[-12, -4, 4, 12, 20, 28].map((zOff, idx) => (
        <mesh
          key={`stripe-${idx}`}
          rotation={[-Math.PI / 2, 0, sideSign * -0.52]}
          position={[sideSign * 14.2, 0.015, zOff]}
        >
          <planeGeometry args={[2.2, 0.55]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.78} />
        </mesh>
      ))}
      {[-22, -14, -6].map((offsetZ, idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, sideSign * -0.45]}
          position={[sideSign * (13.6 + idx * 2.1), 0.018, -offsetZ]}
        >
          <planeGeometry args={[2.5, 0.72]} />
          <meshBasicMaterial color={accentHex} transparent opacity={0.92} />
        </mesh>
      ))}

      {/* Architectural Circuit Portal Gantry */}
      <group position={[bayCenterX, 0, 0]}>
        <mesh position={[-5.4, 4.4, 0]} castShadow>
          <boxGeometry args={[1.1, 8.8, 1.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.45} metalness={0.55} />
        </mesh>
        <mesh position={[5.4, 4.4, 0]} castShadow>
          <boxGeometry args={[1.1, 8.8, 1.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.45} metalness={0.55} />
        </mesh>

        {/* Status LED Pillars */}
        {([-4.8, 4.8] as const).map((lx) => (
          <mesh key={lx} position={[lx, 4.4, 0.55]}>
            <boxGeometry args={[0.2, 8.2, 0.2]} />
            <meshStandardMaterial
              ref={lx > 0 ? statusLedRef : undefined}
              color={accentHex}
              emissive={accentHex}
              emissiveIntensity={2.4}
            />
          </mesh>
        ))}

        <mesh position={[0, 8.8, 0]} castShadow>
          <boxGeometry args={[12.4, 1.4, 1.65]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.6} />
        </mesh>

        <mesh position={[0, 4.2, 0]}>
          <planeGeometry args={[9.4, 8.0]} />
          <meshBasicMaterial
            ref={portalFieldRef}
            color={accentHex}
            transparent
            opacity={0.26}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 7.0, 0.88]}>
          <planeGeometry args={[8.8, 3.3]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </group>
    </group>
  );
}
