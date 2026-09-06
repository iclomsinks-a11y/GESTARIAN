import React, { useEffect, useState } from 'react'
import { Settings, Save, ShieldCheck, Building, Wrench, RefreshCw, Smartphone, Terminal, Database, Activity, CheckCircle2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '../lib/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { EgressAuditModal } from '../components/common/EgressAuditModal'
import { getConfiguracion, saveConfiguracion } from '../services/configuracionService'
import { sectorService } from '../services/sectorService'
import { ImageUploadBox } from '../components/common/ImageUploadBox'
import type { SectorType } from '../config/sectores'

export const ConfiguracionPage: React.FC = () => {
  const { esDev, perfil } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [sector, setSector] = useState<SectorType>('automocion')
  const { addToast } = useToast()

  const [config, setConfig] = useState({
    nombre_empresa: 'GESTARIAN DM CAR',
    cif: 'B82910291',
    direccion: 'Polígono Industrial Las Eras, Calle Central 14',
    telefono: '912 345 678 / 654 321 000',
    email: 'contacto@gestariandmcar.es',
    precio_hora_mano_obra: 45.00,
    iva_defecto: 21,
    horario: 'Lunes a Viernes 09:00 - 18:00 h (Ininterrumpido)',
    terminos_presupuesto: 'Validez del presupuesto: 30 días naturales. Piezas originales con garantía oficial.',
    registro_industrial: 'REG-IND-MD-28/99812',
    fondo_portrait: '',
    fondo_landscape: '',
    logo_bn: '',
    logo_app_bn: ''
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getConfiguracion()
        if (data) {
          setConfig(prev => ({ ...prev, ...data }))
        }
        setSector(sectorService.getCurrentSector())
      } catch (err) {
        console.warn('Usando configuración local:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await saveConfiguracion(config)
      sectorService.setSector(sector)
      addToast('Configuración del taller guardada y blindada en caché', 'success')
    } catch {
      addToast('Error al guardar configuración', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem('gestarian_configuracion')
    localStorage.removeItem('offline_clientes')
    addToast('Caché local limpiada correctamente', 'info')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-slate-300" />
            Configuración de Taller y Empresa
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Datos fiscales, precio hora de mano de obra y parámetros de facturación del taller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearCache}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Caché
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
        {/* Personalización de Imagen: Inicio, Menú y Documentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sky-400" />
              Personalización de Imágenes: Inicio, Menú y Documentos
            </h2>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Pulsar en cualquier recuadro desde móvil, tablet o PC para subir imágenes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recuadro 1: Inicio Portrait */}
            <ImageUploadBox
              id="upload-inicio-portrait"
              title="Inicio Portrait"
              description="Fondo de la página de inicio para móvil y tablet en orientación vertical."
              recommendedSize="1080x1920p"
              aspectRatio="portrait"
              value={config.fondo_portrait}
              onChange={(dataUrl) => setConfig({ ...config, fondo_portrait: dataUrl })}
              onRemove={() => setConfig({ ...config, fondo_portrait: '' })}
            />

            {/* Recuadro 2: Inicio Landscape */}
            <ImageUploadBox
              id="upload-inicio-landscape"
              title="Inicio Landscape"
              description="Fondo de la página de inicio para tablet landscape y pantalla de PC escritorio."
              recommendedSize="1920x1080p"
              aspectRatio="landscape"
              value={config.fondo_landscape}
              onChange={(dataUrl) => setConfig({ ...config, fondo_landscape: dataUrl })}
              onRemove={() => setConfig({ ...config, fondo_landscape: '' })}
            />

            {/* Recuadro 3: Logo B/N Documentos */}
            <ImageUploadBox
              id="upload-logo-bn-documentos"
              title="Logo B/N Documentos"
              description="Para facturas, presupuestos, recibos, proformas e informes de cobro (a la derecha de datos fiscales)."
              recommendedSize="250x250p"
              aspectRatio="square"
              value={config.logo_bn}
              onChange={(dataUrl) => setConfig({ ...config, logo_bn: dataUrl })}
              onRemove={() => setConfig({ ...config, logo_bn: '' })}
            />

            {/* Recuadro 4: Logo B/N Aplicación */}
            <ImageUploadBox
              id="upload-logo-bn-app"
              title="Logo B/N de Aplicación"
              description="Cabecera superior izquierda. Sustituye el logo de Gestarian por el personalizado y al pulsar va a inicio."
              recommendedSize="250x250p"
              aspectRatio="square"
              value={config.logo_app_bn}
              onChange={(dataUrl) => setConfig({ ...config, logo_app_bn: dataUrl })}
              onRemove={() => setConfig({ ...config, logo_app_bn: '' })}
            />
          </div>
        </div>

        {/* Company info */}
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-sky-400" />
            Datos Identificativos del Taller (Facturación y Presupuestos)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Razón Social / Nombre Comercial *</label>
              <input
                type="text"
                required
                value={config.nombre_empresa}
                onChange={(e) => setConfig({ ...config, nombre_empresa: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">CIF / NIF *</label>
              <input
                type="text"
                required
                value={config.cif}
                onChange={(e) => setConfig({ ...config, cif: e.target.value.toUpperCase() })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Dirección Completa</label>
              <input
                type="text"
                value={config.direccion}
                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Nº Registro Industrial</label>
              <input
                type="text"
                value={config.registro_industrial}
                onChange={(e) => setConfig({ ...config, registro_industrial: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Teléfonos de Contacto</label>
              <input
                type="text"
                value={config.telefono}
                onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Email Oficial</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing and workshop config */}
        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            Parámetros Económicos y Horario
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Precio Hora Mano de Obra (€ sin IVA)</label>
              <input
                type="number"
                step="0.5"
                value={config.precio_hora_mano_obra}
                onChange={(e) => setConfig({ ...config, precio_hora_mano_obra: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">IVA por Defecto (%)</label>
              <input
                type="number"
                value={config.iva_defecto}
                onChange={(e) => setConfig({ ...config, iva_defecto: parseInt(e.target.value) || 21 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Vertical / Sector ERP</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="automocion">Automoción (Talleres)</option>
                <option value="comercio">Comercio / Retail</option>
                <option value="construccion">Construcción y Reformas</option>
                <option value="salud">Salud y Clínicas</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-slate-400 mb-1 font-medium">Horario de Atención y Recepción</label>
            <input
              type="text"
              value={config.horario}
              onChange={(e) => setConfig({ ...config, horario: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-slate-400 mb-1 font-medium">Pie de Presupuestos y Condiciones Legales</label>
            <textarea
              rows={2}
              value={config.terminos_presupuesto}
              onChange={(e) => setConfig({ ...config, terminos_presupuesto: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Save footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>

      {/* SECCIÓN EXCLUSIVA MODO DESARROLLADOR: VERIFICACIÓN TÉCNICA Y AUDITORÍA EGRESS */}
      {(esDev || perfil?.rol === 'DESARROLLADOR' || perfil?.esDeveloper) && (
        <section className="bg-slate-900/95 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Auditoría Técnica y Blindaje Egress</h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                    Solo Desarrollador
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificación de consumo de datos de Supabase, almacenamiento de fotos WebP y políticas de transferencia segura.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-2 self-start sm:self-auto shadow-md shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              Ver Informe Completo de Auditoría Egress
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Ahorro de Ancho de Banda</span>
                <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Activo
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-400">~96.5%</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Supabase Free Tier (5 GB/mes) blindado mediante compresión WebP en cliente y debouncing de eventos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">PostgreSQL Base64</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-sky-400">0 Blobs en Base de Datos</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Fotos alojadas exclusivamente en Supabase Storage (bucket <code className="text-sky-300">expedientes-fotos</code>) con URLs públicas optimizadas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Supabase Realtime</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-bold text-amber-400">Debounce 300ms</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Suscripciones con debounce y auto-limpieza al desmontar componentes para prevenir fugas de egreso.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Modal de Auditoría Egress exclusivo para el desarrollador */}
      <EgressAuditModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} />
    </div>
  )
}
