import { SectorType } from '../config/sectores'
import { 
  PRECIO_PIEZA_PARTICULAR, 
  PRECIO_PIEZA_EMPRESA,
  PRECIO_PINTAR_ENTERO_PARTICULAR,
  PRECIO_PINTAR_ENTERO_EMPRESA,
  TipoClienteTarifa 
} from '../lib/presupuestoPricingRules'

export interface TarifaItem {
  id: string
  sector: SectorType
  categoria: string
  nombre: string
  descripcion: string
  unidad: 'pieza' | 'hora' | 'unidad' | 'tratamiento' | 'm2' | 'sesion'
  precioParticular: number
  precioEmpresa: number
  pasoCantidad: number // 1 para enteros, 0.5 para horas, etc.
  esPieza?: boolean
  esPintarPiezasMultiples?: boolean
  esPintarEntero?: boolean
  destacado?: boolean
  activo: boolean
}

export interface SectorTarifaInfo {
  id: SectorType
  nombre: string
  subtitulo: string
  icono: string
  descripcion: string
  ejemplosClave: string[]
}

export const SECTORES_INFO: SectorTarifaInfo[] = [
  {
    id: 'automocion',
    nombre: 'Automoción y Talleres',
    subtitulo: 'Chapa, Pintura y Mecánica',
    icono: 'Car',
    descripcion: 'Tarifas especializadas para taller de carrocería, cabina de pintura y mecánica general.',
    ejemplosClave: [
      'Pintar pieza individual (aleta, paragolpes...) a 80 € (part.) / 70 € (emp.)',
      'Pintar número de piezas (2, 3, 4 piezas con multiplicador automático)',
      'Pintar coche entero (turismo, berlina, SUV)',
      'Mano de obra en tramos de 0,5 horas (45 €/h)'
    ]
  },
  {
    id: 'salud',
    nombre: 'Salud y Bucodental',
    subtitulo: 'Clínica Odontológica y Estética',
    icono: 'HeartPulse',
    descripcion: 'Tarifario de odontología general, empastes, endodoncias, prótesis e higiene bucodental.',
    ejemplosClave: [
      'Empaste simple (obturación 1 cara) - 50 €',
      'Empaste compuesto (2 o más caras) - 65 €',
      'Endodoncias unirradicular / multirradicular',
      'Higiene bucal por ultrasonidos e implantes'
    ]
  },
  {
    id: 'construccion',
    nombre: 'Construcción y Reformas',
    subtitulo: 'Obras, Pintura y Albañilería',
    icono: 'Building2',
    descripcion: 'Tarifas por m² y hora de oficiales para reformas integrales y mantenimiento de edificios.',
    ejemplosClave: [
      'Pintura plástica lisa por m²',
      'Solado y alicatado cerámico por m²',
      'Hora oficial de albañilería, fontanería o electricidad'
    ]
  },
  {
    id: 'comercio',
    nombre: 'Comercio y Servicios',
    subtitulo: 'Servicios Profesionales y Comercios',
    icono: 'Store',
    descripcion: 'Tarifas de mantenimiento comercial, instalación técnica y soporte periódico.',
    ejemplosClave: [
      'Mantenimiento periódico preventivo',
      'Hora de soporte técnico especializado',
      'Auditoría y puesta a punto de instalaciones'
    ]
  }
]

const CATALOGO_TARIFAS_BASE: TarifaItem[] = [
  // ==========================================
  // SECTOR AUTOMOCIÓN - TALLER CHAPA Y PINTURA
  // ==========================================
  {
    id: 'aut-pz-num',
    sector: 'automocion',
    categoria: 'Pintura y Carrocería',
    nombre: 'Pintar número de piezas (Selección de 1 a N piezas)',
    descripcion: 'Permite seleccionar directamente un número de piezas (ej: 2, 3, 4 piezas) aplicando tarifa oficial de 80 € (particular) o 70 € (empresa) por pieza en números enteros.',
    unidad: 'pieza',
    precioParticular: PRECIO_PIEZA_PARTICULAR,
    precioEmpresa: PRECIO_PIEZA_EMPRESA,
    pasoCantidad: 1,
    esPieza: true,
    esPintarPiezasMultiples: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-entero',
    sector: 'automocion',
    categoria: 'Pintura y Carrocería',
    nombre: 'Pintar coche entero (Carrocería completa)',
    descripcion: 'Pintado integral del vehículo en cabina presurizada con desengrasado, fondo aparejo, pintura bicapa al agua y dos manos de barniz ultra brillo.',
    unidad: 'unidad',
    precioParticular: PRECIO_PINTAR_ENTERO_PARTICULAR,
    precioEmpresa: PRECIO_PINTAR_ENTERO_EMPRESA,
    pasoCantidad: 1,
    esPintarEntero: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-aleta',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Aleta (delantera o trasera)',
    descripcion: 'Preparación, lijado fino, aparejo y pintado en cabina de aleta de vehículo. Cantidad en números enteros.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-paragolpes',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Paragolpes / Parachoques (delantero o trasero)',
    descripcion: 'Desmontaje parcial/mascarillado, imprimación de plásticos, pintura flexibilizada y barnizado resistente a impactos.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-capo',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Capó delantero',
    descripcion: 'Preparación superficial de plano horizontal, eliminación de picadas de grava y aplicación de pintura uniforme.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-techo',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Techo del vehículo',
    descripcion: 'Tratamiento de plano superior, enmascarado de lunetas y aplicación de recubrimiento en cabina.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-puerta',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Puerta (lateral delantera / trasera)',
    descripcion: 'Pintado exterior de chapa de puerta con igualación de tono y difuminado adyacente si procede.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-pz-porton',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Portón de maletero',
    descripcion: 'Pintado completo de chapa exterior de portón trasero o maletero.',
    unidad: 'pieza',
    precioParticular: 80,
    precioEmpresa: 70,
    pasoCantidad: 1,
    esPieza: true,
    activo: true
  },
  {
    id: 'aut-pz-retrovisor',
    sector: 'automocion',
    categoria: 'Piezas Específicas',
    nombre: 'Pintar Carcasa de Retrovisor',
    descripcion: 'Pintado de carcasa plástica desmontada.',
    unidad: 'pieza',
    precioParticular: 45,
    precioEmpresa: 40,
    pasoCantidad: 1,
    esPieza: true,
    activo: true
  },
  {
    id: 'aut-mo-chapa',
    sector: 'automocion',
    categoria: 'Mano de Obra y Taller',
    nombre: 'Mano de obra chapa y conformado (horas)',
    descripcion: 'Conformado de chapa, desabollado con multifunción spotter y ajuste de líneas de carrocería. Tarificación en tramos de 0,5 en 0,5 horas.',
    unidad: 'hora',
    precioParticular: 45,
    precioEmpresa: 40,
    pasoCantidad: 0.5,
    destacado: true,
    activo: true
  },
  {
    id: 'aut-mo-pintura',
    sector: 'automocion',
    categoria: 'Mano de Obra y Taller',
    nombre: 'Mano de obra preparación y cabina de pintura (horas)',
    descripcion: 'Horas de preparador y pintor en cabina: lijados, aparejos, desengrasado y aplicación técnica de color y laca.',
    unidad: 'hora',
    precioParticular: 45,
    precioEmpresa: 40,
    pasoCantidad: 0.5,
    activo: true
  },
  {
    id: 'aut-mo-mecanica',
    sector: 'automocion',
    categoria: 'Mano de Obra y Taller',
    nombre: 'Mano de obra mecánica general (horas)',
    descripcion: 'Sustitución de componentes mecánicos, suspensión, frenos y mantenimiento periódico.',
    unidad: 'hora',
    precioParticular: 45,
    precioEmpresa: 42,
    pasoCantidad: 0.5,
    activo: true
  },
  {
    id: 'aut-ser-diag',
    sector: 'automocion',
    categoria: 'Servicios Rápidos',
    nombre: 'Diagnosis electrónica y borrado de averías OBD',
    descripcion: 'Conexión de máquina de diagnóstico multimarca, lectura de códigos de error DTC y prueba de actuadores.',
    unidad: 'unidad',
    precioParticular: 35,
    precioEmpresa: 30,
    pasoCantidad: 1,
    activo: true
  },

  // ==========================================
  // SECTOR SALUD - SALUD BUCODENTAL (DENTAL)
  // ==========================================
  {
    id: 'sal-emp-simple',
    sector: 'salud',
    categoria: 'Odontología Conservadora',
    nombre: 'Empaste simple (Obturación 1 cara)',
    descripcion: 'Eliminación de tejido cariado en una sola superficie dental, grabado ácido, adhesivo y restauración estética con composite nanohíbrido.',
    unidad: 'tratamiento',
    precioParticular: 50,
    precioEmpresa: 45,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'sal-emp-compuesto',
    sector: 'salud',
    categoria: 'Odontología Conservadora',
    nombre: 'Empaste compuesto (Obturación 2 o más caras)',
    descripcion: 'Restauración compleja de dos o más caras del diente (mesial, oclusal, distal) con colocación de matriz, cuña y modelado anatómico con composite.',
    unidad: 'tratamiento',
    precioParticular: 65,
    precioEmpresa: 60,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'sal-rec-estetica',
    sector: 'salud',
    categoria: 'Odontología Conservadora',
    nombre: 'Reconstrucción dental estética con perno de fibra',
    descripcion: 'Reconstrucción de gran pérdida de estructura dental con refuerzo de poste o perno radicular y estratificación estética.',
    unidad: 'tratamiento',
    precioParticular: 85,
    precioEmpresa: 75,
    pasoCantidad: 1,
    activo: true
  },
  {
    id: 'sal-endo-uni',
    sector: 'salud',
    categoria: 'Endodoncia',
    nombre: 'Endodoncia unirradicular (1 conducto)',
    descripcion: 'Instrumentación rotatoria y obturación tridimensional del conducto pulpar en dientes anteriores o premolares de una raíz.',
    unidad: 'tratamiento',
    precioParticular: 130,
    precioEmpresa: 120,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'sal-endo-multi',
    sector: 'salud',
    categoria: 'Endodoncia',
    nombre: 'Endodoncia multirradicular (Molares - 3 o más conductos)',
    descripcion: 'Tratamiento de conductos complejo en molares con instrumentación mecanizada, desinfección ultrasónica y gutapercha termoplástica.',
    unidad: 'tratamiento',
    precioParticular: 210,
    precioEmpresa: 195,
    pasoCantidad: 1,
    activo: true
  },
  {
    id: 'sal-hig-bucal',
    sector: 'salud',
    categoria: 'Periodoncia e Higiene',
    nombre: 'Higiene bucodental completa por ultrasonidos + pulido',
    descripcion: 'Tartrectomía supragingival para eliminación de placa bacteriana y sarro, aeropulidor de bicarbonato y aplicación de flúor remineralizante.',
    unidad: 'sesion',
    precioParticular: 40,
    precioEmpresa: 35,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'sal-cur-cuadrante',
    sector: 'salud',
    categoria: 'Periodoncia e Higiene',
    nombre: 'Curetaje / Raspado y alisado radicular (por cuadrante)',
    descripcion: 'Tratamiento periodontal subgingival con curetas Gracey bajo anestesia local para eliminación de sarro subgingival y descontaminación radicular.',
    unidad: 'tratamiento',
    precioParticular: 60,
    precioEmpresa: 55,
    pasoCantidad: 1,
    activo: true
  },
  {
    id: 'sal-imp-titanio',
    sector: 'salud',
    categoria: 'Implantología y Prótesis',
    nombre: 'Implante dental de titanio osteointegrado',
    descripcion: 'Fase quirúrgica de colocación de fijación de titanio de grado médico biocompatible bajo técnica estéril y control radiológico.',
    unidad: 'unidad',
    precioParticular: 550,
    precioEmpresa: 500,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'sal-cor-zirconio',
    sector: 'salud',
    categoria: 'Implantología y Prótesis',
    nombre: 'Corona de zirconio monolítico sobre diente o implante',
    descripcion: 'Prótesis fija de alta resistencia y estética fabricada mediante diseño CAD/CAM y cementado adhesivo de precisión.',
    unidad: 'unidad',
    precioParticular: 280,
    precioEmpresa: 260,
    pasoCantidad: 1,
    activo: true
  },
  {
    id: 'sal-fer-descarga',
    sector: 'salud',
    categoria: 'Ortodoncia y ATM',
    nombre: 'Férula de descarga tipo Michigan (Tratamiento Bruxismo)',
    descripcion: 'Dispositivo intraoral rígido de resina transparente ajustado en articulador para relajación neuromuscular y protección dental.',
    unidad: 'unidad',
    precioParticular: 180,
    precioEmpresa: 165,
    pasoCantidad: 1,
    activo: true
  },

  // ==========================================
  // SECTOR CONSTRUCCIÓN Y REFORMAS
  // ==========================================
  {
    id: 'con-pintura-m2',
    sector: 'construccion',
    categoria: 'Pintura y Acabados',
    nombre: 'Pintura plástica lisa en paredes y techos (por m²)',
    descripcion: 'Saneado, emplastecido puntual, lijado mecánico y aplicación de 2 manos de pintura plástica mate lavable de alta cubrición.',
    unidad: 'm2',
    precioParticular: 9.50,
    precioEmpresa: 8.50,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'con-solado-m2',
    sector: 'construccion',
    categoria: 'Albañilería y Solados',
    nombre: 'Solado o alicatado con gres porcelánico (por m²)',
    descripcion: 'Colocación de pavimento o revestimiento cerámico con cemento cola flexible C2TE y lechada anti-humedad.',
    unidad: 'm2',
    precioParticular: 28,
    precioEmpresa: 24,
    pasoCantidad: 1,
    activo: true
  },
  {
    id: 'con-mo-albanil',
    sector: 'construccion',
    categoria: 'Mano de Obra',
    nombre: 'Hora oficial 1ª albañilería / reformas',
    descripcion: 'Trabajos de tabiquería, demoliciones, rozas, yesos y remates de obra.',
    unidad: 'hora',
    precioParticular: 35,
    precioEmpresa: 30,
    pasoCantidad: 1,
    activo: true
  },

  // ==========================================
  // SECTOR COMERCIO Y SERVICIOS
  // ==========================================
  {
    id: 'com-mant-mensual',
    sector: 'comercio',
    categoria: 'Mantenimiento Periódico',
    nombre: 'Mantenimiento preventivo mensual para local o comercio',
    descripcion: 'Revisión técnica periódica de iluminación, climatización, cierres de seguridad y fontanería.',
    unidad: 'unidad',
    precioParticular: 150,
    precioEmpresa: 120,
    pasoCantidad: 1,
    destacado: true,
    activo: true
  },
  {
    id: 'com-hora-tecnico',
    sector: 'comercio',
    categoria: 'Soporte y Asistencia',
    nombre: 'Hora asistencia técnica in-situ',
    descripcion: 'Desplazamiento y mano de obra de técnico especialista en instalación o resolución de averías.',
    unidad: 'hora',
    precioParticular: 50,
    precioEmpresa: 45,
    pasoCantidad: 0.5,
    activo: true
  }
]

const STORAGE_KEY = 'gestarian_tarifas_catalogo_v1'

export const tarifasService = {
  /**
   * Obtiene todos los conceptos del catálogo de tarifas, combinando base y persistencia local
   */
  getTarifas(sector?: SectorType): TarifaItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let items: TarifaItem[] = []
      if (stored) {
        items = JSON.parse(stored)
      } else {
        items = CATALOGO_TARIFAS_BASE
        this.saveTarifas(items)
      }

      if (sector) {
        return items.filter(it => it.sector === sector && it.activo)
      }
      return items.filter(it => it.activo)
    } catch {
      return CATALOGO_TARIFAS_BASE
    }
  },

  /**
   * Guarda el listado de tarifas en persistencia local
   */
  saveTarifas(items: TarifaItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('gestarian-tarifas-updated'))
    } catch (e) {
      console.warn('Error al guardar tarifas en localStorage:', e)
    }
  },

  /**
   * Restablece el catálogo a los valores predeterminados oficiales
   */
  restablecerValoresPorDefecto(): TarifaItem[] {
    try {
      localStorage.removeItem(STORAGE_KEY)
      this.saveTarifas(CATALOGO_TARIFAS_BASE)
      return CATALOGO_TARIFAS_BASE
    } catch {
      return CATALOGO_TARIFAS_BASE
    }
  },

  /**
   * Actualiza un ítem específico de la tarifa
   */
  actualizarTarifaItem(id: string, updates: Partial<TarifaItem>): boolean {
    const todos = this.getTarifas()
    const index = todos.findIndex(t => t.id === id)
    if (index >= 0) {
      todos[index] = { ...todos[index], ...updates }
      this.saveTarifas(todos)
      return true
    }
    return false
  },

  /**
   * Añade un nuevo ítem personalizado a la tarifa
   */
  crearTarifaItem(item: Omit<TarifaItem, 'id'>): TarifaItem {
    const nuevo: TarifaItem = {
      ...item,
      id: `tar-custom-${Date.now()}`
    }
    const todos = this.getTarifas()
    todos.push(nuevo)
    this.saveTarifas(todos)
    return nuevo
  },

  /**
   * Calcula el precio de pintar un número de piezas (ej. 2 piezas, 3 piezas, 4 piezas)
   * respetando la regla oficial:
   * - Particular: 80 € / pieza
   * - Empresa: 70 € / pieza
   * - Cantidad en números enteros (1, 2, 3, 4...)
   */
  calcularPintarPiezas(numPiezas: number, tipoCliente: TipoClienteTarifa = 'particular') {
    const cantidad = Math.max(1, Math.round(numPiezas))
    const precioUnitario = tipoCliente === 'empresa' ? PRECIO_PIEZA_EMPRESA : PRECIO_PIEZA_PARTICULAR
    const subtotal = cantidad * precioUnitario
    const iva = Number((subtotal * 0.21).toFixed(2))
    const total = Number((subtotal + iva).toFixed(2))

    return {
      numPiezas: cantidad,
      precioUnitario,
      subtotal,
      iva,
      total,
      tipoCliente,
      descripcion: `Pintar ${cantidad} pieza${cantidad > 1 ? 's' : ''} de carrocería en cabina con barniz alto brillo`
    }
  },

  /**
   * Calcula el precio de pintar un vehículo entero
   */
  calcularPintarEntero(
    tamano: 'compacto' | 'berlina' | 'suv' | 'furgoneta' = 'berlina',
    tipoCliente: TipoClienteTarifa = 'particular'
  ) {
    let base = tipoCliente === 'empresa' ? PRECIO_PINTAR_ENTERO_EMPRESA : PRECIO_PINTAR_ENTERO_PARTICULAR

    if (tamano === 'compacto') {
      base = tipoCliente === 'empresa' ? 850 : 950
    } else if (tamano === 'suv') {
      base = tipoCliente === 'empresa' ? 1100 : 1250
    } else if (tamano === 'furgoneta') {
      base = tipoCliente === 'empresa' ? 1200 : 1350
    }

    const subtotal = base
    const iva = Number((subtotal * 0.21).toFixed(2))
    const total = Number((subtotal + iva).toFixed(2))

    return {
      tamano,
      subtotal,
      iva,
      total,
      tipoCliente,
      descripcion: `Pintar vehículo entero completo (${tamano}) en cabina presurizada con barniz bicapa`
    }
  }
}
