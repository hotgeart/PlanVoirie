import { TOOL_HINTS } from '../constants';
import { fmt, fmtShort } from '../geometry/math';
import { useStore } from '../store/useStore';

export function StatusBar() {
  const cursor = useStore((s) => s.cursor);
  const ppm = useStore((s) => s.view.ppm);
  const tool = useStore((s) => s.tool);
  const count = useStore((s) => s.selection.length);
  return (
    <footer className="statusbar">
      <span className="coords">{cursor ? `X ${fmt(cursor.x)} m   Y ${fmt(cursor.y)} m` : 'X —   Y —'}</span>
      <span>1 m = {fmtShort(Math.round(ppm * 10) / 10)} px</span>
      {count > 0 && <span>{count} objet{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}</span>}
      <span className="hint">{TOOL_HINTS[tool]}</span>
      <span className="saved">Sauvegarde automatique activée</span>
    </footer>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return <div className="toast" role="status">{toast}</div>;
}
