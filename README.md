# Plan Voirie

Application web de dessin de plans vus du dessus, **à l'échelle et en mètres**, pour les plans de voirie et de collecte des déchets : rues, trottoirs, carrefours, véhicules, bennes à ordures ménagères (BOM), bacs et conteneurs.

Tout tourne dans le navigateur : aucun serveur, sauvegarde automatique dans le `localStorage`.

## Installation et lancement

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

Ouvrez ensuite http://localhost:5173.

Autres commandes :

| Commande | Rôle |
| --- | --- |
| `npm run typecheck` | Vérification TypeScript seule |
| `npm run build` | Vérification TypeScript + version de production dans `dist/` |
| `npm run preview` | Sert la version de production |

## Publication sur GitHub Pages

Le dépôt contient un workflow (`.github/workflows/deploy.yml`) qui construit et publie l'application à chaque push sur `main`.

1. Créez un dépôt sur GitHub et poussez-y la branche `main`.
2. Dans le dépôt : **Settings → Pages → Source : « GitHub Actions »** (à faire une seule fois).
3. Le prochain push (ou un lancement manuel dans l'onglet *Actions*) publie le site sur `https://<compte>.github.io/<dépôt>/`.

L'application utilise des chemins relatifs (`base: './'` dans `vite.config.ts`) : elle fonctionne quel que soit le nom du dépôt, sans configuration. Les plans restent enregistrés dans le navigateur de chaque utilisateur ; rien n'est envoyé au serveur.

## Prise en main (5 minutes)

1. **Fond de plan** : bouton *Fond de plan* (ou glissez une image sur le plan).
2. **Calibrer l'échelle** : cliquez deux points de l'image dont vous connaissez la distance, saisissez la distance réelle en mètres. L'image est redimensionnée puis verrouillée.
3. **Route** (touche `2`) : cliquez les points successifs, double-clic ou `Entrée` pour terminer. Tracez une seconde route par-dessus la première : le carrefour se forme tout seul.
4. **Bibliothèque** : glissez une *BOM 3 essieux* et des *Bacs 660 L* sur le plan (ou cliquez pour les ajouter au centre de la vue).
5. **Flèche** (touche `7`) : tracez-la, puis cochez *Courbe* dans les propriétés et déplacez le point de contrôle orange.
6. **Texte** (touche `8`) : cliquez sur le plan et saisissez « Point de collecte ».
7. **Cote** (touche `9`) : cliquez deux points, la distance s'affiche en mètres.
8. **Exporter PDF** : choisissez A3, paysage, complétez le cartouche, *Exporter*.

## Raccourcis clavier

### Outils

| Touche | Outil |
| --- | --- |
| `1` | Sélection |
| `2` | Route |
| `3` | Rectangle |
| `4` | Ellipse |
| `5` | Polygone |
| `6` | Ligne |
| `7` | Flèche |
| `8` | Texte |
| `9` | Cote (mesure) |

### Vue

| Action | Raccourci |
| --- | --- |
| Zoom centré sur le curseur | Molette |
| Déplacer la vue | `Espace` + glisser, ou clic molette + glisser |

### Tracé

| Action | Raccourci |
| --- | --- |
| Terminer une route / un polygone | Double-clic ou `Entrée` |
| Annuler le tracé en cours | `Échap` |
| Retirer le dernier point posé | `Retour arrière` |
| Contraindre l'angle à 15° | `Maj` pendant le tracé |
| Suspendre le magnétisme | `Alt` |

### Édition

| Action | Raccourci |
| --- | --- |
| Sélection multiple | `Maj` + clic, ou rectangle de sélection |
| Tout sélectionner | `Ctrl+A` |
| Déplacer de 0,1 m / 1 m | Flèches / `Maj` + flèches |
| Déplacer à l'horizontale ou à la verticale | `Maj` pendant le glisser |
| Rotation par pas de 15° | `Maj` pendant la rotation à la poignée |
| Copier / Coller / Dupliquer | `Ctrl+C` / `Ctrl+V` / `Ctrl+D` |
| Supprimer | `Suppr` |
| Annuler / Rétablir | `Ctrl+Z` / `Ctrl+Y` (ou `Ctrl+Maj+Z`) |
| Grouper / Dégrouper | `Ctrl+G` / `Ctrl+Maj+G` |
| Enregistrer en .json | `Ctrl+S` |
| Éditer un texte | Double-clic sur le texte (`Entrée` valide, `Maj+Entrée` saut de ligne) |

Le clic droit ouvre un menu avec copier, coller, dupliquer, supprimer, ordre d'empilement, verrouiller, grouper, dégrouper.

### Sommets des routes et polygones

- **Déplacer** : glissez un sommet (point bleu).
- **Ajouter** : cliquez un point intermédiaire (point blanc au milieu d'un segment), ou double-cliquez sur la route à l'endroit voulu.
- **Supprimer** : clic droit sur un sommet.

## À savoir

- **Unités** : toutes les valeurs (positions, dimensions, épaisseurs de trait, taille des textes) sont en mètres.
- **Routes et carrefours** : toutes les routes sont dessinées en passes successives (trottoirs de toutes les routes, bordures, enrobé, marquages). Deux routes superposées forment donc un carrefour sans calcul d'intersection. Les marquages traversent le carrefour ; posez un passage piéton ou un rectangle couleur enrobé pour les masquer si besoin.
- **Empilement** : les fonds de plan sont toujours en dessous. Un objet placé *sous la première route* dans l'ordre d'empilement (via « Arrière-plan ») passe sous les routes ; les autres sont au-dessus.
- **Objets verrouillés** : ils ne sont plus sélectionnables. Pour les déverrouiller : clic droit dessus, ou panneau de droite sans sélection (« Tout déverrouiller », cadenas du fond de plan).
- **Groupes** : cliquer un objet groupé sélectionne tout le groupe. Les boutons de rotation ±15° du panneau font pivoter n'importe quelle sélection autour de son centre.
- **Sauvegarde automatique** : le plan est enregistré dans le `localStorage` du navigateur. Les images de fond volumineuses sont réduites à 3000 px ; si le quota du navigateur est dépassé, un message vous invite à enregistrer en `.json`.
- **PDF** : le plan est rendu en image à 200 dpi à une échelle normalisée (1:100, 1:200…) ; le cadre, le cartouche et la barre d'échelle sont vectoriels. En échelle « Automatique » avec une grande photo aérienne, choisissez la zone « Vue actuelle » pour cadrer sur ce qui est à l'écran.

## Format de fichier (.json)

```jsonc
{
  "app": "plan-voirie",
  "version": 1,                 // version du format
  "meta": { "title": "…", "author": "…" },
  "settings": { "gridVisible": true, "snapEnabled": true, "snapStep": 0.5 },
  "objects": [ /* tous les objets, dans l'ordre d'empilement ; les fonds de plan sont des objets "image" avec src en base64 */ ]
}
```

Les types de tous les objets sont décrits dans `src/types.ts`. Les migrations de version se font dans `parsePlan` (`src/store/persistence.ts`).

## Organisation du code

```
src/
  types.ts              Modèle de données (tout en mètres)
  constants.ts          Couleurs, paramètres de dessin des routes, couleurs de couvercles
  factories.ts          Création des objets avec leurs valeurs par défaut
  geometry/
    math.ts             Distances, magnétisme, boîtes englobantes, translation/rotation d'objets
    road.ts             Arrondi des angles et décalage de polylignes (trottoirs, marquages)
    handles.ts          Édition des sommets
  store/
    useStore.ts         État Zustand : objets, sélection, historique annuler/rétablir, vue
    persistence.ts      Format .json versionné et sauvegarde automatique
    files.ts            Ouvrir / enregistrer / importer une image
  library/
    catalog.ts          ★ Configuration de la bibliothèque (dimensions par défaut)
    symbols/            Dessins vectoriels : Vehicles, Bom, Containers, RoadElements
  canvas/
    CanvasStage.tsx     Scène Konva : zoom, déplacement, outils, sélection, Transformer
    grid.ts, scaleBar.ts  Grille et barre d'échelle (écran + exports)
    Handles.tsx, Drafts.tsx  Poignées de sommets, aperçu du tracé en cours
    objects/            Un fichier de rendu par type d'objet (RoadView, ArrowView, TextView…)
  ui/                   Barre du haut, outils, bibliothèque, propriétés, menus, dialogues
  export/               Rendu hors écran, export PNG et PDF
  hooks/useKeyboard.ts  Raccourcis clavier
```

## Ajouter un symbole à la bibliothèque

### Cas 1 — une variante d'un dessin existant (le plus courant)

Ajoutez une ligne dans `CATALOG` (`src/library/catalog.ts`). Le dessin s'adapte aux dimensions.

```ts
{ id: 'residuel-500', label: 'Résiduels 500 L', category: 'residuel', kind: 'bin',
  length: 1.26, width: 0.66, color: '#2b2f36', wheels: 4 },
```

- `id` : identifiant unique, enregistré dans les fichiers `.json` (ne le renommez pas ensuite).
- `category` : `bom`, `papier`, `pmc`, `alimentaire`, `verre`, `residuel`, `apport`, `vl` ou `voirie` (liste `CATEGORIES` du même fichier).
- `kind` : le dessin utilisé — `car`, `van`, `bom`, `bin`, `column`, `buried`, `skip`, `crosswalk`, `parking`, `parkingAngled`, `turnaround`.
- `length` × `width` : dimensions par défaut en mètres (longueur × largeur).

Pour modifier une dimension par défaut, changez simplement `length` / `width` dans ce fichier.

### Cas 2 — un nouveau dessin

1. Ajoutez le nom du dessin au type `SymbolKind` dans `src/library/catalog.ts`.
2. Créez le composant dans `src/library/symbols/`, par exemple `Composteur.tsx` :

   ```tsx
   import { Circle, Rect } from 'react-konva';
   import type { SymbolRenderProps } from './types';

   // Le dessin est centré sur (0, 0), en mètres : il occupe [-w/2, w/2] × [-h/2, h/2].
   // Pour un véhicule, l'avant est du côté +X.
   export function ComposterSymbol({ w, h, color }: SymbolRenderProps) {
     return (
       <>
         <Rect x={-w / 2} y={-h / 2} width={w} height={h} cornerRadius={0.05}
               fill={color} stroke="#1f2937" strokeWidth={0.03} />
         <Circle radius={Math.min(w, h) * 0.2} fill="#1f2937" />
       </>
     );
   }
   ```

3. Enregistrez-le dans `src/library/symbols/index.ts` :

   ```ts
   export const SYMBOL_RENDERERS = { /* … */ composter: ComposterSymbol };
   ```

4. Ajoutez l'entrée dans `CATALOG` avec `kind: 'composter'`.

Le symbole apparaît alors dans la bibliothèque (vignette générée automatiquement) et hérite du déplacement, de la rotation, du redimensionnement, de la couleur et de l'étiquette.

## Licence

Plan Voirie est un logiciel libre, distribué sous la licence **GNU Affero General Public License, version 3 ou ultérieure** (AGPL-3.0-or-later). Le texte complet est dans le fichier [LICENSE](LICENSE).

Copyright © 2026 MESTER Thomas

En résumé (seul le texte de la licence fait foi) :

- **Vous pouvez** utiliser l'outil librement, y compris dans un cadre professionnel, l'étudier, le modifier et le redistribuer.
- **Vous devez** conserver les mentions de copyright et de licence, et indiquer vos modifications.
- **Vous devez** publier le code source de toute version modifiée que vous distribuez ou que vous mettez en ligne pour d'autres utilisateurs, sous cette même licence.
- **Vous ne pouvez pas** intégrer ce code dans un logiciel fermé ni le redistribuer sous une licence plus restrictive.

Le logiciel est fourni sans aucune garantie.
