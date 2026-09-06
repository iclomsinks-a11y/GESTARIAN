// src/services/authService/categoriasPermisos.ts
/**
 * Definición estructurada del árbol de categorías de taller,
 * fases operativas y permisos granulares por defecto.
 */

export interface PermisoItem {
  id: string
  label: string
  descripcion: string
  riesgoAlto?: boolean
}

export interface FasePermisos {
  id: string
  nombre: string
  icono: string
  descripcion: string
  permisos: PermisoItem[]
}

export const FASES_TALLER: FasePermisos[] = [
  {
    id: 'fase1',
    nombre: 'Fase 1: Recepción, Entrada & Clientes',
    icono: 'Users',
    descripcion: 'Atención al cliente, recepción de vehículos, solicitudes iniciales y presupuestos.',
    permisos: [
      { id: 'f1_recepcion_vehiculos', label: 'Recepción de vehículos', descripcion: 'Registrar entrada inicial del vehículo en las instalaciones' },
      { id: 'f1_fotos_entrada', label: 'Fotos de entrada (Fase 1: Recepción)', descripcion: 'Capturar fotografías del estado inicial de chapa y carrocería' },
      { id: 'f1_clientes_ver', label: 'Consultar directorio de clientes', descripcion: 'Visualizar lista y datos de contacto de clientes' },
      { id: 'f1_clientes_editar', label: 'Crear y editar clientes', descripcion: 'Dar de alta nuevos clientes y modificar direcciones/teléfonos' },
      { id: 'f1_vehiculos_ver', label: 'Consultar fichas de vehículos', descripcion: 'Visualizar vehículos registrados y ficha técnica' },
      { id: 'f1_vehiculos_editar', label: 'Crear y editar vehículos', descripcion: 'Registrar matrículas, bastidores y kilometrajes' },
      { id: 'f1_solicitudes_gestionar', label: 'Gestionar solicitudes de entrada', descripcion: 'Atender solicitudes web/telefónicas y convertirlas a presupuesto' },
      { id: 'f1_presupuestos_ver', label: 'Consultar presupuestos', descripcion: 'Ver historial de presupuestos del taller' },
      { id: 'f1_presupuestos_crear', label: 'Confeccionar nuevos presupuestos', descripcion: 'Elaborar ofertas con líneas de mano de obra y recambios al 21% IVA' },
    ]
  },
  {
    id: 'fase2',
    nombre: 'Fase 2: Planificación, Citas & Diagnosis Previa',
    icono: 'Calendar',
    descripcion: 'Organización de agenda, asignación de elevadores y diagnóstico previo.',
    permisos: [
      { id: 'f2_citas_ver', label: 'Consultar agenda y calendario', descripcion: 'Ver calendario de citas programadas del taller' },
      { id: 'f2_citas_gestionar', label: 'Crear y reprogramar citas', descripcion: 'Asignar nuevas citas a clientes y modificar horarios' },
      { id: 'f2_diagnostico_obd', label: 'Lectura de diagnosis y códigos OBD', descripcion: 'Consultar e ingresar datos de máquina de diagnosis' },
      { id: 'f2_inspeccion_previa', label: 'Checklist de inspección previa', descripcion: 'Cumplimentar revisión visual de luces, neumáticos y niveles' },
    ]
  },
  {
    id: 'fase3',
    nombre: 'Fase 3: Taller, Carrocería & Intervención (Reparaciones)',
    icono: 'Wrench',
    descripcion: 'Trabajo técnico en cabina y bancada, órdenes de trabajo, seguimiento fotográfico y finalización.',
    permisos: [
      { id: 'f3_reparaciones_ver', label: 'Consultar órdenes de trabajo', descripcion: 'Ver lista general de órdenes de reparación del taller' },
      { id: 'f3_solo_asignadas', label: 'Ver únicamente órdenes asignadas', descripcion: 'Restringir la vista a las órdenes donde figura como mecánico asignado' },
      { id: 'f3_imagenes_durante_reparacion', label: 'Acceso a imágenes durante la reparación', descripcion: 'Visualizar y consultar fotos tomadas durante la intervención' },
      { id: 'f3_fotos_progreso', label: 'Subir fotos de progreso', descripcion: 'Añadir fotos de avance (chapa, imprimación, montaje, etc.)' },
      { id: 'f3_tiempos_mano_obra', label: 'Imputar tiempos de trabajo', descripcion: 'Fichar y registrar horas dedicadas a la orden de trabajo' },
      { id: 'f3_solicitar_recambios', label: 'Solicitar recambios de almacén', descripcion: 'Pedir piezas de sustitución o pintura al almacén del taller' },
      { 
        id: 'f3_finalizar_solicitar', 
        label: 'Finalizar reparación (Solicitud a Superior)', 
        descripcion: 'Genera notificación interna a su inmediato superior para que confirme la finalización. Solo cuando la confirma el superior la reparación se da por finalizada.' 
      },
      { 
        id: 'f3_finalizar_directa', 
        label: 'Finalizar reparación directa (Encargado / Jefe)', 
        descripcion: 'Permite dar por finalizada la orden de trabajo directamente y confirmar las solicitudes de finalización enviadas por operarios.',
        riesgoAlto: true
      },
    ]
  },
  {
    id: 'fase4',
    nombre: 'Fase 4: Expedientes Fotográficos & Control de Calidad',
    icono: 'Camera',
    descripcion: 'Roadmap del expediente y sus 6 fases integradas, custodia de fotos y validación de calidad.',
    permisos: [
      { id: 'f4_expedientes_ver', label: 'Consultar expedientes fotográficos', descripcion: 'Visualizar el expediente y sus fases integradas' },
      { id: 'f4_expedientes_subir_fotos', label: 'Añadir o sustituir fotos de fases', descripcion: 'Subir fotos adicionales a cualquier fase del expediente' },
      { id: 'f4_control_calidad', label: 'Validar control de calidad', descripcion: 'Dar el visto bueno de prueba dinámica y lavado' },
      { id: 'f4_expedientes_informe_pdf', label: 'Generar dossier fotográfico en PDF', descripcion: 'Exportar informe pericial o dossier fotográfico completo' },
    ]
  },
  {
    id: 'fase5',
    nombre: 'Fase 5: Entrega, Facturación & Administración Fiscal',
    icono: 'Receipt',
    descripcion: 'Liquidación, cobro, facturación oficial Veri*Factu y supervisión económica.',
    permisos: [
      { id: 'f5_facturas_ver', label: 'Consultar facturas emitidas', descripcion: 'Ver listado de facturas de clientes' },
      { id: 'f5_facturas_emitir', label: 'Emitir facturas oficiales Veri*Factu', descripcion: 'Generar factura definitiva y enviar registro a la Agencia Tributaria', riesgoAlto: true },
      { id: 'f5_cobros_registrar', label: 'Registrar cobros y formas de pago', descripcion: 'Marcar factura como cobrada en efectivo, TPV o transferencia' },
      { id: 'f5_facturas_recibidas_ver', label: 'Consultar facturas de compras', descripcion: 'Ver facturas de proveedores y recambistas' },
      { id: 'f5_balances_ver', label: 'Consultar balances y fiscal', descripcion: 'Ver informes de beneficios, ingresos, gastos e IVA trimestral', riesgoAlto: true },
      { id: 'f5_configuracion_ver', label: 'Configuración general del taller', descripcion: 'Acceso a ajustes del taller y parámetros de la empresa', riesgoAlto: true },
    ]
  }
]

export interface CategoriaPuesto {
  id: string
  sector: string
  area: string
  subarea: string
  cargo: string
  esEncargado: boolean
  descripcion: string
  permisosDefault: Record<string, boolean>
}

export const CATEGORIAS_PUESTOS: CategoriaPuesto[] = [
  // 1. CARROCERÍA / CHAPA Y PINTURA
  {
    id: 'cat_chapista',
    sector: 'Sector Automoción',
    area: 'Carrocería',
    subarea: 'Chapa y Pintura',
    cargo: 'Chapista',
    esEncargado: false,
    descripcion: 'Operario especializado en reparación de chapa, bancada y desabollado.',
    permisosDefault: {
      f1_recepcion_vehiculos: false,
      f1_fotos_entrada: true,
      f1_clientes_ver: false,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: false,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: false,
      f1_presupuestos_crear: false,
      f2_citas_ver: false,
      f2_citas_gestionar: false,
      f2_diagnostico_obd: false,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: true,
      f3_imagenes_durante_reparacion: true, // Acceso imágenes durante la reparación
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true, // Finalizar reparación (con notificación a superior)
      f3_finalizar_directa: false,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: false,
      f4_expedientes_informe_pdf: false,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },
  {
    id: 'cat_jefe_chapa',
    sector: 'Sector Automoción',
    area: 'Carrocería',
    subarea: 'Chapa y Pintura',
    cargo: 'Jefe de Sección Chapa (Encargado)',
    esEncargado: true,
    descripcion: 'Encargado de sección de chapa: supervisa reparaciones, aprueba finalizaciones y gestiona imágenes.',
    permisosDefault: {
      f1_recepcion_vehiculos: true,
      f1_fotos_entrada: true,
      f1_clientes_ver: true,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: true,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: true,
      f1_presupuestos_crear: true,
      f2_citas_ver: true,
      f2_citas_gestionar: true,
      f2_diagnostico_obd: false,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: false,
      f3_imagenes_durante_reparacion: true, // Acceso a imágenes
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: true, // Finalizar reparación directa / confirmar solicitudes de chapistas
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: true,
      f4_expedientes_informe_pdf: true,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },
  {
    id: 'cat_pintor',
    sector: 'Sector Automoción',
    area: 'Carrocería',
    subarea: 'Chapa y Pintura',
    cargo: 'Pintor / Preparador',
    esEncargado: false,
    descripcion: 'Operario de preparación, lijado, enmascarado y aplicación de pintura/barniz.',
    permisosDefault: {
      f1_recepcion_vehiculos: false,
      f1_fotos_entrada: true,
      f1_clientes_ver: false,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: false,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: false,
      f1_presupuestos_crear: false,
      f2_citas_ver: false,
      f2_citas_gestionar: false,
      f2_diagnostico_obd: false,
      f2_inspeccion_previa: false,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: true,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: false,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: false,
      f4_expedientes_informe_pdf: false,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },
  {
    id: 'cat_jefe_pintura',
    sector: 'Sector Automoción',
    area: 'Carrocería',
    subarea: 'Chapa y Pintura',
    cargo: 'Jefe de Sección Pintura (Encargado)',
    esEncargado: true,
    descripcion: 'Encargado de cabina de pintura y colorimetría, autoriza el secado y entrega a montaje.',
    permisosDefault: {
      f1_recepcion_vehiculos: true,
      f1_fotos_entrada: true,
      f1_clientes_ver: true,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: false,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: true,
      f1_presupuestos_crear: true,
      f2_citas_ver: true,
      f2_citas_gestionar: true,
      f2_diagnostico_obd: false,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: false,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: true,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: true,
      f4_expedientes_informe_pdf: true,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },

  // 2. MECÁNICA Y MANTENIMIENTO
  {
    id: 'cat_mecanico_oficial',
    sector: 'Sector Automoción',
    area: 'Mecánica General',
    subarea: 'Mantenimiento & Motores',
    cargo: 'Mecánico / Oficial de Taller',
    esEncargado: false,
    descripcion: 'Mecánico de mantenimiento preventivo, correas, frenos, suspensiones y embragues.',
    permisosDefault: {
      f1_recepcion_vehiculos: false,
      f1_fotos_entrada: false,
      f1_clientes_ver: false,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: false,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: false,
      f1_presupuestos_crear: false,
      f2_citas_ver: true,
      f2_citas_gestionar: false,
      f2_diagnostico_obd: true,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: true,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true, // Solicita confirmación a superior
      f3_finalizar_directa: false,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: false,
      f4_expedientes_informe_pdf: false,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },
  {
    id: 'cat_jefe_mecanica',
    sector: 'Sector Automoción',
    area: 'Mecánica General',
    subarea: 'Mantenimiento & Motores',
    cargo: 'Jefe de Sección Mecánica (Encargado)',
    esEncargado: true,
    descripcion: 'Encargado de área mecánica: asigna elevadores, presupuesta piezas y finaliza reparaciones.',
    permisosDefault: {
      f1_recepcion_vehiculos: true,
      f1_fotos_entrada: true,
      f1_clientes_ver: true,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: true,
      f1_solicitudes_gestionar: true,
      f1_presupuestos_ver: true,
      f1_presupuestos_crear: true,
      f2_citas_ver: true,
      f2_citas_gestionar: true,
      f2_diagnostico_obd: true,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: false,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: true, // Finalización directa y confirmación
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: true,
      f4_expedientes_informe_pdf: true,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },

  // 3. ELECTRICIDAD & DIAGNOSIS
  {
    id: 'cat_electromecanico',
    sector: 'Sector Automoción',
    area: 'Electricidad y Electrónica',
    subarea: 'Diagnosis & Redes CAN',
    cargo: 'Técnico en Diagnosis / Electricista',
    esEncargado: false,
    descripcion: 'Especialista en centralitas, sensores, cableados e inyección electrónica.',
    permisosDefault: {
      f1_recepcion_vehiculos: false,
      f1_fotos_entrada: false,
      f1_clientes_ver: false,
      f1_clientes_editar: false,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: false,
      f1_solicitudes_gestionar: false,
      f1_presupuestos_ver: false,
      f1_presupuestos_crear: false,
      f2_citas_ver: true,
      f2_citas_gestionar: false,
      f2_diagnostico_obd: true,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: true,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: false,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: false,
      f4_expedientes_informe_pdf: false,
      f5_facturas_ver: false,
      f5_facturas_emitir: false,
      f5_cobros_registrar: false,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },

  // 4. RECEPCIÓN & ATENCIÓN AL CLIENTE
  {
    id: 'cat_recepcion',
    sector: 'Sector Automoción',
    area: 'Recepción y Atención',
    subarea: 'Asesoría de Servicio',
    cargo: 'Asesor de Servicio / Recepción',
    esEncargado: false,
    descripcion: 'Atiende clientes, programa citas en calendario, fotografía entradas y confecciona presupuestos.',
    permisosDefault: {
      f1_recepcion_vehiculos: true,
      f1_fotos_entrada: true,
      f1_clientes_ver: true,
      f1_clientes_editar: true,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: true,
      f1_solicitudes_gestionar: true,
      f1_presupuestos_ver: true,
      f1_presupuestos_crear: true,
      f2_citas_ver: true,
      f2_citas_gestionar: true,
      f2_diagnostico_obd: false,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: false,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: false,
      f3_tiempos_mano_obra: false,
      f3_solicitar_recambios: false,
      f3_finalizar_solicitar: false,
      f3_finalizar_directa: false,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: true,
      f4_expedientes_informe_pdf: true,
      f5_facturas_ver: true,
      f5_facturas_emitir: false,
      f5_cobros_registrar: true,
      f5_facturas_recibidas_ver: false,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  },

  // 5. JEFE DE TALLER / GERENTE DE PRODUCCIÓN
  {
    id: 'cat_jefe_taller_general',
    sector: 'Sector Automoción',
    area: 'Dirección Técnica',
    subarea: 'Jefatura de Taller',
    cargo: 'Jefe de Taller / Encargado General',
    esEncargado: true,
    descripcion: 'Máxima autoridad técnica en taller: valida reparaciones de todas las áreas y supervisa expedientes.',
    permisosDefault: {
      f1_recepcion_vehiculos: true,
      f1_fotos_entrada: true,
      f1_clientes_ver: true,
      f1_clientes_editar: true,
      f1_vehiculos_ver: true,
      f1_vehiculos_editar: true,
      f1_solicitudes_gestionar: true,
      f1_presupuestos_ver: true,
      f1_presupuestos_crear: true,
      f2_citas_ver: true,
      f2_citas_gestionar: true,
      f2_diagnostico_obd: true,
      f2_inspeccion_previa: true,
      f3_reparaciones_ver: true,
      f3_solo_asignadas: false,
      f3_imagenes_durante_reparacion: true,
      f3_fotos_progreso: true,
      f3_tiempos_mano_obra: true,
      f3_solicitar_recambios: true,
      f3_finalizar_solicitar: true,
      f3_finalizar_directa: true,
      f4_expedientes_ver: true,
      f4_expedientes_subir_fotos: true,
      f4_control_calidad: true,
      f4_expedientes_informe_pdf: true,
      f5_facturas_ver: true,
      f5_facturas_emitir: true,
      f5_cobros_registrar: true,
      f5_facturas_recibidas_ver: true,
      f5_balances_ver: false,
      f5_configuracion_ver: false
    }
  }
]

/**
 * Convierte los permisos granulares a los booleanos clásicos para compatibilidad con AuthGuard y Sidebar
 */
export function mapearPermisosGranularesABase(granulares: Record<string, boolean>) {
  return {
    reparaciones: !!(granulares.f3_reparaciones_ver || granulares.f3_imagenes_durante_reparacion || granulares.f3_finalizar_solicitar || granulares.f3_finalizar_directa),
    expedientes: !!(granulares.f4_expedientes_ver || granulares.f3_imagenes_durante_reparacion || granulares.f1_fotos_entrada),
    citas: !!(granulares.f2_citas_ver || granulares.f2_citas_gestionar),
    vehiculos: !!(granulares.f1_vehiculos_ver || granulares.f1_vehiculos_editar),
    clientes: !!(granulares.f1_clientes_ver || granulares.f1_clientes_editar),
    presupuestosCrear: !!(granulares.f1_presupuestos_crear || granulares.f1_presupuestos_ver),
    facturasVer: !!granulares.f5_facturas_ver,
    balancesVer: !!granulares.f5_balances_ver,
    configuracionVer: !!granulares.f5_configuracion_ver,
  }
}
