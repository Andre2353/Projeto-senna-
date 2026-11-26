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

  // Color map: aggregate grain + dark racing line rubber wear + subtle seams
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  // Roughness map: dry grain vs glossy rain puddles
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  // Bump map: aggregate micro-relief
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && rCtx && bCtx) {
    cCtx.fillStyle = wet ? '#14171f' : '#1e2026';
    cCtx.fillRect(0, 0, size, size);

    // Racing line rubber darkening in the center tracks
    const lineGrad = cCtx.createLinearGradient(0, 0, size, 0);
    lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
    lineGrad.addColorStop(0.28, 'rgba(5,5,8,0.34)');
    lineGrad.addColorStop(0.5, 'rgba(5,5,8,0.16)');
    lineGrad.addColorStop(0.72, 'rgba(5,5,8,0.34)');
    lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
    cCtx.fillStyle = lineGrad;
    cCtx.fillRect(0, 0, size, size);

    // Roughness base
    rCtx.fillStyle = wet ? '#888888' : '#dcdcdc';
    rCtx.fillRect(0, 0, size, size);

    // Bump base
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Aggregate speckle noise
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

    // Wet puddles (low roughness patches = mirror reflections)
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

export function createStartingGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)';
    ctx.lineWidth = 8;

    // 4 staggered starting grid boxes + start line
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

    // Rubber launch skid marks
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

    // Subtle matte sidewall ring
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    // Classic 80s/90s Goodyear-style yellow & white sidewall arcs
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
    // Iconic vibrant Senna yellow shell
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(0, 0, 512, 256);

    // Classic green & dark navy horizontal wrap-around bands
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, 118, 512, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 140, 512, 4);

    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(0, 144, 512, 18);

    ctx.fillStyle = '#16A34A';
    ctx.fillRect(0, 162, 512, 10);

    // Subtle top crown highlight stripe
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

    // Crisp racing number roundel
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
