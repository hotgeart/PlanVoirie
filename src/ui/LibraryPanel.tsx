import { memo } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATALOG, CATEGORIES, type SymbolDef } from '../library/catalog';
import { SYMBOL_RENDERERS } from '../library/symbols';
import { makeSymbol } from '../factories';
import { snapPt, fmtShort } from '../geometry/math';
import { useStore } from '../store/useStore';

const TW = 60;
const TH = 40;

const Thumb = memo(function Thumb({ def }: { def: SymbolDef }) {
  const Draw = SYMBOL_RENDERERS[def.kind];
  const s = Math.min((TW - 8) / def.length, (TH - 8) / def.width);
  return (
    <Stage width={TW} height={TH} listening={false}>
      <Layer>
        <Group x={TW / 2} y={TH / 2} scaleX={s} scaleY={s}>
          <Draw w={def.length} h={def.width} color={def.color} def={def} count={def.count} angle={def.angle} />
        </Group>
      </Layer>
    </Stage>
  );
});

/** Ajoute le symbole au centre de la vue (clic sur un élément de la bibliothèque). */
function addAtCenter(def: SymbolDef) {
  const s = useStore.getState();
  const n = s.objects.length % 5;
  const c = {
    x: (s.viewport.w / 2 - s.view.x) / s.view.ppm + n * 0.5,
    y: (s.viewport.h / 2 - s.view.y) / s.view.ppm + n * 0.5,
  };
  s.setTool('select');
  s.addObject(makeSymbol(def, s.snapEnabled ? snapPt(c, s.snapStep) : c));
}

export function LibraryPanel() {
  const open = useStore((s) => s.libraryOpen);
  const set = useStore((s) => s.set);
  if (!open) {
    return (
      <aside className="library collapsed">
        <button className="collapse-btn" title="Afficher la bibliothèque" onClick={() => set({ libraryOpen: true })}>
          <ChevronRight size={16} />
        </button>
        <span className="vertical-label">Bibliothèque</span>
      </aside>
    );
  }
  return (
    <aside className="library">
      <header>
        <h3>Bibliothèque</h3>
        <button className="collapse-btn" title="Replier la bibliothèque" onClick={() => set({ libraryOpen: false })}>
          <ChevronLeft size={16} />
        </button>
      </header>
      <p className="hint">Glissez un élément sur le plan, ou cliquez pour l'ajouter au centre.</p>
      <div className="library-scroll">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="lib-cat">
            <h4>{cat.label}</h4>
            {CATALOG.filter((d) => d.category === cat.id).map((def) => (
              <div
                key={def.id}
                className="lib-item"
                draggable
                title={`${def.label} — ${fmtShort(def.length)} × ${fmtShort(def.width)} m`}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-plan-symbol', def.id);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => addAtCenter(def)}
              >
                <Thumb def={def} />
                <div>
                  <strong>{def.label}</strong>
                  <small>{fmtShort(def.length)} × {fmtShort(def.width)} m</small>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
