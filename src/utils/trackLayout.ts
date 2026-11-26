import * as THREE from 'three';

interface TrackHarmonics {
  a1: number;
  a2: number;
  a3: number;
  a4: number;
}

const STAGE_HARMONICS: Record<number, TrackHarmonics> = {
  1: { a1: 16, a2: -20, a3: 11, a4: -5 },   // Mônaco 1984
  2: { a1: 24, a2: -18, a3: 9, a4: -4 },    // Estoril 1985
  3: { a1: 22, a2: -26, a3: 14, a4: -7 },   // Suzuka 1988
  4: { a1: -18, a2: 22, a3: -12, a4: 6 },   // Phoenix 1990
  5: { a1: -26, a2: 20, a3: -10, a4: 5 },   // Interlagos 1991
  6: { a1: 18, a2: -22, a3: 12, a4: -5 },   // Mônaco 1992
  7: { a1: -28, a2: 24, a3: -14, a4: 6 },   // Donington 1993
};

const TWO_PI = Math.PI * 2;

export function wrapTrackZ(z: number, lapLength: number): number {
  const m = (-z) % lapLength;
  const wrappedNeg = m < 0 ? m + lapLength : m;
  return -wrappedNeg;
}

/**
 * Deterministic periodic lateral centerline offset X(z) for a given circuit.
 * Satisfies offset(0) === offset(-lapLength) === 0 and slope(0) === slope(-lapLength) === 0.
 */
export function getTrackOffsetX(raceId: number, z: number, lapLength: number): number {
  const h = STAGE_HARMONICS[raceId] ?? STAGE_HARMONICS[1]!;
  const wrappedZ = wrapTrackZ(z, lapLength);
  const u = -wrappedZ / lapLength;

  return (
    h.a1 * (1 - Math.cos(TWO_PI * u)) +
    h.a2 * (1 - Math.cos(TWO_PI * 2 * u)) +
    h.a3 * (1 - Math.cos(TWO_PI * 3 * u)) +
    h.a4 * (1 - Math.cos(TWO_PI * 4 * u))
  );
}

/**
 * Spatial derivative d(offsetX)/dz, seamless at lap wrap boundaries.
 */
export function getTrackSlopeX(raceId: number, z: number, lapLength: number): number {
  const h = STAGE_HARMONICS[raceId] ?? STAGE_HARMONICS[1]!;
  const wrappedZ = wrapTrackZ(z, lapLength);
  const u = -wrappedZ / lapLength;
  const k = TWO_PI / lapLength;

  return -(
    h.a1 * k * Math.sin(TWO_PI * u) +
    h.a2 * 2 * k * Math.sin(TWO_PI * 2 * u) +
    h.a3 * 3 * k * Math.sin(TWO_PI * 3 * u) +
    h.a4 * 4 * k * Math.sin(TWO_PI * 4 * u)
  );
}

/**
 * Forward road tangent heading in Three.js Y-up space (-Z forward).
 */
export function getTrackHeading(raceId: number, z: number, lapLength: number): number {
  return Math.atan(getTrackSlopeX(raceId, z, lapLength));
}

/**
 * Builds a flat continuous curved horizontal strip geometry following getTrackOffsetX.
 */
export function createCurvedStripGeometry(
  raceId: number,
  lapLength: number,
  zStart: number,
  zEnd: number,
  width: number,
  lateralOffset: number,
  yHeight: number,
  segments = 320,
  uvTileLength = 28
): THREE.BufferGeometry {
  const halfW = width * 0.5;
  const vertexCount = (segments + 1) * 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = zStart + (zEnd - zStart) * t;
    const cx = getTrackOffsetX(raceId, z, lapLength) + lateralOffset;
    const slope = getTrackSlopeX(raceId, z, lapLength);

    // Perpendicular lateral normal in XZ plane
    const len = Math.hypot(1, slope);
    const nx = 1 / len;
    const nz = slope / len;

    const vIdx = i * 2;
    positions[vIdx * 3] = cx - nx * halfW;
    positions[vIdx * 3 + 1] = yHeight;
    positions[vIdx * 3 + 2] = z - nz * halfW;

    positions[(vIdx + 1) * 3] = cx + nx * halfW;
    positions[(vIdx + 1) * 3 + 1] = yHeight;
    positions[(vIdx + 1) * 3 + 2] = z + nz * halfW;

    normals[vIdx * 3] = 0;
    normals[vIdx * 3 + 1] = 1;
    normals[vIdx * 3 + 2] = 0;
    normals[(vIdx + 1) * 3] = 0;
    normals[(vIdx + 1) * 3 + 1] = 1;
    normals[(vIdx + 1) * 3 + 2] = 0;

    const vCoord = -z / uvTileLength;
    uvs[vIdx * 2] = 0;
    uvs[vIdx * 2 + 1] = vCoord;
    uvs[(vIdx + 1) * 2] = 1;
    uvs[(vIdx + 1) * 2 + 1] = vCoord;

    if (i < segments) {
      const a = vIdx;
      const b = vIdx + 1;
      const c = vIdx + 2;
      const d = vIdx + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Builds a continuous vertical barrier wall following getTrackOffsetX.
 */
export function createCurvedWallGeometry(
  raceId: number,
  lapLength: number,
  zStart: number,
  zEnd: number,
  lateralOffset: number,
  wallHeight: number,
  segments = 320
): THREE.BufferGeometry {
  const vertexCount = (segments + 1) * 2;
  const positions = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = zStart + (zEnd - zStart) * t;
    const cx = getTrackOffsetX(raceId, z, lapLength) + lateralOffset;

    const vIdx = i * 2;
    positions[vIdx * 3] = cx;
    positions[vIdx * 3 + 1] = 0;
    positions[vIdx * 3 + 2] = z;

    positions[(vIdx + 1) * 3] = cx;
    positions[(vIdx + 1) * 3 + 1] = wallHeight;
    positions[(vIdx + 1) * 3 + 2] = z;

    if (i < segments) {
      const a = vIdx;
      const b = vIdx + 1;
      const c = vIdx + 2;
      const d = vIdx + 3;
      if (lateralOffset < 0) {
        indices.push(a, c, b, b, c, d);
      } else {
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
