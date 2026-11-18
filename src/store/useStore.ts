import { create } from 'zustand';
import type { PlanFile, PlanMeta, PlanObject, Pt, Tool, View } from '../types';
import { DEFAULT_PPM, MAX_PPM, MIN_PPM } from '../constants';
import { newId } from '../factories';
import {
  boundsContain, clamp, dist, fmt, getBounds, rotateObj, translateObj, unionBounds,
} from '../geometry/math';
import { loadAutosave, saveAutosave, serializePlan } from './persistence';

interface Snapshot {
  objects: PlanObject[];
  meta: PlanMeta;
}

export interface MenuState {
  x: number;
  y: number;
  /** Objet verrouillé sous le curseur (pour proposer « Déverrouiller »). */
  lockedId?: string;
}

export type ReorderMode = 'front' | 'back' | 'forward' | 'backward';
type Patch = Record<string, unknown> | ((o: PlanObject) => PlanObject);

interface State {
  objects: PlanObject[];
  meta: PlanMeta;
  selection: string[];
  tool: Tool;
  view: View;
  viewport: { w: number; h: number };
  gridVisible: boolean;
  snapEnabled: boolean;
  snapStep: number;
  libraryOpen: boolean;

  past: Snapshot[];
  future: Snapshot[];
  historyKey: string | null;
  historyTime: number;

  clipboard: PlanObject[];
  pasteCount: number;

  /** Déplacement en cours (m), appliqué au rendu des objets sélectionnés. */
  drag: { dx: number; dy: number } | null;
  editingTextId: string | null;
  cursor: Pt | null;
  menu: MenuState | null;
  exportMode: 'png' | 'pdf' | null;
  calibration: { a: Pt; b: Pt } | null;
  toast: string | null;

  set: (p: Partial<State>) => void;
  setTool: (t: Tool) => void;
  setView: (v: View) => void;
  zoomAt: (sx: number, sy: number, factor: number) => void;
  fitView: () => void;
  select: (ids: string[]) => void;
  expandGroups: (ids: string[]) => string[];
  notify: (msg: string) => void;

  pushHistory: (key?: string) => void;
  undo: () => void;
  redo: () => void;

  addObject: (o: PlanObject) => void;
  updateObjects: (ids: string[], patch: Patch, key?: string) => void;
  /** Modifie sans créer d'entrée d'historique (appeler pushHistory avant). */
  mutateObjects: (fn: (o: PlanObject) => PlanObject) => void;
  setMeta: (p: Partial<PlanMeta>) => void;

  deleteSelection: () => void;
  duplicateSelection: () => void;
  copy: () => void;
  paste: () => void;
  selectAll: () => void;
  translateSelection: (dx: number, dy: number, key?: string) => void;
  rotateSelection: (deg: number) => void;
  reorder: (mode: ReorderMode) => void;
  setLocked: (ids: string[], locked: boolean) => void;
  group: () => void;
  ungroup: () => void;

  newPlan: () => void;
  loadPlan: (file: PlanFile) => void;
  applyCalibration: (realDistance: number) => void;
}

const MAX_HISTORY = 100;
const saved = loadAutosave();
let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** Clone des objets avec de nouveaux identifiants (et groupes), décalés de (dx, dy). */
function cloneObjects(objs: PlanObject[], dx: number, dy: number): PlanObject[] {
  const groups = new Map<string, string>();
  return objs.map((o) => {
    const c = translateObj(o, dx, dy);
    c.id = newId();
    if (o.groupId) {
      if (!groups.has(o.groupId)) groups.set(o.groupId, newId());
      c.groupId = groups.get(o.groupId);
    }
    return c;
  });
}

export const useStore = create<State>()((set, get) => ({
  objects: saved?.objects ?? [],
  meta: saved?.meta ?? { title: 'Plan sans titre', author: '' },
  selection: [],
  tool: 'select',
  view: { x: 200, y: 150, ppm: DEFAULT_PPM },
  viewport: { w: 0, h: 0 },
  gridVisible: saved?.settings.gridVisible ?? true,
  snapEnabled: saved?.settings.snapEnabled ?? true,
  snapStep: saved?.settings.snapStep ?? 0.5,
  libraryOpen: true,

  past: [],
  future: [],
  historyKey: null,
  historyTime: 0,

  clipboard: [],
  pasteCount: 0,

  drag: null,
  editingTextId: null,
  cursor: null,
  menu: null,
  exportMode: null,
  calibration: null,
  toast: null,

  set: (p) => set(p),

  setTool: (tool) => set({ tool, menu: null, ...(tool !== 'select' ? { selection: [] } : {}) }),

  setView: (view) => set({ view }),

  zoomAt: (sx, sy, factor) => {
    const { view } = get();
    const ppm = clamp(view.ppm * factor, MIN_PPM, MAX_PPM);
    const k = ppm / view.ppm;
    set({ view: { ppm, x: sx - (sx - view.x) * k, y: sy - (sy - view.y) * k } });
  },

  fitView: () => {
    const { viewport, objects } = get();
    const b = unionBounds(objects);
    if (!b || !viewport.w) {
      set({ view: { x: viewport.w / 2, y: viewport.h / 2, ppm: DEFAULT_PPM } });
      return;
    }
    const w = Math.max(1, b.x2 - b.x1);
    const h = Math.max(1, b.y2 - b.y1);
    const ppm = clamp(Math.min((viewport.w - 100) / w, (viewport.h - 100) / h), MIN_PPM, 80);
    set({
      view: {
        ppm,
        x: viewport.w / 2 - ((b.x1 + b.x2) / 2) * ppm,
        y: viewport.h / 2 - ((b.y1 + b.y2) / 2) * ppm,
      },
    });
  },

  select: (ids) => set({ selection: ids }),

  expandGroups: (ids) => {
    const { objects } = get();
    const gids = new Set(
      objects.filter((o) => ids.includes(o.id) && o.groupId).map((o) => o.groupId as string),
    );
    if (!gids.size) return ids;
    const out = new Set(ids);
    for (const o of objects) if (o.groupId && gids.has(o.groupId) && !o.locked) out.add(o.id);
    return [...out];
  },

  notify: (msg) => {
    clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 4500);
  },

  // ---------- Historique ----------

  pushHistory: (key) => {
    const s = get();
    const now = Date.now();
    // Les modifications continues (saisie, curseur) portant la même clé sont fusionnées.
    if (key && s.historyKey === key && now - s.historyTime < 1000) {
      set({ historyTime: now });
      return;
    }
    set({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), { objects: s.objects, meta: s.meta }],
      future: [],
      historyKey: key ?? null,
      historyTime: now,
    });
  },

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    const ids = new Set(prev.objects.map((o) => o.id));
    set({
      past: s.past.slice(0, -1),
      future: [{ objects: s.objects, meta: s.meta }, ...s.future],
      objects: prev.objects,
      meta: prev.meta,
      selection: s.selection.filter((id) => ids.has(id)),
      historyKey: null,
      editingTextId: null,
    });
  },

  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    const ids = new Set(next.objects.map((o) => o.id));
    set({
      past: [...s.past, { objects: s.objects, meta: s.meta }],
      future: s.future.slice(1),
      objects: next.objects,
      meta: next.meta,
      selection: s.selection.filter((id) => ids.has(id)),
      historyKey: null,
      editingTextId: null,
    });
  },

  // ---------- Objets ----------

  addObject: (o) => {
    get().pushHistory();
    set((s) => ({ objects: [...s.objects, o], selection: [o.id] }));
  },

  updateObjects: (ids, patch, key) => {
    if (!ids.length) return;
    get().pushHistory(key);
    const idSet = new Set(ids);
    set((s) => ({
      objects: s.objects.map((o) => {
        if (!idSet.has(o.id)) return o;
        return typeof patch === 'function' ? patch(o) : ({ ...o, ...patch } as PlanObject);
      }),
    }));
  },

  mutateObjects: (fn) => set((s) => ({ objects: s.objects.map(fn) })),

  setMeta: (p) => {
    get().pushHistory('meta');
    set((s) => ({ meta: { ...s.meta, ...p } }));
  },

  deleteSelection: () => {
    const { selection } = get();
    if (!selection.length) return;
    get().pushHistory();
    const sel = new Set(selection);
    set((s) => ({ objects: s.objects.filter((o) => !sel.has(o.id)), selection: [] }));
  },

  duplicateSelection: () => {
    const { selection, objects } = get();
    const src = objects.filter((o) => selection.includes(o.id));
    if (!src.length) return;
    get().pushHistory();
    const clones = cloneObjects(src, 1, 1);
    set((s) => ({ objects: [...s.objects, ...clones], selection: clones.map((c) => c.id) }));
  },

  copy: () => {
    const { selection, objects } = get();
    const src = objects.filter((o) => selection.includes(o.id));
    if (src.length) set({ clipboard: src, pasteCount: 0 });
  },

  paste: () => {
    const { clipboard, pasteCount } = get();
    if (!clipboard.length) return;
    get().pushHistory();
    const n = pasteCount + 1;
    const clones = cloneObjects(clipboard, n, n);
    set((s) => ({
      objects: [...s.objects, ...clones],
      selection: clones.map((c) => c.id),
      pasteCount: n,
      tool: 'select',
    }));
  },

  selectAll: () =>
    set((s) => ({ selection: s.objects.filter((o) => !o.locked).map((o) => o.id), tool: 'select' })),

  translateSelection: (dx, dy, key) => {
    const { selection } = get();
    if (!selection.length || (!dx && !dy)) return;
    get().pushHistory(key);
    const sel = new Set(selection);
    set((s) => ({
      objects: s.objects.map((o) => (sel.has(o.id) && !o.locked ? translateObj(o, dx, dy) : o)),
    }));
  },

  rotateSelection: (deg) => {
    const { selection, objects } = get();
    const src = objects.filter((o) => selection.includes(o.id) && !o.locked);
    if (!src.length) return;
    let c: Pt;
    if (src.length === 1 && 'rotation' in src[0] && src[0].type !== 'text') {
      c = { x: src[0].x, y: src[0].y };
    } else {
      const b = unionBounds(src)!;
      c = { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 };
    }
    get().pushHistory();
    const ids = new Set(src.map((o) => o.id));
    set((s) => ({ objects: s.objects.map((o) => (ids.has(o.id) ? rotateObj(o, c, deg) : o)) }));
  },

  reorder: (mode) => {
    const { selection, objects } = get();
    if (!selection.length) return;
    const sel = new Set(selection);
    let arr = [...objects];
    if (mode === 'front') {
      arr = [...arr.filter((o) => !sel.has(o.id)), ...arr.filter((o) => sel.has(o.id))];
    } else if (mode === 'back') {
      arr = [...arr.filter((o) => sel.has(o.id)), ...arr.filter((o) => !sel.has(o.id))];
    } else if (mode === 'forward') {
      for (let i = arr.length - 2; i >= 0; i--) {
        if (sel.has(arr[i].id) && !sel.has(arr[i + 1].id)) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      }
    } else {
      for (let i = 1; i < arr.length; i++) {
        if (sel.has(arr[i].id) && !sel.has(arr[i - 1].id)) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      }
    }
    get().pushHistory();
    set({ objects: arr });
  },

  setLocked: (ids, locked) => {
    if (!ids.length) return;
    get().pushHistory();
    const idSet = new Set(ids);
    set((s) => ({
      objects: s.objects.map((o) => (idSet.has(o.id) ? { ...o, locked } : o)),
      selection: locked ? s.selection.filter((id) => !idSet.has(id)) : s.selection,
    }));
  },

  group: () => {
    const { selection } = get();
    if (selection.length < 2) return;
    get().pushHistory();
    const gid = newId();
    const sel = new Set(selection);
    set((s) => ({ objects: s.objects.map((o) => (sel.has(o.id) ? { ...o, groupId: gid } : o)) }));
  },

  ungroup: () => {
    const { selection } = get();
    if (!selection.length) return;
    get().pushHistory();
    const sel = new Set(selection);
    set((s) => ({
      objects: s.objects.map((o) => {
        if (!sel.has(o.id) || !o.groupId) return o;
        const { groupId: _g, ...rest } = o;
        return rest as PlanObject;
      }),
    }));
  },

  // ---------- Document ----------

  newPlan: () => {
    get().pushHistory();
    set({ objects: [], meta: { title: 'Plan sans titre', author: get().meta.author }, selection: [] });
    get().fitView();
    get().notify('Nouveau plan créé (Ctrl+Z pour revenir au précédent).');
  },

  loadPlan: (file) => {
    get().pushHistory();
    set({
      objects: file.objects,
      meta: file.meta,
      gridVisible: file.settings.gridVisible,
      snapEnabled: file.settings.snapEnabled,
      snapStep: file.settings.snapStep,
      selection: [],
      tool: 'select',
    });
    get().fitView();
  },

  applyCalibration: (real) => {
    const { calibration, objects, selection } = get();
    if (!calibration) return;
    const { a, b } = calibration;
    const measured = dist(a, b);
    const images = objects.filter((o) => o.type === 'image');
    const target =
      images.find((o) => selection.includes(o.id)) ??
      [...images].reverse().find((o) => boundsContain(getBounds(o), a)) ??
      images[images.length - 1];
    set({ calibration: null, tool: 'select' });
    if (!target || target.type !== 'image' || measured <= 0 || !(real > 0)) {
      get().notify('Aucune image de fond à calibrer.');
      return;
    }
    const k = real / measured;
    get().pushHistory();
    set((s) => ({
      objects: s.objects.map((o) =>
        o.id === target.id && o.type === 'image'
          ? {
              ...o,
              // Mise à l'échelle autour du premier point cliqué, qui reste en place.
              x: a.x + (o.x - a.x) * k,
              y: a.y + (o.y - a.y) * k,
              width: o.width * k,
              height: o.height * k,
              locked: true,
            }
          : o,
      ),
      selection: [],
    }));
    get().notify(`Image mise à l'échelle (×${fmt(k, 3)}) et verrouillée.`);
  },
}));

// ---------- Sauvegarde automatique (localStorage) ----------

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let quotaWarned = false;

useStore.subscribe((s, prev) => {
  if (
    s.objects === prev.objects && s.meta === prev.meta && s.gridVisible === prev.gridVisible &&
    s.snapEnabled === prev.snapEnabled && s.snapStep === prev.snapStep
  ) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const st = useStore.getState();
    const ok = saveAutosave(
      serializePlan(st.objects, st.meta, {
        gridVisible: st.gridVisible, snapEnabled: st.snapEnabled, snapStep: st.snapStep,
      }),
    );
    if (!ok && !quotaWarned) {
      quotaWarned = true;
      st.notify('Sauvegarde automatique impossible (plan trop volumineux) : enregistrez en .json.');
    }
    if (ok) quotaWarned = false;
  }, 600);
});
