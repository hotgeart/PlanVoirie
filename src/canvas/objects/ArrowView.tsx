import { Group, Line, Path } from 'react-konva';
import type { ArrowObj, Pt } from '../../types';
import { dashOf, hitWidth } from './ShapeViews';

/** Point de contrôle de la Bézier quadratique passant par `control` à mi-parcours. */
export function bezierControl(o: Pick<ArrowObj, 'points' | 'control'>): Pt {
  const [p0, p2] = o.points;
  return { x: 2 * o.control.x - (p0.x + p2.x) / 2, y: 2 * o.control.y - (p0.y + p2.y) / 2 };
}

function head(tip: Pt, from: Pt, len: number, wid: number) {
  const d = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / d;
  const uy = (tip.y - from.y) / d;
  const bx = tip.x - ux * len;
  const by = tip.y - uy * len;
  return {
    points: [tip.x, tip.y, bx - uy * wid, by + ux * wid, bx + uy * wid, by - ux * wid],
    base: { x: tip.x - ux * len * 0.8, y: tip.y - uy * len * 0.8 },
  };
}

export function ArrowView({ obj, ppm }: { obj: ArrowObj; ppm: number }) {
  const [p0, p2] = obj.points;
  const c = obj.curved ? bezierControl(obj) : { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  const len = obj.strokeWidth * 4 + 0.35;
  const wid = obj.strokeWidth * 1.6 + 0.16;
  // Direction des têtes : tangente à la courbe aux extrémités
  const tEnd = obj.curved ? c : p0;
  const tStart = obj.curved ? c : p2;
  const hEnd = obj.headEnd ? head(p2, tEnd, len, wid) : null;
  const hStart = obj.headStart ? head(p0, tStart, len, wid) : null;
  // Le trait s'arrête à la base des têtes pour ne pas dépasser de la pointe
  const a = hStart ? hStart.base : p0;
  const b = hEnd ? hEnd.base : p2;
  const data = obj.curved
    ? `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`
    : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  return (
    <Group name="obj" objId={obj.id} listening={!obj.locked}>
      <Path
        data={data} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={dashOf(obj)}
        lineCap="butt" hitStrokeWidth={hitWidth(obj.strokeWidth, ppm)}
      />
      {hEnd && <Line points={hEnd.points} closed fill={obj.stroke} />}
      {hStart && <Line points={hStart.points} closed fill={obj.stroke} />}
    </Group>
  );
}
