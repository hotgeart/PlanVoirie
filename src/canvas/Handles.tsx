import { Circle, Line, Rect } from 'react-konva';
import type { PlanObject, Pt, View } from '../types';
import { COLORS } from '../constants';
import { dimensionGeometry, getBounds, hasPoints } from '../geometry/math';
import { bezierControl } from './objects/ArrowView';

const BLUE = COLORS.selection;

/**
 * Poignées d'édition des objets à points (routes, polygones, lignes, flèches, cotes).
 * Dessinées en pixels écran ; le déplacement est géré par CanvasStage
 * (attributs `hkind` / `hindex` lus au mousedown).
 */
export function Handles({ obj, view }: { obj: PlanObject; view: View }) {
  if (!hasPoints(obj)) return null;
  const S = (p: Pt) => ({ x: p.x * view.ppm + view.x, y: p.y * view.ppm + view.y });
  const pts = obj.points.map(S);
  const closed = obj.type === 'polygon';
  const editable = obj.type === 'road' || obj.type === 'polygon';
  const common = { name: 'handle', objId: obj.id };

  const mids: { x: number; y: number; i: number }[] = [];
  if (editable) {
    pts.forEach((p, i) => {
      const q = pts[i + 1] ?? (closed ? pts[0] : null);
      if (q) mids.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, i });
    });
  }

  let guide: number[] | null = null;
  if (obj.type === 'road') guide = pts.flatMap((p) => [p.x, p.y]);

  let extra: React.ReactNode = null;
  if (obj.type === 'arrow' && obj.curved) {
    const c = S(obj.control);
    const bc = S(bezierControl(obj));
    extra = (
      <>
        <Line points={[pts[0].x, pts[0].y, bc.x, bc.y, pts[1].x, pts[1].y]} stroke={BLUE} strokeWidth={1} dash={[3, 4]} opacity={0.5} listening={false} />
        <Circle {...common} hkind="control" hindex={0} x={c.x} y={c.y} radius={7} fill="#f59f00" stroke="#fff" strokeWidth={2} />
      </>
    );
  }
  if (obj.type === 'dimension') {
    const g = dimensionGeometry(obj.points[0], obj.points[1], obj.offset);
    const m = S({ x: (g.a.x + g.b.x) / 2, y: (g.a.y + g.b.y) / 2 });
    extra = <Rect {...common} hkind="offset" hindex={0} x={m.x - 5} y={m.y - 5} width={10} height={10} fill="#f59f00" stroke="#fff" strokeWidth={2} />;
  }

  return (
    <>
      {guide && <Line points={guide} stroke={BLUE} strokeWidth={1.5} dash={[6, 4]} listening={false} />}
      {extra}
      {mids.map((m) => (
        <Circle key={`m${m.i}`} {...common} hkind="mid" hindex={m.i} x={m.x} y={m.y} radius={5} fill="#fff" stroke={BLUE} strokeWidth={1.5} opacity={0.75} />
      ))}
      {pts.map((p, i) => (
        <Circle key={`v${i}`} {...common} hkind="vertex" hindex={i} x={p.x} y={p.y} radius={6.5} fill={BLUE} stroke="#fff" strokeWidth={2} />
      ))}
    </>
  );
}

/** Cadre en pointillés autour d'un objet sélectionné (quand le Transformer n'est pas affiché). */
export function SelectionOutline({ obj, view }: { obj: PlanObject; view: View }) {
  const b = getBounds(obj);
  return (
    <Rect
      x={b.x1 * view.ppm + view.x - 3} y={b.y1 * view.ppm + view.y - 3}
      width={(b.x2 - b.x1) * view.ppm + 6} height={(b.y2 - b.y1) * view.ppm + 6}
      stroke={BLUE} strokeWidth={1} dash={[5, 4]} listening={false}
    />
  );
}
