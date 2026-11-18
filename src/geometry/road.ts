import type { Pt, RoadObj } from '../types';

export const flat = (pts: Pt[]) => pts.flatMap((p) => [p.x, p.y]);

function dedupe(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const l = out[out.length - 1];
    if (!l || Math.hypot(p.x - l.x, p.y - l.y) > 1e-6) out.push(p);
  }
  return out;
}

/** Remplace chaque angle de la polyligne par un arc de cercle de rayon R (au plus). */
export function filletPolyline(input: Pt[], R: number): Pt[] {
  const pts = dedupe(input);
  if (pts.length < 3 || R <= 0) return pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const A = pts[i - 1], B = pts[i], C = pts[i + 1];
    const la = Math.hypot(A.x - B.x, A.y - B.y);
    const lc = Math.hypot(C.x - B.x, C.y - B.y);
    const u = { x: (A.x - B.x) / la, y: (A.y - B.y) / la };
    const v = { x: (C.x - B.x) / lc, y: (C.y - B.y) / lc };
    const ang = Math.acos(Math.min(1, Math.max(-1, u.x * v.x + u.y * v.y)));
    if (ang < 0.02 || Math.PI - ang < 0.02) {
      out.push(B);
      continue;
    }
    const tan = Math.tan(ang / 2);
    const t = Math.min(R / tan, la / 2, lc / 2);
    const r = t * tan;
    const P1 = { x: B.x + u.x * t, y: B.y + u.y * t };
    const P2 = { x: B.x + v.x * t, y: B.y + v.y * t };
    const bl = Math.hypot(u.x + v.x, u.y + v.y);
    const d = r / Math.sin(ang / 2);
    const O = { x: B.x + ((u.x + v.x) / bl) * d, y: B.y + ((u.y + v.y) / bl) * d };
    const a1 = Math.atan2(P1.y - O.y, P1.x - O.x);
    let delta = Math.atan2(P2.y - O.y, P2.x - O.x) - a1;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const steps = Math.max(2, Math.ceil(Math.abs(delta) / (Math.PI / 36)));
    for (let k = 0; k <= steps; k++) {
      const a = a1 + (delta * k) / steps;
      out.push({ x: O.x + r * Math.cos(a), y: O.y + r * Math.sin(a) });
    }
  }
  out.push(pts[pts.length - 1]);
  return dedupe(out);
}

/** Décale une polyligne de d mètres (d > 0 : vers la gauche du sens du tracé). */
export function offsetPolyline(pts: Pt[], d: number): Pt[] {
  if (Math.abs(d) < 1e-9 || pts.length < 2) return pts;
  const normals: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const l = Math.hypot(dx, dy) || 1;
    normals.push({ x: dy / l, y: -dx / l });
  }
  return pts.map((p, i) => {
    const n1 = normals[Math.max(0, i - 1)];
    const n2 = normals[Math.min(normals.length - 1, i)];
    let mx = n1.x + n2.x;
    let my = n1.y + n2.y;
    const ml = Math.hypot(mx, my);
    if (ml < 1e-6) return { x: p.x + n1.x * d, y: p.y + n1.y * d };
    mx /= ml;
    my /= ml;
    const k = d / Math.max(0.35, mx * n1.x + my * n1.y);
    return { x: p.x + mx * k, y: p.y + my * k };
  });
}

/** Axe de la route, avec angles arrondis si l'option est active. */
export function roadCenterline(road: Pick<RoadObj, 'points' | 'rounded' | 'radius'>): Pt[] {
  return road.rounded ? filletPolyline(road.points, road.radius) : dedupe(road.points);
}
