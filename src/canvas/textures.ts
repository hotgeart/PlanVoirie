/**
 * Textures de remplissage générées par le code (aucune image externe).
 * Chaque tuile se répète sans raccord visible et représente TILE_METERS mètres au sol.
 *
 * Pour ajouter une texture : ajoutez son nom à FillPattern (src/types.ts), une entrée
 * dans TEXTURES ci-dessous, et son libellé dans FILL_PATTERN_LABELS.
 */
import type { FillPattern } from '../types';

const TILE_PX = 256;
const TILE_METERS = 3;
/** Échelle à appliquer au motif pour qu'il soit à l'échelle du plan (m par pixel de tuile). */
export const TEXTURE_SCALE = TILE_METERS / TILE_PX;

export const FILL_PATTERN_LABELS: Record<FillPattern, string> = {
  grass: 'Herbe',
  gravel: 'Gravier',
  sand: 'Sable',
};

type Rand = () => number;
/** Dessine un élément et ses copies décalées d'une tuile, pour que les bords se raccordent. */
type Wrapped = (draw: (ox: number, oy: number) => void) => void;
type Painter = (g: CanvasRenderingContext2D, rand: Rand, wrapped: Wrapped) => void;

const pick = <T,>(rand: Rand, arr: T[]) => arr[Math.floor(rand() * arr.length)];

/** Grandes taches claires et foncées : variation d'ensemble. */
function blotches(g: CanvasRenderingContext2D, rand: Rand, wrapped: Wrapped, count: number, dark: string, light: string) {
  for (let i = 0; i < count; i++) {
    const x = rand() * TILE_PX, y = rand() * TILE_PX, r = 14 + rand() * 30;
    const color = rand() < 0.5 ? dark : light;
    wrapped((ox, oy) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      g.fill();
    });
  }
}

const TEXTURES: Record<FillPattern, { base: string; paint: Painter }> = {
  grass: {
    base: '#74a84e',
    paint: (g, rand, wrapped) => {
      blotches(g, rand, wrapped, 26, 'rgba(52,104,40,0.16)', 'rgba(170,205,110,0.16)');
      const greens = ['#4f8a36', '#5e9a40', '#86b85a', '#99c46a', '#3f7a2e', '#6aa045'];
      g.lineCap = 'round';
      for (let i = 0; i < 2600; i++) {
        const x = rand() * TILE_PX, y = rand() * TILE_PX;
        const a = rand() * Math.PI * 2, len = 3 + rand() * 6;
        const color = pick(rand, greens);
        const lw = 0.8 + rand() * 1.2;
        wrapped((ox, oy) => {
          g.strokeStyle = color;
          g.lineWidth = lw;
          g.beginPath();
          g.moveTo(x + ox, y + oy);
          g.lineTo(x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len);
          g.stroke();
        });
      }
    },
  },

  gravel: {
    base: '#a39d93',
    paint: (g, rand, wrapped) => {
      blotches(g, rand, wrapped, 18, 'rgba(70,66,60,0.12)', 'rgba(225,220,210,0.12)');
      const stones = ['#c9c4ba', '#b3ada2', '#d8d3ca', '#8f8a81', '#bfb7a6', '#9c958a', '#e2ded6', '#7e7971'];
      // Cailloux : petites ellipses orientées au hasard, avec une ombre décalée
      for (let i = 0; i < 1500; i++) {
        const x = rand() * TILE_PX, y = rand() * TILE_PX;
        const rx = 1.8 + rand() * 3.6, ry = rx * (0.55 + rand() * 0.4);
        const a = rand() * Math.PI;
        const color = pick(rand, stones);
        wrapped((ox, oy) => {
          g.fillStyle = 'rgba(40,38,34,0.35)';
          g.beginPath();
          g.ellipse(x + ox + 0.8, y + oy + 0.9, rx, ry, a, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = color;
          g.beginPath();
          g.ellipse(x + ox, y + oy, rx, ry, a, 0, Math.PI * 2);
          g.fill();
        });
      }
    },
  },

  sand: {
    base: '#e2cc9a',
    paint: (g, rand, wrapped) => {
      blotches(g, rand, wrapped, 30, 'rgba(176,140,84,0.13)', 'rgba(250,238,205,0.2)');
      // Grains fins clairs et foncés
      const grains = ['rgba(150,118,70,0.55)', 'rgba(245,232,200,0.75)', 'rgba(196,164,108,0.6)', 'rgba(120,96,60,0.4)'];
      for (let i = 0; i < 5200; i++) {
        const x = rand() * TILE_PX, y = rand() * TILE_PX;
        const s = 0.6 + rand() * 1.1;
        const color = pick(rand, grains);
        wrapped((ox, oy) => {
          g.fillStyle = color;
          g.fillRect(x + ox, y + oy, s, s);
        });
      }
    },
  },
};

const cache = new Map<string, HTMLCanvasElement>();

/** Générateur pseudo-aléatoire à graine fixe : la texture est identique à chaque lancement. */
function rng(seed: number): Rand {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Tuile de texture vue du dessus, à l'opacité demandée (0 à 1). */
export function textureTile(pattern: FillPattern, opacity: number): HTMLCanvasElement {
  const level = Math.round(Math.min(1, Math.max(0, opacity)) * 20);
  const key = `${pattern}:${level}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const c = document.createElement('canvas');
  c.width = TILE_PX;
  c.height = TILE_PX;
  const g = c.getContext('2d')!;
  const tex = TEXTURES[pattern] ?? TEXTURES.grass;
  // Dessin opaque d'abord, puis recopie à l'opacité voulue (sinon les éléments superposés se cumulent)
  g.fillStyle = tex.base;
  g.fillRect(0, 0, TILE_PX, TILE_PX);
  tex.paint(g, rng(20261118), (draw) => {
    for (const ox of [-TILE_PX, 0, TILE_PX]) for (const oy of [-TILE_PX, 0, TILE_PX]) draw(ox, oy);
  });
  let out = c;
  if (level < 20) {
    out = document.createElement('canvas');
    out.width = TILE_PX;
    out.height = TILE_PX;
    const og = out.getContext('2d')!;
    og.globalAlpha = level / 20;
    og.drawImage(c, 0, 0);
  }
  cache.set(key, out);
  return out;
}
