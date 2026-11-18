import { Group, Rect } from 'react-konva';
import type { SymbolObj } from '../../types';
import { getSymbolDef } from '../../library/catalog';
import { SYMBOL_RENDERERS } from '../../library/symbols';
import { MText } from '../MText';

export function SymbolView({ obj }: { obj: SymbolObj }) {
  const def = getSymbolDef(obj.symbolId);
  const Draw = SYMBOL_RENDERERS[def.kind];
  const a = (obj.rotation * Math.PI) / 180;
  // Demi-hauteur de l'emprise après rotation, pour placer l'étiquette dessous
  const halfH = (Math.abs(obj.width * Math.sin(a)) + Math.abs(obj.height * Math.cos(a))) / 2;
  return (
    <>
      <Group
        id={`node-${obj.id}`} name="obj" objId={obj.id}
        x={obj.x} y={obj.y} rotation={obj.rotation} listening={!obj.locked}
      >
        {/* zone cliquable couvrant toute l'emprise */}
        <Rect x={-obj.width / 2} y={-obj.height / 2} width={obj.width} height={obj.height} fill="rgba(0,0,0,0)" />
        <Draw
          w={obj.width} h={obj.height} color={obj.color} def={def}
          showStabilizers={obj.showStabilizers} showManeuverZone={obj.showManeuverZone}
          count={obj.count} angle={obj.angle} variant={obj.variant}
        />
      </Group>
      {obj.label && (
        <MText x={obj.x} y={obj.y + halfH + 0.2} text={obj.label} fontSize={0.45} anchor="top-center" />
      )}
    </>
  );
}
