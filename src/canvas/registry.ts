import type Konva from 'konva';

/** Accès au groupe Konva contenant le plan (utilisé par les exports). */
let world: Konva.Group | null = null;
export const setWorldNode = (g: Konva.Group | null) => {
  world = g;
};
export const getWorldNode = () => world;
