import { memo, useMemo } from 'react';
import { Group, Line } from 'react-konva';
import type { RoadObj } from '../../types';
import { COLORS, ROAD } from '../../constants';
import { flat, offsetPolyline, roadCenterline } from '../../geometry/road';

/**
 * Les routes sont dessinées en passes successives, TOUTES routes confondues :
 * contour des trottoirs → trottoirs → bordures → enrobé → marquages.
 * Deux routes superposées forment ainsi un carrefour propre sans calcul d'intersection.
 */
const PASSES = ['sidewalkEdge', 'sidewalk', 'curb', 'asphalt', 'markings'] as const;
type Pass = (typeof PASSES)[number];

const HIDDEN = -0.05; // côté sans trottoir : la bande reste cachée sous l'enrobé

const RoadPass = memo(function RoadPass({ road, pass, listening }: { road: RoadObj; pass: Pass; listening: boolean }) {
  const center = useMemo(() => roadCenterline(road), [road.points, road.rounded, road.radius]);
  if (center.length < 2) return null;
  const W = road.width;
  const l = road.sidewalkLeft.enabled ? road.sidewalkLeft.width : 0;
  const r = road.sidewalkRight.enabled ? road.sidewalkRight.width : 0;

  /** Bande allant de `right` m à droite du bord de chaussée à `left` m à gauche. */
  const band = (left: number, right: number, color: string) => (
    <Line
      points={flat(offsetPolyline(center, (left - right) / 2))}
      stroke={color} strokeWidth={W + left + right} lineJoin="round" lineCap="butt"
    />
  );
  const stripe = (offset: number, dashed: boolean, key: string) => (
    <Line
      key={key}
      points={flat(offsetPolyline(center, offset))}
      stroke={COLORS.marking} strokeWidth={ROAD.markingWidth} lineJoin="round"
      dash={dashed ? ROAD.dash : undefined}
    />
  );

  let content: React.ReactNode = null;
  switch (pass) {
    case 'sidewalkEdge':
      if (l || r) {
        const e = ROAD.sidewalkOutline;
        content = band(l ? l + e : HIDDEN, r ? r + e : HIDDEN, COLORS.sidewalkEdge);
      }
      break;
    case 'sidewalk':
      if (l || r) content = band(l || HIDDEN, r || HIDDEN, COLORS.sidewalk);
      break;
    case 'curb':
      if (road.curb && (l || r)) {
        content = band(l ? ROAD.curbWidth : HIDDEN, r ? ROAD.curbWidth : HIDDEN, COLORS.curb);
      }
      break;
    case 'asphalt':
      content = band(0, 0, COLORS.asphalt);
      break;
    case 'markings': {
      const lines: React.ReactNode[] = [];
      const n = Math.max(1, Math.round(road.lanes));
      for (let i = 1; i < n; i++) {
        const off = W / 2 - (i * W) / n;
        const central = n % 2 === 0 ? i === n / 2 : true;
        if (central) {
          if (road.centerMarking !== 'none') lines.push(stripe(off, road.centerMarking === 'dashed', `c${i}`));
        } else {
          lines.push(stripe(off, true, `v${i}`));
        }
      }
      if (road.edgeLines) {
        const off = W / 2 - ROAD.edgeInset;
        lines.push(stripe(off, false, 'eL'), stripe(-off, false, 'eR'));
      }
      content = lines;
      break;
    }
  }
  if (!content) return null;
  return (
    <Group name="obj" objId={road.id} listening={listening && !road.locked && pass !== 'markings'}>
      {content}
    </Group>
  );
});

export function RoadsView({ roads, listening = true }: { roads: RoadObj[]; listening?: boolean }) {
  if (!roads.length) return null;
  return (
    <>
      {PASSES.map((pass) => (
        <Group key={pass}>
          {roads.map((r) => (
            <RoadPass key={r.id} road={r} pass={pass} listening={listening} />
          ))}
        </Group>
      ))}
    </>
  );
}
