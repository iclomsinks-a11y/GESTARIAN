import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Inbox, 
  Search, 
  Plus, 
  User, 
  Phone, 
  MessageSquare, 
  Car, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  Eye, 
  Trash2, 
  X, 
  RefreshCw, 
  Check, 
  Image as ImageIcon,
  Send,
  Upload,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  XCircle,
  HelpCircle,
  Building2,
  Wrench,
  Tag,
  ArrowLeft
} from 'lucide-react'
import { SwipeableConceptoItem } from '../components/presupuesto/SwipeableConceptoItem'
import { supabase } from '../lib/supabase'
import type { Cliente, Vehiculo } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { 
  SolicitudPresupuestoCliente, 
  EstadoSolicitud, 
  UrgenciaSolicitud,
  ConceptoPresupuestoItem,
  TipoConcepto,
  obtenerTodasLasSolicitudes, 
  actualizarEstadoSolicitud, 
  eliminarSolicitudTaller, 
  crearSolicitudDesdeTaller,
  tallerEnviarPresupuestoYCita,
  tallerAceptarFechaCliente,
  tallerProponerOtraFecha
} from '../services/clientePresupuestoService'
import { generarConceptosPresupuestoIA } from '../services/aiPresupuestoService'
import { uploadFotoOptimizada } from '../lib/expedienteService'
import {
  TipoClienteTarifa,
  TipoConceptoTarifa,
  PRECIO_PIEZA_PARTICULAR,
  PRECIO_PIEZA_EMPRESA,
  PRECIO_PINTAR_ENTERO_PARTICULAR,
  PRECIO_PINTAR_ENTERO_EMPRESA,
  PRECIO_HORA_MANO_OBRA_DEFECTO,
  esPiezaVehiculo,
  getPrecioPiezaPorTipoCliente,
  normalizarCantidad,
  inferirTipoCliente,
  PIEZAS_FRECUENTES_PRESUPUESTO,
  REPARACIONES_FRECUENTES_PRESUPUESTO
} from '../lib/presupuestoPricingRules'

export const SolicitudesPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [solicitudes, setSolicitudes] = useState<SolicitudPresupuestoCliente[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todas' | EstadoSolicitud>('todas')
  const [urgenciaFilter, setUrgenciaFilter] = useState<'todas' | UrgenciaSolicitud>('todas')
  const [origenFilter, setOrigenFilter] = useState<'todos' | 'portal_cliente' | 'taller'>('todos')

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isPresupuestoModalOpen, setIsPresupuestoModalOpen] = useState(false)
  const [isContraofertaModalOpen, setIsContraofertaModalOpen] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudPresupuestoCliente | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // IA Generation State
  const [isGeneratingIA, setIsGeneratingIA] = useState(false)

  // Form State for Presupuesto + Cita
  const [presupuestoForm, setPresupuestoForm] = useState<{
    tipoCliente: TipoClienteTarifa
    conceptos: ConceptoPresupuestoItem[]
    fechaCita: string
    horaCita: string
    observaciones: string
  }>({
    tipoCliente: 'particular',
    conceptos: [],
    fechaCita: '',
    horaCita: '09:30',
    observaciones: ''
  })

  // Contraoferta de fecha Form
  const [contraofertaForm, setContraofertaForm] = useState<{
    nuevaFecha: string
    nuevaHora: string
    notaTaller: string
  }>({
    nuevaFecha: '',
    nuevaHora: '10:00',
    notaTaller: ''
  })

  // New Solicitud Form State (taller / llamada)
  const [newForm, setNewForm] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    matricula: '',
    marcaModelo: '',
    kilometros: '',
    descripcion: '',
    urgencia: 'normal' as UrgenciaSolicitud,
    fechaDeseada: '',
    origen: 'taller' as 'taller' | 'telefono',
    notasTaller: ''
  })
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [newPhotos, setNewPhotos] = useState<string[]>([])

  // Load Data
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      else setRefreshing(true)

      const [solList, cliRes, vehRes] = await Promise.all([
        obtenerTodasLasSolicitudes(),
        supabase.from('clientes').select('id, nombre, telefono, email').order('nombre', { ascending: true }),
        supabase.from('vehiculos').select('id, matricula, marca, modelo, cliente_id').order('matricula', { ascending: true })
      ])

      setSolicitudes(solList)
      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error al cargar solicitudes:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Subscription
  useRealtimeSubscription({
    tables: ['presupuestos', 'citas', 'expedientes'],
    onUpdate: () => loadData(true)
  })

  // Stats calculation
  const stats = useMemo(() => {
    const total = solicitudes.length
    const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length
    const enProceso = solicitudes.filter(s => s.estado === 'EN_PROCESO').length
    const propuestasEnviadas = solicitudes.filter(s => s.estado === 'PROPUESTA_ENVIADA').length
    const aceptadas = solicitudes.filter(s => s.estado === 'ACEPTADA').length
    const rechazadas = solicitudes.filter(s => s.estado === 'RECHAZADA').length
    const urgentes = solicitudes.filter(s => s.urgencia === 'urgente' && s.estado !== 'RECHAZADA').length

    return { total, pendientes, enProceso, propuestasEnviadas, aceptadas, rechazadas, urgentes }
  }, [solicitudes])

  // Filtered List
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter(s => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim()
        const matchNum = s.numero?.toLowerCase().includes(term)
        const matchCli = s.clienteNombre?.toLowerCase().includes(term)
        const matchMat = s.matricula?.toLowerCase().includes(term)
        const matchMod = s.marcaModelo?.toLowerCase().includes(term)
        const matchTel = s.clienteTelefono?.toLowerCase().includes(term)
        const matchDesc = s.descripcion?.toLowerCase().includes(term)
        if (!matchNum && !matchCli && !matchMat && !matchMod && !matchTel && !matchDesc) {
          return false
        }
      }

      // Status
      if (statusFilter !== 'todas' && s.estado !== statusFilter) {
        return false
      }

      // Urgencia
      if (urgenciaFilter !== 'todas' && s.urgencia !== urgenciaFilter) {
        return false
      }

      // Origen
      if (origenFilter === 'portal_cliente' && s.origen !== 'portal_cliente') {
        return false
      }
      if (origenFilter === 'taller' && s.origen === 'portal_cliente') {
        return false
      }

      return true
    })
  }, [solicitudes, searchTerm, statusFilter, urgenciaFilter, origenFilter])

  // Open Generar Presupuesto Modal
  const handleOpenPresupuestoModal = async (sol: SolicitudPresupuestoCliente) => {
    setSelectedSolicitud(sol)
    
    // Detect or infer client type (particular vs empresa)
    const tipoCli: TipoClienteTarifa = sol.tipoCliente || inferirTipoCliente(sol.clienteNombre)
    const precioPiezaInicial = tipoCli === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR

    // Default proposed date: 2 business days from now or fechaDeseada
    const defaultDate = sol.fechaDeseada || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    
    // Existing concepts if previously edited or generate new with IA
    const existingConceptos = sol.presupuestoPropuesto?.conceptos || []
    
    const initialConceptos = existingConceptos.length > 0 ? existingConceptos.map(c => {
      const isPiece = c.tipo === 'pieza' || esPiezaVehiculo(c.descripcion)
      const tipo: TipoConceptoTarifa = isPiece ? 'pieza' : 'reparacion'
      return {
        ...c,
        tipo,
        cantidad: normalizarCantidad(tipo, c.cantidad),
        precio: isPiece ? precioPiezaInicial : c.precio
      }
    }) : [
      { 
        id: 'c1', 
        descripcion: 'Diagnóstico e inspección técnica de la avería', 
        tipo: 'reparacion' as const, 
        cantidad: 1.0, 
        precio: PRECIO_HORA_MANO_OBRA_DEFECTO 
      },
      { 
        id: 'c2', 
        descripcion: 'Mano de obra especializada de reparación', 
        tipo: 'reparacion' as const, 
        cantidad: 1.5, 
        precio: PRECIO_HORA_MANO_OBRA_DEFECTO 
      }
    ]

    setPresupuestoForm({
      tipoCliente: tipoCli,
      conceptos: initialConceptos,
      fechaCita: sol.citaNegociacion?.fechaTaller || defaultDate,
      horaCita: sol.citaNegociacion?.horaTaller || '09:30',
      observaciones: sol.presupuestoPropuesto?.observaciones || `Presupuesto elaborado en base a la descripción del cliente para ${sol.marcaModelo} (${sol.matricula}).`
    })

    setIsPresupuestoModalOpen(true)

    // Trigger AI generation automatically if no custom concepts were set yet
    if (existingConceptos.length === 0) {
      triggerIAGenerateConcepts(sol.descripcion, `${sol.marcaModelo} (${sol.matricula})`, tipoCli)
    }
  }

  // Cambiar tipo de cliente (Particular 80 € / Empresa 70 €)
  const handleChangeTipoCliente = (newTipo: TipoClienteTarifa) => {
    const newPrice = newTipo === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
    setPresupuestoForm(prev => {
      const updatedConceptos = prev.conceptos.map(c => {
        const isPiece = c.tipo === 'pieza' || esPiezaVehiculo(c.descripcion)
        if (isPiece) {
          return {
            ...c,
            tipo: 'pieza' as const,
            cantidad: normalizarCantidad('pieza', c.cantidad),
            precio: newPrice
          }
        }
        return c
      })
      return {
        ...prev,
        tipoCliente: newTipo,
        conceptos: updatedConceptos
      }
    })
    addToast(
      `Tarifa cambiada a ${newTipo.toUpperCase()}: piezas a ${newPrice} €/ud (cant. de 1 en 1).`, 
      'info'
    )
  }

  // Trigger Gemini IA to generate repair concepts with pricing rules
  const triggerIAGenerateConcepts = async (
    descripcion: string, 
    vehiculoInfo?: string, 
    tipoClienteForzado?: TipoClienteTarifa
  ) => {
    try {
      setIsGeneratingIA(true)
      const currentTipo = tipoClienteForzado || presupuestoForm.tipoCliente || 'particular'
      const generated = await generarConceptosPresupuestoIA(descripcion, vehiculoInfo, currentTipo)
      if (generated && generated.length > 0) {
        setPresupuestoForm(prev => ({
          ...prev,
          conceptos: generated.map(g => ({
            ...g,
            tipo: g.tipo || (esPiezaVehiculo(g.descripcion) ? 'pieza' : 'reparacion')
          }))
        }))
        addToast(`METIS IA extrajo ${generated.length} conceptos según tarifa ${currentTipo.toUpperCase()}`, 'success')
      }
    } catch (err) {
      console.warn('Error en generación IA:', err)
      addToast('No se pudieron generar conceptos automáticos', 'warning')
    } finally {
      setIsGeneratingIA(false)
    }
  }

  // Quick action: Add standard vehicle part (aleta, paragolpes, techo, capó...)
  const handleAddPiezaRapida = (nombrePieza: string) => {
    const newId = `c-pz-${Date.now()}`
    const precio = presupuestoForm.tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        {
          id: newId,
          descripcion: `Sustitución / Pieza: ${nombrePieza}`,
          tipo: 'pieza',
          cantidad: 1, // Números enteros de uno en uno
          precio
        }
      ]
    }))
    addToast(`Añadida pieza "${nombrePieza}" (${precio} € - Tarifa ${presupuestoForm.tipoCliente})`, 'success')
  }

  // Quick action: Pintar número de piezas (2 piezas, 3 piezas, 4 piezas...)
  const handleAddPintarNumeroPiezas = (num: number) => {
    const newId = `c-pz-num-${Date.now()}`
    const precio = presupuestoForm.tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
    const cant = Math.max(1, Math.round(num))
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        {
          id: newId,
          descripcion: `Pintar ${cant} pieza${cant > 1 ? 's' : ''} de carrocería (preparación y pintura en cabina)`,
          tipo: 'pieza',
          cantidad: cant,
          precio
        }
      ]
    }))
    addToast(`Añadido: Pintar ${cant} piezas (${precio} €/ud - Total: ${cant * precio} €)`, 'success')
  }

  // Quick action: Pintar coche entero
  const handleAddPintarCocheEntero = () => {
    const newId = `c-pz-entero-${Date.now()}`
    const precio = presupuestoForm.tipoCliente === 'empresa' ? PRECIO_PINTAR_ENTERO_EMPRESA : PRECIO_PINTAR_ENTERO_PARTICULAR
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        {
          id: newId,
          descripcion: 'Pintar vehículo entero completo en cabina con barniz alto brillo',
          tipo: 'reparacion',
          cantidad: 1,
          precio
        }
      ]
    }))
    addToast(`Añadido: Pintar coche entero (${precio} € - Tarifa ${presupuestoForm.tipoCliente})`, 'success')
  }

  // Quick action: Add repair hours (0.5, 1, 1.5, 2, 2.5...)
  const handleAddReparacionRapida = (nombreReparacion: string, horas: number) => {
    const newId = `c-rep-${Date.now()}`
    const cantNormalizada = normalizarCantidad('reparacion', horas)
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        {
          id: newId,
          descripcion: `Mano de obra: ${nombreReparacion}`,
          tipo: 'reparacion',
          cantidad: cantNormalizada, // 0.5, 1, 1.5...
          precio: PRECIO_HORA_MANO_OBRA_DEFECTO
        }
      ]
    }))
    addToast(`Añadido concepto de reparación (${cantNormalizada} h)`, 'success')
  }

  // Add a manual concept line
  const handleAddConcepto = () => {
    const newId = `c-man-${Date.now()}`
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: [
        ...prev.conceptos,
        { 
          id: newId, 
          descripcion: 'Nueva operación o recambio', 
          tipo: 'reparacion',
          cantidad: 1.0, 
          precio: PRECIO_HORA_MANO_OBRA_DEFECTO 
        }
      ]
    }))
  }

  // Toggle concept between 'pieza' and 'reparacion'
  const handleToggleConceptoTipo = (id: string) => {
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: prev.conceptos.map(c => {
        if (c.id === id) {
          const currentTipo = c.tipo || (esPiezaVehiculo(c.descripcion) ? 'pieza' : 'reparacion')
          const nextTipo: TipoConceptoTarifa = currentTipo === 'pieza' ? 'reparacion' : 'pieza'
          const precio = nextTipo === 'pieza'
            ? (prev.tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR)
            : PRECIO_HORA_MANO_OBRA_DEFECTO
          const cantidad = normalizarCantidad(nextTipo, c.cantidad)
          return {
            ...c,
            tipo: nextTipo,
            cantidad,
            precio
          }
        }
        return c
      })
    }))
  }

  // Update a concept field with strict rules (integers for pieces, 0.5 steps for repairs)
  const handleUpdateConcepto = (
    id: string, 
    field: 'descripcion' | 'cantidad' | 'precio' | 'tipo', 
    value: any
  ) => {
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: prev.conceptos.map(c => {
        if (c.id === id) {
          if (field === 'descripcion') {
            const isPiece = esPiezaVehiculo(value)
            const currentTipo = isPiece ? 'pieza' : (c.tipo || 'reparacion')
            const updatedPrice = isPiece 
              ? (prev.tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR)
              : c.precio
            const updatedQty = normalizarCantidad(currentTipo, c.cantidad)
            return {
              ...c,
              descripcion: value,
              tipo: currentTipo,
              precio: updatedPrice,
              cantidad: updatedQty
            }
          }
          if (field === 'cantidad') {
            const currentTipo = c.tipo || (esPiezaVehiculo(c.descripcion) ? 'pieza' : 'reparacion')
            const numVal = parseFloat(value) || 0
            return {
              ...c,
              cantidad: normalizarCantidad(currentTipo, numVal)
            }
          }
          if (field === 'precio') {
            return {
              ...c,
              precio: Math.max(0, parseFloat(value) || 0)
            }
          }
          if (field === 'tipo') {
            const nextTipo = value as TipoConceptoTarifa
            const precio = nextTipo === 'pieza'
              ? (prev.tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR)
              : PRECIO_HORA_MANO_OBRA_DEFECTO
            return {
              ...c,
              tipo: nextTipo,
              cantidad: normalizarCantidad(nextTipo, c.cantidad),
              precio
            }
          }
        }
        return c
      })
    }))
  }

  // Remove a concept
  const handleRemoveConcepto = (id: string) => {
    setPresupuestoForm(prev => ({
      ...prev,
      conceptos: prev.conceptos.filter(c => c.id !== id)
    }))
  }

  // Submit Presupuesto to Client
  const handleSubmitPresupuestoToClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSolicitud) return

    if (!presupuestoForm.fechaCita || !presupuestoForm.horaCita) {
      addToast('Debes indicar fecha y hora para la cita propuesta', 'warning')
      return
    }

    if (presupuestoForm.conceptos.length === 0) {
      addToast('Agrega al menos un concepto de reparación', 'warning')
      return
    }

    const res = await tallerEnviarPresupuestoYCita(selectedSolicitud.id, {
      conceptos: presupuestoForm.conceptos,
      tipoCliente: presupuestoForm.tipoCliente,
      fechaCita: presupuestoForm.fechaCita,
      horaCita: presupuestoForm.horaCita,
      observaciones: presupuestoForm.observaciones
    })

    if (res.success && res.solicitud) {
      addToast(`Presupuesto (${presupuestoForm.tipoCliente.toUpperCase()}) y propuesta de cita enviados al cliente (${selectedSolicitud.numero})`, 'success')
      setSolicitudes(prev => prev.map(s => s.id === selectedSolicitud.id ? res.solicitud! : s))
      setIsPresupuestoModalOpen(false)
      setSelectedSolicitud(null)
    } else {
      addToast(res.error || 'Error al enviar presupuesto', 'error')
    }
  }

  // Taller accepts client proposed date (Paso 6 -> Paso 7)
  const handleTallerAceptarFechaCliente = async (sol: SolicitudPresupuestoCliente) => {
    if (!window.confirm(`¿Aceptar la fecha propuesta por el cliente para el ${sol.citaNegociacion?.fechaCliente} a las ${sol.citaNegociacion?.horaCliente} y generar el Expediente de taller?`)) {
      return
    }

    const res = await tallerAceptarFechaCliente(sol.id)
    if (res.success && res.solicitud) {
      addToast(`¡Fecha confirmada! Expediente ${res.expediente?.numero || ''} generado en estado RECEPCIÓN`, 'success')
      setSolicitudes(prev => prev.map(s => s.id === sol.id ? res.solicitud! : s))
    } else {
      addToast(res.error || 'Error al aceptar fecha del cliente', 'error')
    }
  }

  // Taller counter-proposes another date
  const handleOpenContraofertaModal = (sol: SolicitudPresupuestoCliente) => {
    setSelectedSolicitud(sol)
    const nextDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    setContraofertaForm({
      nuevaFecha: nextDate,
      nuevaHora: '10:00',
      notaTaller: 'Le proponemos esta fecha alternativa debido a la ocupación en elevadores.'
    })
    setIsContraofertaModalOpen(true)
  }

  const handleSubmitContraoferta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSolicitud) return

    if (!contraofertaForm.nuevaFecha || !contraofertaForm.nuevaHora) {
      addToast('Indica la nueva fecha y hora propuesta', 'warning')
      return
    }

    const res = await tallerProponerOtraFecha(selectedSolicitud.id, {
      nuevaFecha: contraofertaForm.nuevaFecha,
      nuevaHora: contraofertaForm.nuevaHora,
      notaTaller: contraofertaForm.notaTaller
    })

    if (res.success && res.solicitud) {
      addToast(`Nueva propuesta enviada al cliente para el ${contraofertaForm.nuevaFecha} a las ${contraofertaForm.nuevaHora}`, 'info')
      setSolicitudes(prev => prev.map(s => s.id === selectedSolicitud.id ? res.solicitud! : s))
      setIsContraofertaModalOpen(false)
      setSelectedSolicitud(null)
    } else {
      addToast(res.error || 'Error al enviar contraoferta', 'error')
    }
  }

  // Totals calculations for modal
  const modalSubtotal = useMemo(() => {
    return presupuestoForm.conceptos.reduce((acc, c) => acc + (c.cantidad * c.precio), 0)
  }, [presupuestoForm.conceptos])
  const modalIva = useMemo(() => Number((modalSubtotal * 0.21).toFixed(2)), [modalSubtotal])
  const modalTotal = useMemo(() => Number((modalSubtotal + modalIva).toFixed(2)), [modalSubtotal, modalIva])

  // Delete handler
  const handleEliminar = async (sol: SolicitudPresupuestoCliente) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la solicitud ${sol.numero} de ${sol.clienteNombre}?`)) {
      return
    }

    const ok = await eliminarSolicitudTaller(sol.id)
    if (ok) {
      setSolicitudes(prev => prev.filter(s => s.id !== sol.id))
      addToast(`Solicitud ${sol.numero} eliminada`, 'success')
      if (selectedSolicitud?.id === sol.id) setSelectedSolicitud(null)
    } else {
      addToast('Error al eliminar solicitud', 'error')
    }
  }

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhotos(true)
    try {
      const uploaded: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const url = await uploadFotoOptimizada(file, 'solicitud_taller')
        if (url) uploaded.push(url)
      }
      setNewPhotos(prev => [...prev, ...uploaded])
      addToast(`${uploaded.length} fotos procesadas`, 'success')
    } catch (err: any) {
      addToast('Error al subir fotos: ' + err.message, 'error')
    } finally {
      setUploadingPhotos(false)
    }
  }

  // Create new solicitud submit
  const handleCreateNewSolicitud = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newForm.clienteNombre.trim() || !newForm.matricula.trim() || !newForm.descripcion.trim()) {
      addToast('Por favor completa el cliente, matrícula y descripción', 'error')
      return
    }

    const res = await crearSolicitudDesdeTaller({
      clienteId: newForm.clienteId || `cli-${Date.now()}`,
      clienteNombre: newForm.clienteNombre.trim(),
      clienteTelefono: newForm.clienteTelefono.trim() || 'No indicado',
      clienteEmail: newForm.clienteEmail.trim() || undefined,
      matricula: newForm.matricula.trim().toUpperCase(),
      marcaModelo: newForm.marcaModelo.trim() || 'Vehículo taller',
      kilometros: newForm.kilometros.trim() || undefined,
      descripcion: newForm.descripcion.trim(),
      urgencia: newForm.urgencia,
      fechaDeseada: newForm.fechaDeseada || undefined,
      fotos: newPhotos,
      notasTaller: newForm.notasTaller.trim() || undefined,
      origen: newForm.origen
    })

    if (res.success && res.solicitud) {
      setSolicitudes(prev => [res.solicitud!, ...prev])
      addToast(`Solicitud ${res.solicitud.numero} creada con éxito`, 'success')
      setIsNewModalOpen(false)
      setNewForm({
        clienteId: '',
        clienteNombre: '',
        clienteTelefono: '',
        clienteEmail: '',
        matricula: '',
        marcaModelo: '',
        kilometros: '',
        descripcion: '',
        urgencia: 'normal',
        fechaDeseada: '',
        origen: 'taller',
        notasTaller: ''
      })
      setNewPhotos([])
    } else {
      addToast(res.error || 'Error al registrar solicitud', 'error')
    }
  }

  return (
    <div id="page-solicitudes-presupuesto" className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Inbox className="w-4 h-4" />
            <span>Gestión de Presupuestos e IA</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            Solicitudes de Presupuesto
            {stats.pendientes > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 animate-pulse">
                {stats.pendientes} pendientes
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recepción de averías enviadas por clientes, generación de presupuestos con IA (Gemini Pro), propuesta de citas y confirmación de expedientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-solicitudes"
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            title="Actualizar solicitudes"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            id="btn-nueva-solicitud"
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud Manual
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div 
          onClick={() => setStatusFilter('todas')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            statusFilter === 'todas' ? 'border-sky-500/50 bg-sky-500/5 shadow-sm' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total</span>
            <Inbox className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Todas</span>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDIENTE')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            statusFilter === 'PENDIENTE' ? 'border-amber-500/50 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Pendientes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1.5">{stats.pendientes}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Por presupuestar</span>
        </div>

        <div 
          onClick={() => setStatusFilter('PROPUESTA_ENVIADA')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            statusFilter === 'PROPUESTA_ENVIADA' ? 'border-sky-500/50 bg-sky-500/10 shadow-sm' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-sky-400 text-xs font-medium">
            <span>Propuesta Enviada</span>
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-300 mt-1.5">{stats.propuestasEnviadas}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Enviado al cliente</span>
        </div>

        <div 
          onClick={() => setStatusFilter('ACEPTADA')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            statusFilter === 'ACEPTADA' ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Aceptadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1.5">{stats.aceptadas}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Expediente generado</span>
        </div>

        <div 
          onClick={() => setStatusFilter('RECHAZADA')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            statusFilter === 'RECHAZADA' ? 'border-rose-500/50 bg-rose-500/10 shadow-sm' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Rechazadas</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1.5">{stats.rechazadas}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Cerradas</span>
        </div>

        <div 
          onClick={() => setUrgenciaFilter(urgenciaFilter === 'urgente' ? 'todas' : 'urgente')}
          className={`p-4 rounded-2xl bg-slate-900/90 border cursor-pointer transition-all ${
            urgenciaFilter === 'urgente' ? 'border-red-500/50 bg-red-500/10 shadow-sm' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-red-400 text-xs font-medium">
            <span>Urgentes</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400 mt-1.5">{stats.urgentes}</p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Prioritarias</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-solicitudes"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por matrícula, cliente, teléfono, número SOL o descripción..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <select
              id="select-filter-urgencia"
              value={urgenciaFilter}
              onChange={e => setUrgenciaFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-sky-500 shrink-0"
            >
              <option value="todas">Todas las urgencias</option>
              <option value="urgente">🚨 Solo Urgentes</option>
              <option value="pre_itv">⏳ Pre-ITV</option>
              <option value="normal">🔧 Normal</option>
            </select>

            <select
              id="select-filter-origen"
              value={origenFilter}
              onChange={e => setOrigenFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-sky-500 shrink-0"
            >
              <option value="todos">Todos los orígenes</option>
              <option value="portal_cliente">📲 Portal del Cliente</option>
              <option value="taller">📞 Taller / Teléfono</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto border-t border-slate-800/60 text-xs">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Estado:
          </span>

          {(['todas', 'PENDIENTE', 'PROPUESTA_ENVIADA', 'ACEPTADA', 'RECHAZADA', 'EN_PROCESO'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'todas' && 'Todas'}
              {st === 'PENDIENTE' && 'Pendientes'}
              {st === 'PROPUESTA_ENVIADA' && 'Propuesta enviada'}
              {st === 'ACEPTADA' && 'Aceptadas'}
              {st === 'RECHAZADA' && 'Rechazadas'}
              {st === 'EN_PROCESO' && 'En proceso'}
            </button>
          ))}
        </div>
      </div>

      {/* Solicitudes List */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs flex items-center justify-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          <span>Cargando solicitudes de presupuesto...</span>
        </div>
      ) : filteredSolicitudes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs space-y-3">
          <Inbox className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No se encontraron solicitudes</p>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'todas'
              ? 'Prueba a cambiar los filtros de búsqueda.'
              : 'Las solicitudes enviadas por clientes desde su portal aparecerán aquí con estado PENDIENTE.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSolicitudes.map(sol => {
            const isClienteProposedDate = sol.citaNegociacion?.estado === 'PROPUESTA_POR_CLIENTE'
            const isAceptada = sol.estado === 'ACEPTADA'
            const isPendiente = sol.estado === 'PENDIENTE'
            const isPropuestaEnviada = sol.estado === 'PROPUESTA_ENVIADA'
            const isRechazada = sol.estado === 'RECHAZADA'

            return (
              <div 
                key={sol.id} 
                className={`p-5 rounded-2xl bg-slate-900/90 border transition-all hover:border-slate-700 shadow-sm space-y-4 ${
                  isClienteProposedDate 
                    ? 'border-amber-500/60 bg-amber-500/[0.03] ring-1 ring-amber-500/20' 
                    : isPendiente
                    ? 'border-amber-500/30'
                    : isAceptada
                    ? 'border-emerald-500/30'
                    : isRechazada
                    ? 'border-rose-900/40 opacity-75'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Row: Identification, Badges & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-800/60">
                      {sol.numero}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      isPendiente
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : sol.estado === 'EN_PROCESO'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : isPropuestaEnviada
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : isAceptada
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {isPendiente && <Clock className="w-3.5 h-3.5" />}
                      {isPropuestaEnviada && <Send className="w-3.5 h-3.5" />}
                      {isAceptada && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isRechazada && <XCircle className="w-3.5 h-3.5" />}
                      {sol.estado}
                    </span>

                    {/* Urgency Badge */}
                    {sol.urgencia === 'urgente' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> URGENTE
                      </span>
                    )}
                    {sol.urgencia === 'pre_itv' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
                        Pre-ITV
                      </span>
                    )}

                    {/* Origin Badge */}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {sol.origen === 'portal_cliente' ? '📲 Portal Cliente' : '📞 Taller'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Recibida el {new Date(sol.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Middle Info: Client & Vehicle */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {/* Client Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cliente</span>
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sol.clienteNombre}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {sol.clienteTelefono}
                      </span>
                      {sol.clienteTelefono && (
                        <button
                          type="button"
                          onClick={() => {
                            const rawTel = sol.clienteTelefono.replace(/[^0-9]/g, '')
                            const tel = rawTel.startsWith('34') ? rawTel : `34${rawTel}`
                            const msg = encodeURIComponent(`Hola ${sol.clienteNombre}, te contactamos desde el taller respecto a tu solicitud ${sol.numero} para ${sol.matricula}.`)
                            window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Vehículo</span>
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sol.marcaModelo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sky-300 font-bold">
                        {sol.matricula}
                      </span>
                      {sol.kilometros && (
                        <span className="text-slate-500">· {sol.kilometros}</span>
                      )}
                    </div>
                  </div>

                  {/* Proposed Appointment Status */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cita y Presupuesto</span>
                    {sol.presupuestoPropuesto ? (
                      <div className="space-y-1">
                        <div className="text-white font-semibold flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Total: {sol.presupuestoPropuesto.total.toFixed(2)} €</span>
                          <span className="text-[10px] text-slate-500">(IVA incl.)</span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          <span>Cita: {sol.citaNegociacion?.fechaTaller || sol.fechaDeseada || 'No fijada'} a las {sol.citaNegociacion?.horaTaller || '09:30'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        {sol.fechaDeseada 
                          ? `Cliente prefiere cita hacia el: ${sol.fechaDeseada}`
                          : 'Aún no se ha emitido propuesta económica.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Problem Description */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                    Descripción de la avería indicada por el cliente:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {sol.descripcion}
                  </p>
                </div>

                {/* Images Gallery (Up to 5 images) */}
                {sol.fotos && sol.fotos.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                      Fotografías adjuntadas ({sol.fotos.length}/5):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {sol.fotos.map((img, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setSelectedPhoto(img)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700/80 cursor-pointer hover:border-sky-500 transition-all shrink-0 group"
                        >
                          <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEGOTIATION ALERT: Client proposed a new date! (Paso 6) */}
                {isClienteProposedDate && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 space-y-2.5 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-300">
                          El cliente propone una nueva fecha de cita
                        </h4>
                        <p className="text-xs mt-0.5">
                          Fecha solicitada: <strong className="text-white font-mono">{sol.citaNegociacion?.fechaCliente}</strong> a las <strong className="text-white font-mono">{sol.citaNegociacion?.horaCliente} h</strong>.
                        </p>
                        {sol.citaNegociacion?.motivoCliente && (
                          <p className="text-[11px] text-amber-200/80 italic mt-1 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                            Motivo del cliente: "{sol.citaNegociacion.motivoCliente}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleTallerAceptarFechaCliente(sol)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar fecha del cliente
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenContraofertaModal(sol)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        Proponer otra fecha
                      </button>
                    </div>
                  </div>
                )}

                {/* ACCEPTED BADGE & EXPEDIENTE ROADMAP LINK (Paso 7) */}
                {isAceptada && sol.expedienteGenerado && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white">Presupuesto aceptado y cita confirmada:</span>
                        <span className="block text-slate-300 text-[11px]">
                          {sol.citaNegociacion?.fechaTaller || sol.expedienteGenerado.fechaCitaConfirmada} a las {sol.citaNegociacion?.horaTaller || sol.expedienteGenerado.horaCitaConfirmada} h · Fase: {sol.expedienteGenerado.faseActual}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/expedientes?num=${sol.expedienteGenerado?.numero}`)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>Ver Expediente en Roadmap</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {/* Botón Generar Presupuesto */}
                    {(isPendiente || sol.estado === 'EN_PROCESO' || isPropuestaEnviada) && (
                      <button
                        id={`btn-generar-presupuesto-${sol.id}`}
                        type="button"
                        onClick={() => handleOpenPresupuestoModal(sol)}
                        className="px-4 py-2 rounded-xl bg-linear-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                        <span>{isPropuestaEnviada ? 'Modificar Presupuesto / Cita' : 'Generar presupuesto'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEliminar(sol)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar solicitud"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: GENERAR PRESUPUESTO CON IA Y PROPONER CITA */}
      {/* -------------------------------------------------------------------------------- */}
      {isPresupuestoModalOpen && selectedSolicitud && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Elaboración de Presupuesto con IA</span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Generar Presupuesto · {selectedSolicitud.numero}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSolicitud.clienteNombre} · {selectedSolicitud.marcaModelo} ({selectedSolicitud.matricula})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPresupuestoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPresupuestoToClient} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Problem Description Preloaded */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                  Problema indicado por el cliente:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{selectedSolicitud.descripcion}"
                </p>
              </div>

              {/* Reglas de Precios y Selector de Tipo de Cliente */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      Tarifa y Tipo de Cliente:
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Piezas de carrocería (aleta, paragolpes, techo, capó...):{' '}
                      <strong className="text-emerald-400 font-mono">
                        {presupuestoForm.tipoCliente === 'empresa' ? '70 €/ud' : '80 €/ud'}
                      </strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleChangeTipoCliente('particular')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        presupuestoForm.tipoCliente === 'particular'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Particular (80 €/pieza)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeTipoCliente('empresa')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        presupuestoForm.tipoCliente === 'empresa'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Empresa (70 €/pieza)</span>
                    </button>
                  </div>
                </div>

                {/* Normativa de importes y cantidades visible */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Reglas de presupuesto:
                    </span>
                    <span>Piezas: <strong className="text-slate-200 font-mono">{presupuestoForm.tipoCliente === 'empresa' ? '70 €' : '80 €'}</strong> (números enteros de 1 en 1)</span>
                    <span>Reparaciones: <strong className="text-slate-200">horas de 0,5 en 0,5</strong> (1h, 1.5h, 2h, 2.5h...)</span>
                  </div>

                  <a
                    href="#/tarifas"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Tag className="w-3 h-3" />
                    <span>Ver Listado Oficial de Precios</span>
                  </a>
                </div>

                {/* Accesos rápidos de inserción */}
                <div className="space-y-2.5 pt-1">
                  {/* PINTAR NÚMERO DE PIEZAS (Solicitado: poner simplemente un número, ej. 2 piezas, 3 piezas, 4 piezas) */}
                  <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-600/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-sky-400" />
                        Pintar número de piezas (número entero sin detallar cada una):
                      </span>
                      <span className="text-[10px] text-sky-300 font-mono font-bold">
                        {presupuestoForm.tipoCliente === 'empresa' ? '70 €' : '80 €'}/pieza
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleAddPintarNumeroPiezas(num)}
                          className="px-2.5 py-1 rounded-lg bg-sky-900/60 hover:bg-sky-800 border border-sky-600/50 text-xs font-bold text-white transition-all flex items-center gap-1 shadow-xs"
                          title={`Añadir ${num} pieza(s) a ${num * (presupuestoForm.tipoCliente === 'empresa' ? 70 : 80)} €`}
                        >
                          <Plus className="w-3 h-3 text-sky-300" />
                          <span>{num} {num === 1 ? 'pieza' : 'piezas'} ({num * (presupuestoForm.tipoCliente === 'empresa' ? 70 : 80)} €)</span>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddPintarCocheEntero}
                        className="px-2.5 py-1 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-600/50 text-xs font-bold text-indigo-200 transition-all flex items-center gap-1 shadow-xs ml-auto"
                        title="Pintar coche entero completo"
                      >
                        <Car className="w-3 h-3 text-indigo-300" />
                        <span>Pintar coche entero ({presupuestoForm.tipoCliente === 'empresa' ? PRECIO_PINTAR_ENTERO_EMPRESA : PRECIO_PINTAR_ENTERO_PARTICULAR} €)</span>
                      </button>
                    </div>
                  </div>

                  {/* Piezas individuales opcionales */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">O por pieza individual:</span>
                    {PIEZAS_FRECUENTES_PRESUPUESTO.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPiezaRapida(p.nombre)}
                        className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-sky-300 hover:text-sky-200 transition-colors flex items-center gap-1"
                        title={`Añadir ${p.nombre} (1 ud a ${presupuestoForm.tipoCliente === 'empresa' ? '70' : '80'} €)`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{p.nombre.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Insertar reparación (paso 0.5h):</span>
                    {REPARACIONES_FRECUENTES_PRESUPUESTO.slice(0, 3).map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddReparacionRapida(r.nombre, r.horas)}
                        className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-[11px] text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
                        title={`Añadir ${r.nombre} (${r.horas} horas)`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{r.horas}h {r.nombre.replace('Horas ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* IA Generation Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>
                    Analizar avería con IA aplicando tarifa <strong className="text-white">{presupuestoForm.tipoCliente.toUpperCase()}</strong> (piezas {presupuestoForm.tipoCliente === 'empresa' ? '70€' : '80€'}, reparaciones en 0.5h)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => triggerIAGenerateConcepts(
                    selectedSolicitud.descripcion, 
                    `${selectedSolicitud.marcaModelo} (${selectedSolicitud.matricula})`,
                    presupuestoForm.tipoCliente
                  )}
                  disabled={isGeneratingIA}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {isGeneratingIA ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analizando avería...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sugerir con Gemini IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable Concepts Table */}
              {/* Editable Concepts List with Swipe / Lateral Scroll to delete */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Conceptos de Reparación y Piezas
                    </h4>
                    <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <ArrowLeft className="w-2.5 h-2.5" /> Scroll lateral dcha. a izq. para eliminar
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddConcepto}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir concepto manual</span>
                  </button>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 p-2 space-y-2">
                  {/* Table Header for desktop */}
                  <div className="hidden md:grid md:grid-cols-[100px_1fr_120px_110px_90px_36px] items-center gap-2 px-3 py-2 bg-slate-900/90 text-slate-400 font-semibold text-xs border border-slate-800 rounded-lg">
                    <div>Tipo</div>
                    <div>Descripción del Trabajo / Recambio</div>
                    <div className="text-center">Cantidad</div>
                    <div className="text-right">Precio Ud. (€)</div>
                    <div className="text-right">Subtotal</div>
                    <div className="text-center"></div>
                  </div>

                  {/* Concept items with Swipe and Lateral Scroll to delete */}
                  <div className="space-y-2">
                    {presupuestoForm.conceptos.map((c, idx) => {
                      const lineTotal = c.cantidad * c.precio
                      const isPiece = c.tipo === 'pieza' || esPiezaVehiculo(c.descripcion)
                      return (
                        <SwipeableConceptoItem
                          key={c.id || idx}
                          index={idx}
                          onDelete={() => {
                            handleRemoveConcepto(c.id)
                            addToast('Línea de concepto eliminada', 'info')
                          }}
                          disabled={presupuestoForm.conceptos.length <= 1}
                          className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 shadow-xs"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_120px_110px_90px_36px] items-center gap-2 p-2">
                            {/* Toggle Tipo */}
                            <div>
                              <button
                                type="button"
                                onClick={() => handleToggleConceptoTipo(c.id)}
                                className={`w-full px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                                  isPiece 
                                    ? 'bg-sky-950 text-sky-300 border border-sky-700/60 hover:bg-sky-900/50' 
                                    : 'bg-amber-950 text-amber-300 border border-amber-700/60 hover:bg-amber-900/50'
                                }`}
                                title="Haga clic para alternar entre Pieza y Horas de Reparación"
                              >
                                {isPiece ? (
                                  <>
                                    <Car className="w-3 h-3" />
                                    <span>Pieza</span>
                                  </>
                                ) : (
                                  <>
                                    <Wrench className="w-3 h-3" />
                                    <span>Horas</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Descripción */}
                            <div>
                              <input
                                type="text"
                                value={c.descripcion}
                                onChange={e => handleUpdateConcepto(c.id, 'descripcion', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                                placeholder="Ej: Aleta delantera, Horas de pintura..."
                                required
                              />
                              {isPiece && (
                                <span className="text-[10px] text-sky-400/80 block mt-0.5">
                                  Pieza detectada: {presupuestoForm.tipoCliente === 'empresa' ? '70 €' : '80 €'} oficial
                                </span>
                              )}
                            </div>

                            {/* Cantidad */}
                            <div>
                              {isPiece ? (
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={c.cantidad}
                                    onChange={e => handleUpdateConcepto(c.id, 'cantidad', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-sky-500 font-mono"
                                    title="Cantidad en números enteros (de 1 en 1)"
                                    required
                                  />
                                  <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                                    uds. (enteros)
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={c.cantidad}
                                    onChange={e => handleUpdateConcepto(c.id, 'cantidad', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-sky-500 font-mono"
                                    title="Horas de reparación en pasos de 0,5 en 0,5"
                                    required
                                  />
                                  <span className="text-[9px] text-amber-400/80 block text-center mt-0.5">
                                    horas (paso 0.5)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Precio */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={c.precio}
                                onChange={e => handleUpdateConcepto(c.id, 'precio', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-sky-500 font-mono"
                                required
                              />
                            </div>

                            {/* Subtotal */}
                            <div className="text-right font-mono font-semibold text-white text-xs">
                              {lineTotal.toFixed(2)} €
                            </div>

                            {/* Eliminar */}
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveConcepto(c.id)}
                                disabled={presupuestoForm.conceptos.length <= 1}
                                className="text-slate-500 hover:text-rose-400 disabled:opacity-20 p-1 transition-colors"
                                title="Eliminar línea (o haz scroll lateral dcha. a izq.)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </SwipeableConceptoItem>
                      )
                    })}
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal neto:</span>
                      <span className="font-mono text-white">{modalSubtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>IVA (21%):</span>
                      <span className="font-mono text-white">{modalIva.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1.5 border-t border-slate-800">
                      <span>Total Presupuesto:</span>
                      <span className="font-mono">{modalTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Date & Time (Obligatorio) */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Fecha y Hora Propuesta para la Cita (Obligatorio)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Indica al cliente cuándo puede traer su vehículo para la reparación o diagnóstico en taller.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Fecha propuesta:
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={presupuestoForm.fechaCita}
                      onChange={e => setPresupuestoForm(prev => ({ ...prev, fechaCita: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Hora propuesta:
                    </label>
                    <input
                      type="time"
                      value={presupuestoForm.horaCita}
                      onChange={e => setPresupuestoForm(prev => ({ ...prev, horaCita: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Observaciones / Notas para el cliente:
                </label>
                <textarea
                  rows={2}
                  value={presupuestoForm.observaciones}
                  onChange={e => setPresupuestoForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="Información adicional sobre la garantía de recambios, tiempos de entrega..."
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPresupuestoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar presupuesto al cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: CONTRAOFERTA DE FECHA DE CITA (TALLER) */}
      {/* -------------------------------------------------------------------------------- */}
      {isContraofertaModalOpen && selectedSolicitud && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Clock className="w-4 h-4" />
                <span>Proponer Nueva Fecha de Cita</span>
              </div>
              <button
                type="button"
                onClick={() => setIsContraofertaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              El cliente solicitó el {selectedSolicitud.citaNegociacion?.fechaCliente} a las {selectedSolicitud.citaNegociacion?.horaCliente}. Especifica la alternativa disponible:
            </p>

            <form onSubmit={handleSubmitContraoferta} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nueva fecha de cita:
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={contraofertaForm.nuevaFecha}
                  onChange={e => setContraofertaForm(prev => ({ ...prev, nuevaFecha: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nueva hora:
                </label>
                <input
                  type="time"
                  value={contraofertaForm.nuevaHora}
                  onChange={e => setContraofertaForm(prev => ({ ...prev, nuevaHora: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mensaje explicativo para el cliente:
                </label>
                <textarea
                  rows={2}
                  value={contraofertaForm.notaTaller}
                  onChange={e => setContraofertaForm(prev => ({ ...prev, notaTaller: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContraofertaModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20"
                >
                  Enviar al cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: PHOTO PREVIEW */}
      {/* -------------------------------------------------------------------------------- */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img src={selectedPhoto} alt="Ampliación foto avería" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL: NUEVA SOLICITUD MANUAL */}
      {/* -------------------------------------------------------------------------------- */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Plus className="w-4 h-4" />
                <span>Registrar Solicitud en Taller</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSolicitud} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newForm.clienteNombre}
                    onChange={e => setNewForm(prev => ({ ...prev, clienteNombre: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    placeholder="Ej: Laura Morales"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newForm.clienteTelefono}
                    onChange={e => setNewForm(prev => ({ ...prev, clienteTelefono: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    placeholder="600 000 000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Matrícula *</label>
                  <input
                    type="text"
                    required
                    value={newForm.matricula}
                    onChange={e => setNewForm(prev => ({ ...prev, matricula: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
                    placeholder="1234-BBB"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Marca y Modelo</label>
                  <input
                    type="text"
                    value={newForm.marcaModelo}
                    onChange={e => setNewForm(prev => ({ ...prev, marcaModelo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    placeholder="Renault Mégane 1.5 dCi"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descripción de la Avería / Petición *</label>
                <textarea
                  rows={3}
                  required
                  value={newForm.descripcion}
                  onChange={e => setNewForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  placeholder="Síntomas que presenta el vehículo..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Urgencia</label>
                  <select
                    value={newForm.urgencia}
                    onChange={e => setNewForm(prev => ({ ...prev, urgencia: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgente">🚨 Urgente</option>
                    <option value="pre_itv">⏳ Pre-ITV</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fecha deseada</label>
                  <input
                    type="date"
                    value={newForm.fechaDeseada}
                    onChange={e => setNewForm(prev => ({ ...prev, fechaDeseada: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Subida de fotos */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Adjuntar fotos (opcional, máx 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-500"
                />
                {uploadingPhotos && <p className="text-[11px] text-sky-400 mt-1">Subiendo fotos...</p>}
                {newPhotos.length > 0 && (
                  <p className="text-[11px] text-emerald-400 mt-1">{newPhotos.length} fotos adjuntadas</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Guardar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
