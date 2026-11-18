import type { PlanObject, Pt } from '../types';
import { hasPoints } from './math';

export type HandleKind = 'vertex' | 'mid' | 'control' | 'offset';

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Applique le déplacement d'une poignée à un objet. */
export function applyHandle(o: PlanObject, kind: HandleKind, index: number, w: Pt): PlanObject {
  if (!hasPoints(o)) return o;
  if (kind === 'vertex') {
    const points = o.points.map((p, i) => (i === index ? w : p));
    if (o.type === 'arrow' && !o.curved) return { ...o, points, control: mid(points[0], points[1]) };
    return { ...o, points } as PlanObject;
  }
  if (kind === 'control' && o.type === 'arrow') return { ...o, control: w };
  if (kind === 'offset' && o.type === 'dimension') {
    const [p1, p2] = o.points;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
    const n = { x: (p2.y - p1.y) / len, y: -(p2.x - p1.x) / len };
    const off = (w.x - p1.x) * n.x + (w.y - p1.y) * n.y;
    return { ...o, offset: Math.round(off * 100) / 100 };
  }
  return o;
}

/** Insère un sommet après l'index donné (routes et polygones). */
export function insertVertex(o: PlanObject, index: number, p: Pt): PlanObject {
  if (o.type !== 'road' && o.type !== 'polygon') return o;
  const points = [...o.points];
  points.splice(index + 1, 0, p);
  return { ...o, points };
}

/** Supprime un sommet si l'objet en garde assez. */
export function removeVertex(o: PlanObject, index: number): PlanObject {
  if (o.type === 'road' && o.points.length > 2) return { ...o, points: o.points.filter((_, i) => i !== index) };
  if (o.type === 'polygon' && o.points.length > 3) return { ...o, points: o.points.filter((_, i) => i !== index) };
  return o;
}
