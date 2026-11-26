import * as THREE from 'three';
import type { CarLivery } from '../types/game';

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  options?: {
    repeatX?: number;
    repeatY?: number;
    isColor?: boolean;
    anisotropy?: number;
  }
): THREE.CanvasTexture {
  const cached = textureCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx, width, height);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = options?.isColor === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = options?.anisotropy ?? 8;
  if (options?.repeatX !== undefined || options?.repeatY !== undefined) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
  }
  tex.needsUpdate = true;

  textureCache.set(key, tex);
  return tex;
}

export function getCachedCarBodyTexture(livery: CarLivery): THREE.CanvasTexture {
  const key = `body:${livery.id}:${livery.primary}:${livery.secondary}:${livery.accent}:${livery.numberText}`;
  return getOrCreateTexture(key, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = livery.primary;
    ctx.fillRect(0, 0, w, h);

    // Classic 80s/90s Marlboro/Lotus/Williams chevron livery stripe
    ctx.fillStyle = livery.secondary;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25);
    ctx.lineTo(w * 0.42, 0);
    ctx.lineTo(w * 0.65, 0);
    ctx.lineTo(w * 0.24, h * 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Subtle accent pinstripe
    ctx.fillStyle = livery.accent;
    ctx.fillRect(0, h * 0.69, w, 5);

    // Bodywork panel seam lines & subtle Dzus fasteners
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.beginPath();
    ctx.moveTo(w * 0.48, 0);
    ctx.lineTo(w * 0.48, h);
    ctx.stroke();

    // Crisp side racing number
    ctx.fillStyle = '#09090b';
    ctx.fillRect(w * 0.68, h * 0.22, 108, 92);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.68, h * 0.22, 108, 92);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 58px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(livery.numberText, w * 0.68 + 54, h * 0.22 + 48);
  });
}

export function getCachedNumberPlateTexture(livery: CarLivery): THREE.CanvasTexture {
  const key = `plate:${livery.id}:${livery.primary}:${livery.secondary}:${livery.numberText}`;
  return getOrCreateTexture(key, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 114, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = livery.secondary === '#09090B' ? livery.accent : livery.secondary;
    ctx.stroke();

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 126px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(livery.numberText, w / 2, h / 2 + 8);
  });
}

function drawCurvedArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  stepAngle: number
): void {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const ang = startAngle + i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
}

export function getCachedTireSidewallTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('tire-sidewall-goodyear-v2', 256, 256, (ctx) => {
    ctx.fillStyle = '#141418';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle rubber sidewall ribs
    ctx.strokeStyle = '#23232a';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(128, 128, 98, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dark metallic rim lip & center flange
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 128, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Classic curved retro yellow GOODYEAR & white EAGLE lettering
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#facc15';
    drawCurvedArcText(ctx, 'GOODYEAR', 128, 128, 96, -Math.PI * 0.72, 0.165);

    ctx.fillStyle = '#e4e4e7';
    drawCurvedArcText(ctx, 'EAGLE F1', 128, 128, 96, Math.PI * 0.28, 0.165);
  });
}

export function getCachedTireTreadTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const map = getOrCreateTexture(
    'tire-tread-map-v2',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#151519';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        const x = (i * 97) % w;
        const y = (i * 151) % h;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.22)';
        ctx.fillRect(x, y, 2, 3);
      }
    },
    { repeatX: 2, repeatY: 1, isColor: true }
  );

  const bumpMap = getOrCreateTexture(
    'tire-tread-bump-v2',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        const x = (i * 97) % w;
        const y = (i * 151) % h;
        ctx.fillStyle = i % 2 === 0 ? '#9c9c9c' : '#646464';
        ctx.fillRect(x, y, 2, 3);
      }
    },
    { repeatX: 2, repeatY: 1, isColor: false }
  );

  return { map, bumpMap };
}

export function getCachedCarbonTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const map = getOrCreateTexture(
    'carbon-map-v2',
    128,
    128,
    (ctx) => {
      const cell = 8;
      for (let y = 0; y < 128; y += cell) {
        for (let x = 0; x < 128; x += cell) {
          const even = ((x + y) / cell) % 2 === 0;
          ctx.fillStyle = even ? '#18181b' : '#27272a';
          ctx.fillRect(x, y, cell, cell);
        }
      }
    },
    { repeatX: 8, repeatY: 8, isColor: true }
  );

  const bumpMap = getOrCreateTexture(
    'carbon-bump-v2',
    128,
    128,
    (ctx) => {
      const cell = 8;
      for (let y = 0; y < 128; y += cell) {
        for (let x = 0; x < 128; x += cell) {
          const even = ((x + y) / cell) % 2 === 0;
          ctx.fillStyle = even ? '#b5b5b5' : '#555555';
          ctx.fillRect(x, y, cell, cell);
        }
      }
    },
    { repeatX: 8, repeatY: 8, isColor: false }
  );

  const roughnessMap = getOrCreateTexture(
    'carbon-rough-v2',
    128,
    128,
    (ctx) => {
      const cell = 8;
      for (let y = 0; y < 128; y += cell) {
        for (let x = 0; x < 128; x += cell) {
          const even = ((x + y) / cell) % 2 === 0;
          ctx.fillStyle = even ? '#707070' : '#a8a8a8';
          ctx.fillRect(x, y, cell, cell);
        }
      }
    },
    { repeatX: 8, repeatY: 8, isColor: false }
  );

  return { map, bumpMap, roughnessMap };
}

export function getCachedHelmetTexture(
  isSenna: boolean,
  baseColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const key = isSenna ? 'helmet:senna' : `helmet:${baseColor}:${accentColor}`;
  return getOrCreateTexture(key, 256, 128, (ctx) => {
    if (isSenna) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 56, 256, 11);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 69, 256, 4);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(0, 75, 256, 12);
    } else {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 58, 256, 14);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 74, 256, 5);
    }
  });
}
