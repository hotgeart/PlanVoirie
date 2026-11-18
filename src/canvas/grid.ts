const STEPS = [1, 5, 10, 50, 100, 500, 1000, 5000];

interface GridOpts {
  width: number;
  height: number;
  /** Position (px) de l'origine du plan. */
  originX: number;
  originY: number;
  ppm: number;
  /** Multiplicateur d'épaisseur (exports haute résolution). */
  k?: number;
}

/**
 * Grille métrique : lignes tous les 1 m, plus marquées tous les 5 m.
 * Quand le zoom est trop faible, le pas passe à 5/10 m, 10/50 m, etc.
 * Utilisée à l'écran et dans les exports.
 */
export function drawGrid(ctx: CanvasRenderingContext2D, o: GridOpts) {
  const k = o.k ?? 1;
  let i = 0;
  while (i < STEPS.length - 2 && STEPS[i] * o.ppm < 7 * k) i++;
  const minor = STEPS[i];
  const major = STEPS[i + 1];

  const pass = (step: number, color: string, lw: number, skip?: number) => {
    ctx.beginPath();
    const x0 = Math.floor(-o.originX / o.ppm / step) * step;
    for (let x = x0; x * o.ppm + o.originX <= o.width; x += step) {
      if (skip && Math.abs(x / skip - Math.round(x / skip)) < 1e-9) continue;
      const px = Math.round(x * o.ppm + o.originX) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, o.height);
    }
    const y0 = Math.floor(-o.originY / o.ppm / step) * step;
    for (let y = y0; y * o.ppm + o.originY <= o.height; y += step) {
      if (skip && Math.abs(y / skip - Math.round(y / skip)) < 1e-9) continue;
      const py = Math.round(y * o.ppm + o.originY) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(o.width, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lw * k;
    ctx.stroke();
  };

  ctx.save();
  pass(minor, '#e6e9ee', 1, major);
  pass(major, '#c3c9d3', 1);
  ctx.restore();
}
