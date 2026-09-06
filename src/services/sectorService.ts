import { SECTORES_CONFIG, SectorConfig, SectorType } from '../config/sectores'

const SECTOR_STORAGE_KEY = 'gestarian_selected_sector'

export const sectorService = {
  getCurrentSector(): SectorType {
    try {
      const stored = localStorage.getItem(SECTOR_STORAGE_KEY) as SectorType
      if (stored && SECTORES_CONFIG[stored]) {
        return stored
      }
    } catch {}
    return 'automocion'
  },

  setSector(sector: SectorType) {
    try {
      localStorage.setItem(SECTOR_STORAGE_KEY, sector)
      window.dispatchEvent(new CustomEvent('gestarian-sector-changed', { detail: sector }))
    } catch {}
  },

  getConfig(sector?: SectorType): SectorConfig {
    const s = sector || this.getCurrentSector()
    return SECTORES_CONFIG[s] || SECTORES_CONFIG.automocion
  }
}
