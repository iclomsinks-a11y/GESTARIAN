export interface PartCatalogItem {
  id: string
  referencia: string
  nombre: string
  categoria: string
  pvpRecomendado: number
  tiempoEstimadoHoras: number
}

export const COMMON_PARTS: PartCatalogItem[] = [
  { id: '1', referencia: 'ACE-5W30-4L', nombre: 'Aceite Sintético 5W-30 (4 Litros)', categoria: 'Mantenimiento', pvpRecomendado: 45.0, tiempoEstimadoHoras: 0.5 },
  { id: '2', referencia: 'FILT-ACE-01', nombre: 'Filtro de Aceite Cartucho', categoria: 'Filtros', pvpRecomendado: 14.5, tiempoEstimadoHoras: 0.2 },
  { id: '3', referencia: 'FILT-AIRE-01', nombre: 'Filtro de Aire Motor', categoria: 'Filtros', pvpRecomendado: 19.8, tiempoEstimadoHoras: 0.2 },
  { id: '4', referencia: 'PAST-DEL-01', nombre: 'Juego de Pastillas Freno Delanteras', categoria: 'Frenos', pvpRecomendado: 65.0, tiempoEstimadoHoras: 0.8 },
  { id: '5', referencia: 'DISC-DEL-01', nombre: 'Juego de Discos Ventilados Delanteros', categoria: 'Frenos', pvpRecomendado: 120.0, tiempoEstimadoHoras: 1.0 },
  { id: '6', referencia: 'BATE-70AH', nombre: 'Batería 12V 70Ah 640A Start-Stop', categoria: 'Electricidad', pvpRecomendado: 110.0, tiempoEstimadoHoras: 0.4 },
]

export const aiCatalogService = {
  searchParts(query: string): PartCatalogItem[] {
    const q = query.toLowerCase().trim()
    if (!q) return COMMON_PARTS
    return COMMON_PARTS.filter(p => p.nombre.toLowerCase().includes(q) || p.referencia.toLowerCase().includes(q))
  }
}
