import { makeImage } from '../factories';
import { parsePlan, serializePlan } from './persistence';
import { useStore } from './useStore';

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const safeName = (s: string) => (s.trim() || 'plan').replace(/[\\/:*?"<>|]+/g, '-');

/** Ouvre le sélecteur de fichier du navigateur. */
export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function savePlanToFile() {
  const s = useStore.getState();
  const file = serializePlan(s.objects, s.meta, {
    gridVisible: s.gridVisible, snapEnabled: s.snapEnabled, snapStep: s.snapStep,
  });
  downloadBlob(new Blob([JSON.stringify(file)], { type: 'application/json' }), `${safeName(s.meta.title)}.json`);
}

export async function openPlanFromFile(file?: File | null) {
  const f = file ?? (await pickFile('.json,application/json'));
  if (!f) return;
  const s = useStore.getState();
  try {
    s.loadPlan(parsePlan(await f.text()));
    s.notify(`Plan « ${f.name} » ouvert.`);
  } catch (e) {
    s.notify(e instanceof Error ? e.message : "Impossible d'ouvrir ce fichier.");
  }
}

const readDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image'));
    img.src = src;
  });

/** Importe une image comme fond de plan, centrée dans la vue. */
export async function importBackgroundImage(file?: File | null) {
  const f = file ?? (await pickFile('image/*'));
  if (!f) return;
  const s = useStore.getState();
  try {
    let src = await readDataUrl(f);
    const img = await loadImage(src);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    // Les grandes images sont réduites pour rester dans le quota de sauvegarde.
    const MAX = 3000;
    if (f.size > 1.5e6 || Math.max(iw, ih) > MAX) {
      const k = Math.min(1, MAX / Math.max(iw, ih));
      const c = document.createElement('canvas');
      c.width = Math.round(iw * k);
      c.height = Math.round(ih * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      src = c.toDataURL('image/jpeg', 0.85);
    }
    const { view, viewport } = s;
    let w = (viewport.w * 0.7) / view.ppm;
    let h = (w * ih) / iw;
    const maxH = (viewport.h * 0.7) / view.ppm;
    if (h > maxH) {
      h = maxH;
      w = (h * iw) / ih;
    }
    const c = { x: (viewport.w / 2 - view.x) / view.ppm, y: (viewport.h / 2 - view.y) / view.ppm };
    s.setTool('select');
    s.addObject(makeImage(src, f.name, c, w, h));
    s.notify("Image importée. Utilisez « Calibrer l'échelle » pour la mettre à l'échelle du plan.");
  } catch {
    s.notify("Impossible de lire cette image.");
  }
}
