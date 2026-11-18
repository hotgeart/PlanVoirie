import { Circle, Ellipse, Group, Line, Path, Rect } from 'react-konva';
import { shade, withAlpha } from '../../geometry/math';
import type { SymbolRenderProps } from './types';

/** Styles d'arbre proposés dans les propriétés (champ « Style »). */
export const TREE_STYLES = [
  { value: 'houppier', label: 'Houppier festonné' },
  { value: 'plan', label: 'Plan paysager (translucide)' },
  { value: 'massif', label: 'Feuillu détaillé' },
  { value: 'conifere', label: 'Conifère' },
];

/** Contour festonné : n lobes en arc de cercle répartis sur un cercle de rayon R. */
function scallop(R: number, n: number, bulge = 0.62, phase = 0) {
  const ar = 2 * R * Math.sin(Math.PI / n) * bulge;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    d += i === 0 ? `M ${x} ${y}` : ` A ${ar} ${ar} 0 0 1 ${x} ${y}`;
  }
  return d + ' Z';
}

/** Étoile à n pointes (conifère). */
function star(R: number, inner: number, n: number) {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? R : inner;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return pts;
}

function Trunk({ r }: { r: number }) {
  return <Circle radius={Math.max(0.07, r * 0.08)} fill="#6b4a2b" stroke="#3a2614" strokeWidth={0.03} />;
}

/** Arbre vu du dessus, dans le style choisi (voir TREE_STYLES). */
export function TreeSymbol({ w, color, variant }: SymbolRenderProps) {
  const r = w / 2;
  const line = shade(color, -0.55);
  const sw = Math.min(0.06, Math.max(0.03, r * 0.03));

  if (variant === 'plan') {
    // Symbole classique des plans paysagers : disque translucide, rayons et tronc
    return (
      <>
        <Circle radius={r} fill={withAlpha(color, 0.4)} stroke={line} strokeWidth={sw * 1.2} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.2;
          return <Line key={i} points={[Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16, Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82]} stroke={line} strokeWidth={sw * 0.7} opacity={0.7} />;
        })}
        <Circle radius={r * 0.55} stroke={line} strokeWidth={sw * 0.6} dash={[r * 0.12, r * 0.1]} opacity={0.6} />
        <Trunk r={r} />
      </>
    );
  }

  if (variant === 'conifere') {
    return (
      <>
        <Line points={star(r, r * 0.74, 14)} closed fill={shade(color, -0.2)} stroke={line} strokeWidth={sw} lineJoin="round" />
        <Line points={star(r * 0.66, r * 0.44, 10)} closed fill={color} stroke={shade(color, -0.4)} strokeWidth={sw * 0.7} lineJoin="round" />
        <Line points={star(r * 0.34, r * 0.2, 7)} closed fill={shade(color, 0.2)} stroke={shade(color, -0.3)} strokeWidth={sw * 0.6} lineJoin="round" />
        <Trunk r={r * 0.7} />
      </>
    );
  }

  if (variant === 'massif') {
    // Contour festonné + trois touffes intérieures plus claires
    const tufts = [
      { x: -r * 0.3, y: -r * 0.26, k: 0.36, n: 7 },
      { x: r * 0.34, y: -r * 0.06, k: 0.3, n: 6 },
      { x: -r * 0.04, y: r * 0.38, k: 0.32, n: 7 },
    ];
    return (
      <>
        <Path data={scallop(r * 0.9, 13)} fill={shade(color, -0.12)} stroke={line} strokeWidth={sw} lineJoin="round" />
        {tufts.map((t, i) => (
          <Path key={i} x={t.x} y={t.y} data={scallop(r * t.k, t.n, 0.62, i)} fill={shade(color, 0.14 + i * 0.05)} stroke={shade(color, -0.35)} strokeWidth={sw * 0.7} lineJoin="round" />
        ))}
        <Trunk r={r} />
      </>
    );
  }

  // 'houppier' (par défaut) : aplats nets et contour sombre, comme les autres symboles
  return (
    <>
      <Path data={scallop(r * 0.9, 11)} fill={color} stroke={line} strokeWidth={sw} lineJoin="round" />
      <Path data={scallop(r * 0.56, 8, 0.62, 0.3)} fill={shade(color, 0.18)} stroke={shade(color, -0.3)} strokeWidth={sw * 0.7} lineJoin="round" />
      <Trunk r={r} />
    </>
  );
}

const PETALS = ['#e8547a', '#f4c430', '#ffffff', '#b565d9', '#f08a3c'];

/** Fleur vue du dessus : feuilles en croix, couronne de pétales et cœur. R = rayon hors tout. */
function Flower({ x, y, R, petal, turn }: { x: number; y: number; R: number; petal: string; turn: number }) {
  const N = 6;
  const heart = petal === '#f4c430' ? '#c7751a' : '#f6c21c';
  return (
    <Group x={x} y={y} rotation={turn}>
      {[45, 135, 225, 315].map((a) => (
        <Ellipse
          key={`f${a}`} rotation={a} offsetX={-R * 0.62}
          radiusX={R * 0.42} radiusY={R * 0.17} fill="#3f8a3a" stroke="#2a5f27" strokeWidth={R * 0.04}
        />
      ))}
      {Array.from({ length: N }, (_, k) => (
        <Ellipse
          key={k} rotation={(k / N) * 360} offsetX={-R * 0.42}
          radiusX={R * 0.34} radiusY={R * 0.21} fill={petal} stroke={shade(petal, -0.35)} strokeWidth={R * 0.045}
        />
      ))}
      <Circle radius={R * 0.2} fill={heart} stroke={shade(heart, -0.4)} strokeWidth={R * 0.04} />
    </Group>
  );
}

/** Bac à fleurs vu du dessus : bac, terre et une rangée de fleurs. */
export function PlanterSymbol({ w, h, color }: SymbolRenderProps) {
  const rim = Math.min(w, h) * 0.12;
  const iw = w - rim * 2;
  const ih = h - rim * 2;
  // Une fleur par tranche à peu près carrée de la zone de terre
  const n = Math.max(1, Math.round(iw / ih));
  const step = iw / n;
  const R = Math.min(step, ih) * 0.47;
  return (
    <>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={rim * 0.6} fill={color} stroke={shade(color, -0.5)} strokeWidth={0.03} />
      <Rect x={-iw / 2} y={-ih / 2} width={iw} height={ih} cornerRadius={rim * 0.3} fill="#5b4330" stroke="#3a2a1c" strokeWidth={0.02} />
      {Array.from({ length: n }, (_, i) => (
        <Flower key={i} x={-iw / 2 + step * (i + 0.5)} y={0} R={R} petal={PETALS[i % PETALS.length]} turn={i * 23} />
      ))}
    </>
  );
}

/** Poubelle publique (corbeille de rue) vue du dessus : corps rond, couronne et ouverture. */
export function LitterBinSymbol({ w, color }: SymbolRenderProps) {
  const r = w / 2;
  return (
    <>
      <Circle radius={r} fill={shade(color, -0.3)} stroke="#1f2937" strokeWidth={r * 0.06} />
      <Circle radius={r * 0.8} fill={color} />
      <Circle radius={r * 0.5} fill="#15181d" />
      <Circle radius={r * 0.5} stroke={shade(color, 0.35)} strokeWidth={r * 0.07} />
    </>
  );
}
