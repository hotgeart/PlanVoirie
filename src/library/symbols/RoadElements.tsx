import { Circle, Line, Rect } from 'react-konva';
import { COLORS } from '../../constants';
import type { SymbolRenderProps } from './types';

/** Passage piéton : bandes de 0,50 m espacées de 0,50 m, parallèles à l'axe Y. */
export function CrosswalkSymbol({ w, h }: SymbolRenderProps) {
  const n = Math.max(1, Math.round(w / 1.0));
  const pitch = w / n;
  const band = pitch / 2;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <Rect
          key={i}
          x={-w / 2 + i * pitch + band / 2} y={-h / 2} width={band} height={h}
          fill="#ffffff" stroke="#9ca3af" strokeWidth={0.02}
        />
      ))}
    </>
  );
}

/** Stationnement longitudinal : `count` places le long de l'axe X. */
export function ParkingSymbol({ w, h, color, count = 1 }: SymbolRenderProps) {
  const n = Math.max(1, count);
  const lines: number[] = [];
  for (let i = 0; i <= n; i++) lines.push(-w / 2 + (i * w) / n);
  return (
    <>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} />
      {lines.map((x) => (
        <Line key={x} points={[x, -h / 2, x, h / 2]} stroke={COLORS.marking} strokeWidth={0.1} />
      ))}
      <Line points={[-w / 2, -h / 2, w / 2, -h / 2]} stroke={COLORS.marking} strokeWidth={0.1} dash={[0.5, 0.5]} />
    </>
  );
}

/** Décalage horizontal dû à l'inclinaison des places en épi. */
export const angledSkew = (h: number, angle: number) =>
  h / Math.tan((Math.min(89, Math.max(30, angle)) * Math.PI) / 180);

/** Stationnement en épi : `count` places inclinées de `angle` degrés. */
export function ParkingAngledSymbol({ w, h, color, count = 3, angle = 60 }: SymbolRenderProps) {
  const n = Math.max(1, count);
  const s = Math.min(angledSkew(h, angle), w * 0.8);
  const pitch = (w - s) / n;
  const L = -w / 2;
  return (
    <>
      <Line closed points={[L, h / 2, L + s, -h / 2, w / 2, -h / 2, w / 2 - s, h / 2]} fill={color} />
      {Array.from({ length: n + 1 }, (_, i) => (
        <Line
          key={i}
          points={[L + i * pitch, h / 2, L + i * pitch + s, -h / 2]}
          stroke={COLORS.marking} strokeWidth={0.1}
        />
      ))}
    </>
  );
}

/** Aire de retournement circulaire. */
export function TurnaroundSymbol({ w, color }: SymbolRenderProps) {
  const r = w / 2;
  return (
    <>
      <Circle radius={r} fill={color} stroke={COLORS.curb} strokeWidth={0.15} />
      <Circle radius={Math.max(0.1, r - 0.4)} stroke={COLORS.marking} strokeWidth={0.1} dash={[1.5, 1.5]} />
      <Circle radius={0.15} fill={COLORS.marking} opacity={0.6} />
    </>
  );
}

/**
 * Barrière Nadar vue du dessus : lisse métallique le long de l'axe X,
 * deux pieds perpendiculaires et crochets d'accrochage aux extrémités.
 */
export function NadarSymbol({ w, h, color }: SymbolRenderProps) {
  const bar = Math.min(0.08, h * 0.3);
  const foot = Math.min(0.07, w * 0.05);
  const fx = w / 2 - Math.min(0.35, w * 0.16);
  const dark = '#3b4450';
  return (
    <>
      {[-fx, fx].map((x) => (
        <Rect key={x} x={x - foot / 2} y={-h / 2} width={foot} height={h} cornerRadius={foot / 2} fill={color} stroke={dark} strokeWidth={0.02} />
      ))}
      <Rect x={-w / 2} y={-bar / 2} width={w} height={bar} cornerRadius={bar / 2} fill={color} stroke={dark} strokeWidth={0.025} />
      {/* barreaux verticaux, visibles en pointillé sur la lisse */}
      <Line points={[-fx + 0.1, 0, fx - 0.1, 0]} stroke={dark} strokeWidth={bar * 0.35} dash={[0.03, 0.1]} />
      {/* crochets d'accrochage */}
      <Circle x={-w / 2} radius={bar * 0.7} fill={dark} />
      <Circle x={w / 2} radius={bar * 0.7} fill={dark} />
    </>
  );
}

/** Feu tricolore, représenté de face (pictogramme) : boîtier et trois feux, rouge en haut (−Y). */
export function TrafficLightSymbol({ w, h, color }: SymbolRenderProps) {
  const r = Math.min(w * 0.32, h * 0.13);
  const gap = h / 3.4;
  const lights = ['#e03131', '#f59f00', '#2f9e44'];
  return (
    <>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={Math.min(w, h) * 0.22} fill={color} stroke="#0b0f14" strokeWidth={0.03} />
      {lights.map((c, i) => (
        <Circle key={c} y={(i - 1) * gap} radius={r} fill={c} stroke="rgba(255,255,255,0.55)" strokeWidth={r * 0.12} />
      ))}
    </>
  );
}

/** Panneau « stationnement interdit » (E1), représenté de face : disque bleu, couronne et barre rouges. */
export function NoParkingSymbol({ w }: SymbolRenderProps) {
  const r = w / 2;
  const k = r * 0.6;
  return (
    <>
      <Circle radius={r} fill="#ffffff" stroke="#1f2937" strokeWidth={r * 0.04} />
      <Circle radius={r * 0.93} fill="#d62828" />
      <Circle radius={r * 0.7} fill="#1c5bb8" />
      <Line points={[-k, -k, k, k]} stroke="#d62828" strokeWidth={r * 0.24} />
    </>
  );
}
