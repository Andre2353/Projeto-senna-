import * as THREE from 'three';
import type { CarLivery } from '../types/game';

export interface AsphaltTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export interface GrassTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export interface CarbonTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface TireTreadTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export interface ConcreteTextureSet {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function configureRepeatingTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  isColor = true
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createAsphaltTextureSet(
  wet: boolean,
  repeatX = 2,
  repeatY = 48
): AsphaltTextureSet {
  const size = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && rCtx && bCtx) {
    cCtx.fillStyle = wet ? '#14171f' : '#1e2026';
    cCtx.fillRect(0, 0, size, size);

    const lineGrad = cCtx.createLinearGradient(0, 0, size, 0);
    lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lineGrad.addColorStop(0.28, 'rgba(5,5,8,0.34)');
    lineGrad.addColorStop(0.5, 'rgba(5,5,8,0.16)');
    lineGrad.addColorStop(0.72, 'rgba(5,5,8,0.34)');
    lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    cCtx.fillStyle = lineGrad;
    cCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = wet ? '#888888' : '#dcdcdc';
    rCtx.fillRect(0, 0, size, size);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 6500; i++) {
      const x = (i * 173 + (i % 13) * 31) % size;
      const y = (i * 257 + (i % 19) * 17) % size;
      const w = i % 5 === 0 ? 3 : 2;
      const bright = i % 3 === 0;
      cCtx.fillStyle = bright
        ? 'rgba(255, 255, 255, 0.055)'
        : 'rgba(0, 0, 0, 0.14)';
      cCtx.fillRect(x, y, w, w);

      bCtx.fillStyle = bright ? '#b8b8b8' : '#4a4a4a';
      bCtx.fillRect(x, y, w, w);
    }

    if (wet) {
      for (let p = 0; p < 16; p++) {
        const px = ((p * 197 + 43) % (size - 80)) + 40;
        const py = ((p * 281 + 79) % (size - 80)) + 40;
        const rad = 28 + (p % 4) * 16;
        const puddleGrad = rCtx.createRadialGradient(px, py, 4, px, py, rad);
        puddleGrad.addColorStop(0, 'rgba(18, 18, 18, 0.95)');
        puddleGrad.addColorStop(0.65, 'rgba(38, 38, 38, 0.7)');
        puddleGrad.addColorStop(1, 'rgba(136, 136, 136, 0)');
        rCtx.fillStyle = puddleGrad;
        rCtx.beginPath();
        rCtx.arc(px, py, rad, 0, Math.PI * 2);
        rCtx.fill();

        cCtx.fillStyle = 'rgba(10, 14, 24, 0.35)';
        cCtx.beginPath();
        cCtx.arc(px, py, rad * 0.85, 0, Math.PI * 2);
        cCtx.fill();
      }
    }
  }

  return {
    map: configureRepeatingTexture(colorCanvas, repeatX, repeatY, true),
    roughnessMap: configureRepeatingTexture(roughCanvas, repeatX, repeatY, false),
    bumpMap: configureRepeatingTexture(bumpCanvas, repeatX, repeatY, false),
  };
}

export function createGrassTextureSet(repeatX = 48, repeatY = 48): GrassTextureSet {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#15803d';
    cCtx.fillRect(0, 0, size, size);
    cCtx.fillStyle = '#16a34a';
    for (let y = 0; y < size; y += 32) {
      cCtx.fillRect(0, y, size, 16);
    }

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 1600; i++) {
      const x = (i * 89) % size;
      const y = (i * 149) % size;
      cCtx.fillStyle = i % 2 === 0 ? 'rgba(74, 222, 128, 0.18)' : 'rgba(20, 83, 45, 0.25)';
      cCtx.fillRect(x, y, 3, 3);
      bCtx.fillStyle = i % 2 === 0 ? '#a8a8a8' : '#585858';
      bCtx.fillRect(x, y, 2, 2);
    }
  }

  return {
    map: configureRepeatingTexture(colorCanvas, repeatX, repeatY, true),
    bumpMap: configureRepeatingTexture(bumpCanvas, repeatX, repeatY, false),
  };
}

export function createCarbonFiberTextureSet(repeatX = 8, repeatY = 8): CarbonTextureSet {
  const size = 128;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (cCtx && bCtx && rCtx) {
    const cell = 8;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const step = ((x / cell + y / cell) % 4 + 4) % 4;
        const isWarp = step < 2;
        cCtx.fillStyle = isWarp ? '#121216' : '#24242b';
        cCtx.fillRect(x, y, cell, cell);
        cCtx.fillStyle = isWarp ? '#1b1b21' : '#16161b';
        cCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

        bCtx.fillStyle = isWarp ? '#b4b4b4' : '#525252';
        bCtx.fillRect(x, y, cell, cell);

        rCtx.fillStyle = isWarp ? '#484848' : '#787878';
        rCtx.fillRect(x, y, cell, cell);
      }
    }
  }

  return {
    map: configureRepeatingTexture(colorCanvas, repeatX, repeatY, true),
    bumpMap: configureRepeatingTexture(bumpCanvas, repeatX, repeatY, false),
    roughnessMap: configureRepeatingTexture(roughCanvas, repeatX, repeatY, false),
  };
}

export function createTireTreadTextureSet(): TireTreadTextureSet {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#121215';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3600; i++) {
      const x = (i * 113) % size;
      const y = (i * 199) % size;
      cCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.18)';
      cCtx.fillRect(x, y, 2, 2);
      bCtx.fillStyle = i % 2 === 0 ? '#989898' : '#646464';
      bCtx.fillRect(x, y, 2, 2);
    }

    cCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    cCtx.fillRect(126, 0, 4, size);
  }

  return {
    map: configureRepeatingTexture(colorCanvas, 4, 2, true),
    bumpMap: configureRepeatingTexture(bumpCanvas, 4, 2, false),
  };
}

export function createRadiatorFinsTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#52525b';
    ctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? '#d4d4d8' : '#27272a';
      ctx.fillRect(0, y, size, 2);
    }

    ctx.fillStyle = 'rgba(24, 24, 27, 0.55)';
    for (let x = 16; x < size; x += 24) {
      ctx.fillRect(x, 0, 3, size);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createStartingGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)';
    ctx.lineWidth = 8;

    ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
    ctx.fillRect(20, 42, 472, 10);

    const slots = [
      { x: 110, y: 95 },
      { x: 300, y: 155 },
      { x: 110, y: 245 },
      { x: 300, y: 315 },
    ];
    for (const slot of slots) {
      ctx.beginPath();
      ctx.moveTo(slot.x, slot.y + 42);
      ctx.lineTo(slot.x, slot.y);
      ctx.lineTo(slot.x + 102, slot.y);
      ctx.lineTo(slot.x + 102, slot.y + 42);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(9, 9, 11, 0.45)';
    ctx.fillRect(122, 110, 18, 120);
    ctx.fillRect(182, 110, 18, 120);
    ctx.fillRect(312, 170, 18, 130);
    ctx.fillRect(372, 170, 18, 130);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createTireSidewallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 92, -0.55, 0.55);
    ctx.stroke();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 128, 92, Math.PI - 0.5, Math.PI + 0.5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createSennaHelmetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, 118, 512, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 140, 512, 4);

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(0, 144, 512, 18);

    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, 162, 512, 10);

    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(240, 22, 32, 86);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createCarNumberPlateTexture(livery: CarLivery): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = livery.primary;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = livery.secondary;
    ctx.fillRect(0, 0, 256, 44);
    ctx.fillRect(0, 212, 256, 44);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(128, 128, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(livery.numberText, 128, 132);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createBrakeBoardTexture(distanceLabel: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 118);

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 74px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(distanceLabel, 128, 68);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const RETRO_SPONSORS = [
  { title: 'TAG TELEMETRIA', bg: '#09090b', fg: '#f8fafc', accent: '#ef4444' },
  { title: 'APEX TURBO V10', bg: '#dc2626', fg: '#f8fafc', accent: '#facc15' },
  { title: 'CLASSIC SLICK', bg: '#1d4ed8', fg: '#facc15', accent: '#f8fafc' },
  { title: 'CHRONO GP 1988', bg: '#18181b', fg: '#facc15', accent: '#16a34a' },
] as const;

export function createRetroSponsorTexture(variant: number): THREE.CanvasTexture {
  const spec = RETRO_SPONSORS[variant % RETRO_SPONSORS.length]!;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = spec.bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = spec.accent;
    ctx.fillRect(0, 0, 22, 128);
    ctx.fillRect(490, 0, 22, 128);

    ctx.fillStyle = spec.fg;
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.title, 256, 66);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createConcreteFloorTextureSet(
  repeatX = 12,
  repeatY = 12
): ConcreteTextureSet {
  const size = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (cCtx && rCtx) {
    cCtx.fillStyle = '#141820';
    cCtx.fillRect(0, 0, size, size);

    rCtx.fillStyle = '#a8a8a8';
    rCtx.fillRect(0, 0, size, size);

    for (let p = 0; p < 34; p++) {
      const px = (p * 173 + 29) % size;
      const py = (p * 263 + 53) % size;
      const rad = 36 + (p % 5) * 20;

      const cGrad = cCtx.createRadialGradient(px, py, 4, px, py, rad);
      cGrad.addColorStop(0, p % 2 === 0 ? 'rgba(30, 36, 46, 0.24)' : 'rgba(8, 10, 14, 0.26)');
      cGrad.addColorStop(1, 'rgba(20, 24, 32, 0)');
      cCtx.fillStyle = cGrad;
      cCtx.beginPath();
      cCtx.arc(px, py, rad, 0, Math.PI * 2);
      cCtx.fill();

      const rGrad = rCtx.createRadialGradient(px, py, 4, px, py, rad);
      rGrad.addColorStop(0, p % 2 === 0 ? 'rgba(130, 130, 130, 0.4)' : 'rgba(205, 205, 205, 0.4)');
      rGrad.addColorStop(1, 'rgba(168, 168, 168, 0)');
      rCtx.fillStyle = rGrad;
      rCtx.beginPath();
      rCtx.arc(px, py, rad, 0, Math.PI * 2);
      rCtx.fill();
    }

    for (let i = 0; i < 5200; i++) {
      const x = (i * 197 + (i % 17) * 23) % size;
      const y = (i * 293 + (i % 13) * 19) % size;
      const w = i % 7 === 0 ? 2 : 1;
      cCtx.fillStyle =
        i % 3 === 0 ? 'rgba(255, 255, 255, 0.028)' : 'rgba(0, 0, 0, 0.08)';
      cCtx.fillRect(x, y, w, w);

      rCtx.fillStyle =
        i % 2 === 0 ? 'rgba(142, 142, 142, 0.35)' : 'rgba(196, 196, 196, 0.35)';
      rCtx.fillRect(x, y, w, w);
    }

    cCtx.strokeStyle = 'rgba(6, 8, 12, 0.42)';
    cCtx.lineWidth = 1.5;
    cCtx.strokeRect(0.75, 0.75, size - 1.5, size - 1.5);
    cCtx.beginPath();
    cCtx.moveTo(size / 2, 0);
    cCtx.lineTo(size / 2, size);
    cCtx.moveTo(0, size / 2);
    cCtx.lineTo(size, size / 2);
    cCtx.stroke();
  }

  return {
    map: configureRepeatingTexture(colorCanvas, repeatX, repeatY, true),
    roughnessMap: configureRepeatingTexture(roughCanvas, repeatX, repeatY, false),
  };
}
