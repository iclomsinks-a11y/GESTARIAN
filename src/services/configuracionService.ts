import { supabase } from '../lib/supabase'
import type { Configuracion } from '../lib/types'

const CONFIG_CACHE_KEY = 'gestarian_config_cache'

export const DEFAULT_CONFIG: Configuracion = {
  nombre_empresa: 'DM CAR',
  cif: 'B12345678',
  direccion: 'Calle del Taller, 12',
  telefono: '912 345 678',
  email: 'info@dmcar.es',
  moneda: 'EUR',
  iva: 21,
  metodo_redondeo: 'estandar',
  iban: '',
  sector: 'automocion',
  logo_url: '',
  logo_bn: '',
  logo_app_bn: '',
  fondo_portrait: '',
  fondo_landscape: '',
  fondo_pantalla: '',
  opacidad_fondo: 0.15,
  metis_voice_id: 'es-ES-Neural2-A',
  notificaciones_email: true,
  notificaciones_whatsapp: true,
}

export async function getConfiguracion(): Promise<Configuracion> {
  try {
    const cached = localStorage.getItem(CONFIG_CACHE_KEY)
    let initialConfig: Configuracion = DEFAULT_CONFIG
    if (cached) {
      try {
        initialConfig = { ...DEFAULT_CONFIG, ...JSON.parse(cached) }
      } catch (e) {}
    }

    const { data, error } = await supabase
      .from('configuracion')
      .select('id, nombre_empresa, cif, direccion, telefono, email, moneda, iva, metodo_redondeo, iban, sector, logo_url, opacidad_fondo, notificaciones_email, notificaciones_whatsapp, metis_voice_id')
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return initialConfig
    }

    const merged = { ...initialConfig, ...data }
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(merged))
    return merged
  } catch (err) {
    console.warn('Error al cargar configuración:', err)
    return DEFAULT_CONFIG
  }
}

export async function updateConfiguracion(config: Partial<Configuracion>): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getConfiguracion()
    const updated = { ...current, ...config }

    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('gestarian-config-updated', { detail: updated }))

    const { error } = await supabase
      .from('configuracion')
      .upsert({
        id: updated.id || undefined,
        ...config,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.warn('Error actualizando configuracion en base de datos:', error)
      return { success: true }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error guardando configuración' }
  }
}

export const saveConfiguracion = updateConfiguracion

