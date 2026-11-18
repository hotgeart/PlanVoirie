import { useMemo } from 'react';
import {
  ArrowDown, ArrowUp, BringToFront, Copy, Group as GroupIcon, Lock, LockOpen, RotateCcw, RotateCw,
  SendToBack, Trash2, Ungroup,
} from 'lucide-react';
import type {
  ArrowObj, DimensionObj, EllipseObj, FillProps, ImageObj, LineObj, PlanObject, PolygonObj, RectObj,
  RoadObj, StrokeProps, SymbolObj, TextObj,
} from '../types';
import { LID_COLORS, SNAP_STEPS } from '../constants';
import { getSymbolDef } from '../library/catalog';
import { angledSkew } from '../library/symbols/RoadElements';
import { TREE_STYLES } from '../library/symbols/Vegetation';
import { dist, fmt, fmtShort, polygonArea, polylineLength } from '../geometry/math';
import { roadCenterline } from '../geometry/road';
import { importBackgroundImage } from '../store/files';
import { useStore } from '../store/useStore';
import { FILL_PATTERN_LABELS } from '../canvas/textures';
import {
  CheckField, ColorField, NumField, RangeField, Section, SelectField, TextField,
} from './fields';

type Setter = (patch: Record<string, unknown>) => void;

const TYPE_LABELS: Record<PlanObject['type'], string> = {
  road: 'Route', rect: 'Rectangle', ellipse: 'Ellipse', polygon: 'Polygone', line: 'Ligne',
  arrow: 'Flèche', text: 'Texte', dimension: 'Cote', symbol: 'Symbole', image: 'Fond de plan',
};

function StrokeFields({ o, set }: { o: StrokeProps; set: Setter }) {
  return (
    <Section title="Trait">
      <ColorField label="Couleur" value={o.stroke} onChange={(stroke) => set({ stroke })} />
      <NumField label="Épaisseur" unit="m" value={o.strokeWidth} min={0.01} max={5} step={0.05} onChange={(strokeWidth) => set({ strokeWidth })} />
      <CheckField label="Pointillé" value={o.dashed} onChange={(dashed) => set({ dashed })} />
    </Section>
  );
}

function FillFields({ o, set }: { o: FillProps; set: Setter }) {
  return (
    <Section title="Remplissage">
      <SelectField
        label="Type" value={o.fillPattern ?? 'color'}
        options={[
          { value: 'color', label: 'Couleur unie' },
          ...Object.entries(FILL_PATTERN_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        onChange={(v) =>
          // Une texture est posée opaque par défaut ; l'opacité reste réglable ensuite
          set(v === 'color' ? { fillPattern: undefined } : { fillPattern: v, ...(o.fillPattern ? {} : { fillOpacity: 1 }) })
        }
      />
      {!o.fillPattern && <ColorField label="Couleur" value={o.fill} onChange={(fill) => set({ fill })} />}
      <RangeField label="Opacité" value={o.fillOpacity} onChange={(fillOpacity) => set({ fillOpacity })} />
    </Section>
  );
}

function BoxFields({ o, set, wLabel = 'Largeur', hLabel = 'Hauteur' }: {
  o: { x: number; y: number; width: number; height: number; rotation: number }; set: Setter; wLabel?: string; hLabel?: string;
}) {
  return (
    <Section title="Position et taille">
      <div className="row2">
        <NumField label="X" unit="m" value={o.x} onChange={(x) => set({ x })} />
        <NumField label="Y" unit="m" value={o.y} onChange={(y) => set({ y })} />
      </div>
      <div className="row2">
        <NumField label={wLabel} unit="m" value={o.width} min={0.05} onChange={(width) => set({ width })} />
        <NumField label={hLabel} unit="m" value={o.height} min={0.05} onChange={(height) => set({ height })} />
      </div>
      <NumField label="Rotation" unit="°" value={o.rotation} step={15} min={-360} max={360} onChange={(rotation) => set({ rotation })} />
    </Section>
  );
}

function RoadForm({ o, set }: { o: RoadObj; set: Setter }) {
  const laneWidth = Math.round((o.width / Math.max(1, o.lanes)) * 100) / 100;
  return (
    <>
      <Section title="Chaussée">
        {/* Changer le nombre de voies élargit ou rétrécit la chaussée : la largeur d'une voie est conservée */}
        <NumField
          label="Nombre de voies" value={o.lanes} min={1} max={8} step={1}
          onChange={(v) => {
            const lanes = Math.max(1, Math.round(v));
            set({ lanes, width: Math.round(laneWidth * lanes * 100) / 100 });
          }}
        />
        <NumField
          label="Largeur d'une voie" unit="m" value={laneWidth} min={1} max={10} step={0.25}
          onChange={(w) => set({ width: Math.round(w * o.lanes * 100) / 100 })}
        />
        <NumField label="Largeur de chaussée" unit="m" value={o.width} min={1} max={80} step={0.5} onChange={(width) => set({ width })} />
        <SelectField
          label="Marquage central" value={o.centerMarking}
          options={[
            { value: 'none', label: 'Aucun' },
            { value: 'dashed', label: 'Discontinu' },
            { value: 'solid', label: 'Continu' },
          ]}
          onChange={(centerMarking) => set({ centerMarking })}
        />
        <CheckField label="Lignes de rive" value={o.edgeLines} onChange={(edgeLines) => set({ edgeLines })} />
        <p className="info">Longueur : {fmt(polylineLength(roadCenterline(o)))} m</p>
      </Section>
      <Section title="Trottoirs">
        <CheckField label="Trottoir gauche" value={o.sidewalkLeft.enabled} onChange={(enabled) => set({ sidewalkLeft: { ...o.sidewalkLeft, enabled } })} />
        {o.sidewalkLeft.enabled && (
          <NumField label="Largeur gauche" unit="m" value={o.sidewalkLeft.width} min={0.3} max={15} step={0.1} onChange={(width) => set({ sidewalkLeft: { ...o.sidewalkLeft, width } })} />
        )}
        <CheckField label="Trottoir droit" value={o.sidewalkRight.enabled} onChange={(enabled) => set({ sidewalkRight: { ...o.sidewalkRight, enabled } })} />
        {o.sidewalkRight.enabled && (
          <NumField label="Largeur droite" unit="m" value={o.sidewalkRight.width} min={0.3} max={15} step={0.1} onChange={(width) => set({ sidewalkRight: { ...o.sidewalkRight, width } })} />
        )}
        <CheckField label="Bordure de trottoir visible" value={o.curb} onChange={(curb) => set({ curb })} />
        <p className="info">Gauche / droite : dans le sens du tracé.</p>
      </Section>
      <Section title="Tracé">
        <CheckField label="Arrondir les angles" value={o.rounded} onChange={(rounded) => set({ rounded })} />
        {o.rounded && <NumField label="Rayon" unit="m" value={o.radius} min={0.5} max={200} step={1} onChange={(radius) => set({ radius })} />}
        <p className="info">Glissez un sommet pour le déplacer, cliquez un point intermédiaire (ou double-cliquez la route) pour en ajouter un, clic droit sur un sommet pour le supprimer.</p>
      </Section>
    </>
  );
}

function ArrowForm({ o, set }: { o: ArrowObj; set: Setter }) {
  const [a, b] = o.points;
  const toggleCurve = (curved: boolean) => {
    if (!curved) return set({ curved, control: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
    // Courbure initiale : point milieu décalé perpendiculairement
    const len = dist(a, b) || 1;
    const k = len * 0.2;
    set({
      curved,
      control: { x: (a.x + b.x) / 2 + ((b.y - a.y) / len) * k, y: (a.y + b.y) / 2 - ((b.x - a.x) / len) * k },
    });
  };
  return (
    <>
      <Section title="Flèche">
        <CheckField label="Courbe (point de contrôle orange)" value={o.curved} onChange={toggleCurve} />
        <CheckField label="Tête au début" value={o.headStart} onChange={(headStart) => set({ headStart })} />
        <CheckField label="Tête à la fin" value={o.headEnd} onChange={(headEnd) => set({ headEnd })} />
      </Section>
      <StrokeFields o={o} set={set} />
    </>
  );
}

function TextForm({ o, set }: { o: TextObj; set: Setter }) {
  return (
    <Section title="Texte">
      <label className="field col">
        <span>Contenu</span>
        <textarea rows={3} value={o.text} onChange={(e) => set({ text: e.target.value })} />
      </label>
      <NumField label="Taille" unit="m" value={o.fontSize} min={0.05} max={50} step={0.1} onChange={(fontSize) => set({ fontSize })} />
      <ColorField label="Couleur" value={o.color} onChange={(color) => set({ color })} />
      <CheckField label="Gras" value={o.bold} onChange={(bold) => set({ bold })} />
      <CheckField label="Fond (étiquette)" value={o.background} onChange={(background) => set({ background })} />
      {o.background && <ColorField label="Couleur du fond" value={o.backgroundColor} onChange={(backgroundColor) => set({ backgroundColor })} />}
      <NumField label="Rotation" unit="°" value={o.rotation} step={15} min={-360} max={360} onChange={(rotation) => set({ rotation })} />
      <p className="info">Double-cliquez le texte sur le plan pour l'éditer.</p>
    </Section>
  );
}

function DimensionForm({ o, set }: { o: DimensionObj; set: Setter }) {
  return (
    <Section title="Cote">
      <p className="info big">{fmt(dist(o.points[0], o.points[1]))} m</p>
      <NumField label="Décalage" unit="m" value={o.offset} step={0.25} onChange={(offset) => set({ offset })} />
      <NumField label="Taille du texte" unit="m" value={o.fontSize} min={0.1} max={10} step={0.1} onChange={(fontSize) => set({ fontSize })} />
      <ColorField label="Couleur" value={o.color} onChange={(color) => set({ color })} />
    </Section>
  );
}

function SymbolForm({ o, set }: { o: SymbolObj; set: Setter }) {
  const def = getSymbolDef(o.symbolId);
  const k = def.kind;
  const count = o.count ?? def.count ?? 1;
  const angle = o.angle ?? def.angle ?? 60;
  const setCount = (v: number) => {
    const n = Math.round(v);
    if (k === 'parkingAngled') {
      const s = angledSkew(o.height, angle);
      set({ count: n, width: ((o.width - s) / count) * n + s });
    } else {
      set({ count: n, width: (o.width / count) * n });
    }
  };
  const setAngle = (a: number) => {
    const pitch = (o.width - angledSkew(o.height, angle)) / count;
    set({ angle: a, width: pitch * count + angledSkew(o.height, a) });
  };
  return (
    <>
      <Section title={def.label}>
        {k === 'turnaround' ? (
          <NumField label="Rayon" unit="m" value={o.width / 2} min={2} max={50} step={0.5} onChange={(r) => set({ width: r * 2, height: r * 2 })} />
        ) : def.round ? (
          <NumField label="Diamètre" unit="m" value={o.width} min={0.3} max={40} step={0.5} onChange={(d) => set({ width: d, height: d })} />
        ) : (
          <div className="row2">
            <NumField label="Longueur" unit="m" value={o.width} min={0.1} max={50} onChange={(width) => set({ width })} />
            <NumField label="Largeur" unit="m" value={o.height} min={0.1} max={50} onChange={(height) => set({ height })} />
          </div>
        )}
        <NumField label="Rotation" unit="°" value={o.rotation} step={15} min={-360} max={360} onChange={(rotation) => set({ rotation })} />
        <div className="row2">
          <NumField label="X" unit="m" value={o.x} onChange={(x) => set({ x })} />
          <NumField label="Y" unit="m" value={o.y} onChange={(y) => set({ y })} />
        </div>
        {k === 'tree' && (
          <SelectField label="Style" value={o.variant ?? 'houppier'} options={TREE_STYLES} onChange={(variant) => set({ variant })} />
        )}
        {(k === 'parking' || k === 'parkingAngled') && (
          <NumField label="Nombre de places" value={count} min={1} max={40} step={1} onChange={setCount} />
        )}
        {k === 'parkingAngled' && <NumField label="Angle des places" unit="°" value={angle} min={30} max={89} step={5} onChange={setAngle} />}
      </Section>
      {k === 'bom' && (
        <Section title="Options BOM">
          <CheckField label="Stabilisateurs" value={!!o.showStabilizers} onChange={(showStabilizers) => set({ showStabilizers })} />
          <CheckField label="Zone de manœuvre (1 m)" value={!!o.showManeuverZone} onChange={(showManeuverZone) => set({ showManeuverZone })} />
        </Section>
      )}
      {k !== 'crosswalk' && k !== 'noParking' && (
        <Section title={k === 'bin' ? 'Couleur du couvercle' : 'Couleur'}>
          {k === 'bin' && (
            <div className="swatches">
              {LID_COLORS.map((c) => (
                <button
                  key={c.id} title={c.label} aria-label={c.label}
                  className={o.color.toLowerCase() === c.value ? 'on' : ''}
                  style={{ background: c.value }}
                  onClick={() => set({ color: c.value })}
                />
              ))}
            </div>
          )}
          <ColorField label="Personnalisée" value={o.color} onChange={(color) => set({ color })} />
        </Section>
      )}
      <Section title="Étiquette">
        <TextField label="Texte" value={o.label} placeholder="Affichée sous l'objet" onChange={(label) => set({ label })} />
      </Section>
    </>
  );
}

function ImageForm({ o, set }: { o: ImageObj; set: Setter }) {
  const ratio = o.height / o.width;
  return (
    <Section title="Fond de plan">
      <p className="info">{o.name}</p>
      <RangeField label="Opacité" value={o.opacity} onChange={(opacity) => set({ opacity })} />
      <div className="row2">
        <NumField label="Largeur" unit="m" value={o.width} min={0.1} onChange={(width) => set({ width, height: width * ratio })} />
        <NumField label="Hauteur" unit="m" value={o.height} min={0.1} onChange={(height) => set({ height, width: height / ratio })} />
      </div>
      <NumField label="Rotation" unit="°" value={o.rotation} step={1} min={-360} max={360} onChange={(rotation) => set({ rotation })} />
      <button className="wide" onClick={() => useStore.getState().setTool('calibrate')}>Calibrer l'échelle…</button>
      <p className="info">Verrouillez l'image une fois placée pour ne plus la déplacer par erreur.</p>
    </Section>
  );
}

function Form({ o, set }: { o: PlanObject; set: Setter }) {
  switch (o.type) {
    case 'road': return <RoadForm o={o} set={set} />;
    case 'rect':
    case 'ellipse':
      return (
        <>
          <BoxFields o={o as RectObj | EllipseObj} set={set} />
          <StrokeFields o={o} set={set} />
          <FillFields o={o} set={set} />
        </>
      );
    case 'polygon':
      return (
        <>
          <Section title="Mesures">
            <p className="info">Surface : {fmt(polygonArea((o as PolygonObj).points))} m²</p>
            <p className="info">Périmètre : {fmt(polylineLength(o.points, true))} m</p>
          </Section>
          <StrokeFields o={o} set={set} />
          <FillFields o={o} set={set} />
        </>
      );
    case 'line':
      return (
        <>
          <Section title="Mesures">
            <p className="info">Longueur : {fmt(polylineLength((o as LineObj).points))} m</p>
          </Section>
          <StrokeFields o={o} set={set} />
        </>
      );
    case 'arrow': return <ArrowForm o={o} set={set} />;
    case 'text': return <TextForm o={o} set={set} />;
    case 'dimension': return <DimensionForm o={o} set={set} />;
    case 'symbol': return <SymbolForm o={o} set={set} />;
    case 'image': return <ImageForm o={o} set={set} />;
  }
}

function Actions({ count, grouped }: { count: number; grouped: boolean }) {
  const st = useStore.getState;
  const IconBtn = ({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) => (
    <button title={label} aria-label={label} onClick={onClick}><Icon size={16} /></button>
  );
  return (
    <Section title="Actions">
      <div className="icon-row">
        <IconBtn icon={Copy} label="Dupliquer (Ctrl+D)" onClick={() => st().duplicateSelection()} />
        <IconBtn icon={Trash2} label="Supprimer (Suppr)" onClick={() => st().deleteSelection()} />
        <IconBtn icon={Lock} label="Verrouiller" onClick={() => st().setLocked(st().selection, true)} />
        <IconBtn icon={RotateCcw} label="Pivoter de −15°" onClick={() => st().rotateSelection(-15)} />
        <IconBtn icon={RotateCw} label="Pivoter de +15°" onClick={() => st().rotateSelection(15)} />
      </div>
      <div className="icon-row">
        <IconBtn icon={BringToFront} label="Premier plan" onClick={() => st().reorder('front')} />
        <IconBtn icon={ArrowUp} label="Avancer" onClick={() => st().reorder('forward')} />
        <IconBtn icon={ArrowDown} label="Reculer" onClick={() => st().reorder('backward')} />
        <IconBtn icon={SendToBack} label="Arrière-plan" onClick={() => st().reorder('back')} />
        {count > 1 && <IconBtn icon={GroupIcon} label="Grouper (Ctrl+G)" onClick={() => st().group()} />}
        {grouped && <IconBtn icon={Ungroup} label="Dégrouper (Ctrl+Maj+G)" onClick={() => st().ungroup()} />}
      </div>
    </Section>
  );
}

/** Affiché quand rien n'est sélectionné : réglages du plan, fond de plan, objets verrouillés. */
function PlanSettings() {
  const meta = useStore((s) => s.meta);
  const gridVisible = useStore((s) => s.gridVisible);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const snapStep = useStore((s) => s.snapStep);
  const objects = useStore((s) => s.objects);
  const st = useStore.getState;
  const images = objects.filter((o): o is ImageObj => o.type === 'image');
  const locked = objects.filter((o) => o.locked && o.type !== 'image');
  const patchImage = (id: string, patch: Record<string, unknown>) => st().updateObjects([id], patch, `img:${id}`);
  return (
    <>
      <h3>Plan</h3>
      <Section title="Cartouche">
        <TextField label="Titre" value={meta.title} onChange={(title) => st().setMeta({ title })} />
        <TextField label="Auteur" value={meta.author} onChange={(author) => st().setMeta({ author })} />
      </Section>
      <Section title="Grille">
        <CheckField label="Afficher la grille (1 m / 5 m)" value={gridVisible} onChange={(v) => st().set({ gridVisible: v })} />
        <CheckField label="Magnétisme" value={snapEnabled} onChange={(v) => st().set({ snapEnabled: v })} />
        <SelectField
          label="Pas du magnétisme" value={snapStep}
          options={SNAP_STEPS.map((v) => ({ value: v, label: `${fmtShort(v)} m` }))}
          onChange={(v) => st().set({ snapStep: v })}
        />
      </Section>
      <Section title="Fond de plan">
        {images.length === 0 && <p className="info">Aucune image. Importez une photo aérienne, un extrait cadastral ou une capture de carte.</p>}
        {images.map((img) => (
          <div key={img.id} className="bg-item">
            <strong title={img.name}>{img.name}</strong>
            <RangeField label="Opacité" value={img.opacity} onChange={(opacity) => patchImage(img.id, { opacity })} />
            <div className="icon-row">
              <button title={img.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={() => st().setLocked([img.id], !img.locked)}>
                {img.locked ? <Lock size={15} /> : <LockOpen size={15} />}
                <span>{img.locked ? 'Verrouillée' : 'Libre'}</span>
              </button>
              <button
                title="Supprimer l'image"
                onClick={() => {
                  st().pushHistory();
                  useStore.setState((s) => ({ objects: s.objects.filter((o) => o.id !== img.id) }));
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        <button className="wide" onClick={() => void importBackgroundImage()}>Importer une image…</button>
        {images.length > 0 && <button className="wide" onClick={() => st().setTool('calibrate')}>Calibrer l'échelle…</button>}
      </Section>
      {locked.length > 0 && (
        <Section title="Objets verrouillés">
          <p className="info">{locked.length} objet{locked.length > 1 ? 's' : ''} verrouillé{locked.length > 1 ? 's' : ''}.</p>
          <button className="wide" onClick={() => st().setLocked(locked.map((o) => o.id), false)}>Tout déverrouiller</button>
        </Section>
      )}
    </>
  );
}

export function PropertiesPanel() {
  const objects = useStore((s) => s.objects);
  const selection = useStore((s) => s.selection);
  const sel = useMemo(() => objects.filter((o) => selection.includes(o.id)), [objects, selection]);

  if (sel.length === 0) {
    return <aside className="props"><PlanSettings /></aside>;
  }
  const first = sel[0];
  const same = sel.every((o) => o.type === first.type);
  const ids = sel.map((o) => o.id);
  const set: Setter = (patch) =>
    useStore.getState().updateObjects(ids, patch, `prop:${ids[0]}:${Object.keys(patch).join(',')}`);
  const title =
    sel.length === 1
      ? first.type === 'symbol' ? getSymbolDef(first.symbolId).label : TYPE_LABELS[first.type]
      : `${sel.length} objets sélectionnés`;
  return (
    <aside className="props">
      <h3>{title}</h3>
      {same ? <Form o={first} set={set} /> : <p className="info">Sélection de types différents : seules les actions communes sont disponibles.</p>}
      <Actions count={sel.length} grouped={sel.some((o) => o.groupId)} />
    </aside>
  );
}
