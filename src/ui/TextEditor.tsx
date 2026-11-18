import { useEffect, useRef, useState } from 'react';
import type { TextObj, View } from '../types';
import { FONT, LINE_H, measureText } from '../canvas/textMeasure';
import { useStore } from '../store/useStore';

/** Zone de saisie superposée au canvas pour éditer un texte directement sur le plan. */
export function TextEditor({ obj, view }: { obj: TextObj; view: View }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(obj.text);
  const done = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.focus();
      ref.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    const st = useStore.getState();
    st.set({ editingTextId: null });
    const text = value.replace(/\s+$/, '');
    if (!text) {
      useStore.setState((s) => ({
        objects: s.objects.filter((o) => o.id !== obj.id),
        selection: s.selection.filter((id) => id !== obj.id),
      }));
    } else if (text !== obj.text) {
      st.updateObjects([obj.id], { text });
    }
  };

  const fs = obj.fontSize * view.ppm;
  const m = measureText(value || ' ', obj.fontSize, obj.bold);
  return (
    <textarea
      ref={ref}
      className="text-editor"
      value={value}
      spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          commit();
        }
      }}
      style={{
        left: obj.x * view.ppm + view.x,
        top: obj.y * view.ppm + view.y,
        width: m.width * view.ppm + fs,
        height: m.height * view.ppm + 4,
        fontSize: fs,
        lineHeight: LINE_H,
        fontFamily: FONT,
        fontWeight: obj.bold ? 'bold' : 'normal',
        color: obj.color,
        transform: `rotate(${obj.rotation}deg)`,
      }}
    />
  );
}
