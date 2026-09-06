import { supabase } from './supabase'
import { compressImage } from './compressImage'

/**
 * Convierte un DataURL (Base64) a Blob para subirlo como binario a Storage
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Sube una imagen a Supabase Storage y devuelve su URL pública optimizada.
 * Si ya es una URL HTTPS, la retorna directamente sin re-subir.
 */
export async function uploadFotoOptimizada(
  imageSource: string | File,
  prefix = 'foto'
): Promise<string> {
  // Si ya es una URL remota de Storage, no re-subir
  if (typeof imageSource === 'string' && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
    return imageSource
  }

  try {
    let blob: Blob
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
      blob = dataUrlToBlob(imageSource)
    } else if (typeof imageSource !== 'string') {
      blob = imageSource
    } else {
      return ''
    }

    // Comprimir en cliente: máx 1280px de ancho y calidad 0.78 (reduce de 4 MB a ~120 KB)
    const compressed = await compressImage(blob as File, 1280, 0.78)
    const filePath = `expedientes/${Date.now()}_${prefix}_${Math.random().toString(36).substring(7)}.webp`

    const { error: uploadError } = await supabase.storage
      .from('gestarian-files')
      .upload(filePath, compressed, {
        contentType: 'image/webp',
        cacheControl: '31536000', // Caché de 1 año en navegador para 0 egreso en visitas repetidas
        upsert: false
      })

    if (uploadError) {
      // Fallback a bucket público
      const { error: fallbackErr } = await supabase.storage
        .from('public')
        .upload(filePath, compressed, { cacheControl: '31536000', upsert: false })

      if (fallbackErr) throw fallbackErr
      return supabase.storage.from('public').getPublicUrl(filePath).data.publicUrl
    }

    return supabase.storage.from('gestarian-files').getPublicUrl(filePath).data.publicUrl
  } catch (err) {
    console.warn('Error al subir foto a Storage, manteniendo referencia:', err)
    return typeof imageSource === 'string' ? imageSource : ''
  }
}

/**
 * Recopila las URLs de las fotos de un expediente evitando duplicados.
 */
export async function fetchExpedienteFotos(
  clienteId?: string | null,
  vehiculoId?: string | null,
  entityFotos: string[] = [],
  pipelineIds?: {
    presupuestoId?: string | null
    citaId?: string | null
    reparacionId?: string | null
    facturaId?: string | null
  }
): Promise<string[]> {
  const result = new Set<string>()

  // 1. Fotos pasadas directamente
  if (Array.isArray(entityFotos)) {
    entityFotos.forEach(f => {
      if (f && typeof f === 'string') {
        result.add(f.includes(':') && !f.startsWith('http') ? f.substring(f.indexOf(':') + 1) : f)
      }
    })
  }

  // 2. Si hay IDs específicos del pipeline, consultar solo las columnas de fotos de esos registros puntuales
  if (pipelineIds && (pipelineIds.presupuestoId || pipelineIds.citaId || pipelineIds.reparacionId || pipelineIds.facturaId)) {
    try {
      const promises = []
      if (pipelineIds.presupuestoId) promises.push(supabase.from('presupuestos').select('fotos').eq('id', pipelineIds.presupuestoId).maybeSingle())
      if (pipelineIds.citaId) promises.push(supabase.from('citas').select('fotos').eq('id', pipelineIds.citaId).maybeSingle())
      if (pipelineIds.reparacionId) promises.push(supabase.from('reparaciones').select('fotos').eq('id', pipelineIds.reparacionId).maybeSingle())
      if (pipelineIds.facturaId) promises.push(supabase.from('facturas').select('fotos').eq('id', pipelineIds.facturaId).maybeSingle())

      const responses = await Promise.all(promises)
      responses.forEach(res => {
        if (res.data?.fotos && Array.isArray(res.data.fotos)) {
          res.data.fotos.forEach((f: string) => {
            if (f && typeof f === 'string') {
              result.add(f.includes(':') && !f.startsWith('http') ? f.substring(f.indexOf(':') + 1) : f)
            }
          })
        }
      })
    } catch (e) {
      console.warn('Error recuperando fotos de paradas:', e)
    }
    return Array.from(result)
  }

  // 3. Si se solicita a nivel de vehículo
  if (vehiculoId) {
    try {
      const { data: veh } = await supabase.from('vehiculos').select('fotos').eq('id', vehiculoId).maybeSingle()
      if (veh?.fotos && Array.isArray(veh.fotos)) {
        veh.fotos.forEach((f: string) => {
          if (f && typeof f === 'string') result.add(f)
        })
      }
    } catch (e) {
      console.warn('Error recuperando fotos del vehículo:', e)
    }
  }

  return Array.from(result)
}

/**
 * Guarda una nueva foto subiéndola a Storage y asociando solo la URL final en la BD
 */
export async function saveExpedienteFoto(
  dataUrlOrFile: string | File,
  clienteId?: string | null,
  vehiculoId?: string | null,
  categoria: 'fotos' | 'documentos' = 'fotos'
): Promise<string> {
  if (!dataUrlOrFile) return ''

  // Subida a Storage optimizada y comprimida
  const finalUrl = await uploadFotoOptimizada(dataUrlOrFile, categoria)
  if (!finalUrl) return ''

  // Guardar registro en expediente_imagenes
  try {
    await supabase.from('expediente_imagenes').insert({
      cliente_id: clienteId || null,
      vehiculo_id: vehiculoId || null,
      url: finalUrl,
      categoria
    })
  } catch (e) {
    console.warn('Error registrando en expediente_imagenes:', e)
  }

  // Asociar la URL al array de fotos del vehículo
  if (vehiculoId) {
    try {
      const { data: veh } = await supabase.from('vehiculos').select('fotos').eq('id', vehiculoId).maybeSingle()
      const currentFotos: string[] = Array.isArray(veh?.fotos) ? veh.fotos : []
      if (!currentFotos.includes(finalUrl)) {
        await supabase.from('vehiculos').update({ fotos: [...currentFotos, finalUrl] }).eq('id', vehiculoId)
      }
    } catch (e) {
      console.warn('Error actualizando vehiculos.fotos:', e)
    }
  }

  return finalUrl
}

export async function getFotosVehiculo(vehiculoId: string): Promise<string[]> {
  return fetchExpedienteFotos(null, vehiculoId)
}

export const expedienteService = {
  uploadFotoOptimizada,
  saveExpedienteFoto,
  fetchExpedienteFotos,
  getFotosVehiculo
}

