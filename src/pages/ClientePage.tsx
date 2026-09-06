import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { supabase } from '../lib/supabase'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { uploadFotoOptimizada } from '../lib/expedienteService'
import { 
  crearSolicitudPresupuestoCliente, 
  clienteAceptarPresupuestoYCita, 
  clienteProponerNuevaFecha,
  clienteRechazarPresupuesto,
  validarFechaHoraPropuestaCliente,
  getStoredSolicitudesCliente,
  SolicitudPresupuestoCliente,
  EstadoSolicitud
} from '../services/clientePresupuestoService'
import { 
  Car, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  AlertCircle,
  FileCheck,
  XCircle,
  Wrench,
  Camera,
  Plus,
  Send,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Eye,
  MessageSquare,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Building2
} from 'lucide-react'

export const ClientePage: React.FC = () => {
  const { perfil, logout, switchDevelopmentRole } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clienteSession = perfil?.clienteInfo || {
    nombre: perfil?.nombre || 'Cliente del Taller',
    matricula: '1234-KMT',
    telefono: '600 123 456'
  }

  // Active Tab: default to 'solicitar' as requested in prompt, or allow seamless switching
  const [activeTab, setActiveTab] = useState<'solicitar' | 'solicitudes' | 'seguimiento' | 'facturas'>('solicitar')

  // Real-time state
  const [loading, setLoading] = useState(false)
  const [solicitudes, setSolicitudes] = useState<SolicitudPresupuestoCliente[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Vehicles of the client (if multiple, choose; if one, preselect)
  const [vehiculosCliente, setVehiculosCliente] = useState<Array<{ id: string; matricula: string; marca: string; modelo: string }>>([
    { id: 'v1', matricula: '1234-KMT', marca: 'SEAT', modelo: 'León 2.0 TDI' },
    { id: 'v2', matricula: '4829-KLP', marca: 'Volkswagen', modelo: 'Golf VII 2.0 TDI' }
  ])
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('v1')
  const [customMatricula, setCustomMatricula] = useState<string>('')
  const [customModelo, setCustomModelo] = useState<string>('')

  // Form: Solicitar Presupuesto
  const [descripcionProblema, setDescripcionProblema] = useState<string>('')
  const [urgenciaSeleccionada, setUrgenciaSeleccionada] = useState<'normal' | 'urgente' | 'pre_itv'>('normal')
  const [fechaDeseadaCliente, setFechaDeseadaCliente] = useState<string>('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Modal: Negociación de Cita / Aceptar Presupuesto (Paso 5)
  const [citaConfirmModal, setCitaConfirmModal] = useState<{
    open: boolean
    solicitud: SolicitudPresupuestoCliente | null
    modo: 'pregunta' | 'proponer_otra' | 'exito'
    expedienteCreado?: any
  }>({
    open: false,
    solicitud: null,
    modo: 'pregunta'
  })

  // State for client proposed date
  const [clienteNuevaFecha, setClienteNuevaFecha] = useState<string>('')
  const [clienteNuevaHora, setClienteNuevaHora] = useState<string>('10:00')
  const [clienteMotivoFecha, setClienteMotivoFecha] = useState<string>('')
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)

  // Active Roadmap / Expedientes for tracking
  const [expedientesCliente, setExpedientesCliente] = useState<any[]>([])

  // Load client data & requests
  const loadClientData = async () => {
    try {
      setLoading(true)
      const storedSols = getStoredSolicitudesCliente()
      setSolicitudes(storedSols)

      // Check client vehicles from Supabase
      try {
        const { data: vehs } = await supabase
          .from('vehiculos')
          .select('id, matricula, marca, modelo')
          .limit(10)

        if (vehs && vehs.length > 0) {
          setVehiculosCliente(vehs)
          if (vehs.length === 1) {
            setSelectedVehiculoId(vehs[0].id)
          }
        }
      } catch (e) {}

      // Load stored expedientes
      try {
        const rawExps = localStorage.getItem('gestarian_expedientes_override')
        if (rawExps) {
          setExpedientesCliente(JSON.parse(rawExps))
        }
      } catch (e) {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, [])

  // Centralized realtime subscription
  useRealtimeSubscription({
    tables: ['presupuestos', 'citas', 'expedientes'],
    onUpdate: () => {
      loadClientData()
    }
  })

  // Preselection logic for vehicles: if only 1 vehicle exists, auto-select it
  useEffect(() => {
    if (vehiculosCliente.length === 1) {
      setSelectedVehiculoId(vehiculosCliente[0].id)
    }
  }, [vehiculosCliente])

  // Handle Photo selection (Max 5 images as requested)
  const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const selectedList = Array.from(e.target.files)
    const availableSlots = 5 - attachedFiles.length

    if (availableSlots <= 0) {
      addToast('Máximo de 5 imágenes alcanzado', 'warning')
      return
    }

    const toAdd = selectedList.slice(0, availableSlots)
    setAttachedFiles(prev => [...prev, ...toAdd])

    toAdd.forEach(file => {
      const previewUrl = URL.createObjectURL(file)
      setFilePreviews(prev => [...prev, previewUrl])
    })

    if (selectedList.length > availableSlots) {
      addToast(`Solo se adjuntaron ${availableSlots} fotos (máximo 5)`, 'info')
    }
  }

  // Remove photo from preview
  const handleRemovePhoto = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Submit Request (Paso 1)
  const handleSubmitSolicitud = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!descripcionProblema.trim()) {
      addToast('Por favor describe el problema de tu vehículo', 'warning')
      return
    }

    // Determine vehicle data
    let matriculaFinal = ''
    let modeloFinal = ''
    let vehId: string | undefined = undefined

    if (selectedVehiculoId === 'otro') {
      if (!customMatricula.trim()) {
        addToast('Por favor indica la matrícula de tu vehículo', 'warning')
        return
      }
      matriculaFinal = customMatricula.trim().toUpperCase()
      modeloFinal = customModelo.trim() || 'Vehículo particular'
    } else {
      const found = vehiculosCliente.find(v => v.id === selectedVehiculoId)
      if (found) {
        matriculaFinal = found.matricula
        modeloFinal = `${found.marca} ${found.modelo}`
        vehId = found.id
      } else {
        matriculaFinal = clienteSession.matricula || '1234-KMT'
        modeloFinal = 'SEAT León 2.0 TDI'
      }
    }

    try {
      setSubmittingRequest(true)
      addToast('Enviando solicitud y optimizando imágenes...', 'info')

      const res = await crearSolicitudPresupuestoCliente({
        clienteId: perfil?.id || 'cli-001',
        clienteNombre: clienteSession.nombre,
        clienteTelefono: clienteSession.telefono,
        matricula: matriculaFinal,
        marcaModelo: modeloFinal,
        vehiculoId: vehId,
        descripcion: descripcionProblema.trim(),
        urgencia: urgenciaSeleccionada,
        fotos: attachedFiles,
        fechaDeseada: fechaDeseadaCliente || undefined
      })

      if (res.success && res.solicitud) {
        setSolicitudes(prev => [res.solicitud!, ...prev])
        addToast(`¡Solicitud ${res.solicitud.numero} enviada con éxito! El taller la revisará para generar tu presupuesto.`, 'success')

        // Reset form
        setDescripcionProblema('')
        setFechaDeseadaCliente('')
        setAttachedFiles([])
        setFilePreviews([])
        setCustomMatricula('')
        setCustomModelo('')

        // Navigate to solicitudes list tab
        setActiveTab('solicitudes')
      } else {
        addToast(res.error || 'Error al enviar solicitud', 'error')
      }
    } catch (err: any) {
      addToast('Error inesperado: ' + err.message, 'error')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Step 4: Client rejects quote
  const handleRechazarPresupuesto = async (sol: SolicitudPresupuestoCliente) => {
    if (!window.confirm(`¿Estás seguro de que deseas rechazar el presupuesto de la solicitud ${sol.numero}? Una vez rechazada, la solicitud se cerrará definitivamente.`)) {
      return
    }

    const res = await clienteRechazarPresupuesto(sol.id, 'Rechazado desde el portal del cliente.')
    if (res.success && res.solicitud) {
      addToast('Presupuesto rechazado. La solicitud ha sido cerrada.', 'info')
      setSolicitudes(prev => prev.map(s => s.id === sol.id ? res.solicitud! : s))
    } else {
      addToast(res.error || 'No se pudo rechazar el presupuesto', 'error')
    }
  }

  // Step 4 -> Step 5: Client clicks "Aceptar presupuesto"
  const handleOpenAceptarModal = (sol: SolicitudPresupuestoCliente) => {
    setCitaConfirmModal({
      open: true,
      solicitud: sol,
      modo: 'pregunta'
    })
    // Initialize candidate client date to taller date
    const tallerDate = sol.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
    setClienteNuevaFecha(tallerDate)
    setClienteNuevaHora('11:00')
    setClienteMotivoFecha('')
    setDateValidationError(null)
  }

  // Step 5: Option A: "Sí, acepto la fecha" -> Cita confirmada (ASIGNADA) + ACEPTADA + Genera Expediente (Paso 7)
  const handleConfirmarFechaTaller = async () => {
    if (!citaConfirmModal.solicitud) return

    try {
      setLoading(true)
      const res = await clienteAceptarPresupuestoYCita(citaConfirmModal.solicitud.id)
      if (res.success && res.solicitud) {
        addToast(`¡Presupuesto aceptado y cita confirmada! Se ha generado tu Expediente ${res.expediente?.numero || ''} en el Roadmap del taller.`, 'success')
        setSolicitudes(prev => prev.map(s => s.id === citaConfirmModal.solicitud!.id ? res.solicitud! : s))
        
        // Show success screen in modal
        setCitaConfirmModal(prev => ({
          ...prev,
          modo: 'exito',
          expedienteCreado: res.expediente
        }))

        // Refresh expedientes
        loadClientData()
      } else {
        addToast(res.error || 'Error al confirmar presupuesto', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 5: Option B: Client proposes new date (validation: fechaCliente >= fechaTaller)
  const handleValidarYEnviarNuevaFecha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!citaConfirmModal.solicitud) return

    const tallerDate = citaConfirmModal.solicitud.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
    const tallerHour = citaConfirmModal.solicitud.citaNegociacion?.horaTaller || '09:00'

    // Strict validation
    const validation = validarFechaHoraPropuestaCliente(
      tallerDate,
      tallerHour,
      clienteNuevaFecha,
      clienteNuevaHora
    )

    if (!validation.valida) {
      setDateValidationError(validation.error || 'Fecha no válida')
      return
    }

    setDateValidationError(null)

    try {
      setLoading(true)
      const res = await clienteProponerNuevaFecha(citaConfirmModal.solicitud.id, {
        nuevaFecha: clienteNuevaFecha,
        nuevaHora: clienteNuevaHora,
        motivo: clienteMotivoFecha.trim() || undefined
      })

      if (res.success && res.solicitud) {
        addToast('Tu propuesta de fecha ha sido enviada al taller. Te responderán a la brevedad.', 'success')
        setSolicitudes(prev => prev.map(s => s.id === citaConfirmModal.solicitud!.id ? res.solicitud! : s))
        setCitaConfirmModal({ open: false, solicitud: null, modo: 'pregunta' })
      } else {
        addToast(res.error || 'Error al proponer fecha', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // Real-time validation on date/hour change
  useEffect(() => {
    if (citaConfirmModal.open && citaConfirmModal.solicitud && citaConfirmModal.modo === 'proponer_otra') {
      const tallerDate = citaConfirmModal.solicitud.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]
      const tallerHour = citaConfirmModal.solicitud.citaNegociacion?.horaTaller || '09:00'
      const check = validarFechaHoraPropuestaCliente(tallerDate, tallerHour, clienteNuevaFecha, clienteNuevaHora)
      if (!check.valida) {
        setDateValidationError(check.error || null)
      } else {
        setDateValidationError(null)
      }
    }
  }, [clienteNuevaFecha, clienteNuevaHora, citaConfirmModal])

  // Count pending quotes
  const quotesWithProposalCount = useMemo(() => {
    return solicitudes.filter(s => s.estado === 'PROPUESTA_ENVIADA').length
  }, [solicitudes])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Client Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base text-white tracking-wide flex items-center gap-1.5">
                PORTAL DEL CLIENTE
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  GESTARIAN DM CAR
                </span>
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1 truncate max-w-[200px] sm:max-w-xs font-medium">
                {clienteSession.nombre} • Tel: <strong className="text-white font-mono">{clienteSession.telefono}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('solicitar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                activeTab === 'solicitar' 
                  ? 'bg-sky-600 text-white shadow-sky-600/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Solicitar presupuesto</span>
            </button>

            <button
              onClick={() => {
                logout()
                navigate('/portal')
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Salir del portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-800/80 overflow-x-auto py-1">
          <button
            id="tab-solicitar-presupuesto"
            onClick={() => setActiveTab('solicitar')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'solicitar'
                ? 'bg-sky-600/25 text-sky-300 border border-sky-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Solicitar presupuesto</span>
          </button>

          <button
            id="tab-mis-solicitudes"
            onClick={() => setActiveTab('solicitudes')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'solicitudes'
                ? 'bg-sky-600/25 text-sky-300 border border-sky-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mis presupuestos y solicitudes</span>
            {quotesWithProposalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                {quotesWithProposalCount}
              </span>
            )}
          </button>

          <button
            id="tab-seguimiento-roadmap"
            onClick={() => setActiveTab('seguimiento')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'seguimiento'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roadmap en directo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            id="tab-facturas"
            onClick={() => setActiveTab('facturas')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'facturas'
                ? 'bg-purple-600/25 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Facturas</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 1: FORMULARIO SOLICITAR PRESUPUESTO (Paso 1) */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'solicitar' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
                <Plus className="w-4 h-4" />
                <span>Petición Online de Presupuesto</span>
              </div>
              <h1 className="text-2xl font-black text-white">
                Solicitar Presupuesto al Taller
              </h1>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Describe el fallo o trabajo que necesita tu coche, adjunta fotografías para una peritación más precisa y nuestro taller generará tu presupuesto asistido por IA junto a una propuesta de cita.
              </p>
            </div>

            <form onSubmit={handleSubmitSolicitud} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              
              {/* 1. Selector de Vehículo */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-sky-400" />
                    1. Selecciona tu vehículo *
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {vehiculosCliente.length === 1 ? 'Vehículo único preseleccionado' : `${vehiculosCliente.length} vehículos disponibles`}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehiculosCliente.map(veh => {
                    const isSelected = selectedVehiculoId === veh.id
                    return (
                      <div
                        key={veh.id}
                        onClick={() => setSelectedVehiculoId(veh.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/40 text-white'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-xs">{veh.marca} {veh.modelo}</div>
                          <div className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 inline-block border border-slate-800 text-sky-300 font-bold">
                            {veh.matricula}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-sky-400 bg-sky-500 text-white' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    )
                  })}

                  {/* Opción Otro Vehículo */}
                  <div
                    onClick={() => setSelectedVehiculoId('otro')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                      selectedVehiculoId === 'otro'
                        ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/40 text-white'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs">Otro vehículo</div>
                      <div className="text-[11px] text-slate-500">Introducir otra matrícula</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedVehiculoId === 'otro' ? 'border-sky-400 bg-sky-500 text-white' : 'border-slate-700'
                    }`}>
                      {selectedVehiculoId === 'otro' && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>

                {/* Si seleccionó 'otro', mostrar inputs de matrícula y modelo */}
                {selectedVehiculoId === 'otro' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Matrícula *</label>
                      <input
                        type="text"
                        value={customMatricula}
                        onChange={e => setCustomMatricula(e.target.value.toUpperCase())}
                        placeholder="Ej: 5678-ABC"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono"
                        required={selectedVehiculoId === 'otro'}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marca y Modelo</label>
                      <input
                        type="text"
                        value={customModelo}
                        onChange={e => setCustomModelo(e.target.value)}
                        placeholder="Ej: Ford Focus 1.0 EcoBoost"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Descripción del Problema (Obligatorio) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-sky-400" />
                    2. Descripción del problema o avería *
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Obligatorio
                  </span>
                </label>
                <textarea
                  id="textarea-descripcion-averia"
                  rows={4}
                  required
                  value={descripcionProblema}
                  onChange={e => setDescripcionProblema(e.target.value)}
                  placeholder="Explica qué le ocurre al coche. Ej: 'El coche hace un ruido extraño al frenar y vibra el volante a partir de 80 km/h', o 'Se enciende testigo motor y da tirones'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed transition-colors"
                />
                <p className="text-[11px] text-slate-400">
                  Cuanto más detallada sea la descripción, más exacto será el presupuesto y diagnosis preliminar de taller.
                </p>
              </div>

              {/* 3. Subida de Imágenes (Hasta 5 archivos, opcional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-400" />
                    3. Subida de imágenes (opcional, máx. 5 archivos)
                  </span>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">
                    {attachedFiles.length} / 5 seleccionadas
                  </span>
                </label>

                {/* Dropzone / Upload Trigger */}
                <div
                  onClick={() => {
                    if (attachedFiles.length < 5) fileInputRef.current?.click()
                  }}
                  className={`p-5 rounded-xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2 ${
                    attachedFiles.length >= 5
                      ? 'border-slate-800 bg-slate-950/40 opacity-60 cursor-not-allowed'
                      : 'border-slate-700 bg-slate-950/70 hover:border-sky-500 hover:bg-slate-950 cursor-pointer'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleSelectPhotos}
                    className="hidden"
                    disabled={attachedFiles.length >= 5}
                  />
                  <Upload className="w-6 h-6 text-slate-400" />
                  <p className="text-xs text-slate-300 font-semibold">
                    {attachedFiles.length >= 5 
                      ? 'Límite de 5 fotografías alcanzado'
                      : 'Haz clic aquí o arrastra fotos del golpe, avería o cuadro de instrumentos'}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    JPG, PNG, WEBP (se optimizarán automáticamente)
                  </span>
                </div>

                {/* Previews Grid */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {filePreviews.map((preview, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-square">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors shadow"
                            title="Eliminar foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-slate-300">
                          {idx + 1}/5
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Preferencias de Urgencia y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nivel de urgencia:
                  </label>
                  <select
                    value={urgenciaSeleccionada}
                    onChange={e => setUrgenciaSeleccionada(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="normal">Normal (Mantenimiento o revisión habitual)</option>
                    <option value="urgente">🚨 Urgente (Coche averiado / inmovilizado)</option>
                    <option value="pre_itv">⏳ Pre-ITV (Revisión antes de cita de ITV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fecha preferente aproximada (opcional):
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={fechaDeseadaCliente}
                    onChange={e => setFechaDeseadaCliente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Botón Enviar Solicitud */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  id="btn-enviar-solicitud-cliente"
                  type="submit"
                  disabled={submittingRequest}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submittingRequest ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando al taller...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar solicitud</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 2: MIS PRESUPUESTOS Y SOLICITUDES (Paso 4, Paso 5, Paso 6) */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'solicitudes' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" />
                  Mis Presupuestos y Solicitudes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revisa las propuestas enviadas por el taller, acepta o negocia la fecha de tu cita previa.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('solicitar')}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Pedir otro presupuesto</span>
              </button>
            </div>

            {solicitudes.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-600" />
                <h3 className="text-sm font-bold text-white">No tienes solicitudes activas</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aún no has enviado ninguna petición de presupuesto. Puedes solicitar uno ahora mismo en pocos segundos.
                </p>
                <button
                  onClick={() => setActiveTab('solicitar')}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                >
                  Solicitar presupuesto ahora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudes.map(sol => {
                  const isPendiente = sol.estado === 'PENDIENTE'
                  const isEnProceso = sol.estado === 'EN_PROCESO'
                  const isPropuestaEnviada = sol.estado === 'PROPUESTA_ENVIADA'
                  const isAceptada = sol.estado === 'ACEPTADA'
                  const isRechazada = sol.estado === 'RECHAZADA'
                  const isClienteProposedDate = sol.citaNegociacion?.estado === 'PROPUESTA_POR_CLIENTE'

                  return (
                    <div
                      key={sol.id}
                      className={`p-5 rounded-2xl bg-slate-900 border transition-all shadow-md space-y-4 ${
                        isPropuestaEnviada
                          ? 'border-sky-500/50 bg-sky-500/[0.02] ring-1 ring-sky-500/30'
                          : isAceptada
                          ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                          : isRechazada
                          ? 'border-rose-900/40 opacity-70'
                          : 'border-slate-800'
                      }`}
                    >
                      {/* Top Bar: Número, Estado y Fecha */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-800/60">
                            {sol.numero}
                          </span>

                          {/* Status Badge oficial */}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                            isPendiente
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : isEnProceso
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : isPropuestaEnviada
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse'
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

                          <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {sol.matricula} · {sol.marcaModelo}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Enviada el {new Date(sol.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Problem Description */}
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wide">
                          Problema indicado:
                        </span>
                        <p className="text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          {sol.descripcion}
                        </p>
                      </div>

                      {/* Photos Thumbnail Gallery */}
                      {sol.fotos && sol.fotos.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {sol.fotos.map((f, i) => (
                            <img
                              key={i}
                              src={f}
                              alt="Foto adjunta"
                              onClick={() => setSelectedPhoto(f)}
                              className="w-14 h-14 object-cover rounded-lg border border-slate-700 cursor-pointer hover:border-sky-400 transition-all shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      {/* ----------------------------------------------------------------- */}
                      {/* PASO 4: PROPUESTA DE PRESUPUESTO RECIBIDA DEL TALLER */}
                      {/* ----------------------------------------------------------------- */}
                      {isPropuestaEnviada && sol.presupuestoPropuesto && (
                        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-600/40 space-y-4 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-sky-800/40 pb-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-sky-400" />
                              <span className="font-bold text-xs text-white">
                                Presupuesto recibido: {sol.presupuestoPropuesto.numero}
                              </span>
                              {sol.presupuestoPropuesto.tipoCliente && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  sol.presupuestoPropuesto.tipoCliente === 'empresa'
                                    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                                    : 'bg-sky-900/60 text-sky-300 border border-sky-700/50'
                                }`}>
                                  Tarifa {sol.presupuestoPropuesto.tipoCliente}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Calculado con conceptos y tarifas oficiales de taller
                            </span>
                          </div>

                          {/* Concepts Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                                <tr>
                                  <th className="py-1.5">Concepto / Operación</th>
                                  <th className="py-1.5 text-center">Cant.</th>
                                  <th className="py-1.5 text-right">Precio Ud.</th>
                                  <th className="py-1.5 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {sol.presupuestoPropuesto.conceptos.map((c, i) => (
                                  <tr key={i} className="text-slate-200">
                                    <td className="py-1.5">{c.descripcion}</td>
                                    <td className="py-1.5 text-center font-mono">
                                      {c.cantidad} {c.tipo === 'reparacion' || !Number.isInteger(c.cantidad) ? 'h' : 'ud.'}
                                    </td>
                                    <td className="py-1.5 text-right font-mono">{c.precio.toFixed(2)} €</td>
                                    <td className="py-1.5 text-right font-mono font-semibold text-white">
                                      {(c.cantidad * c.precio).toFixed(2)} €
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Financial Summary & Proposed Date Box */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-800/40 text-xs">
                            {/* Proposed Appointment Info */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                              <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Cita Propuesta por el Taller:</span>
                              </div>
                              <p className="text-sm font-black text-white">
                                {sol.citaNegociacion?.fechaTaller} a las {sol.citaNegociacion?.horaTaller} h
                              </p>
                              {sol.presupuestoPropuesto.observaciones && (
                                <p className="text-[11px] text-slate-400 italic pt-1">
                                  "{sol.presupuestoPropuesto.observaciones}"
                                </p>
                              )}
                            </div>

                            {/* Total Box */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-right">
                              <div className="text-slate-400 text-[11px]">
                                Subtotal neto: <span className="font-mono text-white">{sol.presupuestoPropuesto.subtotal.toFixed(2)} €</span>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                IVA (21%): <span className="font-mono text-white">{sol.presupuestoPropuesto.iva.toFixed(2)} €</span>
                              </div>
                              <div className="text-emerald-400 font-black text-base border-t border-slate-800 pt-1">
                                Total: {sol.presupuestoPropuesto.total.toFixed(2)} €
                              </div>
                            </div>
                          </div>

                          {/* Negotiation status notice if client already proposed alternative date */}
                          {isClienteProposedDate ? (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                Has propuesto nueva fecha para el <strong>{sol.citaNegociacion?.fechaCliente}</strong> a las <strong>{sol.citaNegociacion?.horaCliente} h</strong>. Esperando confirmación por el taller.
                              </span>
                            </div>
                          ) : (
                            /* Paso 4 Buttons: Aceptar vs Rechazar */
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-sky-800/40">
                              <button
                                type="button"
                                onClick={() => handleRechazarPresupuesto(sol)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition-colors"
                              >
                                Rechazar presupuesto
                              </button>

                              <button
                                id={`btn-aceptar-presupuesto-${sol.id}`}
                                type="button"
                                onClick={() => handleOpenAceptarModal(sol)}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                <span>Aceptar presupuesto</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ----------------------------------------------------------------- */}
                      {/* PASO 7: ACEPTADA + EXPEDIENTE CREADO */}
                      {/* ----------------------------------------------------------------- */}
                      {isAceptada && (
                        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/40 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                              <div>
                                <span>¡Presupuesto Aceptado y Cita Confirmada!</span>
                                <span className="block text-slate-300 text-[11px] font-normal">
                                  Fecha de entrada: <strong>{sol.citaNegociacion?.fechaTaller} a las {sol.citaNegociacion?.horaTaller} h</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                              <button
                                type="button"
                                onClick={() => setActiveTab('seguimiento')}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                              >
                                <span>Ver en Roadmap</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  await switchDevelopmentRole('USUARIO')
                                  navigate('/expedientes')
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                                title="Cambiar a modo Taller y abrir expedientes"
                              >
                                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Ver en Expedientes (Taller)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* RECHAZADA NOTICE */}
                      {isRechazada && (
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Esta solicitud fue rechazada y se encuentra archivada y cerrada.</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 3: SEGUIMIENTO EN VIVO (ROADMAP) (Paso 7) */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'seguimiento' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <Wrench className="w-4 h-4" />
                <span>Hoja de Ruta y Estado en Taller</span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Roadmap de Expedientes y Reparaciones
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seguimiento paso a paso del ciclo de vida de tu vehículo desde su recepción en box hasta la entrega final con control de calidad.
              </p>
            </div>

            {/* List of Expedientes */}
            <div className="space-y-6">
              {/* Active Expedientes derived from accepted requests */}
              {solicitudes.filter(s => s.estado === 'ACEPTADA').map(s => (
                <div key={s.id} className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                          {s.expedienteGenerado?.numero || 'EXP-26001'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                          Fase: RECEPCIÓN
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {s.marcaModelo} ({s.matricula})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cita confirmada para el: <strong className="text-white">{s.citaNegociacion?.fechaTaller} a las {s.citaNegociacion?.horaTaller} h</strong>
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await switchDevelopmentRole('USUARIO')
                            navigate('/expedientes')
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors shadow-sm"
                        >
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Ver en Expedientes de Taller (Modo Usuario)</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-slate-400">Total Presupuesto Aceptado:</span>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {s.presupuestoPropuesto?.total.toFixed(2) || '0.00'} €
                      </div>
                    </div>
                  </div>

                  {/* 6 Stages Visual Roadmap */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Fases del Roadmap de Taller:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      {[
                        { num: 1, name: 'Recepción', active: true, done: false },
                        { num: 2, name: 'Diagnosis', active: false, done: false },
                        { num: 3, name: 'Mecánica', active: false, done: false },
                        { num: 4, name: 'Pintura', active: false, done: false },
                        { num: 5, name: 'Calidad', active: false, done: false },
                        { num: 6, name: 'Listo', active: false, done: false }
                      ].map(stage => (
                        <div
                          key={stage.num}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            stage.active
                              ? 'bg-emerald-500/20 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center font-bold text-xs ${
                            stage.active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {stage.num}
                          </div>
                          <span className="font-semibold block">{stage.name}</span>
                          {stage.active && (
                            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 animate-pulse">
                              Activa
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Default Active Repair Demo if no accepted quote yet */}
              {solicitudes.filter(s => s.estado === 'ACEPTADA').length === 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Información de Roadmap</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cuando aceptes un presupuesto y confirmes tu cita, tu expediente se creará de forma inmediata en la fase inicial de <strong>RECEPCIÓN</strong> con la cita programada.
                  </p>
                  <button
                    onClick={() => setActiveTab('solicitudes')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                  >
                    Ver presupuestos para aceptar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 4: FACTURAS */}
        {/* ------------------------------------------------------------------------- */}
        {activeTab === 'facturas' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-400" />
              Facturas y Documentos Oficiales
            </h2>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300">
              <p>
                Las facturas generadas tras la finalización de los trabajos se archivan automáticamente bajo la normativa Veri*Factu de la AEAT con código QR y garantía de taller.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------------- */}
      {/* MODAL: NEGOCIACIÓN DE CITA (Paso 5) */}
      {/* ------------------------------------------------------------------------- */}
      {citaConfirmModal.open && citaConfirmModal.solicitud && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in zoom-in-95 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Calendar className="w-4 h-4" />
                <span>Confirmación de Cita y Presupuesto</span>
              </div>
              <button
                type="button"
                onClick={() => setCitaConfirmModal({ open: false, solicitud: null, modo: 'pregunta' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODO 1: PREGUNTA "¿Aceptas la fecha propuesta por el taller?" */}
            {citaConfirmModal.modo === 'pregunta' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-200 text-sm font-semibold">
                  ¿Aceptas la fecha propuesta por el taller para tu cita?
                </p>

                {/* Box con la fecha propuesta */}
                <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-1 text-center">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                    Fecha y Hora Propuesta por el Taller:
                  </span>
                  <p className="text-lg font-black text-white font-mono">
                    {citaConfirmModal.solicitud.citaNegociacion?.fechaTaller || 'Fecha por fijar'} a las {citaConfirmModal.solicitud.citaNegociacion?.horaTaller || '09:30'} h
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Vehículo: {citaConfirmModal.solicitud.marcaModelo} ({citaConfirmModal.solicitud.matricula})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Opción 1: Sí, acepto la fecha */}
                  <button
                    id="btn-confirmar-fecha-si"
                    type="button"
                    onClick={handleConfirmarFechaTaller}
                    disabled={loading}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Sí, acepto la fecha</span>
                    <span className="text-[10px] font-normal opacity-90">Confirmar cita y generar expediente</span>
                  </button>

                  {/* Opción 2: No, quiero proponer otra fecha */}
                  <button
                    id="btn-proponer-otra-fecha"
                    type="button"
                    onClick={() => setCitaConfirmModal(prev => ({ ...prev, modo: 'proponer_otra' }))}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02]"
                  >
                    <Clock className="w-5 h-5 text-sky-400" />
                    <span>No, quiero proponer otra fecha</span>
                    <span className="text-[10px] font-normal opacity-75">Seleccionar otro día u hora</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODO 2: SELECTOR DE NUEVA FECHA PROPUESTA POR EL CLIENTE */}
            {citaConfirmModal.modo === 'proponer_otra' && (
              <form onSubmit={handleValidarYEnviarNuevaFecha} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-white">
                    Indica la fecha y hora que mejor se adapte a tu disponibilidad:
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Regla: La fecha debe ser <strong>posterior o igual</strong> a la propuesta por el taller ({citaConfirmModal.solicitud.citaNegociacion?.fechaTaller} a las {citaConfirmModal.solicitud.citaNegociacion?.horaTaller} h).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Fecha preferente:
                    </label>
                    <input
                      type="date"
                      min={citaConfirmModal.solicitud.citaNegociacion?.fechaTaller || new Date().toISOString().split('T')[0]}
                      value={clienteNuevaFecha}
                      onChange={e => setClienteNuevaFecha(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Hora preferente:
                    </label>
                    <input
                      type="time"
                      value={clienteNuevaHora}
                      onChange={e => setClienteNuevaHora(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Error de validación de negocio */}
                {dateValidationError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{dateValidationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Motivo o aclaración para el taller (opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={clienteMotivoFecha}
                    onChange={e => setClienteMotivoFecha(e.target.value)}
                    placeholder="Ej: Por motivos laborales solo puedo por las tardes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCitaConfirmModal(prev => ({ ...prev, modo: 'pregunta' }))}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Volver
                  </button>

                  <button
                    id="btn-enviar-propuesta-fecha-cliente"
                    type="submit"
                    disabled={!!dateValidationError}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold shadow-md shadow-sky-600/20"
                  >
                    Enviar propuesta de fecha al taller
                  </button>
                </div>
              </form>
            )}

            {/* MODO 3: ÉXITO (Expediente generado) */}
            {citaConfirmModal.modo === 'exito' && (
              <div className="p-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  ¡Presupuesto y Cita Confirmados!
                </h3>
                <p className="text-xs text-slate-300">
                  Se ha generado automáticamente tu expediente <strong className="text-emerald-400 font-mono">{citaConfirmModal.expedienteCreado?.numero}</strong>. Puedes ver su estado en tiempo real en la pestaña de Roadmap.
                </p>

                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCitaConfirmModal({ open: false, solicitud: null, modo: 'pregunta' })
                      setActiveTab('seguimiento')
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    Ir al Roadmap de Seguimiento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Photo Zoom */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img src={selectedPhoto} alt="Foto avería" className="w-full h-full object-contain" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
