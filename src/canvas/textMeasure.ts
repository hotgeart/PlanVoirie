export const FONT = 'Arial';
export const LINE_H = 1.2;

let ctx: CanvasRenderingContext2D | null = null;

/** Mesure un texte (éventuellement multi-lignes) ; résultat en mètres. */
export function measureText(text: string, fontSize: number, bold: boolean) {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  const lines = text.split('\n');
  let w = 0;
  if (ctx) {
    ctx.font = `${bold ? 'bold' : 'normal'} 100px ${FONT}`;
    for (const l of lines) w = Math.max(w, ctx.measureText(l).width);
  }
  return { width: (w / 100) * fontSize, height: lines.length * fontSize * LINE_H };
}
