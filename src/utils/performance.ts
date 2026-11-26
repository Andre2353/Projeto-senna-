import * as THREE from 'three';
import type { GraphicsQuality } from '../types/game';

export interface QualityProfile {
  dpr: [number, number];
  rainCount: number;
  sprayCount: number;
  sparkCount: number;
  enablePostProcessing: boolean;
  shadowMapSize: number;
}

export function getQualityProfile(quality: GraphicsQuality): QualityProfile {
  switch (quality) {
    case 'high':
      return {
        dpr: [1, 2],
        rainCount: 1400,
        sprayCount: 280,
        sparkCount: 70,
        enablePostProcessing: true,
        shadowMapSize: 2048,
      };
    case 'medium':
      return {
        dpr: [1, 1.5],
        rainCount: 800,
        sprayCount: 160,
        sparkCount: 40,
        enablePostProcessing: true,
        shadowMapSize: 1024,
      };
    case 'low':
      return {
        dpr: [0.85, 1],
        rainCount: 350,
        sprayCount: 80,
        sparkCount: 20,
        enablePostProcessing: false,
        shadowMapSize: 512,
      };
  }
}

let cachedToonGradient: THREE.DataTexture | null = null;

/**
 * Shared 4-band cel-shading gradient map for MeshToonMaterial.
 */
export function getToonGradientMap(): THREE.DataTexture {
  if (cachedToonGradient) {
    return cachedToonGradient;
  }
  const colors = new Uint8Array([95, 155, 215, 255]);
  const texture = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  cachedToonGradient = texture;
  return texture;
}

let cachedWebGLSupport: boolean | null = null;

/**
 * Passive, cached WebGL capability check with permissive attributes and
 * clean context release so React.StrictMode never leaks or loses contexts.
 */
export function detectWebGLSupport(): boolean {
  if (cachedWebGLSupport !== null) {
    return cachedWebGLSupport;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const contextAttributes: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
    };

    const gl =
      (canvas.getContext('webgl2', contextAttributes) as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl', contextAttributes) as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl', contextAttributes) as WebGLRenderingContext | null);

    if (!gl) {
      cachedWebGLSupport = false;
      return false;
    }

    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) {
      loseExt.loseContext();
    }

    cachedWebGLSupport = true;
    return true;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}

export function resetWebGLSupportCache(): void {
  cachedWebGLSupport = null;
}
