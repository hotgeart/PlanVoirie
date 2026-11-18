import { Circle, Line, Rect } from 'react-konva';
import { shade } from '../../geometry/math';
import { GLASS, OUTLINE, type SymbolRenderProps } from './types';

const SW = 0.04;

/** Benne à ordures ménagères vue du dessus : cabine à l'avant (+X), trémie à l'arrière. */
export function BomSymbol({ w, h, color, def, showStabilizers, showManeuverZone }: SymbolRenderProps) {
  const L = -w / 2;
  const R = w / 2;
  const T = -h / 2;
  const cab = Math.min(2.1, w * 0.26);
  const hopper = Math.min(1.5, w * 0.17);
  const bodyX = L + hopper;
  const bodyW = w - cab - hopper - 0.18;
  const axles = def.axles ?? 2;

  // Position des essieux le long du véhicule
  const wheelL = Math.min(1.0, w * 0.11);
  const axleXs = [R - cab * 0.62];
  const rear = bodyX + Math.min(1.5, bodyW * 0.28);
  axleXs.push(rear);
  if (axles >= 3) axleXs.push(rear + wheelL + 0.35);

  const ribs: number[] = [];
  for (let x = bodyX + 0.8; x < bodyX + bodyW - 0.3; x += 0.8) ribs.push(x);

  const legXs = [bodyX + 0.5, bodyX + bodyW - 0.5];

  return (
    <>
      {showManeuverZone && (
        <Rect
          x={L - 1} y={T - 1} width={w + 2} height={h + 2}
          stroke="#e8590c" strokeWidth={0.06} dash={[0.45, 0.3]} fill="rgba(232,89,12,0.07)"
        />
      )}
      {showStabilizers &&
        legXs.flatMap((x) =>
          [-1, 1].map((s) => (
            <Line
              key={`${x}${s}`}
              points={[x, (s * h) / 2, x, s * (h / 2 + 0.75)]}
              stroke="#374151" strokeWidth={0.16}
            />
          )),
        )}
      {showStabilizers &&
        legXs.flatMap((x) =>
          [-1, 1].map((s) => (
            <Rect
              key={`p${x}${s}`}
              x={x - 0.25} y={s * (h / 2 + 0.75) - 0.25} width={0.5} height={0.5}
              fill="#f59f00" stroke={OUTLINE} strokeWidth={SW}
            />
          )),
        )}

      {/* roues (dépassent légèrement de la caisse) */}
      {axleXs.flatMap((x) =>
        [-1, 1].map((s) => (
          <Rect
            key={`w${x}${s}`}
            x={x - wheelL / 2} y={s > 0 ? h / 2 - 0.12 : T - 0.07} width={wheelL} height={0.19}
            cornerRadius={0.05} fill="#111827"
          />
        )),
      )}

      {/* trémie arrière */}
      <Rect x={L} y={T + h * 0.03} width={hopper + 0.1} height={h * 0.94} cornerRadius={[0.15, 0, 0, 0.15]} fill={shade(color, -0.3)} stroke={OUTLINE} strokeWidth={SW} />
      <Rect x={L + 0.15} y={T + h * 0.14} width={hopper * 0.55} height={h * 0.72} cornerRadius={0.06} fill="#1f2937" />

      {/* caisson */}
      <Rect x={bodyX} y={T} width={bodyW} height={h} cornerRadius={0.08} fill={color} stroke={OUTLINE} strokeWidth={SW} />
      {ribs.map((x) => (
        <Line key={x} points={[x, T + 0.06, x, -T - 0.06]} stroke={shade(color, -0.25)} strokeWidth={0.05} />
      ))}
      <Rect x={bodyX + 0.25} y={T + h * 0.2} width={bodyW - 0.5} height={h * 0.6} cornerRadius={0.1} fill={shade(color, 0.14)} opacity={0.6} />

      {/* cabine */}
      <Rect x={R - cab + 0.25} y={T - 0.22} width={0.14} height={0.26} fill="#374151" />
      <Rect x={R - cab + 0.25} y={-T - 0.04} width={0.14} height={0.26} fill="#374151" />
      <Rect x={R - cab} y={T + h * 0.01} width={cab} height={h * 0.98} cornerRadius={[0.1, 0.3, 0.3, 0.1]} fill="#f3f4f6" stroke={OUTLINE} strokeWidth={SW} />
      {/* pare-brise */}
      <Line closed points={[R - 0.62, -h * 0.44, R - 0.2, -h * 0.4, R - 0.2, h * 0.4, R - 0.62, h * 0.44]} fill={GLASS} />
      {/* gyrophares */}
      <Circle x={R - cab + 0.45} y={-h * 0.3} radius={0.11} fill="#f59f00" stroke={OUTLINE} strokeWidth={0.02} />
      <Circle x={R - cab + 0.45} y={h * 0.3} radius={0.11} fill="#f59f00" stroke={OUTLINE} strokeWidth={0.02} />
      {/* repère de l'avant sur le toit */}
      <Line closed points={[R - cab + 0.7, -h * 0.16, R - cab + 1.15, 0, R - cab + 0.7, h * 0.16]} fill="#6b7280" />
      {/* phares */}
      <Rect x={R - 0.1} y={-h * 0.44} width={0.08} height={h * 0.16} fill="#fde68a" />
      <Rect x={R - 0.1} y={h * 0.28} width={0.08} height={h * 0.16} fill="#fde68a" />
    </>
  );
}
