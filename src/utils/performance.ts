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
