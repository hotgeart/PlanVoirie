import type {
  ArrowObj, DimensionObj, EllipseObj, ImageObj, LineObj, PolygonObj, Pt, RectObj, RoadObj, SymbolObj, TextObj,
} from './types';
import type { SymbolDef } from './library/catalog';

export const newId = () =>
  'o' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const STROKE = { stroke: '#1f2937', strokeWidth: 0.1, dashed: false };
const FILL = { fill: '#93c5fd', fillOpacity: 0.35 };

export function makeRoad(points: Pt[]): RoadObj {
  return {
    id: newId(), type: 'road', points,
    width: 6, lanes: 2, centerMarking: 'dashed', edgeLines: false,
    sidewalkLeft: { enabled: true, width: 1.5 },
    sidewalkRight: { enabled: true, width: 1.5 },
    curb: true, rounded: true, radius: 8,
  };
}

function box(a: Pt, b: Pt) {
  return {
    x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
    width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y), rotation: 0,
  };
}

export const makeRect = (a: Pt, b: Pt): RectObj => ({ id: newId(), type: 'rect', ...box(a, b), ...STROKE, ...FILL });
export const makeEllipse = (a: Pt, b: Pt): EllipseObj => ({ id: newId(), type: 'ellipse', ...box(a, b), ...STROKE, ...FILL });
export const makePolygon = (points: Pt[]): PolygonObj => ({ id: newId(), type: 'polygon', points, ...STROKE, ...FILL });
export const makeLine = (a: Pt, b: Pt): LineObj => ({ id: newId(), type: 'line', points: [a, b], ...STROKE });

export const makeArrow = (a: Pt, b: Pt): ArrowObj => ({
  id: newId(), type: 'arrow', points: [a, b],
  curved: false, control: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  headStart: false, headEnd: true,
  stroke: '#d92d20', strokeWidth: 0.2, dashed: false,
});

export const makeText = (p: Pt, text = 'Texte'): TextObj => ({
  id: newId(), type: 'text', x: p.x, y: p.y, rotation: 0, text,
  fontSize: 0.8, color: '#111827', bold: false, background: false, backgroundColor: '#ffffff',
});

export const makeDimension = (a: Pt, b: Pt): DimensionObj => ({
  id: newId(), type: 'dimension', points: [a, b], offset: 1, color: '#111827', fontSize: 0.5,
});

export const makeSymbol = (def: SymbolDef, p: Pt): SymbolObj => ({
  id: newId(), type: 'symbol', symbolId: def.id,
  x: p.x, y: p.y, width: def.length, height: def.width, rotation: 0,
  color: def.colors?.length ? def.colors[Math.floor(Math.random() * def.colors.length)] : def.color,
  label: '',
  ...(def.count ? { count: def.count } : {}),
  ...(def.angle ? { angle: def.angle } : {}),
});

export const makeImage = (src: string, name: string, c: Pt, width: number, height: number): ImageObj => ({
  id: newId(), type: 'image', name, src, x: c.x, y: c.y, width, height, rotation: 0, opacity: 0.8,
});
