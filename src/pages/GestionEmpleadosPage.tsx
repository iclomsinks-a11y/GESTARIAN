import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../lib/ToastContext'
import { 
  Users, 
  UserPlus, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  Lock, 
  ShieldAlert, 
  Plus, 
  X,
  Mail,
  Briefcase,
  Layers,
  ChevronRight,
  Eye,
  Camera,
  Wrench,
  Calendar,
  Receipt,
  Check,
  Bell,
  AlertCircle,
  LogIn,
  Info
} from 'lucide-react'
import type { EmpleadoAutorizado, PermisosEmpleado } from '../services/authService/types'
import { 
  CATEGORIAS_PUESTOS, 
  FASES_TALLER, 
  mapearPermisosGranularesABase,
  CategoriaPuesto 
} from '../services/authService/categoriasPermisos'
import { useNavigate } from 'react-router-dom'

export const GestionEmpleadosPage: React.FC = () => {
  const { 
    perfil, 
    getStoredEmpleados, 
    createWorkshopEmployee, 
    updateWorkshopEmployee, 
    deleteWorkshopEmployee,
    loginAsAutorizado
  } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [empleados, setEmpleados] = useState<EmpleadoAutorizado[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEmp, setEditingEmp] = useState<EmpleadoAutorizado | null>(null)

  // Filter / active tab for employee cards
  const [sectorFilter, setSectorFilter] = useState<string>('todos')

  // Form state
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [pinAcceso, setPinAcceso] = useState('')
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('cat_chapista')
  const [cargo, setCargo] = useState('Chapista')
  const [superiorId, setSuperiorId] = useState<string>('')
  const [esEncargado, setEsEncargado] = useState(false)

  // Granular permissions map
  const [permisosGranulares, setPermisosGranulares] = useState<Record<string, boolean>>({})

  // Modal active phase tab
  const [modalActiveFase, setModalActiveFase] = useState<string>('fase3')

  const reloadEmpleados = () => {
    setEmpleados(getStoredEmpleados())
  }

  useEffect(() => {
    reloadEmpleados()
  }, [])

  // When selecting a category in the form, load its default permissions
  const handleSelectCategoria = (catId: string) => {
    setSelectedCategoriaId(catId)
    const cat = CATEGORIAS_PUESTOS.find(c => c.id === catId)
    if (cat) {
      setCargo(cat.cargo)
      setEsEncargado(cat.esEncargado)
      setPermisosGranulares({ ...cat.permisosDefault })

      // Auto-assign reasonable superior if not an encargado
      if (!cat.esEncargado) {
        const potentialSuperiors = empleados.filter(e => e.esEncargado || e.cargo.toLowerCase().includes('jefe'))
        if (potentialSuperiors.length > 0) {
          // If chapa, prefer jefe chapa
          if (cat.subarea.includes('Chapa') || cat.cargo.toLowerCase().includes('chapa') || cat.cargo.toLowerCase().includes('pintor')) {
            const jefeChapa = potentialSuperiors.find(e => e.cargo.toLowerCase().includes('chapa'))
            if (jefeChapa) {
              setSuperiorId(jefeChapa.id)
            } else {
              setSuperiorId(potentialSuperiors[0].id)
            }
          } else {
            setSuperiorId(potentialSuperiors[0].id)
          }
        }
      } else {
        setSuperiorId('')
      }
    }
  }

  const resetForm = () => {
    setNombre('')
    setEmail('')
    setPinAcceso('')
    setSelectedCategoriaId('cat_chapista')
    const cat = CATEGORIAS_PUESTOS.find(c => c.id === 'cat_chapista')
    setCargo(cat?.cargo || 'Chapista')
    setEsEncargado(false)
    setPermisosGranulares({ ...(cat?.permisosDefault || {}) })
    setSuperiorId('')
    setEditingEmp(null)
    setModalActiveFase('fase3')
  }

  const handleOpenAdd = () => {
    resetForm()
    setPinAcceso(Math.floor(1000 + Math.random() * 9000).toString())
    setShowAddModal(true)
  }

  const handleOpenEdit = (emp: EmpleadoAutorizado) => {
    setEditingEmp(emp)
    setNombre(emp.nombre)
    setEmail(emp.email)
    setCargo(emp.cargo)
    setPinAcceso(emp.pinAcceso)
    setEsEncargado(!!emp.esEncargado)
    setSuperiorId(emp.superiorId || '')

    // Match or find category
    const cat = CATEGORIAS_PUESTOS.find(c => c.id === emp.categoriaId) || 
      CATEGORIAS_PUESTOS.find(c => c.cargo.toLowerCase() === emp.cargo.toLowerCase())
    if (cat) {
      setSelectedCategoriaId(cat.id)
    }

    const currentGranulares = emp.permisosGranulares || emp.permisos.granulares || cat?.permisosDefault || {}
    setPermisosGranulares({ ...currentGranulares })
    setShowAddModal(true)
  }

  const toggleGranularPermission = (permId: string) => {
    setPermisosGranulares(prev => ({
      ...prev,
      [permId]: !prev[permId]
    }))
  }

  const handleToggleFaseAll = (faseId: string, value: boolean) => {
    const fase = FASES_TALLER.find(f => f.id === faseId)
    if (!fase) return
    setPermisosGranulares(prev => {
      const next = { ...prev }
      fase.permisos.forEach(p => {
        next[p.id] = value
      })
      return next
    })
  }

  const handleResetToCategoryDefaults = () => {
    const cat = CATEGORIAS_PUESTOS.find(c => c.id === selectedCategoriaId)
    if (cat) {
      setPermisosGranulares({ ...cat.permisosDefault })
      addToast(`Permisos restablecidos a los valores por defecto de ${cat.cargo}`, 'info')
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !pinAcceso.trim()) {
      addToast('Nombre y PIN de acceso son obligatorios', 'warning')
      return
    }

    const cat = CATEGORIAS_PUESTOS.find(c => c.id === selectedCategoriaId)
    const categoriaPuestoStr = cat 
      ? `${cat.sector} / ${cat.area} / ${cat.subarea} / ${cat.cargo}`
      : `Taller / Sector Automoción / General / ${cargo}`

    const superiorEmp = empleados.find(e => e.id === superiorId)
    const superiorNombreStr = superiorEmp ? `${superiorEmp.nombre} (${superiorEmp.cargo})` : undefined

    // Generate base permissions for backward compatibility with AuthGuard / Sidebar
    const basePermisos: PermisosEmpleado = {
      ...mapearPermisosGranularesABase(permisosGranulares),
      granulares: { ...permisosGranulares }
    }

    if (editingEmp) {
      updateWorkshopEmployee(editingEmp.id, {
        nombre,
        email: email || `${pinAcceso}@empleado.dmcar.es`,
        cargo,
        pinAcceso,
        categoriaId: selectedCategoriaId,
        categoriaPuesto: categoriaPuestoStr,
        sector: cat?.sector || 'Sector Automoción',
        area: cat?.area || 'Carrocería',
        subarea: cat?.subarea || 'Chapa y Pintura',
        esEncargado,
        superiorId: superiorId || undefined,
        superiorNombre: superiorNombreStr,
        permisosGranulares,
        permisos: basePermisos
      })
      addToast(`Empleado ${nombre} actualizado correctamente`, 'success')
    } else {
      createWorkshopEmployee({
        tallerId: perfil?.tallerId || 'gestion@talleresdmcar.es',
        nombre,
        email: email || `${pinAcceso}@empleado.dmcar.es`,
        cargo,
        pinAcceso,
        activo: true,
        categoriaId: selectedCategoriaId,
        categoriaPuesto: categoriaPuestoStr,
        sector: cat?.sector || 'Sector Automoción',
        area: cat?.area || 'Carrocería',
        subarea: cat?.subarea || 'Chapa y Pintura',
        esEncargado,
        superiorId: superiorId || undefined,
        superiorNombre: superiorNombreStr,
        permisosGranulares,
        permisos: basePermisos
      })
      addToast(`Nuevo empleado autorizado ${nombre} dado de alta con PIN ${pinAcceso}`, 'success')
    }

    setShowAddModal(false)
    resetForm()
    reloadEmpleados()
  }

  const handleToggleActivo = (emp: EmpleadoAutorizado) => {
    updateWorkshopEmployee(emp.id, { activo: !emp.activo })
    addToast(`Empleado ${emp.nombre} ${!emp.activo ? 'activado' : 'desactivado'}`, 'info')
    reloadEmpleados()
  }

  const handleDelete = (id: string, empNombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el empleado autorizado ${empNombre}?`)) {
      deleteWorkshopEmployee(id)
      addToast(`Empleado ${empNombre} eliminado`, 'info')
      reloadEmpleados()
    }
  }

  const handleSimularLogin = async (emp: EmpleadoAutorizado) => {
    const res = await loginAsAutorizado(emp.pinAcceso)
    if (res.success) {
      addToast(`Sesión iniciada como ${emp.nombre} (${emp.cargo}). Permisos granulares aplicados.`, 'success')
      navigate('/reparaciones')
    } else {
      addToast(res.error || 'Error al iniciar sesión como empleado', 'error')
    }
  }

  const filteredEmpleados = empleados.filter(e => {
    if (sectorFilter === 'todos') return true
    if (sectorFilter === 'carroceria') {
      return (e.area?.toLowerCase().includes('carrocería') || e.subarea?.toLowerCase().includes('chapa') || e.cargo.toLowerCase().includes('chapa') || e.cargo.toLowerCase().includes('pintor'))
    }
    if (sectorFilter === 'mecanica') {
      return (e.area?.toLowerCase().includes('mecánica') || e.cargo.toLowerCase().includes('mecánico'))
    }
    if (sectorFilter === 'encargados') {
      return !!e.esEncargado || e.cargo.toLowerCase().includes('jefe')
    }
    return true
  })

  // Count active permissions helper
  const countActivePerms = (emp: EmpleadoAutorizado) => {
    const gran = emp.permisosGranulares || emp.permisos.granulares || {}
    return Object.values(gran).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white">Gestión de Empleados y Permisos Granulares</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Configurado por Fases
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Administra a tu plantilla por categoría profesional. Por defecto, cada autorizado recibe los permisos específicos de su categoría 
            (ej: <strong className="text-amber-300">Chapista: acceso a imágenes durante la reparación y finalizar reparación con notificación a su superior</strong>; y <strong className="text-sky-300">Jefe de Sección Chapa: acceso a imágenes y confirmación/finalización directa</strong>).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 shrink-0 self-start lg:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Alta de Empleado / Asignar Categoría</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium text-[11px] mr-1">Filtrar área:</span>
        <button
          onClick={() => setSectorFilter('todos')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sectorFilter === 'todos'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({empleados.length})
        </button>
        <button
          onClick={() => setSectorFilter('carroceria')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sectorFilter === 'carroceria'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Carrocería / Chapa y Pintura
        </button>
        <button
          onClick={() => setSectorFilter('mecanica')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sectorFilter === 'mecanica'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Mecánica General
        </button>
        <button
          onClick={() => setSectorFilter('encargados')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sectorFilter === 'encargados'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Jefes de Sección / Encargados
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmpleados.map((emp) => {
          const gran = emp.permisosGranulares || emp.permisos.granulares || {}
          const activeCount = countActivePerms(emp)
          const tieneAccesoImagenes = !!gran.f3_imagenes_durante_reparacion
          const tieneFinalizarDirecta = !!gran.f3_finalizar_directa
          const tieneFinalizarSolicitud = !!gran.f3_finalizar_solicitar

          return (
            <div
              key={emp.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition-all flex flex-col justify-between ${
                emp.activo ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-60 bg-slate-950/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white">{emp.nombre}</h3>
                      {emp.esEncargado && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                          ENCARGADO
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-400 font-semibold block mt-0.5">{emp.cargo}</span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate max-w-[220px]">
                      {emp.categoriaPuesto || 'Sector Automoción / Carrocería'}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    emp.activo 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {emp.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* PIN and Superior info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      PIN Acceso:
                    </span>
                    <span className="font-mono font-bold text-amber-300 tracking-widest text-sm mt-0.5">
                      {emp.pinAcceso}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-sky-400" />
                      Superior Directo:
                    </span>
                    <span className="text-[11px] font-medium text-slate-200 truncate mt-0.5" title={emp.superiorNombre || 'Dueño de Taller'}>
                      {emp.superiorNombre ? emp.superiorNombre.split('(')[0] : 'Dueño Taller'}
                    </span>
                  </div>
                </div>

                {/* Granular Key Permissions Badges */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Permisos Granulares:
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                      {activeCount} activos
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    {/* Highlight: Acceso a Imágenes */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>Imágenes durante reparación:</span>
                      </span>
                      {tieneAccesoImagenes ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Habilitado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Bloqueado</span>
                      )}
                    </div>

                    {/* Highlight: Finalizar Reparación */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Finalizar reparación:</span>
                      </span>
                      {tieneFinalizarDirecta ? (
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Directa (Encargado)
                        </span>
                      ) : tieneFinalizarSolicitud ? (
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20" title="Genera notificación interna a su inmediato superior para que confirme la finalización">
                          Aviso a Superior
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Sin permiso</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons & Quick Simulation */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => handleSimularLogin(emp)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold border border-sky-500/30 transition-all flex items-center gap-1.5 text-[11px]"
                  title={`Probar panel como ${emp.nombre}`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Probar Acceso</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActivo(emp)}
                    className={`px-2 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                      emp.activo 
                        ? 'text-slate-400 hover:text-amber-400' 
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    {emp.activo ? 'Desactivar' : 'Activar'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(emp)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Configurar permisos por fases"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(emp.id, emp.nombre)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Eliminar empleado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Add/Edit Employee with Granular Phase Permissions */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-5 sm:p-6 space-y-5 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEmp ? 'Modificar Empleado y Permisos Granulares' : 'Alta de Nuevo Empleado (Autorizado)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Asigna su categoría profesional para cargar automáticamente los permisos recomendados por fases.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Nombre y Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Roberto Sánchez"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">PIN de Acceso (4 Dígitos) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pinAcceso}
                    onChange={(e) => setPinAcceso(e.target.value)}
                    placeholder="Ej. 5678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold tracking-widest text-center focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Categoría / Puesto Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                    <span>Categoría / Puesto Jerárquico *</span>
                    <span className="text-[11px] text-amber-400 font-normal">
                      Carga automática de permisos por defecto
                    </span>
                  </label>
                  <select
                    value={selectedCategoriaId}
                    onChange={(e) => handleSelectCategoria(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs cursor-pointer"
                  >
                    <optgroup label="Sector Automoción / Carrocería / Chapa y Pintura">
                      <option value="cat_chapista">Chapista (Operario de Chapa & Bancada)</option>
                      <option value="cat_jefe_chapa">Jefe de Sección Chapa (Encargado)</option>
                      <option value="cat_pintor">Pintor / Preparador de Pintura</option>
                      <option value="cat_jefe_pintura">Jefe de Sección Pintura (Encargado)</option>
                    </optgroup>
                    <optgroup label="Sector Automoción / Mecánica General">
                      <option value="cat_mecanico_oficial">Mecánico / Oficial de Taller</option>
                      <option value="cat_jefe_mecanica">Jefe de Sección Mecánica (Encargado)</option>
                    </optgroup>
                    <optgroup label="Sector Automoción / Electricidad & Diagnosis">
                      <option value="cat_electromecanico">Técnico en Diagnosis / Electricista</option>
                    </optgroup>
                    <optgroup label="Sector Automoción / Recepción & Dirección">
                      <option value="cat_recepcion">Asesor de Servicio / Recepción</option>
                      <option value="cat_jefe_taller_general">Jefe de Taller / Encargado General</option>
                    </optgroup>
                  </select>
                </div>

                {/* Cargo display & Superior Selector */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cargo o Especialidad Visible</label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                    <span>Inmediato Superior Asignado</span>
                    <span className="text-[10px] text-slate-500">Recibe notificaciones de finalización</span>
                  </label>
                  <select
                    value={superiorId}
                    onChange={(e) => setSuperiorId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="">Dueño del Taller (Usuario General)</option>
                    {empleados
                      .filter(e => (!editingEmp || e.id !== editingEmp.id))
                      .map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.nombre} — {sup.cargo} {sup.esEncargado ? '(Encargado)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Category Default Info Banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Configuración de Permisos para: {cargo}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedCategoriaId === 'cat_chapista' && (
                    <>
                      <strong>Chapista por defecto:</strong> Tiene activado el <span className="text-emerald-300 font-semibold">acceso a imágenes durante la reparación</span> y <span className="text-sky-300 font-semibold">finalizar reparación (solicitud a superior)</span>. Al finalizar una orden, se generará una notificación interna a su inmediato superior para que la confirme antes de darla por finalizada.
                    </>
                  )}
                  {selectedCategoriaId === 'cat_jefe_chapa' && (
                    <>
                      <strong>Jefe de Sección Chapa (Encargado) por defecto:</strong> Tiene activado el <span className="text-emerald-300 font-semibold">acceso a imágenes</span> y la <span className="text-amber-300 font-semibold">finalización directa de reparaciones</span>, con potestad para validar las solicitudes enviadas por sus operarios de chapa.
                    </>
                  )}
                  {selectedCategoriaId !== 'cat_chapista' && selectedCategoriaId !== 'cat_jefe_chapa' && (
                    <>
                      Permisos predeterminados cargados para la especialidad seleccionada. Puedes personalizar cada opción granularmente por fases a continuación.
                    </>
                  )}
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetToCategoryDefaults}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Restablecer valores por defecto de {cargo}
                  </button>
                </div>
              </div>

              {/* Granular Permissions by Phases */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Permisos Granulares Configurados por Fases:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {Object.values(permisosGranulares).filter(Boolean).length} permisos activos
                  </span>
                </div>

                {/* Phase Selection Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs">
                  {FASES_TALLER.map((fase) => {
                    const activeCountInFase = fase.permisos.filter(p => permisosGranulares[p.id]).length
                    const isCurrent = modalActiveFase === fase.id

                    return (
                      <button
                        key={fase.id}
                        type="button"
                        onClick={() => setModalActiveFase(fase.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                          isCurrent
                            ? 'bg-slate-800 text-white border border-amber-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{fase.nombre.split(':')[0]}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          activeCountInFase > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {activeCountInFase}/{fase.permisos.length}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Active Phase Options Box */}
                {FASES_TALLER.map((fase) => {
                  if (fase.id !== modalActiveFase) return null

                  return (
                    <div key={fase.id} className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-amber-400">{fase.nombre}</h4>
                          <p className="text-[11px] text-slate-400">{fase.descripcion}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleToggleFaseAll(fase.id, true)}
                            className="text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            Marcar todos
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleFaseAll(fase.id, false)}
                            className="text-slate-400 hover:text-slate-200 font-medium"
                          >
                            Desmarcar todos
                          </button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {fase.permisos.map((perm) => {
                          const isChecked = !!permisosGranulares[perm.id]
                          const isKeyHighlight = perm.id === 'f3_imagenes_durante_reparacion' || perm.id === 'f3_finalizar_solicitar' || perm.id === 'f3_finalizar_directa'

                          return (
                            <label
                              key={perm.id}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                                isChecked
                                  ? isKeyHighlight 
                                    ? 'bg-amber-500/10 border-amber-500/30' 
                                    : 'bg-slate-800/80 border-slate-700'
                                  : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/40 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleGranularPermission(perm.id)}
                                className="mt-0.5 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                              />
                              <div className="space-y-0.5">
                                <span className={`font-semibold block text-xs ${
                                  isChecked ? 'text-white' : 'text-slate-300'
                                }`}>
                                  {perm.label}
                                  {perm.riesgoAlto && (
                                    <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                                      Jefatura
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-400 leading-relaxed block">
                                  {perm.descripcion}
                                </span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20"
                >
                  {editingEmp ? 'Guardar Cambios de Permisos' : 'Dar de Alta Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
