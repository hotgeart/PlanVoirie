import { Line, Rect } from 'react-konva';
import { shade } from '../../geometry/math';
import { GLASS, OUTLINE, type SymbolRenderProps } from './types';

const SW = 0.035;

/** Voiture (citadine, berline) vue du dessus, avant côté +X. */
export function CarSymbol({ w, h, color }: SymbolRenderProps) {
  const L = -w / 2;
  const T = -h / 2;
  return (
    <>
      {/* rétroviseurs */}
      <Rect x={w * 0.13} y={T - 0.1} width={0.14} height={0.12} fill={color} stroke={OUTLINE} strokeWidth={SW} />
      <Rect x={w * 0.13} y={-T - 0.02} width={0.14} height={0.12} fill={color} stroke={OUTLINE} strokeWidth={SW} />
      {/* carrosserie */}
      <Rect
        x={L} y={T} width={w} height={h}
        cornerRadius={[h * 0.22, h * 0.4, h * 0.4, h * 0.22]}
        fill={color} stroke={OUTLINE} strokeWidth={SW}
      />
      {/* pare-brise */}
      <Line closed points={[w * 0.07, -h * 0.41, w * 0.25, -h * 0.33, w * 0.25, h * 0.33, w * 0.07, h * 0.41]} fill={GLASS} />
      {/* lunette arrière */}
      <Line closed points={[-w * 0.26, -h * 0.39, -w * 0.37, -h * 0.32, -w * 0.37, h * 0.32, -w * 0.26, h * 0.39]} fill={GLASS} />
      {/* toit */}
      <Rect x={-w * 0.26} y={-h * 0.41} width={w * 0.33} height={h * 0.82} cornerRadius={h * 0.06} fill={shade(color, 0.18)} stroke={OUTLINE} strokeWidth={SW * 0.6} />
      {/* phares */}
      <Rect x={w / 2 - 0.13} y={-h * 0.42} width={0.09} height={h * 0.2} cornerRadius={0.03} fill="#fde68a" />
      <Rect x={w / 2 - 0.13} y={h * 0.22} width={0.09} height={h * 0.2} cornerRadius={0.03} fill="#fde68a" />
      {/* feux arrière */}
      <Rect x={L + 0.04} y={-h * 0.42} width={0.08} height={h * 0.18} fill="#dc2626" />
      <Rect x={L + 0.04} y={h * 0.24} width={0.08} height={h * 0.18} fill="#dc2626" />
      {/* repère de l'avant */}
      <Line closed points={[w * 0.33, -h * 0.12, w * 0.43, 0, w * 0.33, h * 0.12]} fill="rgba(0,0,0,0.4)" />
    </>
  );
}

/** Utilitaire / fourgon vu du dessus, avant côté +X. */
export function VanSymbol({ w, h, color }: SymbolRenderProps) {
  const L = -w / 2;
  const T = -h / 2;
  const cab = w * 0.3; // longueur de la cabine + capot
  return (
    <>
      <Rect x={w / 2 - cab * 0.72} y={T - 0.12} width={0.16} height={0.14} fill="#374151" />
      <Rect x={w / 2 - cab * 0.72} y={-T - 0.02} width={0.16} height={0.14} fill="#374151" />
      <Rect
        x={L} y={T} width={w} height={h}
        cornerRadius={[h * 0.06, h * 0.28, h * 0.28, h * 0.06]}
        fill={color} stroke={OUTLINE} strokeWidth={SW}
      />
      {/* caisse */}
      <Rect x={L + 0.08} y={T + 0.08} width={w - cab - 0.1} height={h - 0.16} cornerRadius={0.06} fill={shade(color, -0.06)} stroke={OUTLINE} strokeWidth={SW * 0.6} />
      {/* pare-brise */}
      <Line closed points={[w / 2 - cab * 0.78, -h * 0.43, w / 2 - cab * 0.4, -h * 0.38, w / 2 - cab * 0.4, h * 0.38, w / 2 - cab * 0.78, h * 0.43]} fill={GLASS} />
      <Rect x={w / 2 - 0.13} y={-h * 0.43} width={0.09} height={h * 0.18} cornerRadius={0.03} fill="#fde68a" />
      <Rect x={w / 2 - 0.13} y={h * 0.25} width={0.09} height={h * 0.18} cornerRadius={0.03} fill="#fde68a" />
      <Rect x={L + 0.03} y={-h * 0.45} width={0.07} height={h * 0.16} fill="#dc2626" />
      <Rect x={L + 0.03} y={h * 0.29} width={0.07} height={h * 0.16} fill="#dc2626" />
      <Line closed points={[w / 2 - cab * 0.3, -h * 0.12, w / 2 - cab * 0.08, 0, w / 2 - cab * 0.3, h * 0.12]} fill="rgba(0,0,0,0.4)" />
    </>
  );
}
