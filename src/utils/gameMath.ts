export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function normalizeAngle(angle: number): number {
  let result = angle;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
}

export function distance2D(ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  return Math.hypot(dx, dz);
}

/**
 * Checks whether a 2D segment from (prevX, prevZ) to (currX, currZ) crosses
 * a portal plane at portalZ within [minX, maxX], avoiding tunneling at 330 km/h.
 */
export function segmentCrossesPortalZ(
  prevX: number,
  prevZ: number,
  currX: number,
  currZ: number,
  portalZ: number,
  minX: number,
  maxX: number
): boolean {
  const crossedPlane =
    (prevZ >= portalZ && currZ <= portalZ) || (prevZ <= portalZ && currZ >= portalZ);
  if (!crossedPlane) {
    return false;
  }

  const dz = currZ - prevZ;
  const t = Math.abs(dz) < 1e-5 ? 0.5 : (portalZ - prevZ) / dz;
  const hitX = lerp(prevX, currX, clamp(t, 0, 1));
  return hitX >= minX && hitX <= maxX;
}
