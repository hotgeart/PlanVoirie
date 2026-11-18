export const MIN_PPM = 1.5;
export const MAX_PPM = 400;
export const DEFAULT_PPM = 30;

export const COLORS = {
  asphalt: '#5a5f66',
  sidewalk: '#d6d5cf',
  sidewalkEdge: '#8f8e88',
  curb: '#9b9a94',
  marking: '#ffffff',
  selection: '#2563eb',
};

/** Paramètres de dessin des routes (m). */
export const ROAD = {
  markingWidth: 0.12,
  dash: [3, 3],
  edgeInset: 0.25,
  curbWidth: 0.15,
  sidewalkOutline: 0.06,
};

/** Couleurs de couvercle proposées pour les bacs. */
export const LID_COLORS = [
  { id: 'gris', label: 'Gris', value: '#6b7280' },
  { id: 'jaune', label: 'Jaune', value: '#f2c200' },
  { id: 'vert', label: 'Vert', value: '#2e9e4f' },
  { id: 'marron', label: 'Marron', value: '#7a4a21' },
  { id: 'bleu', label: 'Bleu', value: '#1f6fd1' },
  { id: 'orange', label: 'Orange', value: '#f26a1b' },
  { id: 'noir', label: 'Noir', value: '#2b2f36' },
];

export const SNAP_STEPS = [1, 0.5, 0.25, 0.1];

export const TOOL_HINTS: Record<string, string> = {
  select: 'Cliquez pour sélectionner, glissez pour déplacer. Maj + clic : sélection multiple. Espace + glisser : déplacer la vue.',
  road: 'Cliquez pour poser les points de la route. Double-clic ou Entrée pour terminer, Échap pour annuler.',
  rect: 'Cliquez-glissez (ou deux clics) pour tracer un rectangle.',
  ellipse: 'Cliquez-glissez (ou deux clics) pour tracer une ellipse.',
  polygon: 'Cliquez pour poser les sommets. Double-clic ou Entrée pour fermer le polygone.',
  line: 'Cliquez deux points (ou glissez) pour tracer une ligne. Maj : angles de 15°.',
  arrow: 'Cliquez deux points (ou glissez) pour tracer une flèche. Cochez « Courbe » dans les propriétés.',
  text: 'Cliquez sur le plan pour placer un texte.',
  dimension: 'Cliquez deux points pour mesurer une distance.',
  calibrate: "Cliquez deux points de l'image dont vous connaissez la distance réelle.",
};
