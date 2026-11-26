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
    ctx.font = 'bold 28px monospace';
    ctx.fillText(
      `PORTAL 0${stage.id} // ${completed ? 'CONCLUÍDO' : 'DISPONÍVEL'}`,
      28,
      54
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText(`${stage.circuit} ${stage.year}`, 28, 118);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 22px monospace';
    ctx.fillText(`${stage.car.teamName.toUpperCase()} · ${stage.car.chassisName}`, 28, 160);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function PortalGate({ stage, completed }: PortalGateProps) {
  const enterStage = useGameStore((state) => state.enterStage);
  const portalFieldRef = useRef<THREE.MeshBasicMaterial>(null);
  const triggeredRef = useRef(false);

  const isLeft = stage.portalSide === 'left';
  const sideSign = isLeft ? -1 : 1;
  const bayCenterX = sideSign * 20.2;
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
    if (portalFieldRef.current) {
      portalFieldRef.current.opacity =
        0.26 + Math.sin(state.clock.elapsedTime * 3.5 + stage.id) * 0.08;
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
      {/* Lateral access bay asphalt (40m long so adjacent 120m portals never overlap) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[sideSign * 20.5, 0.005, 0]} receiveShadow>
        <planeGeometry args={[14, 40]} />
        <meshStandardMaterial color="#1f2937" roughness={0.72} metalness={0.18} />
      </mesh>

      {/* Approach guide chevrons */}
      {[-14, -8, -2].map((offsetZ, idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, sideSign * -0.45]}
          position={[sideSign * (13.2 + idx * 2.1), 0.018, -offsetZ]}
        >
          <planeGeometry args={[2.4, 0.7]} />
          <meshBasicMaterial color={accentHex} transparent opacity={0.88} />
        </mesh>
      ))}

      {/* Monumental Portal Frame */}
      <group position={[bayCenterX, 0, 0]}>
        <mesh position={[-5.4, 4.4, 0]} castShadow>
          <boxGeometry args={[1.1, 8.8, 1.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.45} metalness={0.55} />
        </mesh>
        <mesh position={[5.4, 4.4, 0]} castShadow>
          <boxGeometry args={[1.1, 8.8, 1.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.45} metalness={0.55} />
        </mesh>

        <mesh position={[-4.8, 4.4, 0.55]}>
          <boxGeometry args={[0.18, 8.2, 0.18]} />
          <meshStandardMaterial color={accentHex} emissive={accentHex} emissiveIntensity={2.4} />
        </mesh>
        <mesh position={[4.8, 4.4, 0.55]}>
          <boxGeometry args={[0.18, 8.2, 0.18]} />
          <meshStandardMaterial color={accentHex} emissive={accentHex} emissiveIntensity={2.4} />
        </mesh>

        <mesh position={[0, 8.8, 0]} castShadow>
          <boxGeometry args={[12.2, 1.35, 1.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.6} />
        </mesh>

        <mesh position={[0, 4.2, 0]}>
          <planeGeometry args={[9.4, 8.0]} />
          <meshBasicMaterial
            ref={portalFieldRef}
            color={accentHex}
            transparent
            opacity={0.28}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh position={[0, 6.9, 0.85]}>
          <planeGeometry args={[8.6, 3.2]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </group>
    </group>
  );
}
