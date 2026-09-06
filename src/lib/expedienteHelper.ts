/**
 * src/lib/expedienteHelper.ts
 * Utilidades para generación y resolución consistente del Número de Expediente
 * que acompaña a todas las tarjetas durante el ciclo de vida del vehículo en el taller.
 */

/**
 * Genera un nuevo número de expediente a partir de un correlativo o timestamp.
 * Formato estándar: EXP-26001, EXP-26002...
 */
export function generarNuevoNumeroExpediente(secuencia?: number): string {
  const anioCorto = '26'
  if (secuencia !== undefined && secuencia > 0) {
    return `EXP-${anioCorto}${String(secuencia).padStart(3, '0')}`
  }
  const randomCorrelativo = Math.floor(100 + Math.random() * 900)
  return `EXP-${anioCorto}${randomCorrelativo}`
}

/**
 * Obtiene o resuelve de manera determinista el número de expediente de cualquier entidad del flujo.
 * Si ya tiene numero_expediente, lo devuelve.
 * Si tiene expediente_id o número de presupuesto/orden/factura, lo homologa a EXP-26XXX.
 */
export function resolverNumeroExpediente(entity: {
  numero_expediente?: string | null
  expediente_id?: string | null
  numero?: string | null
  numero_orden?: string | null
  id?: string | null
}): string {
  if (entity.numero_expediente && entity.numero_expediente.startsWith('EXP-')) {
    return entity.numero_expediente
  }

  // Si tiene expediente_id con formato EXP-
  if (entity.expediente_id && entity.expediente_id.startsWith('EXP-')) {
    return entity.expediente_id
  }

  // Si es un presupuesto PRES-26001 -> EXP-26001
  if (entity.numero && entity.numero.startsWith('PRES-')) {
    return entity.numero.replace('PRES-', 'EXP-')
  }

  // Si es una factura FAC-26001 -> EXP-26001
  if (entity.numero && entity.numero.startsWith('FAC-')) {
    return entity.numero.replace('FAC-', 'EXP-')
  }

  // Si es una orden OT-2601 -> EXP-2601
  if (entity.numero_orden && entity.numero_orden.startsWith('OT-')) {
    return entity.numero_orden.replace('OT-', 'EXP-')
  }

  // Si tiene número cualquiera
  if (entity.numero) {
    const nums = entity.numero.replace(/\D/g, '')
    if (nums) return `EXP-26${nums.slice(-3).padStart(3, '0')}`
  }

  // Fallback con ID
  if (entity.id) {
    const cleanId = entity.id.replace(/\D/g, '')
    if (cleanId) return `EXP-26${cleanId.slice(-3).padStart(3, '0')}`
  }

  return 'EXP-26001'
}
