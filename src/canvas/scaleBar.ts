import { fmtShort } from '../geometry/math';

/** Plus grande longueur « ronde » (1, 2, 5 × 10ⁿ m) tenant dans maxLen unités. */
export function niceLength(unitsPerMeter: number, maxLen: number) {
  let best = 0.01;
  for (let e = -2; e <= 4; e++) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e;
      if (v * unitsPerMeter <= maxLen) best = v;
    }
  }
  return best;
}

/**
 * Barre d'échelle graphique. (x, y) = coin bas-gauche de la barre, en px.
 * k = multiplicateur de taille (exports haute résolution).
 */
export function drawScaleBar(ctx: CanvasRenderingContext2D, x: number, y: number, ppm: number, k = 1) {
  const meters = niceLength(ppm, 150 * k);
  const len = meters * ppm;
  const h = 6 * k;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(x - 10 * k, y - h - 22 * k, len + 20 * k + 26 * k, h + 30 * k);
  const seg = len / 4;
  ctx.lineWidth = 1 * k;
  ctx.strokeStyle = '#111827';
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#111827' : '#ffffff';
    ctx.fillRect(x + i * seg, y - h, seg, h);
    ctx.strokeRect(x + i * seg, y - h, seg, h);
  }
  ctx.fillStyle = '#111827';
  ctx.font = `${11 * k}px Arial`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillText('0', x, y - h - 5 * k);
  ctx.fillText(fmtShort(meters / 2), x + len / 2, y - h - 5 * k);
  ctx.fillText(`${fmtShort(meters)} m`, x + len, y - h - 5 * k);
  ctx.restore();
}
