import type { SymbolDef } from '../catalog';

/**
 * Propriétés reçues par chaque dessin de symbole.
 * Le dessin est centré sur (0, 0), en mètres : il occupe [-w/2, w/2] × [-h/2, h/2].
 * Pour un véhicule, l'avant est du côté +X.
 */
export interface SymbolRenderProps {
  w: number;
  h: number;
  color: string;
  def: SymbolDef;
  showStabilizers?: boolean;
  showManeuverZone?: boolean;
  /** Variante de dessin (ex. style d'arbre). */
  variant?: string;
  count?: number;
  angle?: number;
}

export const OUTLINE = '#1f2937';
export const GLASS = '#263445';
