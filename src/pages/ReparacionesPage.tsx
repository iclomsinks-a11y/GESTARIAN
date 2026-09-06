import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Reparacion, Vehiculo, Cliente, EstadoReparacion } from '../lib/types'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { 
  Wrench, 
  Plus, 
  Search, 
  Car, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Camera, 
  Bell, 
  Check, 
  Upload, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
  AlertCircle
} from 'lucide-react'
import { 
  getNotificacionesInternas, 
  getSolicitudesPendientes, 
  crearSolicitudFinalizacionReparacion, 
  confirmarSolicitudFinalizacion, 
  rechazarSolicitudFinalizacion,
  subscribeNotificaciones,
  NotificacionInternaTaller
} from '../services/tallerNotificacionesService'
import { TarjetaVehiculoHeader } from '../components/common/TarjetaVehiculoHeader'
import { resolverNumeroExpediente } from '../lib/expedienteHelper'

interface ReparacionConFotos extends Reparacion {
  numero_expediente?: string
  fotos_durante_reparacion?: { id: string; url: string; titulo: string; fecha: string }[]
  solicitud_superior_pendiente?: boolean
}

export const ReparacionesPage: React.FC = () => {
  const { perfil, loginAsAutorizado, getStoredEmpleados } = useAuth()
  const { addToast } = useToast()

  const [reparaciones, setReparaciones] = useState<ReparacionConFotos[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  
  // Expanded images view state
  const [openImagesRepId, setOpenImagesRepId] = useState<string | null>('r1')
  const [notificaciones, setNotificaciones] = useState<NotificacionInternaTaller[]>([])

  const [formData, setFormData] = useState({
    numero_orden: '',
    vehiculo_id: '',
    cliente_id: '',
    mecanico: 'Jefe de Taller',
    descripcion: '',
    estado: 'en_proceso',
    kilometros: 120000,
    diagnostico: ''
  })

  // Check granular permissions of the logged in user
  const esDueñoODev = perfil?.rol === 'USUARIO' || perfil?.esDeveloper
  const esEncargado = esDueñoODev || !!perfil?.esEncargado || !!perfil?.permisosGranulares?.f3_finalizar_directa
  
  // Specific requested permissions:
  // Chapista: f3_imagenes_durante_reparacion = true, f3_finalizar_solicitar = true, f3_finalizar_directa = false
  // Jefe de Sección Chapa: f3_imagenes_durante_reparacion = true, f3_finalizar_directa = true
  const tienePermisoImagenes = esDueñoODev || !!perfil?.permisosGranulares?.f3_imagenes_durante_reparacion || perfil?.permisos?.includes('f3_imagenes_durante_reparacion')
  const tieneFinalizarDirecta = esDueñoODev || !!perfil?.permisosGranulares?.f3_finalizar_directa || perfil?.permisos?.includes('f3_finalizar_directa')
  const tieneFinalizarSolicitar = esDueñoODev || !!perfil?.permisosGranulares?.f3_finalizar_solicitar || perfil?.permisos?.includes('f3_finalizar_solicitar')

  const reloadNotificaciones = () => {
    setNotificaciones(getNotificacionesInternas())
  }

  useEffect(() => {
    reloadNotificaciones()
    const unsub = subscribeNotificaciones(() => {
      reloadNotificaciones()
    })
    return () => unsub()
  }, [])

  const fetchReparaciones = async () => {
    try {
      setLoading(true)
      const [repRes, cliRes, vehRes] = await Promise.all([
        supabase
          .from('reparaciones')
          .select('id, numero_orden, vehiculo_id, cliente_id, mecanico, descripcion, estado, kilometros, diagnostico, fecha_inicio, fecha_fin, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('clientes').select('id, nombre'),
        supabase.from('vehiculos').select('id, matricula, marca, modelo')
      ])

      if (repRes.data && repRes.data.length > 0) {
        setReparaciones(repRes.data as unknown as ReparacionConFotos[])
      } else {
        setReparaciones([
          {
            id: 'r1',
            cita_id: null,
            numero_orden: 'OT-2601',
            vehiculo_id: 'v1',
            cliente_id: 'c1',
            mecanico: 'David Rivas (Chapista)',
            descripcion: 'Reparación de aleta delantera izquierda, estirado de larguero en bancada y pintura bicapa',
            estado: 'en_proceso',
            kilometros: 120450,
            diagnostico: 'Impacto lateral delantero. Requiere conformar chapa, desabollado y preparación de masilla de poliéster.',
            fecha_inicio: new Date().toISOString(),
            fotos: [],
            created_at: new Date().toISOString(),
            solicitud_superior_pendiente: true,
            fotos_durante_reparacion: [
              {
                id: 'img-1',
                url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
                titulo: '1. Inspección inicial de daño en aleta',
                fecha: '2026-03-05 09:15'
              },
              {
                id: 'img-2',
                url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
                titulo: '2. Desabollado y lijado previo a imprimación',
                fecha: '2026-03-05 11:40'
              },
              {
                id: 'img-3',
                url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
                titulo: '3. Aplicación de fondo protector e imprimación',
                fecha: '2026-03-05 15:20'
              }
            ]
          },
          {
            id: 'r2',
            cita_id: null,
            numero_orden: 'OT-2602',
            vehiculo_id: 'v2',
            cliente_id: 'c2',
            mecanico: 'Antonio Ruiz (Mecánico)',
            descripcion: 'Ruido metálico en tren delantero al frenar en frío',
            estado: 'finalizado',
            kilometros: 64200,
            diagnostico: 'Pastillas gastadas al 90%, cambiadas y purgado circuito de frenos.',
            fecha_inicio: new Date().toISOString(),
            fotos: [],
            created_at: new Date().toISOString()
          }
        ])
      }

      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error al cargar reparaciones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReparaciones()
  }, [])

  useRealtimeSubscription({
    table: 'reparaciones',
    onInsert: () => fetchReparaciones(),
    onUpdate: () => fetchReparaciones(),
    onDelete: () => fetchReparaciones()
  })

  const filteredReparaciones = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return reparaciones
    return reparaciones.filter(r => {
      const cli = clientes.find(c => c.id === r.cliente_id)
      const veh = vehiculos.find(v => v.id === r.vehiculo_id)
      return (
        r.numero_orden?.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        cli?.nombre?.toLowerCase().includes(q) ||
        veh?.matricula?.toLowerCase().includes(q)
      )
    })
  }, [reparaciones, searchTerm, clientes, vehiculos])

  const openModal = () => {
    const nextNum = `OT-26${String(reparaciones.length + 1).padStart(2, '0')}`
    setFormData({
      numero_orden: nextNum,
      vehiculo_id: vehiculos[0]?.id || '',
      cliente_id: clientes[0]?.id || '',
      mecanico: perfil?.nombre ? `${perfil.nombre} (${perfil.cargo || 'Taller'})` : 'Jefe de Taller',
      descripcion: '',
      estado: 'en_proceso',
      kilometros: 100000,
      diagnostico: ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newRep: ReparacionConFotos = {
        id: 'rep_' + Date.now(),
        cita_id: null,
        fotos: [],
        ...formData,
        fecha_inicio: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      const { data } = await supabase.from('reparaciones').insert([formData]).select().maybeSingle()
      setReparaciones(prev => [data ? (data as unknown as ReparacionConFotos) : newRep, ...prev])
      addToast('Orden de trabajo iniciada', 'success')
      setModalOpen(false)
    } catch {
      setModalOpen(false)
    }
  }

  // Finalization workflow:
  // If the user has direct finalization (Encargado / Dueño), it finalizes immediately.
  // If the user is a Chapista / Operario without direct finalization permission,
  // it creates an internal notification for their immediate superior to confirm.
  const handleFinalizarReparacion = (rep: ReparacionConFotos) => {
    const veh = vehiculos.find(v => v.id === rep.vehiculo_id)
    const vehInfo = veh ? `${veh.matricula} (${veh.marca} ${veh.modelo})` : 'Vehículo'

    if (tieneFinalizarDirecta) {
      // Direct finalization
      setReparaciones(prev => prev.map(r => r.id === rep.id ? { 
        ...r, 
        estado: 'finalizado' as EstadoReparacion, 
        solicitud_superior_pendiente: false 
      } : r))
      addToast(`Reparación ${rep.numero_orden} finalizada directamente como ${perfil?.cargo || 'Encargado'}.`, 'success')
      return
    }

    if (tieneFinalizarSolicitar) {
      // Generates internal notification to superior
      const notif = crearSolicitudFinalizacionReparacion({
        reparacionId: rep.id,
        numeroOrden: rep.numero_orden,
        matricula: veh?.matricula || '4589-KBL',
        vehiculoModelo: veh ? `${veh.marca} ${veh.modelo}` : 'SEAT León 1.6 TDI',
        solicitanteId: perfil?.id || 'emp-03',
        solicitanteNombre: perfil?.nombre || 'David Rivas',
        solicitanteCargo: perfil?.cargo || 'Chapista (Chapa y Pintura)',
        superiorDestinoCargo: 'Jefe de Sección Chapa / Encargado'
      })

      setReparaciones(prev => prev.map(r => r.id === rep.id ? { 
        ...r, 
        solicitud_superior_pendiente: true 
      } : r))

      addToast(
        `Solicitud de finalización para ${rep.numero_orden} enviada a tu superior (${notif.superiorDestinoCargo}). La orden se dará por finalizada en cuanto tu superior la confirme.`,
        'info'
      )
      return
    }

    addToast('No tienes permiso asignado para solicitar ni finalizar reparaciones.', 'warning')
  }

  // Superior confirms the pending finalization request
  const handleSuperiorConfirmar = (notifId: string, reparacionId: string, ordenNum: string) => {
    const confirmador = {
      id: perfil?.id || 'emp-04',
      nombre: perfil?.nombre || 'Roberto Morales (Jefe de Sección Chapa)'
    }
    const ok = confirmarSolicitudFinalizacion(notifId, confirmador)
    if (ok) {
      setReparaciones(prev => prev.map(r => r.id === reparacionId || r.numero_orden === ordenNum ? {
        ...r,
        estado: 'finalizado' as EstadoReparacion,
        solicitud_superior_pendiente: false
      } : r))
      addToast(`Reparación ${ordenNum} confirmada y dada por finalizada por ${confirmador.nombre}.`, 'success')
      reloadNotificaciones()
    }
  }

  // Superior rejects the pending finalization request
  const handleSuperiorRechazar = (notifId: string, reparacionId: string, ordenNum: string) => {
    const confirmador = {
      id: perfil?.id || 'emp-04',
      nombre: perfil?.nombre || 'Roberto Morales (Jefe de Sección Chapa)'
    }
    const motivo = prompt('Indica el motivo o comprobaciones pendientes para esta orden de chapa:', 'Falta pulido final y comprobación de espesor de laca.')
    if (motivo !== null) {
      rechazarSolicitudFinalizacion(notifId, motivo, confirmador)
      setReparaciones(prev => prev.map(r => r.id === reparacionId || r.numero_orden === ordenNum ? {
        ...r,
        solicitud_superior_pendiente: false,
        diagnostico: `${r.diagnostico || ''} [Revisión requerida por ${confirmador.nombre}: ${motivo}]`.trim()
      } : r))
      addToast(`Solicitud rechazada: el operario debe realizar las correcciones indicadas.`, 'warning')
      reloadNotificaciones()
    }
  }

  // Simulated photo upload for images during repair
  const handleSubirFotoProgreso = (repId: string) => {
    if (!tienePermisoImagenes) {
      addToast('Tu puesto no tiene permiso de acceso a imágenes durante la reparación.', 'warning')
      return
    }
    const sampleTitles = [
      'Foto de bancada y alineación de cotas',
      'Foto de masillado y preparación de superficie',
      'Control de colorimetría en cabina de pintura',
      'Acabado barniz de alto brillo y secado al horno'
    ]
    const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)]
    const newFoto = {
      id: `img-${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
      titulo: randomTitle,
      fecha: new Date().toLocaleString()
    }

    setReparaciones(prev => prev.map(r => {
      if (r.id === repId) {
        const fotosList = r.fotos_durante_reparacion ? [...r.fotos_durante_reparacion, newFoto] : [newFoto]
        return { ...r, fotos_durante_reparacion: fotosList }
      }
      return r
    }))
    addToast(`Nueva imagen adjuntada: "${randomTitle}"`, 'success')
  }

  // Quick switch between Chapista, Encargado, Dueño for immediate testing
  const switchSimulatedUser = async (roleType: 'chapista' | 'jefe_chapa' | 'dueño') => {
    if (roleType === 'chapista') {
      const res = await loginAsAutorizado('5678')
      if (res.success) addToast('Sesión cambiada a David Rivas (Chapista). Acceso a imágenes activo, finalización genera aviso a superior.', 'info')
    } else if (roleType === 'jefe_chapa') {
      const res = await loginAsAutorizado('9988')
      if (res.success) addToast('Sesión cambiada a Roberto Morales (Jefe de Sección Chapa). Acceso a imágenes y confirmación directa activos.', 'info')
    }
  }

  const solicitudesPendientes = notificaciones.filter(n => n.tipo === 'SOLICITUD_FINALIZACION_REPARACION' && n.estado === 'pendiente')

  return (
    <div className="space-y-6">
      {/* Top Banner with User Context & Quick Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Órdenes de Trabajo y Taller</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              Permisos Granulares Activos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="text-slate-400">Usuario actual:</span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-white font-semibold">
              {perfil?.nombre || 'Usuario'} ({perfil?.cargo || (perfil?.rol === 'USUARIO' ? 'Dueño del Taller' : 'Operario')})
            </span>
            <span className="text-slate-500">•</span>
            {tienePermisoImagenes ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                <Check className="w-3 h-3" /> Acceso a Imágenes Durante Reparación
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                <X className="w-3 h-3" /> Sin Acceso a Imágenes
              </span>
            )}
            <span className="text-slate-500">•</span>
            {tieneFinalizarDirecta ? (
              <span className="text-amber-400 flex items-center gap-1 font-medium text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Finalización Directa (Encargado)
              </span>
            ) : tieneFinalizarSolicitar ? (
              <span className="text-sky-400 flex items-center gap-1 font-medium text-[11px]">
                <Bell className="w-3.5 h-3.5 text-sky-400" /> Finalizar (Aviso a Superior Requerido)
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Sin permiso de finalización</span>
            )}
          </div>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-medium">Probar como:</span>
            <button
              onClick={() => switchSimulatedUser('chapista')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold text-[11px] transition-all"
              title="PIN: 5678"
            >
              David Rivas (Chapista)
            </button>
            <button
              onClick={() => switchSimulatedUser('jefe_chapa')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] border border-amber-500/30 transition-all"
              title="PIN: 9988"
            >
              Roberto Morales (Jefe Chapa)
            </button>
          </div>

          <button
            onClick={openModal}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
          </button>
        </div>
      </div>

      {/* Superior Approval Box (Visible to Encargados, Jefes de Sección o Dueño) */}
      {solicitudesPendientes.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                Notificación Interna de Taller ({solicitudesPendientes.length} solicitud{solicitudesPendientes.length > 1 ? 'es' : ''} pendiente{solicitudesPendientes.length > 1 ? 's' : ''} de confirmación)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              Requiere Validación de Superior
            </span>
          </div>

          <div className="space-y-2">
            {solicitudesPendientes.map((sol) => {
              const expNum = resolverNumeroExpediente({ numero: sol.numeroOrden })
              return (
                <div 
                  key={sol.id} 
                  className="p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-xs">
                        {sol.numeroOrden}
                      </span>
                      <a
                        href={`/expedientes?num=${encodeURIComponent(expNum)}`}
                        className="font-mono text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30 transition-colors"
                        title="Ver seguimiento completo en Roadmap"
                      >
                        {expNum}
                      </a>
                      <span className="font-bold text-amber-300 font-mono text-xs">{sol.matricula}</span>
                      <span className="text-slate-400 text-xs">• {sol.vehiculoModelo}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      El operario <strong className="text-white">{sol.solicitanteNombre}</strong> ({sol.solicitanteCargo}) solicita dar por finalizada la reparación.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Hora de solicitud: {new Date(sol.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>• Destino: {sol.superiorDestinoCargo}</span>
                    </div>
                  </div>

                <div className="flex items-center gap-2 shrink-0">
                  {esEncargado ? (
                    <>
                      <button
                        onClick={() => handleSuperiorConfirmar(sol.id, sol.reparacionId, sol.numeroOrden)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar y Finalizar Reparación</span>
                      </button>
                      <button
                        onClick={() => handleSuperiorRechazar(sol.id, sol.reparacionId, sol.numeroOrden)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 font-medium text-xs flex items-center gap-1.5 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Requiere Revisión</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pendiente de que el Jefe de Sección confirme</span>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nº orden (OT-...), matrícula o trabajo..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredReparaciones.map((rep) => {
          const cli = clientes.find(c => c.id === rep.cliente_id)
          const veh = vehiculos.find(v => v.id === rep.vehiculo_id)

          const isFinished = rep.estado === 'finalizado' || rep.estado === 'finalizada'
          const isInProgress = rep.estado === 'en_proceso'
          const isPendingSuperior = !!rep.solicitud_superior_pendiente && !isFinished
          const fotosDurante = rep.fotos_durante_reparacion || []
          const isImagesOpen = openImagesRepId === rep.id

          const expNum = rep.numero_expediente || resolverNumeroExpediente(rep)

          return (
            <div
              key={rep.id}
              className={`rounded-2xl bg-slate-900 border transition-all shadow-sm flex flex-col justify-between overflow-hidden ${
                isPendingSuperior 
                  ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* VEHICLE HEADER: Matrícula española, Marca/Modelo, Titular, Nº Expediente y Botón Roadmap */}
              <TarjetaVehiculoHeader
                matricula={veh?.matricula || '4589-KBL'}
                marca={veh?.marca || 'SEAT'}
                modelo={veh?.modelo || 'León 1.6 TDI'}
                titular={cli?.nombre || 'Titular Registrado'}
                numeroExpediente={expNum}
                badgeEstado={
                  isFinished ? (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Finalizado
                    </span>
                  ) : isPendingSuperior ? (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse" title="Esperando confirmación del superior">
                      <Clock className="w-3 h-3 text-amber-400" /> Pendiente Superior
                    </span>
                  ) : isInProgress ? (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> En Proceso
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {rep.estado}
                    </span>
                  )
                }
                showRoadmapBtn={true}
              />

              <div className="p-5 space-y-4">
                {/* Orden de Reparación Sub-header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orden de Taller:</span>
                    <span className="font-mono font-black text-xs text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                      {rep.numero_orden}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {rep.kilometros ? `${rep.kilometros.toLocaleString()} km` : 'Sin km'}
                  </span>
                </div>

                {/* Description & Assigned Tech */}
                <div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {rep.descripcion}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                    <span className="text-slate-500">Mecánico/Chapista asignado:</span>
                    <span className="text-slate-300 font-semibold">{rep.mecanico || 'David Rivas (Chapista)'}</span>
                  </div>
                </div>

                {/* Diagnostic box */}
                {rep.diagnostico && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    <strong className="text-slate-300 block mb-0.5 font-semibold text-[11px]">Diagnóstico e Intervención:</strong>
                    {rep.diagnostico}
                  </div>
                )}

                {/* Granular Feature: Images During Repair (Acceso a imágenes durante la reparación) */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setOpenImagesRepId(isImagesOpen ? null : rep.id)}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Imágenes durante la reparación ({fotosDurante.length})</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {isImagesOpen ? '— ocultar' : '— ver fotos'}
                      </span>
                    </button>

                    {tienePermisoImagenes && isImagesOpen && (
                      <button
                        onClick={() => handleSubirFotoProgreso(rep.id)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-all"
                      >
                        <Upload className="w-3 h-3 text-sky-400" />
                        <span>Añadir foto de progreso</span>
                      </button>
                    )}
                  </div>

                  {/* Photos Section Content */}
                  {isImagesOpen && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      {!tienePermisoImagenes ? (
                        <div className="p-3 text-center text-slate-400 text-xs space-y-1">
                          <p className="font-semibold text-rose-400">Permiso restringido</p>
                          <p className="text-[11px]">Tu categoría o puesto actual no tiene activo el permiso "Acceso a imágenes durante la reparación".</p>
                        </div>
                      ) : fotosDurante.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          No hay imágenes registradas para esta orden todavía.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {fotosDurante.map((img) => (
                            <div key={img.id} className="group relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex flex-col justify-end">
                              <img 
                                src={img.url} 
                                alt={img.titulo} 
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                              <div className="relative z-10 p-1 bg-slate-950/85 text-[9px] text-slate-300 truncate">
                                {img.titulo}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer with Finalization Flow */}
              <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{cli?.nombre || 'Cliente Particular'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-mono text-slate-300">{rep.kilometros?.toLocaleString()} km</span>
                </div>

                {/* Finalize Button / Confirmation state */}
                <div className="flex items-center gap-2">
                  {!isFinished ? (
                    isPendingSuperior ? (
                      esEncargado ? (
                        <button
                          onClick={() => {
                            const pendingNotif = notificaciones.find(n => n.reparacionId === rep.id && n.estado === 'pendiente')
                            if (pendingNotif) {
                              handleSuperiorConfirmar(pendingNotif.id, rep.id, rep.numero_orden)
                            } else {
                              handleFinalizarReparacion(rep)
                            }
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar Finalización (Encargado)</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-amber-400 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Notificación enviada al superior (esperando confirmación)</span>
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => handleFinalizarReparacion(rep)}
                        className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          tieneFinalizarDirecta
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/20'
                            : 'bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/20'
                        }`}
                        title={
                          tieneFinalizarDirecta 
                            ? 'Finalizar orden directamente (Encargado / Dueño)' 
                            : 'Generar notificación interna a su superior para confirmar la finalización'
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {tieneFinalizarDirecta 
                            ? 'Finalizar Reparación' 
                            : 'Finalizar (Aviso a Superior)'}
                        </span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Reparación terminada
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: New Repair */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-400" />
                Nueva Orden de Trabajo (Taller)
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nº Orden</label>
                  <input
                    type="text"
                    required
                    value={formData.numero_orden}
                    onChange={(e) => setFormData({ ...formData, numero_orden: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Kilómetros actuales</label>
                  <input
                    type="number"
                    value={formData.kilometros}
                    onChange={(e) => setFormData({ ...formData, kilometros: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mecánico o Chapista Asignado</label>
                <input
                  type="text"
                  required
                  value={formData.mecanico}
                  onChange={(e) => setFormData({ ...formData, mecanico: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Trabajo a Realizar / Descripción</label>
                <textarea
                  required
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej. Reparar chapa en lateral derecho y pintar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Diagnóstico Previo o Notas Técnicas</label>
                <textarea
                  rows={2}
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  placeholder="Detalles sobre daños, piezas a reparar..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Iniciar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
