import { automocionSector, SectorConfig } from './automocion';
import { saludSector } from './salud';
import { construccionSector } from './construccion';
import { comercioSector } from './comercio';

export type { SectorConfig };
export type SectorType = 'automocion' | 'salud' | 'construccion' | 'comercio';

export const SECTORES_CONFIG: Record<SectorType, SectorConfig> = {
  automocion: automocionSector,
  salud: saludSector,
  construccion: construccionSector,
  comercio: comercioSector,
};

export const LISTA_SECTORES = [
  automocionSector,
  saludSector,
  construccionSector,
  comercioSector,
];
