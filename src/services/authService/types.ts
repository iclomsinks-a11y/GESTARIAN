export type RoleType = 'DESARROLLADOR' | 'USUARIO' | 'AUTORIZADO' | 'CLIENTE';

export type TipoLicencia = 'GRATUITA_PRUEBA' | 'PAGO_PRO' | 'PROMOCION_VIP';

export type EstadoUsuario = 'pendiente' | 'activo' | 'bloqueado' | 'rechazado';

export interface PermisosEmpleado {
  reparaciones: boolean;
  expedientes: boolean;
  citas: boolean;
  vehiculos: boolean;
  clientes: boolean;
  presupuestosCrear: boolean;
  facturasVer: boolean;
  balancesVer: boolean;
  configuracionVer: boolean;
  granulares?: Record<string, boolean>;
}

export interface EmpleadoAutorizado {
  id: string;
  tallerId: string;
  nombre: string;
  email: string;
  cargo: string;
  pinAcceso: string;
  activo: boolean;
  permisos: PermisosEmpleado;
  categoriaId?: string;
  categoriaPuesto?: string;
  sector?: string;
  area?: string;
  subarea?: string;
  esEncargado?: boolean;
  superiorId?: string;
  superiorNombre?: string;
  permisosGranulares?: Record<string, boolean>;
  creado_el: string;
}

export interface LicenciaInfo {
  tipo: TipoLicencia;
  estado: 'activo' | 'prueba' | 'vencido';
  fechaInicio: string;
  fechaFin: string | null;
  precioMensual: number;
  modulosHabilitados: string[];
}

export interface SolicitudTallerUsuario {
  id: string;
  email: string;
  nombreTitular: string;
  nombreTaller: string;
  cif: string;
  telefono: string;
  direccion: string;
  estado: EstadoUsuario;
  planSolicitado: TipoLicencia;
  licencia?: LicenciaInfo;
  fechaSolicitud: string;
  notasAprobacion?: string;
}

export interface ClientePortalSession {
  clienteId: string;
  nombre: string;
  matricula: string;
  email?: string;
  telefono?: string;
}

export interface PerfilAuth {
  id: string;
  email: string;
  nombre: string;
  rol: RoleType;
  esDeveloper: boolean;
  tallerNombre?: string;
  tallerId?: string;
  cargo?: string;
  categoriaPuesto?: string;
  esEncargado?: boolean;
  permisos: string[];
  permisosEmpleado?: PermisosEmpleado;
  permisosGranulares?: Record<string, boolean>;
  licencia?: LicenciaInfo;
  clienteInfo?: ClientePortalSession;
}
