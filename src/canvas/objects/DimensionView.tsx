import { Group, Line } from 'react-konva';
import type { DimensionObj } from '../../types';
import { dimensionGeometry, fmt } from '../../geometry/math';
import { MText } from '../MText';
import { hitWidth } from './ShapeViews';

/** Cote technique : lignes d'attache, ligne de cote fléchée, distance en mètres. */
export function DimensionView({ obj, ppm }: { obj: DimensionObj; ppm: number }) {
  const [p1, p2] = obj.points;
  const { a, b, n, u, len, angle } = dimensionGeometry(p1, p2, obj.offset);
  const sw = obj.fontSize * 0.08;
  const sgn = obj.offset >= 0 ? 1 : -1;
  const ext = obj.fontSize * 0.4 * sgn; // dépassement des lignes d'attache
  const ah = Math.min(obj.fontSize * 0.7, len / 3); // longueur des flèches
  const aw = ah * 0.3;
  const arrow = (tip: typeof a, dir: 1 | -1) => [
    tip.x, tip.y,
    tip.x + u.x * ah * dir + n.x * aw, tip.y + u.y * ah * dir + n.y * aw,
    tip.x + u.x * ah * dir - n.x * aw, tip.y + u.y * ah * dir - n.y * aw,
  ];
  // Le texte reste lisible (jamais à l'envers)
  const flip = angle > 90 || angle <= -90;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const up = flip ? -1 : 1;
  const tx = mid.x + n.x * obj.fontSize * 0.25 * up;
  const ty = mid.y + n.y * obj.fontSize * 0.25 * up;
  return (
    <Group name="obj" objId={obj.id} listening={!obj.locked}>
      <Line points={[p1.x, p1.y, a.x + n.x * ext, a.y + n.y * ext]} stroke={obj.color} strokeWidth={sw * 0.7} />
      <Line points={[p2.x, p2.y, b.x + n.x * ext, b.y + n.y * ext]} stroke={obj.color} strokeWidth={sw * 0.7} />
      <Line points={[a.x, a.y, b.x, b.y]} stroke={obj.color} strokeWidth={sw} hitStrokeWidth={hitWidth(obj.fontSize, ppm)} />
      <Line points={arrow(a, 1)} closed fill={obj.color} />
      <Line points={arrow(b, -1)} closed fill={obj.color} />
      <MText
        x={tx} y={ty} rotation={flip ? angle + 180 : angle}
        text={`${fmt(len)} m`} fontSize={obj.fontSize} fill={obj.color} anchor="bottom-center"
      />
    </Group>
  );
}
