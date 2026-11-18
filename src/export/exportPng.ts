import { drawScaleBar } from '../canvas/scaleBar';
import { downloadBlob, safeName } from '../store/files';
import { useStore } from '../store/useStore';
import { contentBounds, renderPlanCanvas, viewBounds } from './render';

const MAX_SIDE = 8000;

export async function exportPng(o: { transparent: boolean; grid: boolean; area: 'content' | 'view' }) {
  const { view, meta } = useStore.getState();
  const bounds = o.area === 'view' ? viewBounds() : contentBounds();
  const wM = bounds.x2 - bounds.x1;
  const hM = bounds.y2 - bounds.y1;
  // Résolution ×2 par rapport à l'écran, plafonnée pour les très grands plans
  const pxPerM = Math.min(view.ppm * 2, MAX_SIDE / Math.max(wM, hM));
  const canvas = renderPlanCanvas({
    bounds, pxPerM, background: o.transparent ? 'transparent' : 'white', grid: o.grid,
  });
  const k = Math.max(1, Math.min(2, canvas.width / 700));
  drawScaleBar(canvas.getContext('2d')!, 20 * k, canvas.height - 14 * k, pxPerM, k);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG');
  downloadBlob(blob, `${safeName(meta.title)}.png`);
}
