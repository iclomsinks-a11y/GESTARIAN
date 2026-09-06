import type { Cliente, Vehiculo, Presupuesto, Factura } from './types'

export const SEED_CLIENTES: Cliente[] = []
export const SEED_VEHICULOS: Vehiculo[] = []
export const SEED_PRESUPUESTOS: Presupuesto[] = []
export const SEED_FACTURAS: Factura[] = []

const KEY_CLIENTES = 'gestarian_offline_clientes'
const KEY_VEHICULOS = 'gestarian_offline_vehiculos'
const KEY_PRESUPUESTOS = 'gestarian_offline_presupuestos'
const KEY_FACTURAS = 'gestarian_offline_facturas'

export function getOfflineClientes(): Cliente[] {
  try {
    const raw = localStorage.getItem(KEY_CLIENTES)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Error reading offline clientes:', e)
  }
  return []
}

export function saveOfflineClientes(clientes: Cliente[]): void {
  try {
    localStorage.setItem(KEY_CLIENTES, JSON.stringify(clientes))
  } catch (e) {
    console.warn('Error saving offline clientes:', e)
  }
}

export function addOfflineCliente(cliente: Cliente): Cliente[] {
  const current = getOfflineClientes()
  const updated = [cliente, ...current.filter(c => c.id !== cliente.id)]
  saveOfflineClientes(updated)
  return updated
}

export function updateOfflineCliente(cliente: Cliente): Cliente[] {
  const current = getOfflineClientes()
  const updated = current.map(c => c.id === cliente.id ? { ...c, ...cliente } : c)
  saveOfflineClientes(updated)
  return updated
}

export function deleteOfflineCliente(clienteId: string): Cliente[] {
  const current = getOfflineClientes()
  const updated = current.filter(c => c.id !== clienteId)
  saveOfflineClientes(updated)
  return updated
}

export function getOfflineVehiculos(): Record<string, Vehiculo[]> {
  try {
    const raw = localStorage.getItem(KEY_VEHICULOS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (e) {
    console.warn('Error reading offline vehiculos:', e)
  }
  return {}
}

export function saveOfflineVehiculos(vehiculosMap: Record<string, Vehiculo[]>): void {
  try {
    localStorage.setItem(KEY_VEHICULOS, JSON.stringify(vehiculosMap))
  } catch (e) {
    console.warn('Error saving offline vehiculos:', e)
  }
}

export function addOfflineVehiculo(veh: Vehiculo): Record<string, Vehiculo[]> {
  const map = getOfflineVehiculos()
  if (!map[veh.cliente_id]) map[veh.cliente_id] = []
  map[veh.cliente_id] = [veh, ...map[veh.cliente_id].filter(v => v.id !== veh.id)]
  saveOfflineVehiculos(map)
  return map
}

export function getOfflinePresupuestos(): Record<string, Presupuesto[]> {
  try {
    const raw = localStorage.getItem(KEY_PRESUPUESTOS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (e) {
    console.warn('Error reading offline presupuestos:', e)
  }
  return {}
}

export function saveOfflinePresupuestos(presupMap: Record<string, Presupuesto[]>): void {
  try {
    localStorage.setItem(KEY_PRESUPUESTOS, JSON.stringify(presupMap))
  } catch (e) {
    console.warn('Error saving offline presupuestos:', e)
  }
}

export function getOfflineFacturas(): Record<string, Factura[]> {
  try {
    const raw = localStorage.getItem(KEY_FACTURAS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (e) {
    console.warn('Error reading offline facturas:', e)
  }
  return {}
}

export function saveOfflineFacturas(factMap: Record<string, Factura[]>): void {
  try {
    localStorage.setItem(KEY_FACTURAS, JSON.stringify(factMap))
  } catch (e) {
    console.warn('Error saving offline facturas:', e)
  }
}
