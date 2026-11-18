import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Rect, Shape, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Bounds, PlanObject, Pt, RoadObj } from '../types';
import { COLORS } from '../constants';
import { useStore } from '../store/useStore';
import { importBackgroundImage, openPlanFromFile } from '../store/files';
import {
  boundsContain, boundsIntersect, constrainAngle, dist, getBounds, isBoxLike, isTransformable,
  nearestSegment, normAngle, refPoint, snapPt, translateObj,
} from '../geometry/math';
import { applyHandle, insertVertex, removeVertex, type HandleKind } from '../geometry/handles';
import {
  makeArrow, makeDimension, makeEllipse, makeLine, makePolygon, makeRect, makeRoad, makeSymbol, makeText,
} from '../factories';
import { getSymbolDef } from '../library/catalog';
import { drawGrid } from './grid';
import { drawScaleBar } from './scaleBar';
import { setWorldNode } from './registry';
import { ObjectView } from './objects/ObjectView';
import { RoadsView } from './objects/RoadView';
import { calibrationPreview, DraftPreview, type Draft } from './Drafts';
import { Handles, SelectionOutline } from './Handles';
import { TextEditor } from '../ui/TextEditor';

type Gesture =
  | { kind: 'pan'; cx: number; cy: number; vx: number; vy: number }
  | { kind: 'move'; start: Pt; ref: Pt; sx: number; sy: number; moved: boolean }
  | { kind: 'marquee'; start: Pt; base: string[] }
  | { kind: 'handle'; objId: string; hkind: HandleKind; index: number };

const ROTATION_SNAPS = Array.from({ length: 24 }, (_, i) => i * 15);
const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

/** Remonte l'arbre Konva jusqu'au nœud d'un objet du plan. */
function findObjId(node: Konva.Node | null): string | null {
  let n: Konva.Node | null = node;
  while (n) {
    if (n.hasName('obj')) return n.getAttr('objId') as string;
    n = n.getParent();
  }
  return null;
}

function inTransformer(node: Konva.Node | null) {
  let n: Konva.Node | null = node;
  while (n) {
    if (n.getClassName() === 'Transformer') return true;
    n = n.getParent();
  }
  return false;
}

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const worldRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const gesture = useRef<Gesture | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const fitted = useRef(false);
  /** Positions écran des deux derniers appuis (pour valider un vrai double-clic). */
  const downs = useRef<{ x: number; y: number }[]>([]);

  const [draft, setDraftState] = useState<Draft | null>(null);
  const [marquee, setMarquee] = useState<Bounds | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);
  const [panning, setPanning] = useState(false);

  const objects = useStore((s) => s.objects);
  const selection = useStore((s) => s.selection);
  const tool = useStore((s) => s.tool);
  const view = useStore((s) => s.view);
  const viewport = useStore((s) => s.viewport);
  const gridVisible = useStore((s) => s.gridVisible);
  const drag = useStore((s) => s.drag);
  const editingTextId = useStore((s) => s.editingTextId);
  const calibration = useStore((s) => s.calibration);

  const setDraft = (d: Draft | null) => {
    draftRef.current = d;
    setDraftState(d);
  };

  // ---------- Taille du canvas ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      useStore.getState().set({ viewport: { w: el.clientWidth, h: el.clientHeight } });
      if (!fitted.current && el.clientWidth > 0) {
        fitted.current = true;
        useStore.getState().fitView();
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setWorldNode(worldRef.current);
    return () => setWorldNode(null);
  }, []);

  // Changer d'outil annule le tracé en cours
  useEffect(() => setDraft(null), [tool]);

  // ---------- Objets affichés (déplacement en cours appliqué) ----------
  const selSet = useMemo(() => new Set(selection), [selection]);
  const display = useMemo(
    () => (drag ? objects.map((o) => (selSet.has(o.id) ? translateObj(o, drag.dx, drag.dy) : o)) : objects),
    [objects, drag, selSet],
  );
  const layers = useMemo(() => {
    const images = display.filter((o) => o.type === 'image');
    const rest = display.filter((o) => o.type !== 'image');
    const firstRoad = rest.findIndex((o) => o.type === 'road');
    return {
      images,
      // Les objets placés sous la première route (ordre d'empilement) passent sous les routes
      below: firstRoad < 0 ? [] : rest.slice(0, firstRoad),
      roads: rest.filter((o): o is RoadObj => o.type === 'road'),
      above: (firstRoad < 0 ? rest : rest.slice(firstRoad)).filter((o) => o.type !== 'road'),
    };
  }, [display]);

  const selected = useMemo(() => display.filter((o) => selSet.has(o.id)), [display, selSet]);
  const useTransformer =
    tool === 'select' && !editingTextId && selected.length > 0 && selected.every(isTransformable);
  const single = selected.length === 1 ? selected[0] : null;
  const keepRatio =
    !!single &&
    (single.type === 'text' || single.type === 'image' ||
      (single.type === 'symbol' && !!getSymbolDef(single.symbolId).round));

  // ---------- Transformer ----------
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = useTransformer
      ? (selected.map((o) => stage.findOne(`#node-${o.id}`)).filter(Boolean) as Konva.Node[])
      : [];
    tr.nodes(nodes);
    tr.forceUpdate();
    tr.getLayer()?.batchDraw();
  });

  const onTransformEnd = () => {
    const tr = trRef.current;
    if (!tr) return;
    const st = useStore.getState();
    const patches = new Map<string, (o: PlanObject) => PlanObject>();
    for (const node of tr.nodes()) {
      const id = node.getAttr('objId') as string;
      const sx = Math.abs(node.scaleX());
      const sy = Math.abs(node.scaleY());
      const x = node.x();
      const y = node.y();
      const rotation = normAngle(node.rotation());
      node.scaleX(1);
      node.scaleY(1);
      patches.set(id, (o) => {
        if (o.type === 'text') return { ...o, x, y, rotation, fontSize: Math.max(0.05, o.fontSize * sy) };
        if (isBoxLike(o)) {
          return { ...o, x, y, rotation, width: Math.max(0.05, o.width * sx), height: Math.max(0.05, o.height * sy) };
        }
        return o;
      });
    }
    st.pushHistory();
    st.mutateObjects((o) => patches.get(o.id)?.(o) ?? o);
  };

  // ---------- Coordonnées ----------
  const pointerWorld = (snap: boolean, evt?: MouseEvent): Pt | null => {
    const p = stageRef.current?.getPointerPosition();
    if (!p) return null;
    const s = useStore.getState();
    const w = { x: (p.x - s.view.x) / s.view.ppm, y: (p.y - s.view.y) / s.view.ppm };
    return snap && s.snapEnabled && !evt?.altKey ? snapPt(w, s.snapStep) : w;
  };

  /** Position du curseur pour le tracé : magnétisme + contrainte d'angle avec Maj. */
  const drawPoint = (evt: MouseEvent, from?: Pt): Pt | null => {
    const w = pointerWorld(true, evt);
    if (!w) return null;
    return evt.shiftKey && from ? constrainAngle(from, w) : w;
  };

  // ---------- Fin de tracé ----------
  const finishTwo = (d: Extract<Draft, { kind: 'two' }>, end: Pt) => {
    const a = d.start;
    const st = useStore.getState();
    if (dist(a, end) < 0.05) return;
    if (d.tool === 'calibrate') {
      setDraft(null);
      st.set({ calibration: { a, b: end } });
      return;
    }
    if ((d.tool === 'rect' || d.tool === 'ellipse') && (Math.abs(end.x - a.x) < 0.05 || Math.abs(end.y - a.y) < 0.05)) return;
    const obj =
      d.tool === 'rect' ? makeRect(a, end)
      : d.tool === 'ellipse' ? makeEllipse(a, end)
      : d.tool === 'line' ? makeLine(a, end)
      : d.tool === 'arrow' ? makeArrow(a, end)
      : makeDimension(a, end);
    setDraft(null);
    st.setTool('select');
    st.addObject(obj);
  };

  const finishMulti = () => {
    const d = draftRef.current;
    if (!d || d.kind !== 'multi') return;
    const st = useStore.getState();
    const min = d.tool === 'road' ? 2 : 3;
    setDraft(null);
    if (d.points.length < min) return;
    st.setTool('select');
    st.addObject(d.tool === 'road' ? makeRoad(d.points) : makePolygon(d.points));
  };

  // ---------- Fin de geste (aussi appelée si la souris est relâchée hors du canvas) ----------
  const endGesture = () => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    const st = useStore.getState();
    if (g.kind === 'pan') setPanning(false);
    if (g.kind === 'move') {
      const d = st.drag;
      st.set({ drag: null });
      if (g.moved && d) st.translateSelection(d.dx, d.dy);
    }
    if (g.kind === 'marquee') setMarquee(null);
  };

  useEffect(() => {
    // Différé : le gestionnaire du canvas (sélection par rectangle…) passe d'abord
    const up = () => setTimeout(endGesture, 0);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ---------- Souris ----------
  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const evt = e.evt;
    const st = useStore.getState();
    const stage = stageRef.current;
    const p = stage?.getPointerPosition();
    if (!stage || !p) return;
    downs.current = [...downs.current.slice(-1), { x: p.x, y: p.y }];
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (st.menu) st.set({ menu: null });

    if (evt.button === 1 || (evt.button === 0 && spaceDown)) {
      evt.preventDefault();
      gesture.current = { kind: 'pan', cx: evt.clientX, cy: evt.clientY, vx: st.view.x, vy: st.view.y };
      setPanning(true);
      return;
    }
    if (evt.button !== 0) return;

    if (st.tool === 'select') {
      if (inTransformer(e.target)) return;
      if (e.target.hasName('handle')) {
        const objId = (e.target as Konva.Node).getAttr('objId') as string;
        let hkind = (e.target as Konva.Node).getAttr('hkind') as HandleKind;
        let index = (e.target as Konva.Node).getAttr('hindex') as number;
        st.pushHistory();
        if (hkind === 'mid') {
          // Clic sur un segment : insertion d'un sommet, qu'on peut déplacer dans la foulée
          const w = pointerWorld(true, evt)!;
          st.mutateObjects((o) => (o.id === objId ? insertVertex(o, index, w) : o));
          hkind = 'vertex';
          index += 1;
        }
        gesture.current = { kind: 'handle', objId, hkind, index };
        return;
      }
      const id = findObjId(e.target);
      const w = pointerWorld(false)!;
      if (id) {
        const ids = st.expandGroups([id]);
        if (evt.shiftKey) {
          const has = st.selection.includes(id);
          st.select(has ? st.selection.filter((s) => !ids.includes(s)) : [...new Set([...st.selection, ...ids])]);
          return;
        }
        if (!st.selection.includes(id)) st.select(ids);
        const obj = st.objects.find((o) => o.id === id)!;
        gesture.current = { kind: 'move', start: w, ref: refPoint(obj), sx: p.x, sy: p.y, moved: false };
      } else {
        if (!evt.shiftKey) st.select([]);
        gesture.current = { kind: 'marquee', start: w, base: evt.shiftKey ? st.selection : [] };
      }
      return;
    }

    if (st.tool === 'text') return; // créé au relâchement (voir onMouseUp)

    const d = draftRef.current;
    if (st.tool === 'road' || st.tool === 'polygon') {
      const last = d?.kind === 'multi' ? d.points[d.points.length - 1] : undefined;
      const w = drawPoint(evt, last);
      if (!w) return;
      if (d?.kind === 'multi') {
        // Ignore le doublon créé par le second clic d'un double-clic
        if (last && dist(last, w) * st.view.ppm < 4) return;
        setDraft({ ...d, points: [...d.points, w], cursor: w });
      } else {
        setDraft({ kind: 'multi', tool: st.tool, points: [w], cursor: w });
      }
      return;
    }

    // Outils à deux points
    if (d?.kind === 'two') {
      const w = drawPoint(evt, d.start);
      if (w) finishTwo(d, w);
    } else {
      const w = drawPoint(evt);
      if (w) setDraft({ kind: 'two', tool: st.tool as Extract<Draft, { kind: 'two' }>['tool'], start: w, cursor: w, sx: p.x, sy: p.y });
    }
  };

  const onMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const evt = e.evt;
    const st = useStore.getState();
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;
    const raw = pointerWorld(false)!;
    st.set({ cursor: raw });

    const g = gesture.current;
    if (g?.kind === 'pan') {
      st.setView({ ...st.view, x: g.vx + evt.clientX - g.cx, y: g.vy + evt.clientY - g.cy });
      return;
    }
    if (g?.kind === 'move') {
      if (!g.moved && Math.hypot(p.x - g.sx, p.y - g.sy) < 4) return;
      g.moved = true;
      let dx = raw.x - g.start.x;
      let dy = raw.y - g.start.y;
      if (evt.shiftKey) {
        // Maj : déplacement contraint à l'horizontale ou à la verticale
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      if (st.snapEnabled && !evt.altKey) {
        const t = snapPt({ x: g.ref.x + dx, y: g.ref.y + dy }, st.snapStep);
        if (dx !== 0 || !evt.shiftKey) dx = t.x - g.ref.x;
        if (dy !== 0 || !evt.shiftKey) dy = t.y - g.ref.y;
      }
      st.set({ drag: { dx, dy } });
      return;
    }
    if (g?.kind === 'marquee') {
      setMarquee({
        x1: Math.min(g.start.x, raw.x), y1: Math.min(g.start.y, raw.y),
        x2: Math.max(g.start.x, raw.x), y2: Math.max(g.start.y, raw.y),
      });
      return;
    }
    if (g?.kind === 'handle') {
      const w = pointerWorld(g.hkind !== 'offset', evt)!;
      st.mutateObjects((o) => (o.id === g.objId ? applyHandle(o, g.hkind, g.index, w) : o));
      return;
    }

    const d = draftRef.current;
    if (d) {
      const from = d.kind === 'multi' ? d.points[d.points.length - 1] : d.start;
      const w = drawPoint(evt, d.kind === 'two' && (d.tool === 'rect' || d.tool === 'ellipse') ? undefined : from);
      if (w) setDraft({ ...d, cursor: w });
    }
  };

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    const st = useStore.getState();
    const g = gesture.current;
    const p = stageRef.current?.getPointerPosition();

    if (g?.kind === 'marquee' && marquee) {
      const hit = st.objects
        .filter((o) => !o.locked && boundsIntersect(getBounds(o), marquee))
        .map((o) => o.id);
      st.select(st.expandGroups([...new Set([...g.base, ...hit])]));
    }
    const wasGesture = !!g;
    endGesture();
    if (wasGesture || e.evt.button !== 0) return;

    if (st.tool === 'text' && !spaceDown) {
      const w = pointerWorld(true, e.evt);
      if (!w) return;
      const t = makeText(w);
      st.setTool('select');
      st.addObject(t);
      st.set({ editingTextId: t.id });
      return;
    }
    const d = draftRef.current;
    if (d?.kind === 'two' && p && Math.hypot(p.x - d.sx, p.y - d.sy) > 6) finishTwo(d, d.cursor);
  };

  const onDblClick = (e: KonvaEventObject<MouseEvent>) => {
    const st = useStore.getState();
    // Deux clics rapides à des endroits différents ne sont pas un double-clic
    const [d1, d2] = downs.current;
    if (d1 && d2 && Math.hypot(d1.x - d2.x, d1.y - d2.y) > 8) return;
    if (draftRef.current?.kind === 'multi') {
      finishMulti();
      return;
    }
    if (st.tool !== 'select') return;
    const id = findObjId(e.target);
    const obj = st.objects.find((o) => o.id === id);
    if (!obj || obj.locked) return;
    if (obj.type === 'text') {
      st.set({ editingTextId: obj.id, selection: [obj.id] });
    } else if (obj.type === 'road' || obj.type === 'polygon') {
      // Double-clic sur un segment : ajoute un sommet à cet endroit
      const w = pointerWorld(false)!;
      const seg = nearestSegment(obj.points, w, obj.type === 'polygon');
      st.pushHistory();
      st.mutateObjects((o) => (o.id === obj.id ? insertVertex(o, seg.index, seg.point) : o));
      st.select([obj.id]);
    }
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const p = stageRef.current?.getPointerPosition();
    if (!p) return;
    const delta = e.evt.deltaMode === 1 ? e.evt.deltaY * 33 : e.evt.deltaY;
    useStore.getState().zoomAt(p.x, p.y, Math.exp(-delta * 0.0015));
  };

  const onContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    const st = useStore.getState();
    if (draftRef.current) return;
    // Clic droit sur un sommet : suppression
    if (e.target.hasName('handle')) {
      if ((e.target as Konva.Node).getAttr('hkind') === 'vertex') {
        const objId = (e.target as Konva.Node).getAttr('objId') as string;
        const index = (e.target as Konva.Node).getAttr('hindex') as number;
        const obj = st.objects.find((o) => o.id === objId);
        if (obj && removeVertex(obj, index) !== obj) {
          st.pushHistory();
          st.mutateObjects((o) => (o.id === objId ? removeVertex(o, index) : o));
        }
      }
      return;
    }
    if (st.tool !== 'select') st.setTool('select');
    const id = findObjId(e.target);
    let lockedId: string | undefined;
    if (id) {
      if (!st.selection.includes(id)) st.select(st.expandGroups([id]));
    } else {
      const w = pointerWorld(false);
      if (w) lockedId = [...st.objects].reverse().find((o) => o.locked && boundsContain(getBounds(o), w))?.id;
      if (!inTransformer(e.target)) st.select([]);
    }
    st.set({ menu: { x: e.evt.clientX, y: e.evt.clientY, lockedId } });
  };

  // ---------- Clavier lié au tracé et à la vue ----------
  useEffect(() => {
    const editable = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(true);
      if (editable(e.target)) return;
      const st = useStore.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        setSpaceDown(true);
      } else if (e.key === 'Enter') {
        finishMulti();
      } else if (e.key === 'Escape') {
        if (st.menu) st.set({ menu: null });
        else if (draftRef.current) setDraft(null);
        else if (st.tool !== 'select') st.setTool('select');
        else st.select([]);
      } else if (e.key === 'Backspace' && draftRef.current?.kind === 'multi') {
        const d = draftRef.current;
        setDraft(d.points.length > 1 ? { ...d, points: d.points.slice(0, -1) } : null);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(false);
      if (e.code === 'Space') setSpaceDown(false);
    };
    const blur = () => {
      setShiftDown(false);
      setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // ---------- Glisser-déposer (bibliothèque, images, fichiers .json) ----------
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) void importBackgroundImage(file);
      else if (file.name.toLowerCase().endsWith('.json')) void openPlanFromFile(file);
      return;
    }
    const symbolId = e.dataTransfer.getData('application/x-plan-symbol');
    if (!symbolId) return;
    stage.setPointersPositions(e.nativeEvent);
    const w = pointerWorld(true);
    if (!w) return;
    const st = useStore.getState();
    st.setTool('select');
    st.addObject(makeSymbol(getSymbolDef(symbolId), w));
  };

  const cursor = panning ? 'grabbing' : spaceDown ? 'grab' : tool === 'select' ? 'default' : 'crosshair';
  const editingObj = editingTextId ? objects.find((o) => o.id === editingTextId) : null;
  const sm = marquee && {
    x: marquee.x1 * view.ppm + view.x, y: marquee.y1 * view.ppm + view.y,
    w: (marquee.x2 - marquee.x1) * view.ppm, h: (marquee.y2 - marquee.y1) * view.ppm,
  };

  return (
    <div
      ref={containerRef} className="canvas-container" style={{ cursor }}
      onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
      onMouseLeave={() => useStore.getState().set({ cursor: null })}
    >
      <Stage
        ref={stageRef} width={viewport.w} height={viewport.h}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onDblClick={onDblClick} onWheel={onWheel} onContextMenu={onContextMenu}
      >
        {/* Grille */}
        <Layer listening={false}>
          <Rect width={viewport.w} height={viewport.h} fill="#ffffff" />
          {gridVisible && (
            <Shape
              sceneFunc={(ctx) =>
                drawGrid(ctx._context, { width: viewport.w, height: viewport.h, originX: view.x, originY: view.y, ppm: view.ppm })
              }
            />
          )}
        </Layer>

        {/* Plan : tout ce groupe est en mètres (échelle = px/m) */}
        <Layer>
          <Group ref={worldRef} x={view.x} y={view.y} scaleX={view.ppm} scaleY={view.ppm}>
            {layers.images.map((o) => <ObjectView key={o.id} obj={o} ppm={view.ppm} />)}
            {layers.below.map((o) => <ObjectView key={o.id} obj={o} ppm={view.ppm} editing={o.id === editingTextId} />)}
            <RoadsView roads={layers.roads} />
            {layers.above.map((o) => <ObjectView key={o.id} obj={o} ppm={view.ppm} editing={o.id === editingTextId} />)}
            {draft && <DraftPreview draft={draft} ppm={view.ppm} />}
            {calibration && (
              <Group listening={false}>
                <ObjectView obj={calibrationPreview(calibration.a, calibration.b)} ppm={view.ppm} />
              </Group>
            )}
          </Group>
          <Transformer
            ref={trRef}
            rotationSnaps={shiftDown ? ROTATION_SNAPS : []}
            rotationSnapTolerance={7.5}
            resizeEnabled={selected.length === 1}
            keepRatio={keepRatio}
            enabledAnchors={keepRatio ? CORNERS : undefined}
            flipEnabled={false}
            ignoreStroke
            anchorSize={9}
            anchorCornerRadius={2}
            anchorStroke={COLORS.selection}
            borderStroke={COLORS.selection}
            rotateAnchorOffset={28}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 4 ? oldBox : newBox)}
            onTransformEnd={onTransformEnd}
          />
        </Layer>

        {/* Surcouche écran : poignées, rectangle de sélection, barre d'échelle */}
        <Layer>
          {tool === 'select' && !useTransformer && selected.length > 1 &&
            selected.map((o) => <SelectionOutline key={o.id} obj={o} view={view} />)}
          {tool === 'select' && single && !useTransformer && <Handles obj={single} view={view} />}
          {sm && (
            <Rect x={sm.x} y={sm.y} width={sm.w} height={sm.h} fill="rgba(37,99,235,0.08)" stroke={COLORS.selection} strokeWidth={1} listening={false} />
          )}
          <Shape listening={false} sceneFunc={(ctx) => drawScaleBar(ctx._context, 22, viewport.h - 16, view.ppm)} />
        </Layer>
      </Stage>
      {editingObj?.type === 'text' && <TextEditor obj={editingObj} view={view} />}
    </div>
  );
}
