import {
  FileDown, FilePlus, FolderOpen, Grid3x3, Image as ImageIcon, ImageDown, Magnet, Maximize, Redo2,
  Ruler, Save, Undo2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { importBackgroundImage, openPlanFromFile, savePlanToFile } from '../store/files';

function Btn({
  icon: Icon, label, title, onClick, disabled, active,
}: {
  icon: typeof Save; label: string; title?: string; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button className={active ? 'active' : ''} title={title ?? label} onClick={onClick} disabled={disabled}>
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

export function TopBar() {
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const gridVisible = useStore((s) => s.gridVisible);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const tool = useStore((s) => s.tool);
  const title = useStore((s) => s.meta.title);
  const st = useStore.getState;

  return (
    <header className="topbar">
      <div className="brand">Plan&nbsp;Voirie</div>
      <div className="group">
        <Btn icon={FilePlus} label="Nouveau" onClick={() => st().newPlan()} />
        <Btn icon={FolderOpen} label="Ouvrir" title="Ouvrir un plan (.json)" onClick={() => void openPlanFromFile()} />
        <Btn icon={Save} label="Enregistrer" title="Enregistrer en .json (Ctrl+S)" onClick={savePlanToFile} />
      </div>
      <div className="group">
        <Btn icon={ImageIcon} label="Fond de plan" title="Importer une image de fond (photo aérienne, cadastre…)" onClick={() => void importBackgroundImage()} />
        <Btn icon={Ruler} label="Calibrer l'échelle" title="Cliquer deux points de l'image et saisir la distance réelle" active={tool === 'calibrate'} onClick={() => st().setTool('calibrate')} />
      </div>
      <div className="group">
        <Btn icon={ImageDown} label="Exporter PNG" onClick={() => st().set({ exportMode: 'png' })} />
        <Btn icon={FileDown} label="Exporter PDF" onClick={() => st().set({ exportMode: 'pdf' })} />
      </div>
      <div className="group">
        <Btn icon={Undo2} label="Annuler" title="Annuler (Ctrl+Z)" disabled={!canUndo} onClick={() => st().undo()} />
        <Btn icon={Redo2} label="Rétablir" title="Rétablir (Ctrl+Y)" disabled={!canRedo} onClick={() => st().redo()} />
      </div>
      <div className="group">
        <Btn icon={Grid3x3} label="Grille" title="Afficher / masquer la grille" active={gridVisible} onClick={() => st().set({ gridVisible: !gridVisible })} />
        <Btn icon={Magnet} label="Magnétisme" title="Magnétisme à la grille (Alt pour le suspendre)" active={snapEnabled} onClick={() => st().set({ snapEnabled: !snapEnabled })} />
        <Btn icon={Maximize} label="Ajuster" title="Ajuster la vue à tout le plan" onClick={() => st().fitView()} />
      </div>
      <input
        className="title-input"
        value={title}
        title="Titre du plan"
        aria-label="Titre du plan"
        onChange={(e) => st().setMeta({ title: e.target.value })}
      />
    </header>
  );
}
