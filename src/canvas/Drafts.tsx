import { Circle, Group } from 'react-konva';
import type { PlanObject, Pt } from '../types';
import { makeArrow, makeDimension, makeEllipse, makeLine, makePolygon, makeRect, makeRoad } from '../factories';
import { ObjectView } from './objects/ObjectView';
import { RoadsView } from './objects/RoadView';

export type Draft =
  | { kind: 'multi'; tool: 'road' | 'polygon'; points: Pt[]; cursor: Pt }
  | {
      kind: 'two';
      tool: 'rect' | 'ellipse' | 'line' | 'arrow' | 'dimension' | 'calibrate';
      start: Pt;
      cursor: Pt;
      /** Position écran du premier clic (distingue clic et glisser). */
      sx: number;
      sy: number;
    };

/** Objet de calibrage : une cote rouge sans décalage. */
export const calibrationPreview = (a: Pt, b: Pt): PlanObject => ({
  ...makeDimension(a, b), id: 'calib', offset: 0, color: '#e03131',
});

function previewObject(d: Draft): PlanObject | null {
  if (d.kind === 'multi') {
    const pts = [...d.points, d.cursor];
    if (d.tool === 'road') return { ...makeRoad(pts), id: 'draft' };
    return pts.length >= 3 ? { ...makePolygon(pts), id: 'draft' } : { ...makeLine(pts[0], pts[1]), id: 'draft' };
  }
  const { start: a, cursor: b } = d;
  switch (d.tool) {
    case 'rect': return { ...makeRect(a, b), id: 'draft' };
    case 'ellipse': return { ...makeEllipse(a, b), id: 'draft' };
    case 'line': return { ...makeLine(a, b), id: 'draft' };
    case 'arrow': return { ...makeArrow(a, b), id: 'draft' };
    case 'dimension': return { ...makeDimension(a, b), id: 'draft' };
    case 'calibrate': return calibrationPreview(a, b);
  }
}

/** Aperçu de l'objet en cours de tracé (non cliquable). */
export function DraftPreview({ draft, ppm }: { draft: Draft; ppm: number }) {
  const obj = previewObject(draft);
  if (!obj) return null;
  return (
    <Group listening={false} opacity={0.75}>
      {obj.type === 'road' ? <RoadsView roads={[obj]} listening={false} /> : <ObjectView obj={obj} ppm={ppm} />}
      {draft.kind === 'multi' &&
        draft.points.map((p, i) => <Circle key={i} x={p.x} y={p.y} radius={5 / ppm} fill="#2563eb" />)}
    </Group>
  );
}
