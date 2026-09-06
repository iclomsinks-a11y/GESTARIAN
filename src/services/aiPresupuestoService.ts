import { GoogleGenAI, Type } from '@google/genai'
import { 
  TipoClienteTarifa, 
  TipoConceptoTarifa,
  PRECIO_PIEZA_PARTICULAR, 
  PRECIO_PIEZA_EMPRESA, 
  PRECIO_HORA_MANO_OBRA_DEFECTO,
  esPiezaVehiculo, 
  normalizarCantidad 
} from '../lib/presupuestoPricingRules'

export interface ConceptoPresupuestoIA {
  id: string
  descripcion: string
  tipo?: TipoConceptoTarifa
  cantidad: number
  precio: number
}

/**
 * Intelligent local automotive heuristic fallback if offline, quota exhausted or API key is absent.
 * Strict adherence to pricing rules:
 * - Piezas (aleta, paragolpes, techo, capó...): 70 € (empresa) / 80 € (particular), cantidades enteras de 1 en 1.
 * - Tipos de reparación: horas en múltiplos de 0.5 (1h, 1.5h, 2h, 2.5h...).
 */
function extractConceptsLocally(
  descripcion: string, 
  vehiculo?: string,
  tipoCliente: TipoClienteTarifa = 'particular'
): ConceptoPresupuestoIA[] {
  const text = (descripcion + ' ' + (vehiculo || '')).toLowerCase()
  const items: ConceptoPresupuestoIA[] = []
  const precioPieza = tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR

  // Check for bodywork / chapa / pintura / golpe / rayón / aleta / paragolpes / techo / capo
  if (
    text.includes('chapa') || 
    text.includes('pintura') || 
    text.includes('golpe') || 
    text.includes('paragolpe') || 
    text.includes('aleta') || 
    text.includes('techo') || 
    text.includes('capo') || 
    text.includes('capó') || 
    text.includes('puerta') || 
    text.includes('ray')
  ) {
    // Detect specific pieces mentioned
    if (text.includes('aleta')) {
      items.push({ id: 'c1', descripcion: 'Pieza de carrocería: Aleta delantera', tipo: 'pieza', cantidad: 1, precio: precioPieza })
    }
    if (text.includes('paragolpe')) {
      items.push({ id: 'c2', descripcion: 'Pieza de carrocería: Paragolpes', tipo: 'pieza', cantidad: 1, precio: precioPieza })
    }
    if (text.includes('capo') || text.includes('capó')) {
      items.push({ id: 'c3', descripcion: 'Pieza de carrocería: Capó delantero', tipo: 'pieza', cantidad: 1, precio: precioPieza })
    }
    if (text.includes('techo')) {
      items.push({ id: 'c4', descripcion: 'Pieza de carrocería: Panel de techo', tipo: 'pieza', cantidad: 1, precio: precioPieza })
    }

    // If none specifically detected but it's bodywork
    if (items.length === 0) {
      items.push({ id: 'c1', descripcion: 'Pieza de carrocería y sustitución', tipo: 'pieza', cantidad: 1, precio: precioPieza })
    }

    // Repair operations in steps of 0.5 hours
    items.push(
      { id: 'c-rep1', descripcion: 'Mano de obra: Desmontaje de piezas y desabollado de chapa', tipo: 'reparacion', cantidad: 1.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c-rep2', descripcion: 'Mano de obra: Preparación, lijado y pintura en cabina', tipo: 'reparacion', cantidad: 2.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c-rep3', descripcion: 'Mano de obra: Montaje final, calibración de holguras y pulido', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )

    return items
  }

  // Check for brakes / vibration on brake
  if (text.includes('fren') || text.includes('pastilla') || text.includes('disco') || (text.includes('vibra') && text.includes('volante'))) {
    items.push(
      { id: 'c1', descripcion: 'Mano de obra: Diagnóstico del sistema de frenos en elevador', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c2', descripcion: 'Recambio: Juego de pastillas de freno homologadas', tipo: 'pieza', cantidad: 1, precio: 65 },
      { id: 'c3', descripcion: 'Mano de obra: Sustitución de pastillas y purgado', tipo: 'reparacion', cantidad: 1.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c4', descripcion: 'Mano de obra: Verificación en banco y equilibrado', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }
  // Check for clutch / transmission
  else if (text.includes('embrague') || text.includes('marcha') || text.includes('cambio') || text.includes('pedal')) {
    items.push(
      { id: 'c1', descripcion: 'Mano de obra: Diagnóstico de transmisión y embrague', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c2', descripcion: 'Recambio: Kit de embrague completo con cojinete', tipo: 'pieza', cantidad: 1, precio: 280 },
      { id: 'c3', descripcion: 'Mano de obra: Desmontaje y montaje de caja de cambios', tipo: 'reparacion', cantidad: 3.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c4', descripcion: 'Mano de obra: Prueba dinámica y ajuste de varillaje', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }
  // Check for timing belt / distribucion
  else if (text.includes('distrib') || text.includes('correa') || text.includes('bomba de agua')) {
    items.push(
      { id: 'c1', descripcion: 'Recambio: Kit de distribución completo (correa + tensores)', tipo: 'pieza', cantidad: 1, precio: 195 },
      { id: 'c2', descripcion: 'Recambio: Bomba de agua de refrigeración reforzada', tipo: 'pieza', cantidad: 1, precio: 85 },
      { id: 'c3', descripcion: 'Mano de obra: Calado y montaje de distribución', tipo: 'reparacion', cantidad: 2.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c4', descripcion: 'Mano de obra: Purga de refrigerante y verificación térmica', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }
  // Check for oil / filters / maintenance
  else if (text.includes('aceite') || text.includes('filtro') || text.includes('mantenimiento') || text.includes('revision')) {
    items.push(
      { id: 'c1', descripcion: 'Recambio: Aceite sintético homologado 5W-30 (5L)', tipo: 'pieza', cantidad: 1, precio: 55 },
      { id: 'c2', descripcion: 'Recambio: Filtro de aceite y filtro de aire', tipo: 'pieza', cantidad: 2, precio: 22 },
      { id: 'c3', descripcion: 'Mano de obra: Sustitución de fluidos y filtros de motor', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c4', descripcion: 'Mano de obra: Revisión de 35 puntos de seguridad', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }
  // Check for battery / electrical / alternator
  else if (text.includes('bateria') || text.includes('arranc') || text.includes('alternador') || text.includes('luces') || text.includes('testigo')) {
    items.push(
      { id: 'c1', descripcion: 'Mano de obra: Diagnosis electrónica OBD y reseteo', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c2', descripcion: 'Recambio: Batería alta capacidad tecnología EFB/AGM', tipo: 'pieza', cantidad: 1, precio: 125 },
      { id: 'c3', descripcion: 'Mano de obra: Montaje y codificación de batería', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }
  // Generic automotive repair concepts
  else {
    items.push(
      { id: 'c1', descripcion: `Mano de obra: Diagnóstico de avería (${descripcion.slice(0, 35)}...)`, tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c2', descripcion: 'Mano de obra: Reparación y ajuste mecánico en elevador', tipo: 'reparacion', cantidad: 1.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c3', descripcion: 'Mano de obra: Prueba de rodaje y control final de calidad', tipo: 'reparacion', cantidad: 0.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    )
  }

  return items
}

/**
 * Generates repair quote line items using Gemini 3.8 Flash with intelligent local automotive fallback.
 * Strictly enforces workshop business rules:
 * - Piezas del vehículo (aleta, paragolpes, techo, capó, puertas...): 70 € si es empresa, 80 € si es particular.
 *   Cantidades en enteros de 1 en 1.
 * - Tipo de reparación (mano de obra / horas de reparación): saltos de 0.5 en 0.5 horas (1, 1.5, 2, 2.5...).
 */
export async function generarConceptosPresupuestoIA(
  descripcionCliente: string,
  vehiculoInfo?: string,
  tipoCliente: TipoClienteTarifa = 'particular'
): Promise<ConceptoPresupuestoIA[]> {
  const cleanDesc = descripcionCliente?.trim() || ''
  const precioOficialPieza = tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR

  if (!cleanDesc) {
    return [
      { id: 'c1', descripcion: 'Mano de obra: Revisión técnica y diagnóstico general', tipo: 'reparacion', cantidad: 1.0, precio: PRECIO_HORA_MANO_OBRA_DEFECTO },
      { id: 'c2', descripcion: 'Mano de obra: Reparación y ajuste en taller', tipo: 'reparacion', cantidad: 1.5, precio: PRECIO_HORA_MANO_OBRA_DEFECTO }
    ]
  }

  const apiKey = 
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    localStorage.getItem('GESTARIAN_GEMINI_KEY') || 
    localStorage.getItem('gestarian_gemini_api_key') || 
    ''

  if (!apiKey) {
    return extractConceptsLocally(cleanDesc, vehiculoInfo, tipoCliente)
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })

    const prompt = `Eres un perito y jefe de taller mecánico y de chapa y pintura en España (GESTARIAN DM CAR).
Un cliente ha enviado la siguiente solicitud de presupuesto para su vehículo ${vehiculoInfo ? `(${vehiculoInfo})` : ''}:
"${cleanDesc}"

TIPO DE CLIENTE: ${tipoCliente.toUpperCase()} (${tipoCliente === 'empresa' ? 'Tarifa Empresa' : 'Tarifa Particular'}).

REGLAS DE PRECIOS Y CANTIDADES ESTRICTAS Y OBLIGATORIAS:
1. Para piezas del vehículo de carrocería (aleta, paragolpes delantero/trasero, techo, capó, puertas, retrovisores, portón, etc.):
   - El precio unitario DEBE ser exactamente ${precioOficialPieza} € (porque el cliente es ${tipoCliente}).
   - La cantidad DEBE ser siempre un número entero de 1 en 1 (1, 2, 3...).
   - Asigna tipo: "pieza".

2. Para conceptos de tipo de reparación (mano de obra de reparación, chapa, pintura, desmontaje, montaje, mecánica):
   - La cantidad representa HORAS de reparación y DEBE ir obligatoriamente en tramos de 0,5 en 0,5 horas (ejemplos: 0.5, 1, 1.5, 2, 2.5, 3, etc.).
   - El precio por hora recomendado es de 45 €/hora.
   - Asigna tipo: "reparacion".

Genera entre 3 y 5 conceptos realistas y concretos respetando rigurosamente estas dos reglas.`

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              descripcion: {
                type: Type.STRING,
                description: 'Descripción del trabajo o pieza'
              },
              tipo: {
                type: Type.STRING,
                enum: ['pieza', 'reparacion'],
                description: 'Indica si es una pieza del vehículo o horas de reparación'
              },
              cantidad: {
                type: Type.NUMBER,
                description: 'Cantidad (entero para piezas, múltiplos de 0.5 para horas de reparación)'
              },
              precio: {
                type: Type.NUMBER,
                description: 'Precio unitario en euros sin IVA'
              }
            },
            required: ['descripcion', 'tipo', 'cantidad', 'precio']
          }
        }
      }
    })

    const rawJson = response.text?.trim()
    if (rawJson) {
      const parsed = JSON.parse(rawJson)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => {
          const desc = String(item.descripcion || 'Operación técnica').trim()
          const isPiece = item.tipo === 'pieza' || esPiezaVehiculo(desc)
          const resolvedType: TipoConceptoTarifa = isPiece ? 'pieza' : 'reparacion'
          
          let cantidad = Number(item.cantidad) || (resolvedType === 'pieza' ? 1 : 1.0)
          cantidad = normalizarCantidad(resolvedType, cantidad)

          let precio = Number(item.precio) || 45
          if (resolvedType === 'pieza' && esPiezaVehiculo(desc)) {
            precio = precioOficialPieza
          }

          return {
            id: `c-ai-${idx + 1}-${Date.now()}`,
            descripcion: desc,
            tipo: resolvedType,
            cantidad,
            precio
          }
        })
      }
    }
  } catch (err) {
    console.warn('[AI Presupuesto] Fallo en llamada a Gemini, recurriendo a extracción heurística:', err)
  }

  // Graceful fallback
  return extractConceptsLocally(cleanDesc, vehiculoInfo, tipoCliente)
}

