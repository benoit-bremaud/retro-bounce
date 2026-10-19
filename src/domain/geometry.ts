/** Axis-aligned rectangle in game units, origin at the top-left corner (y grows downward). */
export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Result of a swept test: fraction of the move done at contact and the unit contact normal. */
export interface Hit {
  /** Fraction of the displacement travelled before contact, in [0, 1]. */
  t: number;
  /** Normal x of the surface hit, pointing toward the circle. */
  nx: number;
  /** Normal y of the surface hit, pointing toward the circle. */
  ny: number;
}

/** Creates a reusable {@link Hit} so the game loop never allocates one. */
export function createHit(): Hit {
  return { t: 0, nx: 0, ny: 0 };
}

function setHit(out: Hit, t: number, nx: number, ny: number): true {
  out.t = t;
  out.nx = nx;
  out.ny = ny;
  return true;
}

/** Entry and exit times of a move along one axis through a slab. */
interface Interval {
  enter: number;
  exit: number;
}

// Module-level scratch objects: the game loop must not allocate (project rule), so the helpers
// return their results through these. Not re-entrant, which is fine for a single-threaded domain.
const slabX: Interval = { enter: 0, exit: 0 };
const slabY: Interval = { enter: 0, exit: 0 };
const corner = { x: 0, y: 0 };

/** Fills `out` with the times a move crosses [low, high]; false if it never can (parallel, outside). */
function slab(start: number, delta: number, low: number, high: number, out: Interval): boolean {
  if (delta === 0) {
    out.enter = -Infinity;
    out.exit = Infinity;
    return start >= low && start <= high;
  }
  const a = (low - start) / delta;
  const b = (high - start) / delta;
  out.enter = Math.min(a, b);
  out.exit = Math.max(a, b);
  return true;
}

/** Contact with a corner point; (ox, oy) is the circle centre relative to that corner. */
function sweepCorner(
  ox: number,
  oy: number,
  radius: number,
  dx: number,
  dy: number,
  out: Hit,
): boolean {
  const a = dx * dx + dy * dy;
  const b = ox * dx + oy * dy;
  const c = ox * ox + oy * oy - radius * radius;
  const discriminant = b * b - a * c;
  if (discriminant < 0) return false;
  const t = (-b - Math.sqrt(discriminant)) / a;
  if (t < 0 || t > 1) return false;
  const nx = (ox + dx * t) / radius;
  const ny = (oy + dy * t) / radius;
  // A graze (motion tangent to the corner arc) is not a hit: the ball would not bounce.
  return nx * dx + ny * dy < 0 && setHit(out, t, nx, ny);
}

/** Normal of the face a circle with its centre inside the rectangle leaves through. */
function exitNormal(cx: number, cy: number, rect: Rect, out: Hit): void {
  const toLeft = cx - rect.left;
  const toRight = rect.left + rect.width - cx;
  const toTop = cy - rect.top;
  const toBottom = rect.top + rect.height - cy;
  const nearest = Math.min(toLeft, toRight, toTop, toBottom);
  out.nx = 0;
  out.ny = 0;
  if (nearest === toLeft) out.nx = -1;
  else if (nearest === toRight) out.nx = 1;
  else if (nearest === toTop) out.ny = -1;
  else out.ny = 1;
}

/** Whether a circle centred at (cx, cy) overlaps the rectangle. */
export function circleOverlapsRect(cx: number, cy: number, radius: number, rect: Rect): boolean {
  return distanceToRect(cx, cy, rect) < radius;
}

function distanceToRect(cx: number, cy: number, rect: Rect): number {
  const qx = Math.min(Math.max(cx, rect.left), rect.left + rect.width);
  const qy = Math.min(Math.max(cy, rect.top), rect.top + rect.height);
  return Math.hypot(cx - qx, cy - qy);
}

/** Circle touching or overlapping the rectangle: a hit at t = 0 only if it moves into it. */
function overlapHit(cx: number, cy: number, dx: number, dy: number, rect: Rect, out: Hit): boolean {
  const qx = Math.min(Math.max(cx, rect.left), rect.left + rect.width);
  const qy = Math.min(Math.max(cy, rect.top), rect.top + rect.height);
  const distance = Math.hypot(cx - qx, cy - qy);
  if (distance > 0) {
    out.nx = (cx - qx) / distance;
    out.ny = (cy - qy) / distance;
  } else {
    exitNormal(cx, cy, rect, out);
  }
  return out.nx * dx + out.ny * dy < 0 && setHit(out, 0, out.nx, out.ny);
}

/** Writes into `out` the rectangle corner whose rounded zone contains (px, py), if any. */
function cornerAt(px: number, py: number, rect: Rect, out: { x: number; y: number }): boolean {
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  const inColumn = px >= rect.left && px <= right;
  const inRow = py >= rect.top && py <= bottom;
  if (inColumn || inRow) return false;
  out.x = px < rect.left ? rect.left : right;
  out.y = py < rect.top ? rect.top : bottom;
  return true;
}

/**
 * Sweeps a circle of centre (cx, cy) along the displacement (dx, dy) against a rectangle and
 * writes the first contact into `out`. Returns false when the circle does not touch the rectangle
 * during the move, or when it only touches it while moving away. Faces and rounded corners are
 * handled exactly, so a fast circle cannot tunnel through a thin rectangle. A circle that already
 * overlaps the rectangle hits at `t = 0` only if its motion points into it. `out` is only
 * meaningful when the result is true. Requires `radius > 0`.
 */
export function sweepCircleRect(
  cx: number,
  cy: number,
  radius: number,
  dx: number,
  dy: number,
  rect: Rect,
  out: Hit,
): boolean {
  if (distanceToRect(cx, cy, rect) < radius) return overlapHit(cx, cy, dx, dy, rect, out);
  if (dx === 0 && dy === 0) return false;

  // Slab test against the rectangle grown by the radius.
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  if (!slab(cx, dx, rect.left - radius, right + radius, slabX)) return false;
  if (!slab(cy, dy, rect.top - radius, bottom + radius, slabY)) return false;
  const enter = Math.max(slabX.enter, slabY.enter);
  const exit = Math.min(slabX.exit, slabY.exit);
  if (enter > exit || enter > 1 || exit < 0) return false;

  // A negative entry time means the centre is already inside the grown rectangle: away from the
  // corners that is the circle resting on a face (touching, rounding error).
  const px = enter < 0 ? cx : cx + dx * enter;
  const py = enter < 0 ? cy : cy + dy * enter;
  if (cornerAt(px, py, rect, corner)) {
    return sweepCorner(cx - corner.x, cy - corner.y, radius, dx, dy, out);
  }
  if (enter < 0) return overlapHit(cx, cy, dx, dy, rect, out);
  // The face is the axis entered last; the normal opposes the motion along it.
  const alongX = slabX.enter > slabY.enter;
  return setHit(out, enter, alongX ? -Math.sign(dx) : 0, alongX ? 0 : -Math.sign(dy));
}
