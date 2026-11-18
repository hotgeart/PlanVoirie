import { Text } from 'react-konva';
import { FONT, LINE_H, measureText } from './textMeasure';

/**
 * Texte dimensionné en mètres. Le canvas gère mal les polices de moins d'un
 * pixel : le texte est donc dessiné ×K puis réduit par l'échelle du nœud.
 */
const K = 100;

interface Props {
  x?: number;
  y?: number;
  text: string;
  /** Hauteur de police en mètres. */
  fontSize: number;
  fill?: string;
  bold?: boolean;
  rotation?: number;
  anchor?: 'top-left' | 'top-center' | 'center' | 'bottom-center';
  listening?: boolean;
}

export function MText({
  x = 0, y = 0, text, fontSize, fill = '#111827', bold = false, rotation = 0,
  anchor = 'top-left', listening = false,
}: Props) {
  const m = measureText(text, fontSize, bold);
  const centered = anchor !== 'top-left';
  const oy = anchor === 'center' ? m.height / 2 : anchor === 'bottom-center' ? m.height : 0;
  return (
    <Text
      x={x} y={y} rotation={rotation}
      text={text}
      fontFamily={FONT}
      fontStyle={bold ? 'bold' : 'normal'}
      fontSize={fontSize * K}
      lineHeight={LINE_H}
      scaleX={1 / K} scaleY={1 / K}
      width={centered ? m.width * K + 4 : undefined}
      align={centered ? 'center' : 'left'}
      offsetX={centered ? (m.width * K + 4) / 2 : 0}
      offsetY={oy * K}
      fill={fill}
      listening={listening}
    />
  );
}
