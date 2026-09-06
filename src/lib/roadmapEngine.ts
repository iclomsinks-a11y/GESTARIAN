export interface TimelineStep {
  id: string
  title: string
  subtitle?: string
  functionName?: string
  color: string // 'emerald' | 'amber' | 'blue' | 'red' | 'slate' | 'yellow'
  animatedBorder?: boolean
  action?: {
    onClick: () => void
    label?: string
  }
}

export interface ExpedienteData {
  clienteId: string
  vehiculoId: string
  presupuesto?: { 
    id: string
    estado: string
    numero?: string
    numero_solicitud?: string | null
    cita_propuesta_fecha?: string | null
    cita_propuesta_hora?: string | null
    cita_propuesta_estado?: string | null
    cita_propuesta_fecha_cliente?: string | null
    cita_propuesta_nota_cliente?: string | null
  } | null
  cita?: { 
    id: string
    estado: string
    fecha?: string
    hora?: string
    fecha_propuesta_cliente?: string | null
    nota_cliente?: string | null
  } | null
  reparacion?: { id: string; estado: string } | null
  factura?: { 
    numero: string
    estado_cobro: string
    fecha?: string
    created_at?: string
    enviado_email_at?: string | null
    enviado_whatsapp_at?: string | null 
  } | null
  ultimoCobro?: { created_at: string } | null
}

function formatCitaDate(fecha?: string, hora?: string) {
  if (!fecha) return ''
  try {
    const d = new Date(fecha)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const aa = String(d.getFullYear()).slice(-2)
    const horaStr = hora ? hora.substring(0, 5) : ''
    return horaStr ? `${dd}/${mm}/${aa} ${horaStr}h` : `${dd}/${mm}/${aa}`
  } catch (e) {
    return fecha
  }
}

export interface RoadmapActions {
  onNavigateCliente: (clienteId: string) => void
  onCrearPresupuesto: (vehiculoId: string, clienteId: string) => void
  onVerPresupuesto: (presupuestoId: string) => void
  onAceptarPresupuesto: (presupuestoId: string) => void
  onCrearCita: (vehiculoId: string, clienteId: string, presupuestoId: string) => void
  onVerCita: (citaId: string) => void
  onAsignarCita: (citaId: string) => void
  onModificarCita: (citaId: string) => void
  onConfirmarCita: (citaId: string) => void
  onEnviarTaller: (vehiculoId: string, clienteId: string, citaId: string) => void
  onGestionarReparacion: (reparacionId: string) => void
  onFinalizarReparacion: (reparacionId: string) => void
  onGenerarFactura: (vehiculoId: string, clienteId: string, reparacionId?: string) => void
  onVerFactura: (numero: string, mode?: 'view' | 'scrollToSend') => void
}

export function buildRoadmap(data: ExpedienteData, actions: RoadmapActions): TimelineStep[] {
  const steps: TimelineStep[] = []

  // ── 1. RECEPCIÓN ──
  steps.push({
    id: 'recepcion',
    functionName: 'Recepción',
    title: 'Recepción',
    subtitle: 'Acceso a datos preliminares del presupuesto, cliente, vehículo, trabajo previsto e imágenes incorporadas',
    color: 'emerald',
    action: { onClick: () => actions.onNavigateCliente(data.clienteId) }
  })

  // ── 2. PRESUPUESTO ──
  const pres = data.presupuesto

  if (!pres) {
    steps.push({
      id: 'presupuesto',
      functionName: 'Presupuesto',
      title: 'Presupuesto Pendiente',
      subtitle: 'Crear valoración y desglose',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onCrearPresupuesto(data.vehiculoId, data.clienteId) }
    })
  } else if (pres.estado === 'pendiente') {
    steps.push({
      id: 'presupuesto',
      functionName: 'Presupuesto',
      title: 'Presupuesto Pendiente',
      subtitle: pres.numero || 'Pendiente validación cliente',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onAceptarPresupuesto(pres.id) }
    })
  } else if (pres.estado === 'aceptado' || pres.estado === 'aprobado') {
    steps.push({
      id: 'presupuesto',
      functionName: 'Presupuesto',
      title: 'Presupuesto Aprobado',
      subtitle: pres.numero || 'Validado por cliente',
      color: 'emerald',
      action: { onClick: () => actions.onVerPresupuesto(pres.id) }
    })
  } else {
    steps.push({
      id: 'presupuesto',
      functionName: 'Presupuesto',
      title: 'Presupuesto Rechazado',
      color: 'red',
      action: { onClick: () => actions.onVerPresupuesto(pres.id) }
    })
  }

  // ── 3. CITA VINCULADA ──
  const cita = data.cita
  const presAceptado = pres?.estado === 'aceptado' || pres?.estado === 'aprobado'
  const citaDateFormatted = cita ? formatCitaDate(cita.fecha, cita.hora) : ''

  if (cita?.estado === 'modificacion_solicitada' || pres?.cita_propuesta_estado === 'modificacion_solicitada') {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'CAMBIO CITA',
      subtitle: cita?.fecha_propuesta_cliente ? `Propone: ${cita.fecha_propuesta_cliente}` : 'Revisar fecha',
      color: 'amber',
      animatedBorder: true,
      action: { 
        onClick: () => actions.onModificarCita(cita ? cita.id : pres!.id),
        label: 'Aceptar/Ajustar'
      }
    })
  } else if (cita?.estado === 'propuesta' || pres?.cita_propuesta_estado === 'propuesta') {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'CITA PROPUESTA',
      subtitle: citaDateFormatted ? `Prevista: ${citaDateFormatted}` : 'Pendiente cliente',
      color: 'blue',
      animatedBorder: true,
      action: { onClick: () => actions.onVerCita(cita ? cita.id : pres!.id) }
    })
  } else if (!presAceptado && !cita) {
    steps.push({ id: 'cita', functionName: 'Cita', title: 'Generar Cita', color: 'slate' })
  } else if (!cita) {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'Generar Cita',
      subtitle: 'Agendar fecha',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onCrearCita(data.vehiculoId, data.clienteId, pres!.id) }
    })
  } else if (cita.estado === 'pendiente' || cita.estado === 'solicitada') {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'CITA PENDIENTE',
      subtitle: citaDateFormatted ? `Fecha: ${citaDateFormatted}` : undefined,
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onVerCita(cita.id) }
    })
  } else if (cita.estado === 'asignada') {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'CITA ASIGNADA',
      subtitle: citaDateFormatted ? `Fecha: ${citaDateFormatted}` : undefined,
      color: 'amber',
      animatedBorder: false,
      action: { onClick: () => actions.onVerCita(cita.id) }
    })
  } else if (cita.estado === 'confirmada' || cita.estado === 'completada') {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: 'CITA CONFIRMADA',
      subtitle: citaDateFormatted ? `Fecha: ${citaDateFormatted}` : undefined,
      color: 'emerald',
      animatedBorder: false,
      action: { onClick: () => actions.onVerCita(cita.id) }
    })
  } else {
    steps.push({
      id: 'cita',
      functionName: 'Cita',
      title: `Cita (${cita.estado})`,
      subtitle: citaDateFormatted ? `Fecha: ${citaDateFormatted}` : undefined,
      color: 'slate',
      action: { onClick: () => actions.onVerCita(cita.id) }
    })
  }

  // ── 4. REPARACIÓN ──
  const rep = data.reparacion
  if (!cita) {
    steps.push({ id: 'reparacion', functionName: 'Reparación', title: 'Reparación', color: 'slate' })
  } else if (cita.estado === 'pendiente' || cita.estado === 'solicitada' || cita.estado === 'propuesta' || cita.estado === 'modificacion_solicitada') {
    steps.push({
      id: 'reparacion',
      functionName: 'Reparación',
      title: 'ASIGNAR CITA',
      subtitle: 'Esperando entrada',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onAsignarCita(cita.id) }
    })
  } else if (cita.estado === 'asignada') {
    steps.push({
      id: 'reparacion',
      functionName: 'Reparación',
      title: 'CONFIRMAR CITA',
      color: 'emerald',
      animatedBorder: true,
      action: { onClick: () => actions.onConfirmarCita(cita.id) }
    })
  } else if (!rep) {
    steps.push({
      id: 'reparacion',
      functionName: 'Reparación',
      title: 'Enviar a Taller',
      subtitle: 'Iniciar trabajo',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onEnviarTaller(data.vehiculoId, data.clienteId, cita.id) }
    })
  } else if (rep.estado === 'en_proceso') {
    steps.push({
      id: 'reparacion',
      functionName: 'Reparación',
      title: 'Reparación en Proceso',
      subtitle: 'Operarios trabajando',
      color: 'blue',
      animatedBorder: true,
      action: { onClick: () => actions.onGestionarReparacion(rep.id) }
    })
  } else {
    steps.push({
      id: 'reparacion',
      functionName: 'Reparación',
      title: 'Reparación Finalizada',
      subtitle: 'Listo para factura',
      color: 'emerald',
      action: { onClick: () => actions.onGestionarReparacion(rep.id) }
    })
  }

  // ── 5. FACTURA ──
  const fac = data.factura
  const repFinalizada = rep?.estado === 'finalizado' || rep?.estado === 'finalizada' || rep?.estado === 'completada' || rep?.estado === 'terminada'

  if (rep?.estado === 'en_proceso') {
    steps.push({
      id: 'factura',
      functionName: 'Facturación',
      title: 'Finalizar Reparación',
      color: 'emerald',
      animatedBorder: true,
      action: { onClick: () => actions.onFinalizarReparacion(rep.id) }
    })
  } else if (!repFinalizada) {
    steps.push({ id: 'factura', functionName: 'Facturación', title: 'Facturación', color: 'slate' })
  } else if (!fac) {
    steps.push({
      id: 'factura',
      functionName: 'Facturación',
      title: 'Generar Factura',
      subtitle: 'Veri*Factu lista',
      color: 'amber',
      animatedBorder: true,
      action: { onClick: () => actions.onGenerarFactura(data.vehiculoId, data.clienteId, rep?.id) }
    })
  } else {
    steps.push({
      id: 'factura',
      functionName: 'Facturación',
      title: `Factura ${fac.numero}`,
      subtitle: 'Emitida',
      color: 'emerald',
      action: { onClick: () => actions.onVerFactura(fac.numero) }
    })
  }

  // ── 6. COBRO ──
  if (!fac) {
    steps.push({ id: 'cobro', functionName: 'Cobro', title: 'Cobro', color: 'slate' })
  } else {
    const isEnviada = !!(fac.enviado_email_at || fac.enviado_whatsapp_at)

    if (!isEnviada) {
      steps.push({
        id: 'cobro',
        functionName: 'Cobro',
        title: 'Enviar al Cliente',
        subtitle: 'WhatsApp / Email',
        color: 'yellow',
        animatedBorder: true,
        action: { onClick: () => actions.onVerFactura(fac.numero, 'scrollToSend') }
      })
    } else if (fac.estado_cobro === 'pagada') {
      steps.push({
        id: 'cobro',
        functionName: 'Cobro',
        title: 'Factura Abonada',
        subtitle: 'EXPEDIENTE CERRADO',
        color: 'emerald',
        animatedBorder: true,
        action: { onClick: () => actions.onVerFactura(fac.numero) }
      })
    } else if (fac.estado_cobro === 'parcial') {
      steps.push({
        id: 'cobro',
        functionName: 'Cobro',
        title: 'Cobro Parcial',
        subtitle: 'Pendiente saldo',
        color: 'blue',
        action: { onClick: () => actions.onVerFactura(fac.numero) }
      })
    } else {
      steps.push({
        id: 'cobro',
        functionName: 'Cobro',
        title: 'Factura Impagada',
        subtitle: 'Pendiente cobro',
        color: 'red',
        action: { onClick: () => actions.onVerFactura(fac.numero) }
      })
    }
  }

  return steps
}
