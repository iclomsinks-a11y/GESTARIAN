// src/services/tallerNotificacionesService.ts
/**
 * Servicio de notificaciones internas de taller
 * Gestiona solicitudes de confirmación de finalización de reparaciones
 * entre operarios (ej. Chapistas) y sus inmediatos superiores (ej. Jefes de Sección / Encargados).
 */

export interface NotificacionInternaTaller {
  id: string
  tipo: 'SOLICITUD_FINALIZACION_REPARACION' | 'CONFIRMACION_FINALIZACION' | 'RECHAZO_FINALIZACION'
  reparacionId: string
  numeroOrden: string
  numeroExpediente?: string
  matricula: string
  vehiculoModelo?: string
  titularVehiculo?: string
  solicitanteId: string
  solicitanteNombre: string
  solicitanteCargo: string
  superiorDestinoCargo?: string
  fecha: string
  estado: 'pendiente' | 'confirmada' | 'rechazada'
  confirmadoPor?: {
    id: string
    nombre: string
    fecha: string
  }
  motivoRechazo?: string
  leida: boolean
}

const STORAGE_NOTIFICACIONES = 'gestarian_taller_notificaciones_internas'

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeNotificaciones(cb: Listener): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function notify() {
  listeners.forEach(cb => {
    try {
      cb()
    } catch (e) {
      console.warn('Error in notification listener:', e)
    }
  })
}

function getInitialNotificaciones(): NotificacionInternaTaller[] {
  return [
    {
      id: 'notif-001',
      tipo: 'SOLICITUD_FINALIZACION_REPARACION',
      reparacionId: 'r1',
      numeroOrden: 'OT-2601',
      numeroExpediente: 'EXP-26010',
      matricula: '4589-KBL',
      vehiculoModelo: 'SEAT León 1.6 TDI',
      titularVehiculo: 'Juan Gómez Delgado',
      solicitanteId: 'emp-03',
      solicitanteNombre: 'David Rivas',
      solicitanteCargo: 'Chapista (Sector Automoción / Carrocería / Chapa y Pintura)',
      superiorDestinoCargo: 'Jefe de Sección Chapa / Encargado',
      fecha: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      estado: 'pendiente',
      leida: false
    }
  ]
}

export function getNotificacionesInternas(): NotificacionInternaTaller[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICACIONES)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  const initial = getInitialNotificaciones()
  localStorage.setItem(STORAGE_NOTIFICACIONES, JSON.stringify(initial))
  return initial
}

export function saveNotificacionesInternas(list: NotificacionInternaTaller[]) {
  try {
    localStorage.setItem(STORAGE_NOTIFICACIONES, JSON.stringify(list))
    notify()
  } catch (e) {}
}

export function getSolicitudesPendientes(): NotificacionInternaTaller[] {
  return getNotificacionesInternas().filter(
    n => n.tipo === 'SOLICITUD_FINALIZACION_REPARACION' && n.estado === 'pendiente'
  )
}

/**
 * Un operario (ej. Chapista) solicita finalizar la reparación.
 * Se genera una notificación interna dirigida a su inmediato superior.
 */
export function crearSolicitudFinalizacionReparacion(data: {
  reparacionId: string
  numeroOrden: string
  numeroExpediente?: string
  matricula: string
  vehiculoModelo?: string
  titularVehiculo?: string
  solicitanteId: string
  solicitanteNombre: string
  solicitanteCargo: string
  superiorDestinoCargo?: string
}): NotificacionInternaTaller {
  const list = getNotificacionesInternas()

  // Evitar duplicados pendientes para la misma orden
  const existente = list.find(
    n => n.reparacionId === data.reparacionId && n.estado === 'pendiente'
  )
  if (existente) return existente

  const nueva: NotificacionInternaTaller = {
    id: `notif-${Date.now()}`,
    tipo: 'SOLICITUD_FINALIZACION_REPARACION',
    reparacionId: data.reparacionId,
    numeroOrden: data.numeroOrden,
    numeroExpediente: data.numeroExpediente || 'EXP-26010',
    matricula: data.matricula,
    vehiculoModelo: data.vehiculoModelo || 'Vehículo en taller',
    titularVehiculo: data.titularVehiculo || 'Titular del vehículo',
    solicitanteId: data.solicitanteId,
    solicitanteNombre: data.solicitanteNombre,
    solicitanteCargo: data.solicitanteCargo,
    superiorDestinoCargo: data.superiorDestinoCargo || 'Jefe de Sección / Encargado',
    fecha: new Date().toISOString(),
    estado: 'pendiente',
    leida: false
  }

  list.unshift(nueva)
  saveNotificacionesInternas(list)
  return nueva
}

/**
 * El superior (Jefe de Sección Chapa, Encargado, Usuario o Dev) confirma la finalización
 */
export function confirmarSolicitudFinalizacion(
  notificacionId: string,
  confirmador: { id: string; nombre: string }
): boolean {
  const list = getNotificacionesInternas()
  const idx = list.findIndex(n => n.id === notificacionId)
  if (idx === -1) return false

  list[idx].estado = 'confirmada'
  list[idx].confirmadoPor = {
    id: confirmador.id,
    nombre: confirmador.nombre,
    fecha: new Date().toISOString()
  }
  list[idx].leida = true

  // Añadir notificación de confirmación para el operario
  list.unshift({
    id: `notif-conf-${Date.now()}`,
    tipo: 'CONFIRMACION_FINALIZACION',
    reparacionId: list[idx].reparacionId,
    numeroOrden: list[idx].numeroOrden,
    matricula: list[idx].matricula,
    vehiculoModelo: list[idx].vehiculoModelo,
    solicitanteId: list[idx].solicitanteId,
    solicitanteNombre: list[idx].solicitanteNombre,
    solicitanteCargo: list[idx].solicitanteCargo,
    fecha: new Date().toISOString(),
    estado: 'confirmada',
    confirmadoPor: {
      id: confirmador.id,
      nombre: confirmador.nombre,
      fecha: new Date().toISOString()
    },
    leida: false
  })

  saveNotificacionesInternas(list)
  return true
}

/**
 * El superior rechaza la finalización y requiere revisiones adicionales
 */
export function rechazarSolicitudFinalizacion(
  notificacionId: string,
  motivo: string,
  confirmador: { id: string; nombre: string }
): boolean {
  const list = getNotificacionesInternas()
  const idx = list.findIndex(n => n.id === notificacionId)
  if (idx === -1) return false

  list[idx].estado = 'rechazada'
  list[idx].motivoRechazo = motivo
  list[idx].confirmadoPor = {
    id: confirmador.id,
    nombre: confirmador.nombre,
    fecha: new Date().toISOString()
  }
  list[idx].leida = true

  saveNotificacionesInternas(list)
  return true
}

export function marcarTodasLeidas() {
  const list = getNotificacionesInternas().map(n => ({ ...n, leida: true }))
  saveNotificacionesInternas(list)
}
