import { Ellipse, Group, Line, Rect } from 'react-konva';
import type { EllipseObj, FillProps, LineObj, PolygonObj, RectObj, StrokeProps } from '../../types';
import { withAlpha } from '../../geometry/math';
import { flat } from '../../geometry/road';
import { TEXTURE_SCALE, textureTile } from '../textures';

/** Pointillés proportionnels à l'épaisseur du trait (m). */
export const dashOf = (s: StrokeProps) =>
  s.dashed ? [Math.max(0.3, s.strokeWidth * 4), Math.max(0.2, s.strokeWidth * 3)] : undefined;

/** Largeur de la zone cliquable : au moins 10 px à l'écran. */
export const hitWidth = (strokeWidth: number, ppm: number) => Math.max(strokeWidth, 10 / ppm);

/** Attributs Konva du remplissage : couleur unie ou texture (herbe, gravier, sable) à l'échelle du plan. */
function fillAttrs(o: FillProps) {
  if (o.fillOpacity <= 0) return {};
  if (o.fillPattern) {
    return {
      fillPatternImage: textureTile(o.fillPattern, o.fillOpacity) as unknown as HTMLImageElement,
      fillPatternScaleX: TEXTURE_SCALE,
      fillPatternScaleY: TEXTURE_SCALE,
      fillPatternRepeat: 'repeat',
      fillPriority: 'pattern',
    };
  }
  return { fill: withAlpha(o.fill, o.fillOpacity), fillPriority: 'color' };
}

interface P<T> {
  obj: T;
  ppm: number;
}

export function RectView({ obj, ppm }: P<RectObj>) {
  return (
    <Group id={`node-${obj.id}`} name="obj" objId={obj.id} x={obj.x} y={obj.y} rotation={obj.rotation} listening={!obj.locked}>
      <Rect
        x={-obj.width / 2} y={-obj.height / 2} width={obj.width} height={obj.height}
        {...fillAttrs(obj)} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={dashOf(obj)}
        hitStrokeWidth={hitWidth(obj.strokeWidth, ppm)}
      />
    </Group>
  );
}

export function EllipseView({ obj, ppm }: P<EllipseObj>) {
  return (
    <Group id={`node-${obj.id}`} name="obj" objId={obj.id} x={obj.x} y={obj.y} rotation={obj.rotation} listening={!obj.locked}>
      <Ellipse
        radiusX={obj.width / 2} radiusY={obj.height / 2}
        {...fillAttrs(obj)} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={dashOf(obj)}
        hitStrokeWidth={hitWidth(obj.strokeWidth, ppm)}
      />
    </Group>
  );
}

export function PolygonView({ obj, ppm }: P<PolygonObj>) {
  return (
    <Group name="obj" objId={obj.id} listening={!obj.locked}>
      <Line
        points={flat(obj.points)} closed lineJoin="round"
        {...fillAttrs(obj)} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={dashOf(obj)}
        hitStrokeWidth={hitWidth(obj.strokeWidth, ppm)}
      />
    </Group>
  );
}

export function LineView({ obj, ppm }: P<LineObj>) {
  return (
    <Group name="obj" objId={obj.id} listening={!obj.locked}>
      <Line
        points={flat(obj.points)} lineCap="round"
        stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={dashOf(obj)}
        hitStrokeWidth={hitWidth(obj.strokeWidth, ppm)}
      />
    </Group>
  );
}
