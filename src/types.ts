/**
 * Modèle de données du plan.
 * TOUTES les coordonnées et dimensions sont en MÈTRES (y vers le bas),
 * les angles en degrés. Le rendu convertit avec un facteur px/m (zoom).
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Propriétés communes à tous les objets. */
export interface BaseObj {
  id: string;
  locked?: boolean;
  /** Les objets partageant le même groupId sont sélectionnés ensemble. */
  groupId?: string;
}

export interface StrokeProps {
  stroke: string;
  /** Épaisseur du trait en mètres. */
  strokeWidth: number;
  dashed: boolean;
}

/** Textures de remplissage disponibles (dessinées dans src/canvas/textures.ts). */
export type FillPattern = 'grass' | 'gravel' | 'sand';

export interface FillProps {
  fill: string;
  /** 0 = pas de remplissage, 1 = opaque. */
  fillOpacity: number;
  /** Texture de remplissage ; absent = couleur unie (`fill`). */
  fillPattern?: FillPattern;
}

/** Objet « boîte » : x,y = CENTRE, rotation autour du centre. */
export interface BoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// ---------- Routes ----------

export interface Sidewalk {
  enabled: boolean;
  width: number;
}

export type CenterMarking = 'none' | 'dashed' | 'solid';

export interface RoadObj extends BaseObj {
  type: 'road';
  /** Axe de la chaussée. « Gauche » = à gauche dans le sens du tracé. */
  points: Pt[];
  width: number;
  lanes: number;
  centerMarking: CenterMarking;
  edgeLines: boolean;
  sidewalkLeft: Sidewalk;
  sidewalkRight: Sidewalk;
  curb: boolean;
  rounded: boolean;
  radius: number;
}

// ---------- Formes ----------

export interface RectObj extends BaseObj, BoxProps, StrokeProps, FillProps {
  type: 'rect';
}

export interface EllipseObj extends BaseObj, BoxProps, StrokeProps, FillProps {
  type: 'ellipse';
}

export interface PolygonObj extends BaseObj, StrokeProps, FillProps {
  type: 'polygon';
  points: Pt[];
}

export interface LineObj extends BaseObj, StrokeProps {
  type: 'line';
  points: Pt[]; // 2 points
}

export interface ArrowObj extends BaseObj, StrokeProps {
  type: 'arrow';
  points: Pt[]; // 2 points : début, fin
  curved: boolean;
  /** Point par lequel passe la courbe (à mi-parcours). */
  control: Pt;
  headStart: boolean;
  headEnd: boolean;
}

export interface TextObj extends BaseObj {
  type: 'text';
  /** Coin haut-gauche ; rotation autour de ce point. */
  x: number;
  y: number;
  rotation: number;
  text: string;
  /** Hauteur de police en mètres. */
  fontSize: number;
  color: string;
  bold: boolean;
  background: boolean;
  backgroundColor: string;
}

export interface DimensionObj extends BaseObj {
  type: 'dimension';
  points: Pt[]; // 2 points mesurés
  /** Décalage de la ligne de cote par rapport aux points (m). */
  offset: number;
  color: string;
  fontSize: number;
}

// ---------- Bibliothèque ----------

export interface SymbolObj extends BaseObj, BoxProps {
  type: 'symbol';
  /** Identifiant dans src/library/catalog.ts. width = longueur, height = largeur. */
  symbolId: string;
  color: string;
  label: string;
  showStabilizers?: boolean;
  showManeuverZone?: boolean;
  /** Variante de dessin (ex. style d'arbre) ; absent = style par défaut. */
  variant?: string;
  /** Nombre de places (stationnement). */
  count?: number;
  /** Angle des places en épi (degrés). */
  angle?: number;
}

// ---------- Fond de plan ----------

export interface ImageObj extends BaseObj, BoxProps {
  type: 'image';
  name: string;
  /** Image encodée en base64 (data URL). */
  src: string;
  opacity: number;
}

export type PlanObject =
  | RoadObj
  | RectObj
  | EllipseObj
  | PolygonObj
  | LineObj
  | ArrowObj
  | TextObj
  | DimensionObj
  | SymbolObj
  | ImageObj;

export type BoxObject = RectObj | EllipseObj | SymbolObj | ImageObj;
export type PointsObject = RoadObj | PolygonObj | LineObj | ArrowObj | DimensionObj;

// ---------- Document ----------

export interface PlanMeta {
  title: string;
  author: string;
}

export interface PlanSettings {
  gridVisible: boolean;
  snapEnabled: boolean;
  snapStep: number;
}

/** Format du fichier .json enregistré. */
export interface PlanFile {
  app: 'plan-voirie';
  version: number;
  meta: PlanMeta;
  settings: PlanSettings;
  objects: PlanObject[];
}

export type Tool =
  | 'select'
  | 'road'
  | 'rect'
  | 'ellipse'
  | 'polygon'
  | 'line'
  | 'arrow'
  | 'text'
  | 'dimension'
  | 'calibrate';

export interface View {
  /** Position écran (px) de l'origine du plan. */
  x: number;
  y: number;
  /** Pixels par mètre. */
  ppm: number;
}
