import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { savePlanToFile } from '../store/files';
import { TOOLS } from '../ui/Toolbar';

const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/** Raccourcis clavier globaux (Entrée / Échap / Espace sont gérés par CanvasStage). */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (ctrl && k === 's') {
        e.preventDefault();
        savePlanToFile();
        return;
      }
      if (isEditable(e.target) || st.exportMode || st.calibration) return;

      if (ctrl) {
        const map: Record<string, () => void> = {
          z: () => (e.shiftKey ? st.redo() : st.undo()),
          y: st.redo,
          c: st.copy,
          v: st.paste,
          d: st.duplicateSelection,
          a: st.selectAll,
          g: () => (e.shiftKey ? st.ungroup() : st.group()),
        };
        if (map[k]) {
          e.preventDefault();
          map[k]();
        }
        return;
      }

      if (e.key === 'Delete' || (e.key === 'Backspace' && st.tool === 'select')) {
        e.preventDefault();
        st.deleteSelection();
        return;
      }
      if (e.key.startsWith('Arrow') && st.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        st.translateSelection(dx, dy, 'nudge');
        return;
      }
      const tool = TOOLS.find((t) => t.key === e.key);
      if (tool && !e.altKey) st.setTool(tool.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
