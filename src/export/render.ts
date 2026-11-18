import type { Bounds } from '../types';
import { drawGrid } from '../canvas/grid';
import { getWorldNode } from '../canvas/registry';
import { unionBounds } from '../geometry/math';
import { useStore } from '../store/useStore';

/** Zone visible à l'écran, en mètres. */
export function viewBounds(): Bounds {
  const { view, viewport } = useStore.getState();
  return {
    x1: -view.x / view.ppm,
    y1: -view.y / view.ppm,
    x2: (viewport.w - view.x) / view.ppm,
    y2: (viewport.h - view.y) / view.ppm,
  };
}

/** Emprise de tout le plan (avec marge), ou vue actuelle si le plan est vide. */
export function contentBounds(margin = 1): Bounds {
  const b = unionBounds(useStore.getState().objects);
  if (!b) return viewBounds();
  return { x1: b.x1 - margin, y1: b.y1 - margin, x2: b.x2 + margin, y2: b.y2 + margin };
}

interface RenderOpts {
  bounds: Bounds;
  /** Résolution de sortie en pixels par mètre. */
  pxPerM: number;
  background: 'white' | 'transparent';
  grid: boolean;
}

/**
 * Dessine la zone demandée du plan dans un canvas hors écran, à la résolution voulue,
 * indépendamment du zoom courant (le groupe Konva est redessiné avec un pixelRatio adapté).
 */
export function renderPlanCanvas({ bounds, pxPerM, background, grid }: RenderOpts): HTMLCanvasElement {
  const world = getWorldNode();
  if (!world) throw new Error('Canvas indisponible');
  const { view } = useStore.getState();
  const wM = bounds.x2 - bounds.x1;
  const hM = bounds.y2 - bounds.y1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(wM * pxPerM));
  canvas.height = Math.max(1, Math.round(hM * pxPerM));
  const ctx = canvas.getContext('2d')!;
  if (background === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (grid) {
    drawGrid(ctx, {
      width: canvas.width, height: canvas.height,
      originX: -bounds.x1 * pxPerM, originY: -bounds.y1 * pxPerM,
      ppm: pxPerM, k: Math.max(1, pxPerM / 40),
    });
  }
  const plan = world.toCanvas({
    x: bounds.x1 * view.ppm + view.x,
    y: bounds.y1 * view.ppm + view.y,
    width: wM * view.ppm,
    height: hM * view.ppm,
    pixelRatio: pxPerM / view.ppm,
  });
  ctx.drawImage(plan, 0, 0, canvas.width, canvas.height);
  return canvas;
}
