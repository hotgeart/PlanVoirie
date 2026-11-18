/**
 * CONFIGURATION DE LA BIBLIOTHÈQUE
 * --------------------------------
 * Toutes les dimensions sont en mètres, vues du dessus :
 *   length = longueur (axe X du symbole ; l'avant d'un véhicule est côté +X)
 *   width  = largeur  (axe Y du symbole)
 *
 * Pour ajouter un élément : ajoutez une entrée dans CATALOG en réutilisant un
 * `kind` existant (le dessin s'adapte aux dimensions), ou créez un nouveau
 * dessin dans src/library/symbols/ (voir le README).
 */

export type SymbolKind =
  | 'car'
  | 'van'
  | 'bom'
  | 'bin'
  | 'column'
  | 'buried'
  | 'skip'
  | 'crosswalk'
  | 'parking'
  | 'parkingAngled'
  | 'turnaround'
  | 'tree'
  | 'planter'
  | 'litter'
  | 'nadar'
  | 'trafficLight'
  | 'noParking';

export type CategoryId =
  | 'vl' | 'bom' | 'bacs' | 'apport' | 'voirie' | 'vegetation'
  | 'papier' | 'pmc' | 'alimentaire' | 'verre' | 'residuel';

export interface SymbolDef {
  id: string;
  label: string;
  category: CategoryId;
  /** Dessin utilisé (voir src/library/symbols/index.ts). */
  kind: SymbolKind;
  length: number;
  width: number;
  /** Couleur principale par défaut (carrosserie, caisson, couvercle…). */
  color: string;
  /** Si présent : une de ces couleurs est tirée au hasard à chaque ajout sur le plan. */
  colors?: string[];
  /** Symbole rond : proportions conservées, réglé par son diamètre. */
  round?: boolean;
  /** BOM : nombre d'essieux. */
  axles?: number;
  /** Bacs : 2 ou 4 roues (0 = petit bac sans roues). */
  wheels?: 0 | 2 | 4;
  /** Stationnement : nombre de places par défaut. */
  count?: number;
  /** Stationnement en épi : angle par défaut (degrés). */
  angle?: number;
}

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'bom', label: 'Bennes à ordures (BOM)' },
  { id: 'papier', label: 'Papier-carton (jaune)' },
  { id: 'pmc', label: 'PMC (bleu)' },
  { id: 'alimentaire', label: 'Déchets alimentaires (orange)' },
  { id: 'verre', label: 'Verres transparents (vert)' },
  { id: 'residuel', label: 'Déchets résiduels (gris/noir)' },
  { id: 'apport', label: 'Apport volontaire et bennes' },
  { id: 'vl', label: 'Véhicules légers' },
  { id: 'voirie', label: 'Éléments de voirie' },
  { id: 'vegetation', label: 'Végétation et mobilier urbain' },
];

/** Couleurs de carrosserie tirées au hasard pour les voitures (modifiable ensuite dans les propriétés). */
export const CAR_COLORS = ['#eceff1', '#9aa3ad', '#c0392b', '#34568b'];

const GRIS = '#6b7280';
const JAUNE = '#f2c200';
const VERT = '#2e9e4f';

/** Dimensions au sol des conteneurs, par contenance en litres. */
const BIN_SIZES: Record<number, { length: number; width: number; wheels: 0 | 2 | 4 }> = {
  25: { length: 0.4, width: 0.32, wheels: 0 },
  140: { length: 0.5, width: 0.55, wheels: 2 },
  240: { length: 0.58, width: 0.74, wheels: 2 },
  660: { length: 1.36, width: 0.77, wheels: 4 },
  1100: { length: 1.37, width: 1.07, wheels: 4 },
};

/** Fractions de déchets : couleur du conteneur et contenances proposées. */
const FRACTIONS: { id: CategoryId; label: string; color: string; sizes: number[] }[] = [
  { id: 'papier', label: 'Papier-carton', color: JAUNE, sizes: [240, 660, 1100] },
  { id: 'pmc', label: 'PMC', color: '#1f6fd1', sizes: [240, 660, 1100] },
  { id: 'alimentaire', label: 'Alimentaires', color: '#f26a1b', sizes: [25, 140, 240] },
  { id: 'verre', label: 'Verre', color: '#2f7d3a', sizes: [140, 240] },
  { id: 'residuel', label: 'Résiduels', color: '#2b2f36', sizes: [140, 240, 660, 1100] },
];

export const CATALOG: SymbolDef[] = [
  // --- Bennes à ordures ménagères ---
  { id: 'bom-2', label: 'BOM 2 essieux', category: 'bom', kind: 'bom', length: 8.0, width: 2.5, color: '#2f8f5b', axles: 2 },
  { id: 'bom-3', label: 'BOM 3 essieux', category: 'bom', kind: 'bom', length: 9.5, width: 2.5, color: '#2f8f5b', axles: 3 },
  { id: 'mini-benne', label: 'Mini-benne', category: 'bom', kind: 'bom', length: 6.0, width: 2.2, color: '#2f8f5b', axles: 2 },

  // --- Conteneurs par fraction (gamme Bruxelles-Propreté) ---
  // length = côté charnière/poignée (largeur du bac vu de face), width = profondeur
  ...FRACTIONS.flatMap((f) =>
    f.sizes.map((s): SymbolDef => ({
      id: `${f.id}-${s}`,
      label: `${f.label} ${s} L`,
      category: f.id,
      kind: 'bin',
      color: f.color,
      ...BIN_SIZES[s],
    })),
  ),

  // --- Anciens bacs : retirés de la bibliothèque (catégorie 'bacs' non affichée),
  //     conservés pour que les plans déjà enregistrés qui les utilisent s'affichent encore ---
  { id: 'bac-120', label: 'Bac 120 L', category: 'bacs', kind: 'bin', length: 0.48, width: 0.55, color: GRIS, wheels: 2 },
  { id: 'bac-240', label: 'Bac 240 L', category: 'bacs', kind: 'bin', length: 0.58, width: 0.73, color: JAUNE, wheels: 2 },
  { id: 'bac-360', label: 'Bac 360 L', category: 'bacs', kind: 'bin', length: 0.67, width: 0.88, color: VERT, wheels: 2 },
  { id: 'bac-660', label: 'Bac 660 L', category: 'bacs', kind: 'bin', length: 1.26, width: 0.78, color: GRIS, wheels: 4 },
  { id: 'bac-770', label: 'Bac 770 L', category: 'bacs', kind: 'bin', length: 1.26, width: 0.78, color: JAUNE, wheels: 4 },
  { id: 'bac-1100', label: 'Bac 1100 L', category: 'bacs', kind: 'bin', length: 1.37, width: 1.08, color: VERT, wheels: 4 },

  // --- Apport volontaire et bennes ---
  { id: 'colonne-aerienne', label: 'Colonne aérienne', category: 'apport', kind: 'column', length: 1.5, width: 1.5, color: VERT },
  { id: 'conteneur-enterre', label: 'Conteneur enterré', category: 'apport', kind: 'buried', length: 2.0, width: 2.0, color: GRIS },
  { id: 'benne-ampliroll', label: 'Benne ampliroll', category: 'apport', kind: 'skip', length: 6.0, width: 2.5, color: '#3b6ea5' },

  // --- Véhicules légers ---
  { id: 'citadine', label: 'Voiture citadine', category: 'vl', kind: 'car', length: 4.0, width: 1.75, color: '#c0392b', colors: CAR_COLORS },
  { id: 'berline', label: 'Berline', category: 'vl', kind: 'car', length: 4.7, width: 1.85, color: '#34568b', colors: CAR_COLORS },
  { id: 'utilitaire', label: 'Utilitaire', category: 'vl', kind: 'van', length: 5.5, width: 2.0, color: '#eceff1' },

  // --- Éléments de voirie ---
  { id: 'passage-pieton', label: 'Passage piéton', category: 'voirie', kind: 'crosswalk', length: 6.0, width: 3.0, color: '#ffffff' },
  { id: 'stationnement-long', label: 'Stationnement longitudinal', category: 'voirie', kind: 'parking', length: 10.0, width: 2.0, color: '#5a5f66', count: 2 },
  { id: 'stationnement-epi', label: 'Stationnement en épi', category: 'voirie', kind: 'parkingAngled', length: 11.6, width: 5.0, color: '#5a5f66', count: 3, angle: 60 },
  { id: 'aire-retournement', label: 'Aire de retournement', category: 'voirie', kind: 'turnaround', length: 18.0, width: 18.0, color: '#5a5f66', round: true },

  // Signalisation : pictogrammes vus de face, agrandis pour rester lisibles sur le plan
  { id: 'feu-tricolore', label: 'Feu tricolore', category: 'voirie', kind: 'trafficLight', length: 0.5, width: 1.2, color: '#1f2937' },
  { id: 'stationnement-interdit', label: 'Stationnement interdit', category: 'voirie', kind: 'noParking', length: 0.8, width: 0.8, color: '#1c5bb8', round: true },

  // --- Végétation et mobilier urbain (symboles ronds : length = width = diamètre) ---
  { id: 'arbre', label: 'Arbre', category: 'vegetation', kind: 'tree', length: 5.0, width: 5.0, color: '#4c9a3f', round: true },
  { id: 'arbuste', label: 'Arbuste', category: 'vegetation', kind: 'tree', length: 1.5, width: 1.5, color: '#5fa84a', round: true },
  { id: 'bac-fleurs', label: 'Bac à fleurs', category: 'vegetation', kind: 'planter', length: 2.0, width: 0.6, color: '#9a9da3' },
  { id: 'poubelle-publique', label: 'Poubelle publique', category: 'vegetation', kind: 'litter', length: 0.5, width: 0.5, color: '#3d6b4a', round: true },
  { id: 'barriere-nadar', label: 'Barrière Nadar', category: 'vegetation', kind: 'nadar', length: 2.5, width: 0.5, color: '#aab3bd' },
];

const byId = new Map(CATALOG.map((d) => [d.id, d]));
export const getSymbolDef = (id: string): SymbolDef => byId.get(id) ?? CATALOG[0];
