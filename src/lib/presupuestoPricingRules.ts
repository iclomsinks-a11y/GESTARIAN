/**
 * Reglas de tarificación y cuantificación de presupuestos de taller GESTARIAN
 * 
 * Reglas de negocio:
 * 1. Piezas del vehículo (aleta, paragolpes, techo, capó, puerta, etc.):
 *    - Precio para clientes que sean EMPRESAS: 70 € por pieza
 *    - Precio para clientes que sean PARTICULARES: 80 € por pieza
 *    - Cantidades en NÚMEROS ENTEROS de uno en uno (1, 2, 3...)
 * 
 * 2. Tipo de reparación (horas de mano de obra):
 *    - Va de 0,5 en 0,5 horas de reparación (0.5, 1, 1.5, 2, 2.5, 3...)
 */

export type TipoClienteTarifa = 'particular' | 'empresa'
export type TipoConceptoTarifa = 'pieza' | 'reparacion'

export const PRECIO_PIEZA_PARTICULAR = 80
export const PRECIO_PIEZA_EMPRESA = 70
export const PRECIO_HORA_MANO_OBRA_DEFECTO = 45
export const PRECIO_PINTAR_ENTERO_PARTICULAR = 1100
export const PRECIO_PINTAR_ENTERO_EMPRESA = 950

export const PALABRAS_CLAVE_PIEZAS = [
  'aleta',
  'paragolpe',
  'paragolpes',
  'parachoques',
  'techo',
  'capo',
  'capó',
  'capot',
  'puerta',
  'porton',
  'portón',
  'maletero',
  'retrovisor',
  'espejo',
  'faldon',
  'faldón',
  'estribo',
  'spoiler',
  'faros',
  'piloto',
  'calandra',
  'rejilla',
  'moldura',
  'parabrisas',
  'luna',
  'pintar pieza',
  'pintar piezas',
  'número de piezas',
  'numero de piezas',
  'piezas de chapa',
  'piezas de pintura'
]

/**
 * Determina si la descripción corresponde a una pieza del vehículo (chapa / carrocería)
 * o al concepto genérico "Pintar número de piezas"
 */
export function esPiezaVehiculo(descripcion: string): boolean {
  if (!descripcion) return false
  const desc = descripcion.toLowerCase()
  return PALABRAS_CLAVE_PIEZAS.some(p => desc.includes(p))
}

/**
 * Genera el concepto formal para "Pintar número de piezas"
 * permitiendo indicar simplemente un número (ej. 2, 3, 4 piezas)
 */
export function crearConceptoPintarPiezas(numPiezas: number = 2, tipoCliente: TipoClienteTarifa = 'particular') {
  const piezasEnteras = Math.max(1, Math.round(numPiezas))
  const precioUnitario = tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
  return {
    id: `c-pz-num-${Date.now()}`,
    descripcion: `Pintar ${piezasEnteras} pieza${piezasEnteras > 1 ? 's' : ''} de carrocería (preparación y pintura en cabina)`,
    tipo: 'pieza' as const,
    cantidad: piezasEnteras,
    precio: precioUnitario
  }
}

/**
 * Genera el concepto formal para "Pintar coche entero"
 */
export function crearConceptoPintarEntero(tipoVehiculo: string = 'turismo', tipoCliente: TipoClienteTarifa = 'particular') {
  const precio = tipoCliente === 'empresa' ? PRECIO_PINTAR_ENTERO_EMPRESA : PRECIO_PINTAR_ENTERO_PARTICULAR
  return {
    id: `c-pz-entero-${Date.now()}`,
    descripcion: `Pintar vehículo entero completo (${tipoVehiculo}) en cabina con barniz alto brillo`,
    tipo: 'reparacion' as const,
    cantidad: 1.0,
    precio: precio
  }
}

/**
 * Devuelve el precio oficial de la pieza según si el cliente es particular o empresa
 */
export function getPrecioPiezaPorTipoCliente(tipoCliente: TipoClienteTarifa = 'particular'): number {
  return tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
}

/**
 * Normaliza la cantidad según el tipo de concepto:
 * - Pieza: número entero (1, 2, 3...)
 * - Reparación: múltiplos de 0.5 (0.5, 1, 1.5, 2, 2.5...)
 */
export function normalizarCantidad(tipo: TipoConceptoTarifa, valor: number): number {
  if (isNaN(valor) || valor <= 0) {
    return tipo === 'pieza' ? 1 : 0.5
  }

  if (tipo === 'pieza') {
    // Número entero de 1 en 1
    return Math.max(1, Math.round(valor))
  } else {
    // Horas en tramos de 0.5
    return Math.max(0.5, Math.round(valor * 2) / 2)
  }
}

/**
 * Infiere inteligentemente si un cliente es Particular o Empresa
 */
export function inferirTipoCliente(nombre?: string, dniCif?: string): TipoClienteTarifa {
  const texto = `${nombre || ''} ${dniCif || ''}`.toUpperCase()
  
  if (
    texto.includes(' S.L') || 
    texto.includes(' S.A') || 
    texto.includes(' SL') || 
    texto.includes(' SA') || 
    texto.includes(' S.C') || 
    texto.includes(' C.B') || 
    texto.includes(' CIF') || 
    texto.includes('EMPRESA') || 
    texto.includes('TRANSPORTES') ||
    texto.includes('RENT A CAR') ||
    texto.includes('FLOTA') ||
    texto.includes('LOGISTICA') ||
    texto.includes('TALLERES') ||
    texto.includes('SERVICIOS') ||
    texto.includes('CONSTRUCCIONES')
  ) {
    return 'empresa'
  }

  // Comprobar patrón de CIF español de personas jurídicas (A, B, C, D, E, F, G, J...)
  if (dniCif && /^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/i.test(dniCif.trim())) {
    return 'empresa'
  }

  return 'particular'
}

/**
 * Catálogo rápido de piezas habituales
 */
export const PIEZAS_FRECUENTES_PRESUPUESTO = [
  { nombre: 'Aleta delantera (chapa)', clave: 'aleta' },
  { nombre: 'Aleta trasera (chapa)', clave: 'aleta' },
  { nombre: 'Paragolpes delantero', clave: 'paragolpes' },
  { nombre: 'Paragolpes trasero', clave: 'paragolpes' },
  { nombre: 'Capó delantero', clave: 'capó' },
  { nombre: 'Techo del vehículo', clave: 'techo' },
  { nombre: 'Puerta delantera', clave: 'puerta' },
  { nombre: 'Puerta trasera', clave: 'puerta' },
  { nombre: 'Portón de maletero', clave: 'portón' }
]

/**
 * Catálogo de horas de reparación típicas (en tramos de 0.5h)
 */
export const REPARACIONES_FRECUENTES_PRESUPUESTO = [
  { nombre: 'Horas chapa y desabollado', horas: 1.5 },
  { nombre: 'Horas preparación y pintura cabina', horas: 2.0 },
  { nombre: 'Horas montaje y desmontaje', horas: 1.0 },
  { nombre: 'Horas reparación mecánica', horas: 1.0 },
  { nombre: 'Diagnóstico técnico y control', horas: 0.5 }
]
