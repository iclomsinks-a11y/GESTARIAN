import React, { useState, useMemo, useEffect } from 'react'
import { 
  Tag, 
  Car, 
  HeartPulse, 
  Building2, 
  Store, 
  Search, 
  Plus, 
  Copy, 
  Check, 
  Printer, 
  RefreshCw, 
  User, 
  Info, 
  Wrench,
  ShieldCheck,
  Calculator,
  ChevronRight,
  Sliders,
  CheckCircle2,
  X,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../lib/ToastContext'
import { sectorService } from '../services/sectorService'
import { SectorType } from '../config/sectores'
import { 
  tarifasService, 
  TarifaItem, 
  SECTORES_INFO 
} from '../services/tarifasService'
import { 
  TipoClienteTarifa, 
  PRECIO_PIEZA_PARTICULAR, 
  PRECIO_PIEZA_EMPRESA,
  PRECIO_PINTAR_ENTERO_PARTICULAR,
  PRECIO_PINTAR_ENTERO_EMPRESA
} from '../lib/presupuestoPricingRules'

export const ListadoPreciosPage: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  // Sector actual configurado en el sistema
  const sectorActualSistema = sectorService.getCurrentSector()
  
  // Sector seleccionado para visualizar en la página de precios
  const [selectedSector, setSelectedSector] = useState<SectorType>(sectorActualSistema)
  
  // Tipo de cliente activo para ver precios
  const [tipoCliente, setTipoCliente] = useState<TipoClienteTarifa>('particular')

  // Catálogo de tarifas
  const [tarifas, setTarifas] = useState<TarifaItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas')

  // Widget Calculadora Rápida: Pintar número de piezas
  const [numPiezasCalculadora, setNumPiezasCalculadora] = useState<number>(2)
  const [tamanoPintarEntero, setTamanoPintarEntero] = useState<'compacto' | 'berlina' | 'suv' | 'furgoneta'>('berlina')
  const [copiadoId, setCopiadoId] = useState<string | null>(null)

  // Modal para nuevo concepto
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nuevoConcepto, setNuevoConcepto] = useState<Partial<TarifaItem>>({
    nombre: '',
    categoria: 'Pintura y Carrocería',
    descripcion: '',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    activo: true
  })

  // Cargar tarifas al inicio o tras actualizar
  const cargarTarifas = () => {
    const data = tarifasService.getTarifas()
    setTarifas(data)
  }

  useEffect(() => {
    cargarTarifas()

    const handleUpdate = () => cargarTarifas()
    window.addEventListener('gestarian-tarifas-updated', handleUpdate)
    return () => window.removeEventListener('gestarian-tarifas-updated', handleUpdate)
  }, [])

  // Información del sector actualmente en visualización
  const sectorInfo = useMemo(() => {
    return SECTORES_INFO.find(s => s.id === selectedSector) || SECTORES_INFO[0]
  }, [selectedSector])

  // Filtrado por sector, categoría y búsqueda
  const tarifasFiltradas = useMemo(() => {
    return tarifas.filter(t => {
      if (t.sector !== selectedSector) return false
      if (selectedCategoria !== 'todas' && t.categoria !== selectedCategoria) return false
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        return (
          t.nombre.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tarifas, selectedSector, selectedCategoria, searchTerm])

  // Lista de categorías únicas para el sector seleccionado
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set<string>()
    tarifas.filter(t => t.sector === selectedSector).forEach(t => cats.add(t.categoria))
    return Array.from(cats)
  }, [tarifas, selectedSector])

  // Cálculo de pintar número de piezas
  const calculoPintarPiezas = useMemo(() => {
    return tarifasService.calcularPintarPiezas(numPiezasCalculadora, tipoCliente)
  }, [numPiezasCalculadora, tipoCliente])

  // Cálculo de pintar coche entero
  const calculoPintarEntero = useMemo(() => {
    return tarifasService.calcularPintarEntero(tamanoPintarEntero, tipoCliente)
  }, [tamanoPintarEntero, tipoCliente])

  // Copiar concepto al portapapeles
  const handleCopiarConcepto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto)
    setCopiadoId(id)
    addToast('Concepto copiado al portapapeles', 'info')
    setTimeout(() => setCopiadoId(null), 2500)
  }

  // Restablecer valores predeterminados
  const handleRestablecer = () => {
    if (window.confirm('¿Deseas restablecer todas las tarifas a los valores oficiales de catálogo?')) {
      const defaultData = tarifasService.restablecerValoresPorDefecto()
      setTarifas(defaultData)
      addToast('Tarifas restablecidas con éxito a valores oficiales', 'success')
    }
  }

  // Guardar nuevo concepto
  const handleGuardarNuevo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoConcepto.nombre || !nuevoConcepto.precioParticular) {
      addToast('Por favor completa el nombre y precio del concepto', 'error')
      return
    }

    tarifasService.crearTarifaItem({
      sector: selectedSector,
      categoria: nuevoConcepto.categoria || 'General',
      nombre: nuevoConcepto.nombre,
      descripcion: nuevoConcepto.descripcion || '',
      unidad: (nuevoConcepto.unidad as any) || 'unidad',
      precioParticular: Number(nuevoConcepto.precioParticular) || 0,
      precioEmpresa: Number(nuevoConcepto.precioEmpresa) || Number(nuevoConcepto.precioParticular) || 0,
      pasoCantidad: Number(nuevoConcepto.pasoCantidad) || 1,
      activo: true
    })

    cargarTarifas()
    setIsModalOpen(false)
    setNuevoConcepto({
      nombre: '',
      categoria: categoriasDisponibles[0] || 'General',
      descripcion: '',
      unidad: 'pieza',
      precioParticular: 80,
      precioEmpresa: 70,
      pasoCantidad: 1,
      activo: true
    })
    addToast('Nuevo concepto añadido al listado de precios', 'success')
  }

  // Imprimir tarifa oficial
  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Listado Oficial de Precios y Tarifas
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl">
            Catálogo estructurado por categorías de sector profesional. Incluye reglas de tarificación oficial 
            para cliente Particular vs Empresa, módulo de pintado por número de piezas y mano de obra reglada.
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleImprimir}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-colors"
            title="Imprimir listado de tarifas"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleRestablecer}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 transition-colors"
            title="Restablecer valores de fábrica"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Valores oficiales</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir concepto</span>
          </button>
        </div>
      </div>

      {/* Selector de Sector / Categoría de la Industria */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            Categoría del Sector Empresarial
          </span>
          {selectedSector === sectorActualSistema && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-3 h-3" /> Sector activo del taller
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SECTORES_INFO.map(sec => {
            const isSelected = selectedSector === sec.id
            const isSistema = sectorActualSistema === sec.id
            const Icon = 
              sec.id === 'automocion' ? Car :
              sec.id === 'salud' ? HeartPulse :
              sec.id === 'construccion' ? Building2 : Store

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setSelectedSector(sec.id)
                  setSelectedCategoria('todas')
                }}
                className={`p-4 rounded-xl text-left transition-all relative border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-sky-500 shadow-md shadow-sky-950/40 ring-1 ring-sky-500/40'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSistema && (
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                        Principal
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white">{sec.nombre}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sec.subtitulo}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className={isSelected ? 'text-sky-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? 'Mostrando tarifas' : 'Ver listado'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selector de Tarifa: Particular vs Empresa */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Tarifa Activa para Cálculo y Visualización:
            </h4>
            <p className="text-xs text-slate-400">
              {tipoCliente === 'particular'
                ? 'Tarifa Particular: Piezas de pintura a 80 € / ud. IVA e impuestos para consumidor final.'
                : 'Tarifa Empresa / Flotas: Piezas de pintura a 70 € / ud. Precios especiales para profesionales.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setTipoCliente('particular')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tipoCliente === 'particular'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Particular (80 €/pieza)</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoCliente('empresa')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tipoCliente === 'empresa'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Empresa (70 €/pieza)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN ESPECIAL AUTOMOCIÓN: CALCULADORA PINTAR NÚMERO DE PIEZAS & ENTERO */}
      {/* ========================================================================= */}
      {selectedSector === 'automocion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tarjeta 1: Pintar Número de Piezas (Regla central solicitada por el usuario) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border-2 border-sky-500/40 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-block mb-1">
                  Módulo Rápido de Carrocería
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  Pintar número de piezas
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Indica simplemente un número de piezas (ej: 2, 3 o 4 piezas) sin necesidad de detallar
                  aleta, paragolpes, techo o capó.
                </p>
              </div>

              <span className="text-right shrink-0">
                <span className="text-xs text-slate-400 block">Tarifa {tipoCliente}</span>
                <strong className="text-lg font-mono font-bold text-emerald-400">
                  {tipoCliente === 'empresa' ? '70 €' : '80 €'}/ud
                </strong>
              </span>
            </div>

            {/* Selector de número de piezas */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Número de piezas a pintar:
                </label>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {numPiezasCalculadora} {numPiezasCalculadora === 1 ? 'pieza' : 'piezas'}
                </span>
              </div>

              {/* Botones rápidos de 1 a 6 piezas */}
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumPiezasCalculadora(n)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                      numPiezasCalculadora === n
                        ? 'bg-sky-600 text-white border-sky-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {n} {n === 1 ? 'pz' : 'pzs'}
                  </button>
                ))}
              </div>

              {/* Input manual si son más de 6 piezas */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">O especificar cantidad exacta:</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={numPiezasCalculadora}
                  onChange={e => setNumPiezasCalculadora(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-slate-400">piezas (número entero)</span>
              </div>
            </div>

            {/* Desglose de importe */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Desglose oficial ({tipoCliente}):</span>
                <span className="text-slate-200 font-mono">
                  {calculoPintarPiezas.numPiezas} piezas × {calculoPintarPiezas.precioUnitario} € = <strong className="text-white">{calculoPintarPiezas.subtotal} €</strong>
                </span>
                <span className="text-[11px] text-slate-400 block">
                  + 21% IVA ({calculoPintarPiezas.iva} €)
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Total con IVA</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {calculoPintarPiezas.total} €
                </span>
              </div>
            </div>

            {/* Acciones de la calculadora */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopiarConcepto(
                  `Pintar ${calculoPintarPiezas.numPiezas} piezas de carrocería (${calculoPintarPiezas.precioUnitario} €/ud) - Subtotal: ${calculoPintarPiezas.subtotal} €`,
                  'calc-piezas'
                )}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiadoId === 'calc-piezas' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar concepto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/solicitudes')
                  addToast('Dirigiéndote a Solicitudes para aplicar la tarifa', 'info')
                }}
                className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Usar en presupuesto</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tarjeta 2: Pintar Coche Entero */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block mb-1">
                  Pintado Integral
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" />
                  Pintar coche entero
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Pintado completo de carrocería en cabina presurizada con desengrasado, aparejo, base bicapa y barniz.
                </p>
              </div>

              <span className="text-right shrink-0">
                <span className="text-xs text-slate-400 block">Tarifa {tipoCliente}</span>
                <strong className="text-lg font-mono font-bold text-indigo-400">
                  {calculoPintarEntero.subtotal} €
                </strong>
              </span>
            </div>

            {/* Selector de tamaño de vehículo */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Tipo o categoría del vehículo:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'compacto', label: 'Utilitario / Compacto' },
                  { id: 'berlina', label: 'Berlina / Familiar' },
                  { id: 'suv', label: 'SUV / 4x4' },
                  { id: 'furgoneta', label: 'Furgoneta' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTamanoPintarEntero(t.id as any)}
                    className={`p-2.5 rounded-lg text-center text-xs font-bold transition-all border ${
                      tamanoPintarEntero === t.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desglose de importe */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Vehículo: <strong className="text-white capitalize">{calculoPintarEntero.tamano}</strong></span>
                <span className="text-slate-200 font-mono">
                  Subtotal base: <strong className="text-white">{calculoPintarEntero.subtotal} €</strong>
                </span>
                <span className="text-[11px] text-slate-400 block">
                  + 21% IVA ({calculoPintarEntero.iva} €)
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Total con IVA</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {calculoPintarEntero.total} €
                </span>
              </div>
            </div>

            {/* Acciones de la calculadora */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopiarConcepto(
                  `Pintar coche entero (${calculoPintarEntero.tamano}) en cabina - Subtotal: ${calculoPintarEntero.subtotal} €`,
                  'calc-entero'
                )}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiadoId === 'calc-entero' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar concepto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate('/solicitudes')
                  addToast('Dirigiéndote a Solicitudes para aplicar la tarifa', 'info')
                }}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Usar en presupuesto</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN ESPECIAL SALUD: COMPARATIVA DE EMPASTES Y TRATAMIENTOS DENTALES   */}
      {/* ========================================================================= */}
      {selectedSector === 'salud' && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-1">
                Sector Salud Bucodental & Odontología
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                Diferenciación de Procedimientos: Empastes y Endodoncias
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                A diferencia del taller automotriz, los tratamientos odontológicos se tarifican por 
                superficies dentales restauradas (obturación simple o compuesta), conductos radiculares y fase quirúrgica.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Exento de IVA médico</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800/60">
                Régimen Sanitario
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-white">Empaste Simple</h4>
                <span className="text-xs font-mono font-bold text-emerald-400">50 €</span>
              </div>
              <p className="text-[11px] text-slate-400">
                1 sola superficie dental (oclusal, vestibular o lingual). Caries incipiente o superficial.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-white">Empaste Compuesto</h4>
                <span className="text-xs font-mono font-bold text-emerald-400">65 €</span>
              </div>
              <p className="text-[11px] text-slate-400">
                2 o más superficies interproximales (mesio-oclusal, disto-oclusal). Requiere matriz y cuña.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-white">Reconstrucción Estética</h4>
                <span className="text-xs font-mono font-bold text-emerald-400">85 €</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gran pérdida de corona o cúspides, perno de fibra de vidrio y estratificación anatómica.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE FILTROS Y BÚSQUEDA DEL CATÁLOGO                                 */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Categorías del sector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoria('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoria === 'todas'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Todas ({tarifas.filter(t => t.sector === selectedSector).length})
            </button>
            {categoriasDisponibles.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoria(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategoria === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio o recambio..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabla / Listado de Conceptos */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 font-bold">Concepto / Servicio</th>
                  <th className="p-3.5 font-bold w-40">Categoría</th>
                  <th className="p-3.5 font-bold w-32 text-center">Unidad / Regla</th>
                  <th className="p-3.5 font-bold w-32 text-right">Tarifa Particular</th>
                  <th className="p-3.5 font-bold w-32 text-right">Tarifa Empresa</th>
                  <th className="p-3.5 font-bold w-28 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tarifasFiltradas.length > 0 ? (
                  tarifasFiltradas.map(t => {
                    const precioActivo = tipoCliente === 'empresa' ? t.precioEmpresa : t.precioParticular
                    return (
                      <tr 
                        key={t.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          t.destacado ? 'bg-sky-950/10' : ''
                        }`}
                      >
                        {/* Concepto */}
                        <td className="p-3.5">
                          <div className="flex items-start gap-2">
                            {t.destacado && (
                              <span className="p-1 rounded bg-sky-500/20 text-sky-400 shrink-0 mt-0.5" title="Concepto estándar destacado">
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            )}
                            <div>
                              <span className="font-bold text-white text-xs block">
                                {t.nombre}
                              </span>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 max-w-xl">
                                {t.descripcion}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/50">
                            {t.categoria}
                          </span>
                        </td>

                        {/* Unidad / Regla */}
                        <td className="p-3.5 text-center">
                          {t.esPieza ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800/50">
                              Pieza (entero)
                            </span>
                          ) : t.pasoCantidad === 0.5 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/50">
                              Hora (paso 0.5h)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                              {t.unidad}
                            </span>
                          )}
                        </td>

                        {/* Precio Particular */}
                        <td className={`p-3.5 text-right font-mono font-bold ${
                          tipoCliente === 'particular' ? 'text-sky-400 text-sm' : 'text-slate-400'
                        }`}>
                          {t.precioParticular.toFixed(2)} €
                        </td>

                        {/* Precio Empresa */}
                        <td className={`p-3.5 text-right font-mono font-bold ${
                          tipoCliente === 'empresa' ? 'text-indigo-400 text-sm' : 'text-slate-400'
                        }`}>
                          {t.precioEmpresa.toFixed(2)} €
                        </td>

                        {/* Acción */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopiarConcepto(
                              `${t.nombre}: ${precioActivo.toFixed(2)} €`,
                              t.id
                            )}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Copiar texto y precio al portapapeles"
                          >
                            {copiadoId === t.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron conceptos para la categoría o búsqueda especificada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PARA AÑADIR CONCEPTO PERSONALIZADO A LA TARIFA                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">Añadir Concepto al Catálogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevo} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sector Profesional
                </label>
                <input
                  type="text"
                  disabled
                  value={sectorInfo.nombre}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Trabajo / Pieza / Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoConcepto.nombre}
                  onChange={e => setNuevoConcepto(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Pintar Spoiler Trasero, Empaste molar..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={nuevoConcepto.categoria}
                  onChange={e => setNuevoConcepto(prev => ({ ...prev, categoria: e.target.value }))}
                  placeholder="Ej: Pintura y Carrocería, Odontología..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tarifa Particular (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoConcepto.precioParticular}
                    onChange={e => setNuevoConcepto(prev => ({ ...prev, precioParticular: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tarifa Empresa (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoConcepto.precioEmpresa}
                    onChange={e => setNuevoConcepto(prev => ({ ...prev, precioEmpresa: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Descripción Detallada
                </label>
                <textarea
                  rows={2}
                  value={nuevoConcepto.descripcion}
                  onChange={e => setNuevoConcepto(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción técnica del procedimiento, materiales y condiciones..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm"
                >
                  Guardar en catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
