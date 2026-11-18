import type { Bounds, BoxObject, PlanObject, PointsObject, Pt, TextObj } from '../types';
import { measureText } from '../canvas/textMeasure';

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const r4 = (v: number) => Math.round(v * 10000) / 10000;

export const snapPt = (p: Pt, step: number): Pt => ({
  x: r4(Math.round(p.x / step) * step),
  y: r4(Math.round(p.y / step) * step),
});

export function rotPt(p: Pt, c: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

export const normAngle = (deg: number) => {
  const a = ((deg % 360) + 360) % 360;
  return Math.round(a * 100) / 100;
};

/** Nombre au format français (virgule décimale). */
export const fmt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');
/** Nombre compact : sans zéros inutiles. */
export const fmtShort = (v: number) => String(Math.round(v * 1000) / 1000).replace('.', ',');

/** Contraint b à un angle multiple de `step` degrés autour de a. */
export function constrainAngle(a: Pt, b: Pt, step = 15): Pt {
  const d = dist(a, b);
  if (d === 0) return b;
  const s = (step * Math.PI) / 180;
  const ang = Math.round(Math.atan2(b.y - a.y, b.x - a.x) / s) * s;
  return { x: r4(a.x + Math.cos(ang) * d), y: r4(a.y + Math.sin(ang) * d) };
}

export function isBoxLike(o: PlanObject): o is BoxObject {
  return o.type === 'rect' || o.type === 'ellipse' || o.type === 'symbol' || o.type === 'image';
}
export function isTransformable(o: PlanObject): o is BoxObject | TextObj {
  return isBoxLike(o) || o.type === 'text';
}
export function hasPoints(o: PlanObject): o is PointsObject {
  return 'points' in o;
}

export function translateObj(o: PlanObject, dx: number, dy: number): PlanObject {
  const mv = (p: Pt) => ({ x: p.x + dx, y: p.y + dy });
  if (o.type === 'arrow') return { ...o, points: o.points.map(mv), control: mv(o.control) };
  if (hasPoints(o)) return { ...o, points: o.points.map(mv) };
  return { ...o, x: o.x + dx, y: o.y + dy };
}

export function rotateObj(o: PlanObject, c: Pt, deg: number): PlanObject {
  const rt = (p: Pt) => rotPt(p, c, deg);
  if (o.type === 'arrow') return { ...o, points: o.points.map(rt), control: rt(o.control) };
  if (hasPoints(o)) return { ...o, points: o.points.map(rt) };
  const p = rt({ x: o.x, y: o.y });
  return { ...o, x: p.x, y: p.y, rotation: normAngle(o.rotation + deg) };
}

function ptsBounds(pts: Pt[], pad = 0): Bounds {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const p of pts) {
    x1 = Math.min(x1, p.x);
    y1 = Math.min(y1, p.y);
    x2 = Math.max(x2, p.x);
    y2 = Math.max(y2, p.y);
  }
  return { x1: x1 - pad, y1: y1 - pad, x2: x2 + pad, y2: y2 + pad };
}

/** Boîte englobante alignée sur les axes (m). */
export function getBounds(o: PlanObject): Bounds {
  switch (o.type) {
    case 'road': {
      const sw = Math.max(
        o.sidewalkLeft.enabled ? o.sidewalkLeft.width : 0,
        o.sidewalkRight.enabled ? o.sidewalkRight.width : 0,
      );
      return ptsBounds(o.points, o.width / 2 + sw + 0.1);
    }
    case 'polygon':
    case 'line':
      return ptsBounds(o.points, o.strokeWidth / 2);
    case 'arrow':
      return ptsBounds(o.curved ? [...o.points, o.control] : o.points, o.strokeWidth * 2 + 0.2);
    case 'dimension':
      return ptsBounds(o.points, Math.abs(o.offset) + o.fontSize * 1.6);
    case 'text': {
      const m = measureText(o.text, o.fontSize, o.bold);
      const c = { x: o.x, y: o.y };
      const pad = o.background ? o.fontSize * 0.3 : 0;
      return ptsBounds(
        [
          { x: o.x - pad, y: o.y - pad },
          { x: o.x + m.width + pad, y: o.y - pad },
          { x: o.x + m.width + pad, y: o.y + m.height + pad },
          { x: o.x - pad, y: o.y + m.height + pad },
        ].map((p) => rotPt(p, c, o.rotation)),
      );
    }
    default: {
      const c = { x: o.x, y: o.y };
      let extra = 0;
      if (o.type === 'symbol') {
        if (o.showManeuverZone || o.showStabilizers) extra = 1.05;
      } else if (o.type !== 'image') {
        extra = o.strokeWidth / 2;
      }
      const hw = o.width / 2 + extra;
      const hh = o.height / 2 + extra;
      const b = ptsBounds(
        [
          { x: o.x - hw, y: o.y - hh },
          { x: o.x + hw, y: o.y - hh },
          { x: o.x + hw, y: o.y + hh },
          { x: o.x - hw, y: o.y + hh },
        ].map((p) => rotPt(p, c, o.rotation)),
      );
      if (o.type === 'symbol' && o.label) b.y2 += 0.9;
      return b;
    }
  }
}

export function unionBounds(objs: PlanObject[]): Bounds | null {
  if (!objs.length) return null;
  const b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
  for (const o of objs) {
    const ob = getBounds(o);
    b.x1 = Math.min(b.x1, ob.x1);
    b.y1 = Math.min(b.y1, ob.y1);
    b.x2 = Math.max(b.x2, ob.x2);
    b.y2 = Math.max(b.y2, ob.y2);
  }
  return b;
}

export const boundsIntersect = (a: Bounds, b: Bounds) =>
  a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;

export const boundsContain = (b: Bounds, p: Pt) =>
  p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2;

/** Point de référence d'un objet (utilisé pour le magnétisme au déplacement). */
export function refPoint(o: PlanObject): Pt {
  return hasPoints(o) ? o.points[0] : { x: o.x, y: o.y };
}

/** Segment le plus proche de p ; renvoie l'index du segment et le point projeté. */
export function nearestSegment(points: Pt[], p: Pt, closed: boolean) {
  let best = { index: 0, point: points[0], d: Infinity };
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1);
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = dist(p, q);
    if (d < best.d) best = { index: i, point: q, d };
  }
  return best;
}

export function polylineLength(pts: Pt[], closed = false) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 2) l += dist(pts[pts.length - 1], pts[0]);
  return l;
}

export function polygonArea(pts: Pt[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

/** Géométrie d'une cote : ligne décalée a→b, normale, angle. */
export function dimensionGeometry(p1: Pt, p2: Pt, offset: number) {
  const len = dist(p1, p2);
  const ux = len ? (p2.x - p1.x) / len : 1;
  const uy = len ? (p2.y - p1.y) / len : 0;
  const n = { x: uy, y: -ux }; // normale « gauche »
  const a = { x: p1.x + n.x * offset, y: p1.y + n.y * offset };
  const b = { x: p2.x + n.x * offset, y: p2.y + n.y * offset };
  return { a, b, n, u: { x: ux, y: uy }, len, angle: (Math.atan2(uy, ux) * 180) / Math.PI };
}

/** #rrggbb + opacité → rgba(). */
export function withAlpha(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Éclaircit (amt > 0) ou assombrit (amt < 0) une couleur #rrggbb. */
export function shade(hex: string, amt: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (c: number) => {
    const v = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  };
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
