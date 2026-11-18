import {
  Circle, Minus, MousePointer2, MoveUpRight, Pentagon, Route, Ruler, Square, Type,
} from 'lucide-react';
import type { Tool } from '../types';
import { useStore } from '../store/useStore';

export const TOOLS: { id: Tool; label: string; key: string; icon: typeof Square }[] = [
  { id: 'select', label: 'Sélection', key: '1', icon: MousePointer2 },
  { id: 'road', label: 'Route', key: '2', icon: Route },
  { id: 'rect', label: 'Rectangle', key: '3', icon: Square },
  { id: 'ellipse', label: 'Ellipse', key: '4', icon: Circle },
  { id: 'polygon', label: 'Polygone', key: '5', icon: Pentagon },
  { id: 'line', label: 'Ligne', key: '6', icon: Minus },
  { id: 'arrow', label: 'Flèche', key: '7', icon: MoveUpRight },
  { id: 'text', label: 'Texte', key: '8', icon: Type },
  { id: 'dimension', label: 'Cote (mesure)', key: '9', icon: Ruler },
];

export function Toolbar() {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  return (
    <nav className="toolbar" aria-label="Outils">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={tool === t.id ? 'active' : ''}
          title={`${t.label} (${t.key})`}
          aria-label={t.label}
          onClick={() => setTool(t.id)}
        >
          <t.icon size={19} />
          <span>{t.label.split(' ')[0]}</span>
        </button>
      ))}
    </nav>
  );
}
