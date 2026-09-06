import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Expediente, Cliente, Vehiculo } from '../lib/types'
import { expedienteService, uploadFotoOptimizada } from '../lib/expedienteService'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import { useToast } from '../lib/ToastContext'
import { buildRoadmap, ExpedienteData } from '../lib/roadmapEngine'
import { TimelineVisual } from '../components/TimelineVisual'
import { TarjetaVehiculoHeader } from '../components/common/TarjetaVehiculoHeader'
import { 
  Camera, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Car, 
  User, 
  Clock, 
  X,
  Sparkles,
  Layers
} from 'lucide-react'

export const ExpedientesPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetId = searchParams.get('id')
  const targetNum = searchParams.get('num')

  const [expedientes, setExpedientes] = useState<Expediente[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null)
  const [uploading, setUploading] = useState(false)
  const [newModalOpen, setNewModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const [newExpData, setNewExpData] = useState({
    numero: '',
    cliente_id: '',
    vehiculo_id: '',
    descripcion: '',
    estado: 'abierto'
  })

  // CRITICAL ARCHITECTURE: Exclude 'fotos' from list select to prevent 5GB egress exhaustion!
  const fetchExpedientes = async () => {
    try {
      setLoading(true)
      const [expRes, cliRes, vehRes] = await Promise.all([
        supabase
          .from('expedientes')
          .select('id, numero, estado, descripcion, cliente_id, vehiculo_id, fecha_apertura, fecha_cierre, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('clientes')
          .select('id, nombre, dni'),
        supabase
          .from('vehiculos')
          .select('id, matricula, marca, modelo')
      ])

      let baseList: Expediente[] = []
      if (expRes.data && expRes.data.length > 0) {
        baseList = expRes.data as Expediente[]
      } else {
        // Fallback demo expedientes
        baseList = [
          {
            id: 'exp-1',
            numero: 'EXP-26010',
            estado: 'abierto',
            descripcion: 'Reparación de chapa y pintura aleta delantera derecha y paragolpes',
            cliente_id: 'c1',
            vehiculo_id: 'v1',
            fotos: [
              'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80'
            ],
            fecha_apertura: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: 'exp-2',
            numero: 'EXP-26011',
            estado: 'en_reparacion',
            descripcion: 'Revisión mecánica integral e informe fotográfico de bajos y transmisión',
            cliente_id: 'c2',
            vehiculo_id: 'v2',
            fotos: [
              'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80'
            ],
            fecha_apertura: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]
      }

      // Check local storage overrides for dynamically generated expedientes from accepted quotes
      try {
        const rawLocal = localStorage.getItem('gestarian_expedientes_override')
        if (rawLocal) {
          const localParsed: Expediente[] = JSON.parse(rawLocal)
          const existingIds = new Set(baseList.map(b => b.id))
          const existingNums = new Set(baseList.map(b => b.numero))
          const toPrepend = localParsed.filter(l => !existingIds.has(l.id) && !existingNums.has(l.numero))
          baseList = [...toPrepend, ...baseList]
        }
      } catch (e) {}

      setExpedientes(baseList)

      if (cliRes.data) setClientes(cliRes.data as Cliente[])
      if (vehRes.data) setVehiculos(vehRes.data as Vehiculo[])
    } catch (err) {
      console.warn('Error al cargar expedientes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpedientes()
  }, [])

  // Auto-select target expediente from query params (id or num) from card shortcuts
  useEffect(() => {
    if (!loading && (targetId || targetNum)) {
      const found = expedientes.find(e => 
        (targetId && e.id === targetId) || 
        (targetNum && (e.numero === targetNum || e.numero?.replace('EXP-', '') === targetNum.replace('EXP-', '')))
      )
      if (found) {
        setSelectedExpediente(found)
        setTimeout(() => {
          document.getElementById('detalle-expediente')?.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      } else if (targetNum) {
        const virtualExp: Expediente = {
          id: 'exp-vir-' + Date.now(),
          numero: targetNum,
          estado: 'abierto',
          descripcion: `Expediente para seguimiento integral del ciclo de taller`,
          cliente_id: clientes[0]?.id || '',
          vehiculo_id: vehiculos[0]?.id || '',
          fotos: [],
          fecha_apertura: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        setSelectedExpediente(virtualExp)
      }
    } else if (!loading && !selectedExpediente && expedientes.length > 0) {
      setSelectedExpediente(expedientes[0])
    }
  }, [loading, targetId, targetNum, expedientes])

  // CENTRALIZED REALTIME HOOK: Debounced updates, eliminates egress flood
  useRealtimeSubscription({
    table: 'expedientes',
    onInsert: () => fetchExpedientes(),
    onUpdate: () => fetchExpedientes(),
    onDelete: () => fetchExpedientes()
  })

  const filteredExpedientes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return expedientes
    return expedientes.filter(e => {
      const cli = clientes.find(c => c.id === e.cliente_id)
      const veh = vehiculos.find(v => v.id === e.vehiculo_id)
      return (
        e.numero?.toLowerCase().includes(q) ||
        e.descripcion?.toLowerCase().includes(q) ||
        cli?.nombre?.toLowerCase().includes(q) ||
        veh?.matricula?.toLowerCase().includes(q)
      )
    })
  }, [expedientes, searchTerm, clientes, vehiculos])

  const openNewModal = () => {
    const nextNum = `EXP-26${String(expedientes.length + 1).padStart(3, '0')}`
    setNewExpData({
      numero: nextNum,
      cliente_id: clientes[0]?.id || '',
      vehiculo_id: vehiculos[0]?.id || '',
      descripcion: '',
      estado: 'abierto'
    })
    setNewModalOpen(true)
  }

  const handleCreateExpediente = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newExp: Expediente = {
        id: 'exp_' + Date.now(),
        ...newExpData,
        fotos: [],
        fecha_apertura: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      const { data } = await supabase.from('expedientes').insert([{
        numero: newExpData.numero,
        cliente_id: newExpData.cliente_id,
        vehiculo_id: newExpData.vehiculo_id,
        descripcion: newExpData.descripcion,
        estado: newExpData.estado,
        fecha_apertura: new Date().toISOString()
      }]).select().maybeSingle()

      setExpedientes(prev => [data ? (data as Expediente) : newExp, ...prev])
      addToast('Expediente creado con éxito', 'success')
      setNewModalOpen(false)
    } catch (err) {
      console.warn('Error creando expediente:', err)
      setNewModalOpen(false)
    }
  }

  // OPTIMIZED PHOTO UPLOAD: In-browser WebP compression + Storage upload
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedExpediente || !e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    try {
      setUploading(true)
      addToast('Comprimiendo y subiendo foto a Storage...', 'info')

      const uploadedUrl = await uploadFotoOptimizada(file, selectedExpediente.id)
      if (!uploadedUrl) {
        throw new Error('Error al subir foto a Storage')
      }

      const updatedFotos = [...(selectedExpediente.fotos || []), uploadedUrl]

      // Update in Supabase (only string URL array, NO base64!)
      await supabase
        .from('expedientes')
        .update({ fotos: updatedFotos })
        .eq('id', selectedExpediente.id)

      setSelectedExpediente({
        ...selectedExpediente,
        fotos: updatedFotos
      })

      setExpedientes(prev => prev.map(exp => exp.id === selectedExpediente.id ? { ...exp, fotos: updatedFotos } : exp))
      addToast('Foto optimizada adjuntada (<250 KB en Storage)', 'success')
    } catch (err: any) {
      console.warn('Fallo al subir foto optimizada:', err)
      addToast('Foto añadida en modo visualización', 'info')
      // Visual fallback
      const objectUrl = URL.createObjectURL(file)
      const updatedFotos = [...(selectedExpediente.fotos || []), objectUrl]
      setSelectedExpediente({ ...selectedExpediente, fotos: updatedFotos })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!selectedExpediente) return
    const updatedFotos = (selectedExpediente.fotos || []).filter(f => f !== photoUrl)
    try {
      await supabase.from('expedientes').update({ fotos: updatedFotos }).eq('id', selectedExpediente.id)
      setSelectedExpediente({ ...selectedExpediente, fotos: updatedFotos })
      addToast('Foto eliminada del expediente', 'info')
    } catch {
      setSelectedExpediente({ ...selectedExpediente, fotos: updatedFotos })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Egress Protection Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-emerald-400" />
            Expedientes Fotográficos de Reparación
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro visual del estado de recepción, peritación y entrega. Imágenes comprimidas en WebP.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Expediente
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar expediente por número (EXP-...), matrícula o cliente..."
          className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Grid: List on Left, Selected Detail Gallery on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expedientes list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Listado de Expedientes ({filteredExpedientes.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              Cargando expedientes...
            </div>
          ) : filteredExpedientes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              No hay expedientes activos.
            </div>
          ) : (
            filteredExpedientes.map((exp) => {
              const cli = clientes.find(c => c.id === exp.cliente_id)
              const veh = vehiculos.find(v => v.id === exp.vehiculo_id)
              const isSelected = selectedExpediente?.id === exp.id

              return (
                <div
                  key={exp.id}
                  onClick={() => {
                    setSelectedExpediente(exp)
                    if (window.innerWidth < 1024) {
                      setTimeout(() => {
                        document.getElementById('detalle-expediente')?.scrollIntoView({ behavior: 'smooth' })
                      }, 100)
                    }
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white font-mono">{exp.numero}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {exp.estado}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-2.5">
                    {exp.descripcion || 'Sin descripción detallada.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-mono text-slate-200">{veh?.matricula || 'Vehículo'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <User className="w-3 h-3 text-sky-400" />
                      <span className="truncate max-w-[110px]">{cli?.nombre || 'Cliente'}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Selected Expediente Detail & Photo Gallery */}
        <div id="detalle-expediente" className="lg:col-span-2">
          {selectedExpediente ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
              {/* Tarjeta de Vehículo Header con Matrícula Española, Marca/Modelo y Titular */}
              {(() => {
                const veh = vehiculos.find(v => v.id === selectedExpediente.vehiculo_id)
                const cli = clientes.find(c => c.id === selectedExpediente.cliente_id)
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                    <TarjetaVehiculoHeader
                      matricula={veh?.matricula || '4589 KBL'}
                      marca={veh?.marca || 'SEAT'}
                      modelo={veh?.modelo || 'León 1.6 TDI'}
                      titular={cli?.nombre || 'Titular Registrado'}
                      numeroExpediente={selectedExpediente.numero}
                      expedienteId={selectedExpediente.id}
                      badgeEstado={
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          {selectedExpediente.estado}
                        </span>
                      }
                      showRoadmapBtn={false}
                    />
                    <div className="p-3 bg-slate-950/40 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        {selectedExpediente.descripcion || 'Sin observaciones adicionales registradas.'}
                      </p>

                      {/* Upload button */}
                      <div className="shrink-0">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadPhoto}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {uploading ? 'Subiendo WebP...' : 'Adjuntar Fotografía'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Lifecycle Roadmap */}
              {(() => {
                const expData: ExpedienteData = {
                  clienteId: selectedExpediente.cliente_id || '',
                  vehiculoId: selectedExpediente.vehiculo_id || '',
                  presupuesto: {
                    id: 'pres-auto',
                    estado: selectedExpediente.estado === 'cerrado' ? 'aprobado' : 'pendiente',
                    numero: `PRES-${selectedExpediente.numero.replace('EXP-', '')}`
                  },
                  cita: {
                    id: 'cit-auto',
                    estado: selectedExpediente.estado === 'cerrado' ? 'confirmada' : 'propuesta',
                    fecha: selectedExpediente.fecha_apertura?.split('T')[0] || new Date().toISOString().split('T')[0],
                    hora: '09:30'
                  },
                  reparacion: {
                    id: 'rep-auto',
                    estado: selectedExpediente.estado === 'cerrado' ? 'finalizada' : 'en_proceso'
                  },
                  factura: selectedExpediente.estado === 'cerrado' ? {
                    numero: `FAC-${selectedExpediente.numero.replace('EXP-', '')}`,
                    estado_cobro: 'pagada',
                    enviado_email_at: new Date().toISOString()
                  } : null
                }

                const steps = buildRoadmap(expData, {
                  onNavigateCliente: () => navigate('/clientes'),
                  onCrearPresupuesto: () => navigate('/presupuestos'),
                  onVerPresupuesto: () => navigate('/presupuestos'),
                  onAceptarPresupuesto: () => navigate('/presupuestos'),
                  onCrearCita: () => navigate('/citas'),
                  onVerCita: () => navigate('/citas'),
                  onAsignarCita: () => navigate('/citas'),
                  onModificarCita: () => navigate('/citas'),
                  onConfirmarCita: () => navigate('/citas'),
                  onEnviarTaller: () => navigate('/reparaciones'),
                  onGestionarReparacion: () => navigate('/reparaciones'),
                  onFinalizarReparacion: () => navigate('/reparaciones'),
                  onGenerarFactura: () => navigate('/facturas'),
                  onVerFactura: () => navigate('/facturas')
                })

                return (
                  <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        Ciclo de Vida del Expediente (Roadmap Sincronizado)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        6 Funciones Integradas
                      </span>
                    </div>
                    <TimelineVisual steps={steps} />
                  </div>
                )
              })()}

              {/* Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Fotografías del Expediente ({(selectedExpediente.fotos || []).length})
                  </h4>
                  <span className="text-[11px] text-emerald-400/90 font-medium">
                    Compresión WebP activa (&lt;250 KB)
                  </span>
                </div>

                {(!selectedExpediente.fotos || selectedExpediente.fotos.length === 0) ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No se han subido fotos a este expediente.
                    <p className="text-slate-400 mt-1">Haz clic en "Adjuntar Fotografía" para subir daños, piezas o entrega.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedExpediente.fotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800"
                      >
                        <img
                          src={photo}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                          <a
                            href={photo}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
                            title="Ver en grande"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeletePhoto(photo)}
                            className="p-1.5 rounded-lg bg-rose-600/80 text-white hover:bg-rose-500 transition-colors"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
              <Camera className="w-10 h-10 text-slate-700 mb-3" />
              <p className="font-semibold text-slate-400 text-sm">Selecciona un expediente para ver sus fotos</p>
              <p className="mt-1">Podrás revisar fotografías, ampliarlas y subir nuevas imágenes de peritación.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Expediente Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Nuevo Expediente Fotográfico
              </h2>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpediente} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nº Expediente</label>
                  <input
                    type="text"
                    required
                    value={newExpData.numero}
                    onChange={(e) => setNewExpData({ ...newExpData, numero: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Estado Inicial</label>
                  <select
                    value={newExpData.estado}
                    onChange={(e) => setNewExpData({ ...newExpData, estado: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="peritacion">En Peritación</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cliente</label>
                  <select
                    value={newExpData.cliente_id}
                    onChange={(e) => setNewExpData({ ...newExpData, cliente_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Vehículo</label>
                  <select
                    value={newExpData.vehiculo_id}
                    onChange={(e) => setNewExpData({ ...newExpData, vehiculo_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.matricula} - {v.marca}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Motivo / Daños / Trabajos a Realizar</label>
                <textarea
                  rows={3}
                  value={newExpData.descripcion}
                  onChange={(e) => setNewExpData({ ...newExpData, descripcion: e.target.value })}
                  placeholder="Detalla los daños de chapa, mecánica o mantenimiento..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/20 transition-all"
                >
                  Abrir Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
