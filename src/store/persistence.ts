import type { PlanFile, PlanMeta, PlanObject, PlanSettings } from '../types';

export const FILE_VERSION = 1;
const APP_ID = 'plan-voirie';
const AUTOSAVE_KEY = 'plan-voirie:autosave';

export function serializePlan(objects: PlanObject[], meta: PlanMeta, settings: PlanSettings): PlanFile {
  return { app: APP_ID, version: FILE_VERSION, meta, settings, objects };
}

/** Lit et valide un fichier de plan. Lève une Error avec un message en français. */
export function parsePlan(text: string): PlanFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }
  const d = data as Partial<PlanFile>;
  if (!d || d.app !== APP_ID || !Array.isArray(d.objects)) {
    throw new Error("Ce fichier n'est pas un plan Plan Voirie.");
  }
  if (typeof d.version !== 'number' || d.version > FILE_VERSION) {
    throw new Error("Ce plan a été créé avec une version plus récente de l'application.");
  }
  // Point d'entrée pour les migrations futures : if (d.version < 2) { ... }
  return {
    app: APP_ID,
    version: FILE_VERSION,
    meta: { title: d.meta?.title ?? 'Plan sans titre', author: d.meta?.author ?? '' },
    settings: {
      gridVisible: d.settings?.gridVisible ?? true,
      snapEnabled: d.settings?.snapEnabled ?? true,
      snapStep: d.settings?.snapStep ?? 0.5,
    },
    objects: d.objects.filter((o) => o && typeof o.id === 'string' && typeof o.type === 'string'),
  };
}

/** Sauvegarde automatique. Renvoie false si le quota localStorage est dépassé. */
export function saveAutosave(file: PlanFile): boolean {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function loadAutosave(): PlanFile | null {
  try {
    const t = localStorage.getItem(AUTOSAVE_KEY);
    return t ? parsePlan(t) : null;
  } catch {
    return null;
  }
}
