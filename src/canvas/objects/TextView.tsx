import { Group, Rect } from 'react-konva';
import type { TextObj } from '../../types';
import { MText } from '../MText';
import { measureText } from '../textMeasure';

export function TextView({ obj, editing }: { obj: TextObj; editing?: boolean }) {
  const m = measureText(obj.text, obj.fontSize, obj.bold);
  const pad = obj.fontSize * 0.3;
  return (
    <Group
      id={`node-${obj.id}`} name="obj" objId={obj.id}
      x={obj.x} y={obj.y} rotation={obj.rotation}
      listening={!obj.locked} opacity={editing ? 0 : 1}
    >
      {obj.background && (
        <Rect
          x={-pad} y={-pad} width={m.width + pad * 2} height={m.height + pad * 2}
          fill={obj.backgroundColor} stroke={obj.color} strokeWidth={obj.fontSize * 0.05}
          cornerRadius={obj.fontSize * 0.2}
        />
      )}
      {/* zone cliquable couvrant tout le texte */}
      <Rect width={Math.max(m.width, obj.fontSize)} height={m.height} fill="rgba(0,0,0,0)" />
      <MText text={obj.text} fontSize={obj.fontSize} fill={obj.color} bold={obj.bold} />
    </Group>
  );
}
