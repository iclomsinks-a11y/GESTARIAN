import { supabase } from '../lib/supabase'
import type { Presupuesto, Cita, EstadoPresupuesto, EstadoCita } from '../lib/types'
import { uploadFotoOptimizada } from '../lib/expedienteService'

export const STORAGE_KEY_SOLICITUDES = 'gestarian_cliente_solicitudes_presupuesto'
export const STORAGE_KEY_PRESUPUESTOS = 'gestarian_presupuestos_override'
export const STORAGE_KEY_CITAS = 'gestarian_citas_override'
export const STORAGE_KEY_EXPEDIENTES = 'gestarian_expedientes_override'

export type EstadoSolicitud = 'PENDIENTE' | 'EN_PROCESO' | 'PROPUESTA_ENVIADA' | 'ACEPTADA' | 'RECHAZADA'
export type EstadoNegociacionCita = 'PROPUESTA_POR_TALLER' | 'PROPUESTA_POR_CLIENTE' | 'ASIGNADA'
export type UrgenciaSolicitud = 'normal' | 'urgente' | 'pre_itv'
export type TipoConcepto = 'pieza' | 'reparacion'
export type TipoClientePresupuesto = 'particular' | 'empresa'

export interface ConceptoPresupuestoItem {
  id: string
  descripcion: string
  tipo?: TipoConcepto
  cantidad: number
  precio: number
}

export interface PresupuestoPropuesto {
  id: string
  numero: string
  tipoCliente?: TipoClientePresupuesto
  conceptos: ConceptoPresupuestoItem[]
  subtotal: number
  iva: number
  total: number
  observaciones?: string
  fechaCreacion: string
}

export interface CitaNegociacion {
  estado: EstadoNegociacionCita
  fechaTaller: string
  horaTaller: string
  fechaCliente?: string
  horaCliente?: string
  motivoCliente?: string
  historial?: Array<{
    autor: 'taller' | 'cliente'
    fecha: string
    hora: string
    fechaPropuesta: string
    horaPropuesta: string
    nota?: string
  }>
}

export interface ExpedienteGeneradoInfo {
  id: string
  numero: string
  estado: string
  fechaApertura: string
  fechaCitaConfirmada: string
  horaCitaConfirmada: string
  faseActual: string
}

export interface SolicitudPresupuestoCliente {
  id: string
  numero: string
  clienteId: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail?: string
  matricula: string
  marcaModelo: string
  vehiculoId?: string
  kilometros?: string
  descripcion: string
  urgencia?: UrgenciaSolicitud
  fotos: string[]
  fechaDeseada?: string
  estado: EstadoSolicitud
  origen?: 'portal_cliente' | 'taller' | 'telefono'
  tipoCliente?: TipoClientePresupuesto
  notasTaller?: string
  
  // Flujo de presupuesto e IA
  presupuestoPropuesto?: PresupuestoPropuesto
  
  // Flujo de negociación de citas
  citaNegociacion?: CitaNegociacion

  // Expediente generado al aceptar presupuesto y cita
  expedienteGenerado?: ExpedienteGeneradoInfo
  
  // Retrocompatibilidad
  presupuestoId?: string
  presupuestoNumero?: string
  citaId?: string
  
  created_at: string
  updated_at?: string
}

export interface SolicitudPresupuestoClienteInput {
  clienteId: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail?: string
  matricula: string
  marcaModelo: string
  vehiculoId?: string
  kilometros?: string
  descripcion: string
  urgencia?: UrgenciaSolicitud
  fotos: (File | string)[]
  fechaDeseada?: string
}

// Helper: Normaliza estados legados o minúsculas a los 5 oficiales en mayúsculas
export function normalizarEstado(estadoRaw: string): EstadoSolicitud {
  if (!estadoRaw) return 'PENDIENTE'
  const up = estadoRaw.toUpperCase()
  if (up === 'PENDIENTE') return 'PENDIENTE'
  if (up === 'EN_PROCESO' || up === 'EN_ESTUDIO') return 'EN_PROCESO'
  if (up === 'PROPUESTA_ENVIADA' || up === 'PRESUPUESTADO') return 'PROPUESTA_ENVIADA'
  if (up === 'ACEPTADA' || up === 'APROBADO' || up === 'APROBADA') return 'ACEPTADA'
  if (up === 'RECHAZADA' || up === 'RECHAZADO') return 'RECHAZADA'
  return 'PENDIENTE'
}

// -------------------------------------------------------------------------
// Helper to get / save local storage
// -------------------------------------------------------------------------
export function getStoredSolicitudesCliente(): SolicitudPresupuestoCliente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOLICITUDES)
    if (raw) {
      const parsed: SolicitudPresupuestoCliente[] = JSON.parse(raw)
      return parsed.map(s => ({
        ...s,
        estado: normalizarEstado(s.estado as string)
      }))
    }
  } catch (e) {}

  const demoList: SolicitudPresupuestoCliente[] = [
    {
      id: 'sol-cli-001',
      numero: 'SOL-2026-001',
      clienteId: 'c1',
      clienteNombre: 'Juan Pérez García',
      clienteTelefono: '600 123 456',
      clienteEmail: 'juan.perez@example.com',
      matricula: '1234-KMT',
      marcaModelo: 'SEAT León 2.0 TDI',
      kilometros: '145.000 km',
      descripcion: 'El coche hace un ruido extraño al frenar y vibra el volante intensamente a más de 80 km/h.',
      urgencia: 'normal',
      fotos: [
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80'
      ],
      estado: 'PROPUESTA_ENVIADA',
      origen: 'portal_cliente',
      presupuestoPropuesto: {
        id: 'pres-prop-001',
        numero: 'PRES-26001',
        conceptos: [
          { id: 'c1', descripcion: 'Revisión técnica del sistema de frenado en elevador', cantidad: 1, precio: 35 },
          { id: 'c2', descripcion: 'Cambio de pastillas de freno delanteras Brembo', cantidad: 1, precio: 68 },
          { id: 'c3', descripcion: 'Sustitución de discos de freno ventilados delanteros', cantidad: 1, precio: 110 },
          { id: 'c4', descripcion: 'Equilibrado y comprobación de tren delantero', cantidad: 2, precio: 18 }
        ],
        subtotal: 249.00,
        iva: 52.29,
        total: 301.29,
        observaciones: 'Presupuesto elaborado con conceptos técnicos sugeridos por IA y validados por el jefe de taller.',
        fechaCreacion: '2026-09-04T12:00:00.000Z'
      },
      citaNegociacion: {
        estado: 'PROPUESTA_POR_TALLER',
        fechaTaller: '2026-09-08',
        horaTaller: '09:30'
      },
      created_at: '2026-09-04T10:00:00.000Z'
    },
    {
      id: 'sol-cli-002',
      numero: 'SOL-2026-002',
      clienteId: 'c2',
      clienteNombre: 'María Rodríguez Santos',
      clienteTelefono: '611 223 344',
      clienteEmail: 'maria.rodriguez@example.com',
      matricula: '4829-KLP',
      marcaModelo: 'Volkswagen Golf VII 2.0 TDI',
      kilometros: '98.500 km',
      descripcion: 'Testigo de avería motor encendido (parpadeo en amarillo), tirones en marchas cortas y humo blanco al acelerar.',
      urgencia: 'urgente',
      fotos: [
        'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80'
      ],
      estado: 'PENDIENTE',
      origen: 'portal_cliente',
      fechaDeseada: '2026-09-09',
      created_at: '2026-09-05T02:20:00.000Z'
    },
    {
      id: 'sol-cli-003',
      numero: 'SOL-2026-003',
      clienteId: 'c3',
      clienteNombre: 'Carlos Gómez Martín',
      clienteTelefono: '622 334 455',
      matricula: '9182-MBN',
      marcaModelo: 'Toyota Yaris Hybrid 120H',
      kilometros: '42.000 km',
      descripcion: 'Revisión técnica general pre-ITV. Comprobar eficacia de frenos, alineación de faros, holguras de rótulas y gases.',
      urgencia: 'pre_itv',
      fotos: [],
      estado: 'EN_PROCESO',
      origen: 'portal_cliente',
      fechaDeseada: '2026-09-12',
      notasTaller: 'Cliente necesita el coche antes del día 15 por cita en estación ITV.',
      created_at: '2026-09-04T11:45:00.000Z'
    }
  ]

  saveStoredSolicitudesCliente(demoList)
  return demoList
}

export function saveStoredSolicitudesCliente(list: SolicitudPresupuestoCliente[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(list))
  } catch (e) {}
}

// -------------------------------------------------------------------------
// 1. Cliente envía solicitud (descripción + imágenes + vehículo)
// -------------------------------------------------------------------------
export async function crearSolicitudPresupuestoCliente(
  input: SolicitudPresupuestoClienteInput
): Promise<{ success: boolean; solicitud?: SolicitudPresupuestoCliente; error?: string }> {
  try {
    if (!input.descripcion?.trim()) {
      return { success: false, error: 'La descripción del problema es obligatoria.' }
    }

    // Comprimir y subir hasta 5 fotos
    const uploadedPhotos: string[] = []
    const fotosToProcess = (input.fotos || []).slice(0, 5)
    for (const item of fotosToProcess) {
      if (item) {
        const url = await uploadFotoOptimizada(item, 'solicitud_cliente')
        if (url) uploadedPhotos.push(url)
      }
    }

    const solId = `sol-${Date.now()}`
    const currentYear = new Date().getFullYear()
    const currentList = getStoredSolicitudesCliente()
    const nextSeq = String(currentList.length + 1).padStart(3, '0')
    const num = `SOL-${currentYear}-${nextSeq}`

    const newSolicitud: SolicitudPresupuestoCliente = {
      id: solId,
      numero: num,
      clienteId: input.clienteId,
      clienteNombre: input.clienteNombre,
      clienteTelefono: input.clienteTelefono,
      clienteEmail: input.clienteEmail,
      matricula: input.matricula.toUpperCase().trim(),
      marcaModelo: input.marcaModelo,
      vehiculoId: input.vehiculoId,
      kilometros: input.kilometros,
      descripcion: input.descripcion.trim(),
      urgencia: input.urgencia || 'normal',
      fotos: uploadedPhotos,
      fechaDeseada: input.fechaDeseada,
      estado: 'PENDIENTE',
      origen: 'portal_cliente',
      created_at: new Date().toISOString()
    }

    currentList.unshift(newSolicitud)
    saveStoredSolicitudesCliente(currentList)

    // Sincronizar en BD si disponible
    try {
      await supabase.from('presupuestos').insert({
        id: solId,
        numero: num,
        numero_solicitud: num,
        cliente_id: input.clienteId,
        vehiculo_id: input.vehiculoId || null,
        estado: 'pendiente',
        total: 0,
        conceptos: [{ descripcion: `Solicitud de cliente: ${input.descripcion}`, cantidad: 1, precio: 0 }],
        observaciones: `Solicitud desde Portal Cliente (${input.matricula})`,
        fotos: uploadedPhotos,
        origen_solicitud: 'portal_cliente',
        solicitud_descripcion: input.descripcion,
        solicitud_urgencia: input.urgencia || 'normal'
      })
    } catch (dbErr) {
      console.warn('Almacenamiento local para solicitud:', dbErr)
    }

    return { success: true, solicitud: newSolicitud }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al procesar solicitud' }
  }
}

// -------------------------------------------------------------------------
// 2. Taller genera presupuesto (con IA) y propone fecha de cita
// -------------------------------------------------------------------------
export async function tallerEnviarPresupuestoYCita(
  solicitudId: string,
  data: {
    conceptos: ConceptoPresupuestoItem[]
    fechaCita: string
    horaCita: string
    observaciones?: string
    tipoCliente?: TipoClientePresupuesto
  }
): Promise<{ success: boolean; solicitud?: SolicitudPresupuestoCliente; error?: string }> {
  try {
    if (!data.fechaCita || !data.horaCita) {
      return { success: false, error: 'La fecha y hora de la cita son obligatorias.' }
    }
    if (!data.conceptos || data.conceptos.length === 0) {
      return { success: false, error: 'Debe haber al menos un concepto en el presupuesto.' }
    }

    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }

    // Calcular subtotal e IVA 21%
    const subtotal = data.conceptos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)
    const iva = Number((subtotal * 0.21).toFixed(2))
    const total = Number((subtotal + iva).toFixed(2))

    const presId = sol.presupuestoPropuesto?.id || `pres-${Date.now()}`
    const presNum = sol.presupuestoPropuesto?.numero || `PRES-26${Math.floor(100 + Math.random() * 900)}`

    const presupuestoPropuesto: PresupuestoPropuesto = {
      id: presId,
      numero: presNum,
      tipoCliente: data.tipoCliente || sol.tipoCliente || 'particular',
      conceptos: data.conceptos,
      subtotal: Number(subtotal.toFixed(2)),
      iva,
      total,
      observaciones: data.observaciones || 'Presupuesto y propuesta de cita elaborados por el taller.',
      fechaCreacion: new Date().toISOString()
    }

    const citaNegociacion: CitaNegociacion = {
      estado: 'PROPUESTA_POR_TALLER',
      fechaTaller: data.fechaCita,
      horaTaller: data.horaCita,
      historial: [
        ...(sol.citaNegociacion?.historial || []),
        {
          autor: 'taller',
          fecha: new Date().toISOString(),
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          fechaPropuesta: data.fechaCita,
          horaPropuesta: data.horaCita,
          nota: data.observaciones
        }
      ]
    }

    // Actualizar solicitud a estado PROPUESTA_ENVIADA
    sol.estado = 'PROPUESTA_ENVIADA'
    if (data.tipoCliente) {
      sol.tipoCliente = data.tipoCliente
    }
    sol.presupuestoPropuesto = presupuestoPropuesto
    sol.citaNegociacion = citaNegociacion
    sol.presupuestoNumero = presNum
    sol.updated_at = new Date().toISOString()

    saveStoredSolicitudesCliente(list)

    // Guardar también en tabla de presupuestos de taller para sincronización
    try {
      const localPres = localStorage.getItem(STORAGE_KEY_PRESUPUESTOS)
      const currentPres: any[] = localPres ? JSON.parse(localPres) : []
      const presItem = {
        id: presId,
        numero: presNum,
        numero_solicitud: sol.numero,
        cliente_id: sol.clienteId,
        vehiculo_id: sol.vehiculoId || null,
        estado: 'pendiente',
        conceptos: data.conceptos,
        total,
        observaciones: data.observaciones || `Presupuesto para solicitud ${sol.numero}`,
        fotos: sol.fotos,
        cita_propuesta_fecha: data.fechaCita,
        cita_propuesta_hora: data.horaCita,
        cita_propuesta_estado: 'propuesta',
        created_at: new Date().toISOString()
      }
      currentPres.unshift(presItem)
      localStorage.setItem(STORAGE_KEY_PRESUPUESTOS, JSON.stringify(currentPres))
    } catch (e) {}

    return { success: true, solicitud: sol }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al enviar presupuesto' }
  }
}

// -------------------------------------------------------------------------
// 4 & 5. Cliente acepta presupuesto y acepta la cita del taller
// -------------------------------------------------------------------------
export async function clienteAceptarPresupuestoYCita(
  solicitudId: string
): Promise<{ 
  success: boolean
  solicitud?: SolicitudPresupuestoCliente
  expediente?: ExpedienteGeneradoInfo
  error?: string 
}> {
  try {
    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }
    if (sol.estado === 'RECHAZADA') {
      return { success: false, error: 'Esta solicitud ya fue rechazada y no puede aceptarse.' }
    }

    const fechaConfirmada = sol.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
    const horaConfirmada = sol.citaNegociacion?.horaTaller || '09:30'

    // Actualizar cita a ASIGNADA
    if (sol.citaNegociacion) {
      sol.citaNegociacion.estado = 'ASIGNADA'
    }

    // Actualizar solicitud a ACEPTADA
    sol.estado = 'ACEPTADA'
    sol.updated_at = new Date().toISOString()

    // GENERAR EXPEDIENTE Y ROADMAP (Paso 7)
    const expInfo = await crearExpedienteDesdePresupuestoAceptado(sol, fechaConfirmada, horaConfirmada)
    sol.expedienteGenerado = expInfo

    saveStoredSolicitudesCliente(list)

    return { success: true, solicitud: sol, expediente: expInfo }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al aceptar presupuesto' }
  }
}

// -------------------------------------------------------------------------
// 5. Cliente propone nueva fecha
// Regla: Fecha seleccionada >= fecha propuesta por taller (si es mismo día, hora posterior)
// -------------------------------------------------------------------------
export function validarFechaHoraPropuestaCliente(
  fechaTaller: string,
  horaTaller: string,
  fechaCliente: string,
  horaCliente: string
): { valida: boolean; error?: string } {
  if (!fechaCliente || !horaCliente) {
    return { valida: false, error: 'Debe indicar fecha y hora para su propuesta.' }
  }

  // Comparar fechas YYYY-MM-DD
  if (fechaCliente < fechaTaller) {
    return { 
      valida: false, 
      error: `La fecha propuesta debe ser posterior o igual a la fecha propuesta por el taller (${fechaTaller}).` 
    }
  }

  if (fechaCliente === fechaTaller) {
    if (horaCliente <= horaTaller) {
      return { 
        valida: false, 
        error: `Si selecciona el mismo día (${fechaTaller}), la hora debe ser posterior a la propuesta por el taller (${horaTaller}).` 
      }
    }
  }

  return { valida: true }
}

export async function clienteProponerNuevaFecha(
  solicitudId: string,
  data: {
    nuevaFecha: string
    nuevaHora: string
    motivo?: string
  }
): Promise<{ success: boolean; solicitud?: SolicitudPresupuestoCliente; error?: string }> {
  try {
    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }
    if (sol.estado === 'RECHAZADA') {
      return { success: false, error: 'La solicitud está rechazada.' }
    }

    const fechaTaller = sol.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
    const horaTaller = sol.citaNegociacion?.horaTaller || '09:00'

    // Validación estricta de regla de negocio
    const validacion = validarFechaHoraPropuestaCliente(
      fechaTaller, 
      horaTaller, 
      data.nuevaFecha, 
      data.nuevaHora
    )

    if (!validacion.valida) {
      return { success: false, error: validacion.error }
    }

    if (!sol.citaNegociacion) {
      sol.citaNegociacion = {
        estado: 'PROPUESTA_POR_CLIENTE',
        fechaTaller,
        horaTaller
      }
    }

    sol.citaNegociacion.estado = 'PROPUESTA_POR_CLIENTE'
    sol.citaNegociacion.fechaCliente = data.nuevaFecha
    sol.citaNegociacion.horaCliente = data.nuevaHora
    sol.citaNegociacion.motivoCliente = data.motivo

    sol.citaNegociacion.historial = [
      ...(sol.citaNegociacion.historial || []),
      {
        autor: 'cliente',
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fechaPropuesta: data.nuevaFecha,
        horaPropuesta: data.nuevaHora,
        nota: data.motivo
      }
    ]

    sol.updated_at = new Date().toISOString()
    saveStoredSolicitudesCliente(list)

    return { success: true, solicitud: sol }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al proponer nueva fecha' }
  }
}

// -------------------------------------------------------------------------
// 6. Taller acepta nueva fecha propuesta por el cliente
// -------------------------------------------------------------------------
export async function tallerAceptarFechaCliente(
  solicitudId: string
): Promise<{ 
  success: boolean
  solicitud?: SolicitudPresupuestoCliente
  expediente?: ExpedienteGeneradoInfo
  error?: string 
}> {
  try {
    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }

    const fechaConfirmada = sol.citaNegociacion?.fechaCliente || sol.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
    const horaConfirmada = sol.citaNegociacion?.horaCliente || sol.citaNegociacion?.horaTaller || '10:00'

    if (sol.citaNegociacion) {
      sol.citaNegociacion.estado = 'ASIGNADA'
      sol.citaNegociacion.fechaTaller = fechaConfirmada
      sol.citaNegociacion.horaTaller = horaConfirmada
    }

    sol.estado = 'ACEPTADA'
    sol.updated_at = new Date().toISOString()

    // GENERAR EXPEDIENTE Y ROADMAP (Paso 7)
    const expInfo = await crearExpedienteDesdePresupuestoAceptado(sol, fechaConfirmada, horaConfirmada)
    sol.expedienteGenerado = expInfo

    saveStoredSolicitudesCliente(list)

    return { success: true, solicitud: sol, expediente: expInfo }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al aceptar fecha del cliente' }
  }
}

// -------------------------------------------------------------------------
// 6. Taller propone otra fecha alternativa (contraoferta de cita)
// -------------------------------------------------------------------------
export async function tallerProponerOtraFecha(
  solicitudId: string,
  data: {
    nuevaFecha: string
    nuevaHora: string
    notaTaller?: string
  }
): Promise<{ success: boolean; solicitud?: SolicitudPresupuestoCliente; error?: string }> {
  try {
    if (!data.nuevaFecha || !data.nuevaHora) {
      return { success: false, error: 'Debe especificar fecha y hora para la nueva cita.' }
    }

    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }

    if (!sol.citaNegociacion) {
      sol.citaNegociacion = {
        estado: 'PROPUESTA_POR_TALLER',
        fechaTaller: data.nuevaFecha,
        horaTaller: data.nuevaHora
      }
    } else {
      sol.citaNegociacion.estado = 'PROPUESTA_POR_TALLER'
      sol.citaNegociacion.fechaTaller = data.nuevaFecha
      sol.citaNegociacion.horaTaller = data.nuevaHora
      sol.citaNegociacion.historial = [
        ...(sol.citaNegociacion.historial || []),
        {
          autor: 'taller',
          fecha: new Date().toISOString(),
          hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          fechaPropuesta: data.nuevaFecha,
          horaPropuesta: data.nuevaHora,
          nota: data.notaTaller
        }
      ]
    }

    sol.estado = 'PROPUESTA_ENVIADA'
    sol.updated_at = new Date().toISOString()
    saveStoredSolicitudesCliente(list)

    return { success: true, solicitud: sol }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al contraproponer fecha' }
  }
}

// -------------------------------------------------------------------------
// 4. Cliente rechaza presupuesto (se cierra definitivamente)
// -------------------------------------------------------------------------
export async function clienteRechazarPresupuesto(
  solicitudId: string,
  motivo?: string
): Promise<{ success: boolean; solicitud?: SolicitudPresupuestoCliente; error?: string }> {
  try {
    const list = getStoredSolicitudesCliente()
    const sol = list.find(s => s.id === solicitudId)
    if (!sol) {
      return { success: false, error: 'Solicitud no encontrada.' }
    }

    sol.estado = 'RECHAZADA'
    sol.notasTaller = (sol.notasTaller ? sol.notasTaller + '\n' : '') + `[Rechazado por el cliente el ${new Date().toLocaleDateString('es-ES')}]: ${motivo || 'Sin motivo especificado'}`
    sol.updated_at = new Date().toISOString()

    saveStoredSolicitudesCliente(list)

    return { success: true, solicitud: sol }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al rechazar presupuesto' }
  }
}

// -------------------------------------------------------------------------
// 7. Generación del Expediente y Roadmap
// -------------------------------------------------------------------------
export async function crearExpedienteDesdePresupuestoAceptado(
  sol: SolicitudPresupuestoCliente,
  fechaCitaConfirmada: string,
  horaCitaConfirmada: string
): Promise<ExpedienteGeneradoInfo> {
  const expNum = `EXP-26${Math.floor(100 + Math.random() * 900)}`
  const expId = `exp-sol-${Date.now()}`
  const fechaApertura = new Date().toISOString()

  const expInfo: ExpedienteGeneradoInfo = {
    id: expId,
    numero: expNum,
    estado: 'RECEPCIÓN',
    fechaApertura,
    fechaCitaConfirmada,
    horaCitaConfirmada,
    faseActual: 'RECEPCIÓN'
  }

  // 1. Guardar en expediente_override
  try {
    const localExps = localStorage.getItem(STORAGE_KEY_EXPEDIENTES)
    const expsList: any[] = localExps ? JSON.parse(localExps) : []
    
    const newExpObj = {
      id: expId,
      numero: expNum,
      estado: 'RECEPCIÓN',
      descripcion: `Expediente generado desde Solicitud ${sol.numero}: ${sol.descripcion}`,
      cliente_id: sol.clienteId,
      vehiculo_id: sol.vehiculoId || null,
      presupuesto_id: sol.presupuestoPropuesto?.id,
      presupuesto_numero: sol.presupuestoPropuesto?.numero,
      fecha_apertura: fechaApertura,
      cita_fecha: fechaCitaConfirmada,
      cita_hora: horaCitaConfirmada,
      fotos: sol.fotos || [],
      matricula: sol.matricula,
      marca_modelo: sol.marcaModelo,
      cliente_nombre: sol.clienteNombre,
      created_at: fechaApertura
    }

    expsList.unshift(newExpObj)
    localStorage.setItem(STORAGE_KEY_EXPEDIENTES, JSON.stringify(expsList))
  } catch (e) {
    console.warn('Error guardando expediente en localStorage:', e)
  }

  // 2. Guardar en tabla de Citas
  try {
    const localCitas = localStorage.getItem(STORAGE_KEY_CITAS)
    const citasList: any[] = localCitas ? JSON.parse(localCitas) : []
    const citaItem = {
      id: `cita-${Date.now()}`,
      cliente_id: sol.clienteId,
      vehiculo_id: sol.vehiculoId || null,
      fecha: fechaCitaConfirmada,
      hora: horaCitaConfirmada,
      estado: 'confirmada',
      motivo: `Cita confirmada para expediente ${expNum}: ${sol.descripcion}`,
      presupuesto_id: sol.presupuestoPropuesto?.id,
      created_at: new Date().toISOString()
    }
    citasList.unshift(citaItem)
    localStorage.setItem(STORAGE_KEY_CITAS, JSON.stringify(citasList))
  } catch (e) {}

  // 3. Intentar insertar en Supabase expedientes
  try {
    await supabase.from('expedientes').insert({
      id: expId,
      numero: expNum,
      estado: 'abierto',
      descripcion: `Expediente generado desde Solicitud ${sol.numero}: ${sol.descripcion}`,
      cliente_id: sol.clienteId,
      vehiculo_id: sol.vehiculoId || null,
      fecha_apertura: fechaApertura,
      created_at: fechaApertura
    })
  } catch (e) {}

  return expInfo
}

// -------------------------------------------------------------------------
// Obtener todas las solicitudes para el taller
// -------------------------------------------------------------------------
export async function obtenerTodasLasSolicitudes(): Promise<SolicitudPresupuestoCliente[]> {
  return getStoredSolicitudesCliente()
}

// Eliminar solicitud
export async function eliminarSolicitudTaller(id: string): Promise<boolean> {
  try {
    const list = getStoredSolicitudesCliente()
    const filtered = list.filter(s => s.id !== id)
    saveStoredSolicitudesCliente(filtered)
    return true
  } catch (e) {
    return false
  }
}

// Actualizar estado general
export async function actualizarEstadoSolicitud(
  id: string,
  nuevoEstado: EstadoSolicitud,
  notasTaller?: string
): Promise<boolean> {
  try {
    const list = getStoredSolicitudesCliente()
    const idx = list.findIndex(s => s.id === id)
    if (idx !== -1) {
      list[idx].estado = nuevoEstado
      if (notasTaller !== undefined) {
        list[idx].notasTaller = notasTaller
      }
      list[idx].updated_at = new Date().toISOString()
      saveStoredSolicitudesCliente(list)
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

// Retrocompatibilidad con conversiones previas
export async function convertirSolicitudEnPresupuesto(
  solicitudId: string,
  data: {
    vehiculoId?: string
    total: number
    conceptos: { id?: string; descripcion: string; cantidad: number; precio: number }[]
    observaciones?: string
  }
): Promise<{ success: boolean; presupuestoId?: string; presupuestoNumero?: string; error?: string }> {
  const conceptosMapeados: ConceptoPresupuestoItem[] = data.conceptos.map((c, i) => ({
    id: c.id || `c-${i}`,
    descripcion: c.descripcion,
    cantidad: c.cantidad,
    precio: c.precio
  }))

  const res = await tallerEnviarPresupuestoYCita(solicitudId, {
    conceptos: conceptosMapeados,
    fechaCita: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    horaCita: '10:00',
    observaciones: data.observaciones
  })

  if (res.success && res.solicitud?.presupuestoPropuesto) {
    return {
      success: true,
      presupuestoId: res.solicitud.presupuestoPropuesto.id,
      presupuestoNumero: res.solicitud.presupuestoPropuesto.numero
    }
  }
  return { success: false, error: res.error || 'Error en conversión' }
}

export async function aceptarPresupuestoYCita(presupuestoId: string) {
  const list = getStoredSolicitudesCliente()
  const sol = list.find(s => s.presupuestoPropuesto?.id === presupuestoId || s.id === presupuestoId)
  if (sol) {
    return clienteAceptarPresupuestoYCita(sol.id)
  }
  return { success: true }
}

export async function proponerCambioCita(
  presupuestoId: string,
  nuevaFecha: string,
  nuevaHora: string,
  notaMotivo: string
) {
  const list = getStoredSolicitudesCliente()
  const sol = list.find(s => s.presupuestoPropuesto?.id === presupuestoId || s.id === presupuestoId)
  if (sol) {
    return clienteProponerNuevaFecha(sol.id, {
      nuevaFecha,
      nuevaHora,
      motivo: notaMotivo
    })
  }
  return { success: true }
}

export async function aceptarCambioCitaDesdeTaller(presupuestoId: string) {
  const list = getStoredSolicitudesCliente()
  const sol = list.find(s => s.presupuestoPropuesto?.id === presupuestoId || s.id === presupuestoId)
  if (sol) {
    return tallerAceptarFechaCliente(sol.id)
  }
  return { success: true }
}

export async function crearSolicitudDesdeTaller(input: any) {
  return crearSolicitudPresupuestoCliente({
    clienteId: input.clienteId,
    clienteNombre: input.clienteNombre,
    clienteTelefono: input.clienteTelefono,
    clienteEmail: input.clienteEmail,
    matricula: input.matricula,
    marcaModelo: input.marcaModelo,
    vehiculoId: input.vehiculoId,
    kilometros: input.kilometros,
    descripcion: input.descripcion,
    urgencia: input.urgencia,
    fotos: input.fotos || [],
    fechaDeseada: input.fechaDeseada
  })
}
