import { useEffect, useState } from 'react';
import { Group, Image as KImage, Rect } from 'react-konva';
import type { ImageObj } from '../../types';

const cache = new Map<string, HTMLImageElement>();

function useImage(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(cache.get(src) ?? null);
  useEffect(() => {
    const cached = cache.get(src);
    if (cached) {
      setImg(cached);
      return;
    }
    const el = new Image();
    el.onload = () => {
      cache.set(src, el);
      setImg(el);
    };
    el.src = src;
  }, [src]);
  return img;
}

/** Fond de plan : image à l'échelle, toujours dessinée sous les autres objets. */
export function ImageView({ obj }: { obj: ImageObj }) {
  const img = useImage(obj.src);
  return (
    <Group
      id={`node-${obj.id}`} name="obj" objId={obj.id}
      x={obj.x} y={obj.y} rotation={obj.rotation} listening={!obj.locked}
    >
      {img ? (
        <KImage image={img} x={-obj.width / 2} y={-obj.height / 2} width={obj.width} height={obj.height} opacity={obj.opacity} />
      ) : (
        <Rect x={-obj.width / 2} y={-obj.height / 2} width={obj.width} height={obj.height} fill="#e5e7eb" />
      )}
    </Group>
  );
}
