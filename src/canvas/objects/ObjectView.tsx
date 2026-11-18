import { memo } from 'react';
import type { PlanObject } from '../../types';
import { ArrowView } from './ArrowView';
import { DimensionView } from './DimensionView';
import { ImageView } from './ImageView';
import { EllipseView, LineView, PolygonView, RectView } from './ShapeViews';
import { SymbolView } from './SymbolView';
import { TextView } from './TextView';

/** Aiguillage vers le rendu de chaque type d'objet (les routes sont à part : RoadsView). */
export const ObjectView = memo(function ObjectView({
  obj, ppm, editing,
}: { obj: PlanObject; ppm: number; editing?: boolean }) {
  switch (obj.type) {
    case 'rect': return <RectView obj={obj} ppm={ppm} />;
    case 'ellipse': return <EllipseView obj={obj} ppm={ppm} />;
    case 'polygon': return <PolygonView obj={obj} ppm={ppm} />;
    case 'line': return <LineView obj={obj} ppm={ppm} />;
    case 'arrow': return <ArrowView obj={obj} ppm={ppm} />;
    case 'text': return <TextView obj={obj} editing={editing} />;
    case 'dimension': return <DimensionView obj={obj} ppm={ppm} />;
    case 'symbol': return <SymbolView obj={obj} />;
    case 'image': return <ImageView obj={obj} />;
    default: return null;
  }
});
