import { Circle, Line, Rect } from 'react-konva';
import { shade } from '../../geometry/math';
import { OUTLINE, type SymbolRenderProps } from './types';

/** Bac roulant vu du dessus : poignée/charnière à l'arrière (haut), couvercle coloré. */
export function BinSymbol({ w, h, color, def }: SymbolRenderProps) {
  const L = -w / 2;
  const T = -h / 2;
  const sw = 0.02;
  const four = def.wheels === 4;
  const hinge = h * 0.13;
  const wr = four ? 0.07 : 0.06;
  return (
    <>
      {def.wheels === 0 ? null : four ? (
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => (
          <Circle key={`${sx}${sy}`} x={sx * (w / 2 - 0.05)} y={sy * (h / 2 - 0.05)} radius={wr} fill="#111827" />
        ))
      ) : (
        [-1, 1].map((s) => (
          <Rect key={s} x={s > 0 ? w / 2 - 0.035 : L - 0.035} y={T + 0.01} width={0.07} height={0.17} cornerRadius={0.02} fill="#111827" />
        ))
      )}
      {/* cuve */}
      <Rect x={L} y={T} width={w} height={h} cornerRadius={0.05} fill={shade(color, -0.35)} stroke={OUTLINE} strokeWidth={sw} />
      {/* barre de préhension / charnière */}
      <Rect x={L + w * 0.08} y={T + 0.02} width={w * 0.84} height={hinge - 0.03} cornerRadius={0.02} fill={shade(color, -0.6)} />
      {/* couvercle */}
      <Rect x={L + 0.025} y={T + hinge} width={w - 0.05} height={h - hinge - 0.025} cornerRadius={0.04} fill={color} stroke={shade(color, -0.4)} strokeWidth={sw} />
      <Rect x={L + w * 0.12} y={T + hinge + (h - hinge) * 0.16} width={w * 0.76} height={(h - hinge) * 0.5} cornerRadius={0.03} stroke={shade(color, -0.25)} strokeWidth={sw} fill={shade(color, 0.12)} />
      {/* poignée avant */}
      <Line points={[-w * 0.18, h / 2 - 0.07, w * 0.18, h / 2 - 0.07]} stroke={shade(color, -0.4)} strokeWidth={0.03} lineCap="round" />
    </>
  );
}

/** Colonne d'apport volontaire aérienne. */
export function ColumnSymbol({ w, h, color }: SymbolRenderProps) {
  const r = Math.min(w, h) / 2;
  return (
    <>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={r * 0.35} fill={shade(color, -0.25)} stroke={OUTLINE} strokeWidth={0.04} />
      <Circle radius={r * 0.82} fill={color} stroke={shade(color, -0.4)} strokeWidth={0.03} />
      {/* orifices d'introduction */}
      <Circle x={-r * 0.45} radius={r * 0.16} fill="#111827" />
      <Circle x={r * 0.45} radius={r * 0.16} fill="#111827" />
      {/* anneau de levage */}
      <Circle radius={r * 0.14} fill="#d1d5db" stroke={OUTLINE} strokeWidth={0.03} />
    </>
  );
}

/** Conteneur enterré : dalle au sol + borne d'introduction. */
export function BuriedSymbol({ w, h, color }: SymbolRenderProps) {
  const m = Math.min(w, h);
  return (
    <>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={0.05} fill="#c4c4be" stroke={OUTLINE} strokeWidth={0.04} />
      <Rect x={-w / 2 + m * 0.07} y={-h / 2 + m * 0.07} width={w - m * 0.14} height={h - m * 0.14} stroke="#8a8a84" strokeWidth={0.03} dash={[0.12, 0.08]} />
      {/* borne */}
      <Rect x={-m * 0.19} y={-m * 0.19} width={m * 0.38} height={m * 0.38} cornerRadius={m * 0.06} fill={color} stroke={OUTLINE} strokeWidth={0.04} />
      <Circle radius={m * 0.1} fill="#111827" />
    </>
  );
}

/** Benne ampliroll : caisson ouvert, crochet de préhension à l'avant (+X). */
export function SkipSymbol({ w, h, color }: SymbolRenderProps) {
  const L = -w / 2;
  const T = -h / 2;
  const wall = 0.14;
  const ribs: number[] = [];
  for (let x = L + 0.8; x < w / 2 - 0.5; x += 0.8) ribs.push(x);
  return (
    <>
      <Rect x={L} y={T} width={w} height={h} cornerRadius={0.06} fill={color} stroke={OUTLINE} strokeWidth={0.04} />
      <Rect x={L + wall} y={T + wall} width={w - wall * 2} height={h - wall * 2} fill={shade(color, -0.45)} />
      {ribs.map((x) => (
        <Line key={x} points={[x, T, x, T + wall, x, -T - wall, x, -T]} stroke={shade(color, -0.3)} strokeWidth={0.06} dash={[wall, h - wall * 2]} />
      ))}
      {/* portes arrière */}
      <Line points={[L + 0.05, 0, L + wall, 0]} stroke={OUTLINE} strokeWidth={0.04} />
      {/* potence et anneau de crochet */}
      <Line points={[w / 2, -h * 0.22, w / 2 + 0.28, 0, w / 2, h * 0.22]} stroke={OUTLINE} strokeWidth={0.07} lineJoin="round" />
      <Circle x={w / 2 + 0.28} radius={0.09} fill="#f59f00" stroke={OUTLINE} strokeWidth={0.03} />
    </>
  );
}
