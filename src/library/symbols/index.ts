import type { ComponentType } from 'react';
import type { SymbolKind } from '../catalog';
import type { SymbolRenderProps } from './types';
import { CarSymbol, VanSymbol } from './Vehicles';
import { BomSymbol } from './Bom';
import { BinSymbol, BuriedSymbol, ColumnSymbol, SkipSymbol } from './Containers';
import { LitterBinSymbol, PlanterSymbol, TreeSymbol } from './Vegetation';
import {
  CrosswalkSymbol, NadarSymbol, NoParkingSymbol, ParkingAngledSymbol, ParkingSymbol, TrafficLightSymbol, TurnaroundSymbol,
} from './RoadElements';

/** Associe chaque `kind` du catalogue à son dessin vectoriel. */
export const SYMBOL_RENDERERS: Record<SymbolKind, ComponentType<SymbolRenderProps>> = {
  car: CarSymbol,
  van: VanSymbol,
  bom: BomSymbol,
  bin: BinSymbol,
  column: ColumnSymbol,
  buried: BuriedSymbol,
  skip: SkipSymbol,
  crosswalk: CrosswalkSymbol,
  parking: ParkingSymbol,
  parkingAngled: ParkingAngledSymbol,
  turnaround: TurnaroundSymbol,
  tree: TreeSymbol,
  planter: PlanterSymbol,
  litter: LitterBinSymbol,
  nadar: NadarSymbol,
  trafficLight: TrafficLightSymbol,
  noParking: NoParkingSymbol,
};
