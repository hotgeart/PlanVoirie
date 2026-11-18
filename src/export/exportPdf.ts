import { jsPDF } from 'jspdf';
import { niceLength } from '../canvas/scaleBar';
import { fmtShort } from '../geometry/math';
import { safeName } from '../store/files';
import { contentBounds, renderPlanCanvas, viewBounds } from './render';

export interface PdfOptions {
  format: 'a4' | 'a3';
  orientation: 'portrait' | 'landscape';
  /** Dénominateur de l'échelle (200 pour 1:200) ou 'auto'. */
  scale: 'auto' | number;
  grid: boolean;
  area: 'content' | 'view';
  title: string;
  author: string;
  date: string;
}

const PAGE = { a4: [210, 297], a3: [297, 420] } as const;
const STANDARD_SCALES = [20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 2000, 2500, 5000, 10000];
const MARGIN = 10; // mm
const DPI = 200;

/**
 * Export PDF : plan à l'échelle (image 200 dpi) dans un cadre, avec cartouche
 * (titre, auteur, date, échelle) et barre d'échelle dessinés en vectoriel.
 */
export async function exportPdf(o: PdfOptions) {
  const [pw, ph] = o.orientation === 'landscape' ? [PAGE[o.format][1], PAGE[o.format][0]] : PAGE[o.format];
  const fw = pw - MARGIN * 2; // cadre (mm)
  const fh = ph - MARGIN * 2;
  const cartW = Math.min(125, fw * 0.55);
  const cartH = 30;

  const src = o.area === 'view' ? viewBounds() : contentBounds();
  const cw = src.x2 - src.x1;
  const ch = src.y2 - src.y1;
  // Zone utile : le cadre moins la hauteur du cartouche, pour que le plan ne passe pas dessous
  const usableW = fw - 8;
  const usableH = fh - cartH - 8;
  const den =
    o.scale === 'auto'
      ? STANDARD_SCALES.find((d) => (cw * 1000) / d <= usableW && (ch * 1000) / d <= usableH) ??
        Math.ceil(Math.max((cw * 1000) / usableW, (ch * 1000) / usableH) / 1000) * 1000
      : o.scale;
  const mmPerM = 1000 / den;

  // Emprise réelle du cadre, centrée sur le contenu (décalée vers le haut au-dessus du cartouche)
  const cx = (src.x1 + src.x2) / 2;
  const cy = (src.y1 + src.y2) / 2;
  const x1 = cx - fw / 2 / mmPerM;
  const y1 = cy - (fh - cartH) / 2 / mmPerM;
  const bounds = { x1, y1, x2: x1 + fw / mmPerM, y2: y1 + fh / mmPerM };

  const pxPerMm = DPI / 25.4;
  const canvas = renderPlanCanvas({ bounds, pxPerM: pxPerMm * mmPerM, background: 'white', grid: o.grid });

  const pdf = new jsPDF({ orientation: o.orientation, unit: 'mm', format: o.format });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, MARGIN, fw, fh);

  // Cadre
  pdf.setDrawColor(20);
  pdf.setLineWidth(0.5);
  pdf.rect(MARGIN, MARGIN, fw, fh);

  // Barre d'échelle (bas-gauche)
  const meters = niceLength(mmPerM, 60);
  const len = meters * mmPerM;
  const bx = MARGIN + 7;
  const by = MARGIN + fh - 7;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(bx - 4, by - 7, len + 16, 11, 'F');
  pdf.setLineWidth(0.15);
  for (let i = 0; i < 4; i++) {
    const c = i % 2 === 0 ? 20 : 255;
    pdf.setFillColor(c, c, c);
    pdf.rect(bx + (i * len) / 4, by - 1.6, len / 4, 1.6, 'FD');
  }
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(20);
  pdf.text('0', bx, by - 2.8, { align: 'center' });
  pdf.text(fmtShort(meters / 2), bx + len / 2, by - 2.8, { align: 'center' });
  pdf.text(`${fmtShort(meters)} m`, bx + len, by - 2.8, { align: 'center' });

  // Cartouche (bas-droite)
  const kx = MARGIN + fw - cartW;
  const ky = MARGIN + fh - cartH;
  pdf.setFillColor(255, 255, 255);
  pdf.setLineWidth(0.35);
  pdf.rect(kx, ky, cartW, cartH, 'FD');
  pdf.setLineWidth(0.2);
  pdf.line(kx, ky + 14, kx + cartW, ky + 14);
  pdf.line(kx, ky + 22, kx + cartW, ky + 22);
  pdf.line(kx + cartW / 2, ky + 14, kx + cartW / 2, ky + cartH);

  const cell = (label: string, value: string, x: number, y: number, w: number, big = false) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(110);
    pdf.text(label.toUpperCase(), x + 2, y + 3.2);
    pdf.setFont('helvetica', big ? 'bold' : 'normal');
    pdf.setFontSize(big ? 13 : 9);
    pdf.setTextColor(20);
    const lines = pdf.splitTextToSize(value || '—', w - 4) as string[];
    pdf.text(lines[0], x + 2, y + (big ? 10.5 : 6.8));
  };
  const orient = o.orientation === 'landscape' ? 'paysage' : 'portrait';
  cell('Titre', o.title, kx, ky, cartW, true);
  cell('Auteur', o.author, kx, ky + 14, cartW / 2);
  cell('Date', o.date, kx + cartW / 2, ky + 14, cartW / 2);
  cell('Échelle', `1:${den}`, kx, ky + 22, cartW / 2);
  cell('Format', `${o.format.toUpperCase()} ${orient}`, kx + cartW / 2, ky + 22, cartW / 2);

  pdf.save(`${safeName(o.title)}.pdf`);
}
