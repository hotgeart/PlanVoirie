import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

interface Item {
  label: string;
  hint?: string;
  action: () => void;
  disabled?: boolean;
  sep?: boolean;
}

/** Menu du clic droit sur le plan. */
export function ContextMenu() {
  const menu = useStore((s) => s.menu);
  const selection = useStore((s) => s.selection);
  const objects = useStore((s) => s.objects);
  const hasClipboard = useStore((s) => s.clipboard.length > 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) useStore.getState().set({ menu: null });
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menu]);

  if (!menu) return null;
  const st = useStore.getState();
  const n = selection.length;
  const grouped = objects.some((o) => selection.includes(o.id) && o.groupId);

  const items: Item[] = [];
  if (n > 0) {
    items.push(
      { label: 'Copier', hint: 'Ctrl+C', action: st.copy },
      { label: 'Coller', hint: 'Ctrl+V', action: st.paste, disabled: !hasClipboard },
      { label: 'Dupliquer', hint: 'Ctrl+D', action: st.duplicateSelection },
      { label: 'Supprimer', hint: 'Suppr', action: st.deleteSelection },
      { label: 'Premier plan', action: () => st.reorder('front'), sep: true },
      { label: 'Avancer', action: () => st.reorder('forward') },
      { label: 'Reculer', action: () => st.reorder('backward') },
      { label: 'Arrière-plan', action: () => st.reorder('back') },
      { label: 'Verrouiller', action: () => st.setLocked(selection, true), sep: true },
      { label: 'Grouper', hint: 'Ctrl+G', action: st.group, disabled: n < 2 },
      { label: 'Dégrouper', hint: 'Ctrl+Maj+G', action: st.ungroup, disabled: !grouped },
    );
  } else {
    if (menu.lockedId) {
      const id = menu.lockedId;
      items.push({
        label: 'Déverrouiller',
        action: () => {
          st.setLocked([id], false);
          st.select([id]);
        },
      });
    }
    items.push(
      { label: 'Coller', hint: 'Ctrl+V', action: st.paste, disabled: !hasClipboard, sep: !!menu.lockedId },
      { label: 'Tout sélectionner', hint: 'Ctrl+A', action: st.selectAll },
    );
  }

  const x = Math.min(menu.x, window.innerWidth - 230);
  const y = Math.min(menu.y, window.innerHeight - items.length * 30 - 20);
  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it) => (
        <button
          key={it.label}
          className={it.sep ? 'sep' : ''}
          disabled={it.disabled}
          onClick={() => {
            st.set({ menu: null });
            it.action();
          }}
        >
          <span>{it.label}</span>
          {it.hint && <kbd>{it.hint}</kbd>}
        </button>
      ))}
    </div>
  );
}
