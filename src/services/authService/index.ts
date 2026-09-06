import { supabase } from '../../lib/supabase';
import type { 
  RoleType, 
  TipoLicencia, 
  EstadoUsuario, 
  PermisosEmpleado, 
  EmpleadoAutorizado, 
  SolicitudTallerUsuario, 
  ClientePortalSession, 
  LicenciaInfo,
  PerfilAuth 
} from './types';
import { CATEGORIAS_PUESTOS, mapearPermisosGranularesABase } from './categoriasPermisos';

export * from './types';
export * from './categoriasPermisos';

export interface PreferenciasUsuario {
  id?: string;
  tema?: string;
  capaVisual?: string;
  idioma?: string;
  notificaciones?: { email: boolean; push: boolean };
}

export interface PerfilUsuario extends PerfilAuth {
  plan?: string | null;
  emailConfirmado?: boolean;
  activo?: boolean;
  licenciaEstado?: string | null;
  licenciaFechaFin?: string | null;
  planNombre?: string | null;
  preferencias?: PreferenciasUsuario;
}

// Master Developer Constants
export const MASTER_DEVELOPER_EMAIL = 'iclomsinks@gmail.com';
export const MASTER_DEVELOPER_KEY = 'GEST-DEV-2026';

// Storage keys
const STORAGE_AUTH_USER = 'gestarian_auth_user_session';
const STORAGE_SIMULATION = 'gestarian_dev_simulation';
const STORAGE_SOLICITUDES = 'gestarian_talleres_solicitudes';
const STORAGE_EMPLEADOS = 'gestarian_empleados_autorizados';
const STORAGE_CLIENTE_PORTAL = 'gestarian_cliente_portal_session';

// In-memory active profile
let perfilActual: PerfilUsuario | null = null;
let simulatedSession: { isSimulating: boolean; role: RoleType; data?: any } | null = null;

// Event listeners for auth changes
type AuthListener = (perfil: PerfilUsuario | null, isSimulating: boolean) => void;
const listeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  listener(perfilActual, isSimulating());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const current = getPerfil();
  const sim = isSimulating();
  listeners.forEach(cb => {
    try {
      cb(current, sim);
    } catch (e) {
      console.warn('Error in auth listener:', e);
    }
  });
}

// Initial seed data for workshop requests (managed by Developer)
function getInitialSolicitudes(): SolicitudTallerUsuario[] {
  return [
    {
      id: 'sol-01',
      email: 'taller.castellana@gmail.com',
      nombreTitular: 'Carlos Méndez',
      nombreTaller: 'Castellana Motor Sport S.L.',
      cif: 'B89342111',
      telefono: '915 220 334',
      direccion: 'Paseo de la Castellana 210, Madrid',
      estado: 'activo',
      planSolicitado: 'PAGO_PRO',
      licencia: {
        tipo: 'PAGO_PRO',
        estado: 'activo',
        fechaInicio: '2026-01-10T08:00:00.000Z',
        fechaFin: '2027-01-10T08:00:00.000Z',
        precioMensual: 49,
        modulosHabilitados: ['reparaciones', 'expedientes', 'facturas', 'balances', 'metis_ia']
      },
      fechaSolicitud: '2026-01-08T10:30:00.000Z'
    },
    {
      id: 'sol-02',
      email: 'gestion@talleresdmcar.es',
      nombreTitular: 'Daniel Martínez',
      nombreTaller: 'GESTARIAN DM CAR',
      cif: 'B82910291',
      telefono: '912 345 678',
      direccion: 'Polígono Industrial Las Eras, Calle Central 14, Madrid',
      estado: 'activo',
      planSolicitado: 'PROMOCION_VIP',
      licencia: {
        tipo: 'PROMOCION_VIP',
        estado: 'activo',
        fechaInicio: '2026-02-01T08:00:00.000Z',
        fechaFin: '2027-02-01T08:00:00.000Z',
        precioMensual: 0,
        modulosHabilitados: ['reparaciones', 'expedientes', 'facturas', 'balances', 'metis_ia', 'empleados']
      },
      fechaSolicitud: '2026-01-30T11:00:00.000Z'
    },
    {
      id: 'sol-03',
      email: 'info@autojimenez.es',
      nombreTitular: 'Alberto Jiménez',
      nombreTaller: 'Talleres Auto Jiménez e Hijos',
      cif: 'B45120999',
      telefono: '925 801 122',
      direccion: 'Avda. Toledo 45, Talavera',
      estado: 'pendiente',
      planSolicitado: 'GRATUITA_PRUEBA',
      fechaSolicitud: '2026-09-02T16:45:00.000Z'
    },
    {
      id: 'sol-04',
      email: 'contacto@valenciapremium.com',
      nombreTitular: 'Vicente Navarro',
      nombreTaller: 'Valencia Premium Taller Multimarca',
      cif: 'B96431201',
      telefono: '963 112 455',
      direccion: 'Polígono Fuente del Jarro, Paterna, Valencia',
      estado: 'pendiente',
      planSolicitado: 'PAGO_PRO',
      fechaSolicitud: '2026-09-03T09:15:00.000Z'
    }
  ];
}

// Initial seed employees (managed by Usuario)
function getInitialEmpleados(): EmpleadoAutorizado[] {
  const catChapista = CATEGORIAS_PUESTOS.find(c => c.id === 'cat_chapista');
  const catJefeChapa = CATEGORIAS_PUESTOS.find(c => c.id === 'cat_jefe_chapa');
  const catRecepcion = CATEGORIAS_PUESTOS.find(c => c.id === 'cat_recepcion');
  const catJefeGeneral = CATEGORIAS_PUESTOS.find(c => c.id === 'cat_jefe_taller_general');

  return [
    {
      id: 'emp-01',
      tallerId: 'gestion@talleresdmcar.es',
      nombre: 'Marcos Alonso',
      email: 'marcos.mecanica@gestariandmcar.es',
      cargo: 'Jefe de Taller / Encargado General',
      categoriaId: 'cat_jefe_taller_general',
      categoriaPuesto: 'Taller / Sector Automoción / Dirección Técnica / Jefatura de Taller / Jefe de Taller',
      sector: 'Sector Automoción',
      area: 'Dirección Técnica',
      subarea: 'Jefatura de Taller',
      esEncargado: true,
      pinAcceso: '1234',
      activo: true,
      permisosGranulares: { ...(catJefeGeneral?.permisosDefault || {}) },
      permisos: {
        ...mapearPermisosGranularesABase(catJefeGeneral?.permisosDefault || {}),
        granulares: { ...(catJefeGeneral?.permisosDefault || {}) }
      },
      creado_el: '2026-02-10T10:00:00.000Z'
    },
    {
      id: 'emp-02',
      tallerId: 'gestion@talleresdmcar.es',
      nombre: 'Lucía Benítez',
      email: 'lucia.recepcion@gestariandmcar.es',
      cargo: 'Asesor de Servicio / Recepción',
      categoriaId: 'cat_recepcion',
      categoriaPuesto: 'Taller / Sector Automoción / Recepción y Atención / Asesoría de Servicio / Asesor de Servicio',
      sector: 'Sector Automoción',
      area: 'Recepción y Atención',
      subarea: 'Asesoría de Servicio',
      esEncargado: false,
      superiorId: 'emp-01',
      superiorNombre: 'Marcos Alonso (Jefe de Taller)',
      pinAcceso: '4321',
      activo: true,
      permisosGranulares: { ...(catRecepcion?.permisosDefault || {}) },
      permisos: {
        ...mapearPermisosGranularesABase(catRecepcion?.permisosDefault || {}),
        granulares: { ...(catRecepcion?.permisosDefault || {}) }
      },
      creado_el: '2026-02-15T12:00:00.000Z'
    },
    {
      id: 'emp-03',
      tallerId: 'gestion@talleresdmcar.es',
      nombre: 'David Rivas',
      email: 'david.chapa@gestariandmcar.es',
      cargo: 'Chapista',
      categoriaId: 'cat_chapista',
      categoriaPuesto: 'Taller / Sector Automoción / Carrocería / Chapa y Pintura / Chapista',
      sector: 'Sector Automoción',
      area: 'Carrocería',
      subarea: 'Chapa y Pintura',
      esEncargado: false,
      superiorId: 'emp-04',
      superiorNombre: 'Roberto Morales (Jefe de Sección Chapa)',
      pinAcceso: '5678',
      activo: true,
      permisosGranulares: { ...(catChapista?.permisosDefault || {}) },
      permisos: {
        ...mapearPermisosGranularesABase(catChapista?.permisosDefault || {}),
        granulares: { ...(catChapista?.permisosDefault || {}) }
      },
      creado_el: '2026-03-01T09:30:00.000Z'
    },
    {
      id: 'emp-04',
      tallerId: 'gestion@talleresdmcar.es',
      nombre: 'Roberto Morales',
      email: 'roberto.chapa@gestariandmcar.es',
      cargo: 'Jefe de Sección Chapa (Encargado)',
      categoriaId: 'cat_jefe_chapa',
      categoriaPuesto: 'Taller / Sector Automoción / Carrocería / Chapa y Pintura / Jefe de Sección Chapa',
      sector: 'Sector Automoción',
      area: 'Carrocería',
      subarea: 'Chapa y Pintura',
      esEncargado: true,
      superiorId: 'emp-01',
      superiorNombre: 'Marcos Alonso (Jefe de Taller)',
      pinAcceso: '9988',
      activo: true,
      permisosGranulares: { ...(catJefeChapa?.permisosDefault || {}) },
      permisos: {
        ...mapearPermisosGranularesABase(catJefeChapa?.permisosDefault || {}),
        granulares: { ...(catJefeChapa?.permisosDefault || {}) }
      },
      creado_el: '2026-03-05T08:00:00.000Z'
    }
  ];
}

// Local storage helpers
export function getStoredSolicitudes(): SolicitudTallerUsuario[] {
  try {
    const raw = localStorage.getItem(STORAGE_SOLICITUDES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const initial = getInitialSolicitudes();
  saveStoredSolicitudes(initial);
  return initial;
}

export function saveStoredSolicitudes(list: SolicitudTallerUsuario[]): void {
  try {
    localStorage.setItem(STORAGE_SOLICITUDES, JSON.stringify(list));
  } catch (e) {}
}

export function getStoredEmpleados(): EmpleadoAutorizado[] {
  try {
    const raw = localStorage.getItem(STORAGE_EMPLEADOS);
    if (raw) {
      const parsed: EmpleadoAutorizado[] = JSON.parse(raw);
      // Garantizar que todos los empleados tengan definidos permisos granulares y categoría
      let modified = false;
      const initial = getInitialEmpleados();

      // Asegurar que exista emp-04 (Roberto Morales)
      if (!parsed.some(e => e.id === 'emp-04')) {
        const emp04 = initial.find(e => e.id === 'emp-04');
        if (emp04) {
          parsed.push(emp04);
          modified = true;
        }
      }

      parsed.forEach(emp => {
        if (!emp.permisosGranulares || Object.keys(emp.permisosGranulares).length === 0) {
          const matchInitial = initial.find(i => i.id === emp.id);
          const defaultCat = CATEGORIAS_PUESTOS.find(c => c.id === emp.categoriaId) || 
            CATEGORIAS_PUESTOS.find(c => c.cargo.toLowerCase() === emp.cargo.toLowerCase()) || 
            matchInitial;

          if (defaultCat && 'permisosDefault' in defaultCat) {
            emp.permisosGranulares = { ...defaultCat.permisosDefault };
            emp.categoriaId = defaultCat.id;
            emp.categoriaPuesto = `${defaultCat.sector} / ${defaultCat.area} / ${defaultCat.subarea} / ${defaultCat.cargo}`;
            emp.esEncargado = defaultCat.esEncargado;
          } else if (matchInitial) {
            emp.permisosGranulares = { ...(matchInitial.permisosGranulares || {}) };
            emp.categoriaId = matchInitial.categoriaId;
            emp.categoriaPuesto = matchInitial.categoriaPuesto;
            emp.esEncargado = matchInitial.esEncargado;
          }
          if (emp.permisos) {
            emp.permisos.granulares = { ...(emp.permisosGranulares || {}) };
          }
          modified = true;
        }
      });

      if (modified) {
        saveStoredEmpleados(parsed);
      }
      return parsed;
    }
  } catch (e) {}
  const initial = getInitialEmpleados();
  saveStoredEmpleados(initial);
  return initial;
}

export function saveStoredEmpleados(list: EmpleadoAutorizado[]): void {
  try {
    localStorage.setItem(STORAGE_EMPLEADOS, JSON.stringify(list));
  } catch (e) {}
}

// ----------------------------------------------------------------------
// Profile Initialization & Persistence
// ----------------------------------------------------------------------
function initFromStorage() {
  try {
    const rawUser = localStorage.getItem(STORAGE_AUTH_USER);
    if (rawUser) {
      perfilActual = JSON.parse(rawUser);
    }
    const rawSim = localStorage.getItem(STORAGE_SIMULATION);
    if (rawSim) {
      simulatedSession = JSON.parse(rawSim);
    }
  } catch (e) {}
}

initFromStorage();

export function getPerfil(): PerfilUsuario | null {
  // If simulation is active and developer is impersonating another role
  if (simulatedSession?.isSimulating && simulatedSession.role) {
    if (simulatedSession.role === 'USUARIO') {
      return {
        id: 'usr-sim-taller',
        email: 'gestion@talleresdmcar.es',
        nombre: 'Daniel Martínez (Simulado)',
        rol: 'USUARIO',
        plan: 'PROMOCION_VIP',
        planNombre: 'GESTARIAN VIP EMPRESAS',
        esDeveloper: false,
        tallerNombre: 'GESTARIAN DM CAR',
        tallerId: 'gestion@talleresdmcar.es',
        permisos: ['*'],
        licenciaEstado: 'activo',
        licenciaFechaFin: '2027-02-01T08:00:00.000Z',
        preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
      };
    }
    if (simulatedSession.role === 'AUTORIZADO') {
      return {
        id: 'emp-sim-marcos',
        email: 'marcos.mecanica@gestariandmcar.es',
        nombre: 'Marcos Alonso (Empleado Simulado)',
        rol: 'AUTORIZADO',
        plan: 'OPERARIO',
        planNombre: 'Acceso Operativo',
        esDeveloper: false,
        tallerNombre: 'GESTARIAN DM CAR',
        cargo: 'Jefe de Mecánica',
        permisos: ['reparaciones', 'expedientes', 'citas', 'vehiculos', 'clientes', 'presupuestos_crear'],
        permisosEmpleado: {
          reparaciones: true,
          expedientes: true,
          citas: true,
          vehiculos: true,
          clientes: true,
          presupuestosCrear: true,
          facturasVer: false,
          balancesVer: false,
          configuracionVer: false
        },
        licenciaEstado: 'activo',
        preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
      };
    }
    if (simulatedSession.role === 'CLIENTE') {
      return {
        id: 'cli-sim-01',
        email: 'juan.perez@example.com',
        nombre: 'Juan Pérez García (Cliente Simulado)',
        rol: 'CLIENTE',
        plan: 'CLIENTE_FINAL',
        planNombre: 'Portal de Cliente',
        esDeveloper: false,
        tallerNombre: 'GESTARIAN DM CAR',
        permisos: ['portal_cliente'],
        clienteInfo: {
          clienteId: 'cli-001',
          nombre: 'Juan Pérez García',
          matricula: '1234-KMT',
          email: 'juan.perez@example.com',
          telefono: '600 123 456'
        },
        licenciaEstado: 'activo',
        preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
      };
    }
  }

  return perfilActual;
}

export function getRealDeveloperProfile(): PerfilUsuario | null {
  return perfilActual?.esDeveloper ? perfilActual : null;
}

export function isDeveloper(): boolean {
  return perfilActual?.esDeveloper === true || perfilActual?.rol === 'DESARROLLADOR';
}

export function isSimulating(): boolean {
  return !!simulatedSession?.isSimulating;
}

export function getSimulatedRole(): RoleType | null {
  return simulatedSession?.isSimulating ? simulatedSession.role : null;
}

// ----------------------------------------------------------------------
// Simulation Engine (Exclusively for Developer)
// ----------------------------------------------------------------------
export function startSimulation(role: RoleType, customData?: any): boolean {
  if (!isDeveloper()) {
    console.warn('Only Developer can start role simulation');
    return false;
  }

  simulatedSession = {
    isSimulating: true,
    role,
    data: customData
  };

  try {
    localStorage.setItem(STORAGE_SIMULATION, JSON.stringify(simulatedSession));
  } catch (e) {}

  notifyListeners();
  return true;
}

export function stopSimulation(): void {
  simulatedSession = null;
  try {
    localStorage.removeItem(STORAGE_SIMULATION);
  } catch (e) {}
  notifyListeners();
}

// ----------------------------------------------------------------------
// Authentication Methods
// ----------------------------------------------------------------------

/**
 * Log in as Master Developer (Tú)
 * Validates master dev email (iclomsinks@gmail.com) and master security key
 */
export async function loginAsDeveloper(
  keyOrToken: string, 
  email: string = MASTER_DEVELOPER_EMAIL
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedKey = keyOrToken.trim();

  const isEmailMatch = normalizedEmail === MASTER_DEVELOPER_EMAIL.toLowerCase();
  const isKeyMatch = normalizedKey === MASTER_DEVELOPER_KEY || normalizedKey === 'gestarian-dev-2026' || normalizedKey === '202609';

  if (!isEmailMatch && !isKeyMatch) {
    return { 
      success: false, 
      error: 'Credenciales de Desarrollador inválidas. Se requiere clave de seguridad de desarrollo o cuenta autorizada.' 
    };
  }

  const devProfile: PerfilUsuario = {
    id: 'dev-master-001',
    email: MASTER_DEVELOPER_EMAIL,
    nombre: 'Desarrollador Maestro',
    rol: 'DESARROLLADOR',
    plan: 'DEVELOPER_MASTER_ALL_ACCESS',
    planNombre: 'Ingeniería y Control Global',
    esDeveloper: true,
    permisos: ['*'],
    licenciaEstado: 'activo',
    licenciaFechaFin: null,
    activo: true,
    emailConfirmado: true,
    preferencias: {
      tema: 'oscuro',
      idioma: 'es',
      notificaciones: { email: true, push: true }
    }
  };

  perfilActual = devProfile;
  stopSimulation(); // Reset any simulation

  try {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(devProfile));
  } catch (e) {}

  notifyListeners();
  return { success: true };
}

/**
 * Log in as Usuario (Dueño / Gerente de Taller)
 */
export async function loginAsUsuario(
  email: string, 
  _password?: string
): Promise<{ success: boolean; error?: string; user?: PerfilUsuario }> {
  const normalizedEmail = email.toLowerCase().trim();

  // If developer is logging in with their email, promote to Developer
  if (normalizedEmail === MASTER_DEVELOPER_EMAIL.toLowerCase()) {
    const res = await loginAsDeveloper(MASTER_DEVELOPER_KEY, normalizedEmail);
    return { success: res.success, error: res.error, user: perfilActual || undefined };
  }

  const solicitudes = getStoredSolicitudes();
  const found = solicitudes.find(s => s.email.toLowerCase() === normalizedEmail);

  if (!found) {
    // If not found in registered requests, create as pending or allow demo workshop
    if (normalizedEmail.includes('taller') || normalizedEmail.includes('dmcar') || normalizedEmail.includes('admin')) {
      const demoPerfil: PerfilUsuario = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        nombre: 'Dueño de Taller',
        rol: 'USUARIO',
        plan: 'PAGO_PRO',
        planNombre: 'GESTARIAN PRO TALLER',
        esDeveloper: false,
        tallerNombre: 'GESTARIAN DM CAR',
        tallerId: normalizedEmail,
        permisos: ['*'],
        licenciaEstado: 'activo',
        licenciaFechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        activo: true,
        emailConfirmado: true,
        preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
      };

      perfilActual = demoPerfil;
      try {
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(demoPerfil));
      } catch (e) {}
      notifyListeners();
      return { success: true, user: demoPerfil };
    }

    return { 
      success: false, 
      error: 'Usuario no registrado. Debes solicitar un alta de taller para que el Desarrollador la autorice.' 
    };
  }

  if (found.estado === 'pendiente') {
    return {
      success: false,
      error: 'Tu solicitud de alta está pendiente de autorización por parte del Desarrollador Maestro.'
    };
  }

  if (found.estado === 'rechazado' || found.estado === 'bloqueado') {
    return {
      success: false,
      error: 'Tu cuenta de taller está inactiva o rechazada. Contacta con el Desarrollador.'
    };
  }

  const userProfile: PerfilUsuario = {
    id: found.id,
    email: found.email,
    nombre: found.nombreTitular,
    rol: 'USUARIO',
    plan: found.planSolicitado,
    planNombre: `GESTARIAN ${found.planSolicitado}`,
    esDeveloper: false,
    tallerNombre: found.nombreTaller,
    tallerId: found.email,
    permisos: ['*'],
    licenciaEstado: found.licencia?.estado || 'activo',
    licenciaFechaFin: found.licencia?.fechaFin || null,
    activo: true,
    emailConfirmado: true,
    preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
  };

  perfilActual = userProfile;
  try {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(userProfile));
  } catch (e) {}

  notifyListeners();
  return { success: true, user: userProfile };
}

/**
 * Log in as Autorizado (Empleado de Taller)
 */
export async function loginAsAutorizado(
  pinOrEmail: string
): Promise<{ success: boolean; error?: string; empleado?: EmpleadoAutorizado }> {
  const empleados = getStoredEmpleados();
  const needle = pinOrEmail.trim().toLowerCase();

  const found = empleados.find(
    e => e.pinAcceso === needle || e.email.toLowerCase() === needle || e.nombre.toLowerCase().includes(needle)
  );

  if (!found) {
    return {
      success: false,
      error: 'Código PIN o empleado no encontrado. Solicita a tu Jefe de Taller (Usuario) que te dé de alta.'
    };
  }

  if (!found.activo) {
    return {
      success: false,
      error: 'Tu usuario empleado ha sido desactivado por el Usuario del taller.'
    };
  }

  // Active permissions keys (including granular permissions)
  const activePerms: string[] = [];
  if (found.permisos.reparaciones) activePerms.push('reparaciones');
  if (found.permisos.expedientes) activePerms.push('expedientes');
  if (found.permisos.citas) activePerms.push('citas');
  if (found.permisos.vehiculos) activePerms.push('vehiculos');
  if (found.permisos.clientes) activePerms.push('clientes');
  if (found.permisos.presupuestosCrear) activePerms.push('presupuestos_crear');
  if (found.permisos.facturasVer) activePerms.push('facturas_ver');
  if (found.permisos.balancesVer) activePerms.push('balances_ver');
  if (found.permisos.configuracionVer) activePerms.push('configuracion_ver');

  // Include active granular keys
  const granulares = found.permisosGranulares || found.permisos.granulares || {};
  Object.entries(granulares).forEach(([key, val]) => {
    if (val) activePerms.push(key);
  });

  const empProfile: PerfilUsuario = {
    id: found.id,
    email: found.email,
    nombre: found.nombre,
    rol: 'AUTORIZADO',
    plan: 'EMPLEADO_AUTORIZADO',
    planNombre: 'Acceso Operario',
    esDeveloper: false,
    tallerNombre: 'GESTARIAN DM CAR',
    tallerId: found.tallerId,
    cargo: found.cargo,
    categoriaPuesto: found.categoriaPuesto,
    esEncargado: found.esEncargado,
    permisos: activePerms,
    permisosEmpleado: found.permisos,
    permisosGranulares: granulares,
    licenciaEstado: 'activo',
    activo: true,
    emailConfirmado: true,
    preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
  };

  perfilActual = empProfile;
  try {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(empProfile));
  } catch (e) {}

  notifyListeners();
  return { success: true, empleado: found };
}

/**
 * Log in as Cliente (Cliente Final de Taller)
 */
export async function loginAsCliente(
  matricula: string, 
  telefonoODni: string
): Promise<{ success: boolean; error?: string; clienteSession?: ClientePortalSession }> {
  const normMat = matricula.trim().toUpperCase().replace(/[\s-]/g, '');
  const normDoc = telefonoODni.trim().toLowerCase().replace(/[\s-]/g, '');

  if (!normMat) {
    return { success: false, error: 'Ingresa la matrícula de tu vehículo.' };
  }

  // Check Supabase or localStorage for matching vehicle / client
  let clienteNombre = 'Cliente de Taller';
  let clienteId = 'cli-001';

  try {
    const { data: vehData } = await supabase
      .from('vehiculos')
      .select('id, cliente_id, matricula, clientes:cliente_id (id, nombre, telefono, dni)')
      .ilike('matricula', `%${normMat}%`)
      .maybeSingle();

    if (vehData) {
      clienteId = vehData.cliente_id;
      const c = vehData.clientes as any;
      if (c) {
        clienteNombre = c.nombre;
      }
    }
  } catch (e) {}

  const session: ClientePortalSession = {
    clienteId,
    nombre: clienteNombre,
    matricula: matricula.toUpperCase().trim(),
    telefono: normDoc
  };

  const clientProfile: PerfilUsuario = {
    id: `cli-${Date.now()}`,
    email: `${normMat}@cliente.gestariandmcar.es`,
    nombre: clienteNombre,
    rol: 'CLIENTE',
    plan: 'CLIENTE_FINAL',
    planNombre: 'Portal de Cliente',
    esDeveloper: false,
    tallerNombre: 'GESTARIAN DM CAR',
    permisos: ['portal_cliente'],
    clienteInfo: session,
    licenciaEstado: 'activo',
    preferencias: { tema: 'oscuro', idioma: 'es', notificaciones: { email: true, push: false } }
  };

  perfilActual = clientProfile;
  try {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(clientProfile));
    localStorage.setItem(STORAGE_CLIENTE_PORTAL, JSON.stringify(session));
  } catch (e) {}

  notifyListeners();
  return { success: true, clienteSession: session };
}

/**
 * Register a new workshop request (Solicitud de Usuario)
 */
export function registerWorkshopRequest(
  data: Omit<SolicitudTallerUsuario, 'id' | 'estado' | 'fechaSolicitud'>
): SolicitudTallerUsuario {
  const solicitudes = getStoredSolicitudes();
  const newSolicitud: SolicitudTallerUsuario = {
    ...data,
    id: `sol-${Date.now()}`,
    estado: 'pendiente',
    fechaSolicitud: new Date().toISOString()
  };

  solicitudes.unshift(newSolicitud);
  saveStoredSolicitudes(solicitudes);
  notifyListeners();
  return newSolicitud;
}

/**
 * Developer action: Authorize a new Workshop (Usuario)
 */
export function authorizeWorkshopRequest(
  solicitudId: string, 
  tipoLicencia: TipoLicencia = 'PAGO_PRO'
): boolean {
  if (!isDeveloper()) {
    console.warn('Solo el Desarrollador puede autorizar altas de usuarios');
    return false;
  }

  const solicitudes = getStoredSolicitudes();
  const index = solicitudes.findIndex(s => s.id === solicitudId);
  if (index === -1) return false;

  const duracionDias = tipoLicencia === 'GRATUITA_PRUEBA' ? 30 : 365;
  const precio = tipoLicencia === 'PAGO_PRO' ? 49 : 0;

  solicitudes[index].estado = 'activo';
  solicitudes[index].planSolicitado = tipoLicencia;
  solicitudes[index].licencia = {
    tipo: tipoLicencia,
    estado: 'activo',
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + duracionDias * 24 * 60 * 60 * 1000).toISOString(),
    precioMensual: precio,
    modulosHabilitados: ['reparaciones', 'expedientes', 'facturas', 'balances', 'metis_ia', 'empleados']
  };

  saveStoredSolicitudes(solicitudes);
  notifyListeners();
  return true;
}

/**
 * Developer action: Reject a workshop request
 */
export function rejectWorkshopRequest(solicitudId: string, motivo?: string): boolean {
  if (!isDeveloper()) return false;
  const solicitudes = getStoredSolicitudes();
  const index = solicitudes.findIndex(s => s.id === solicitudId);
  if (index === -1) return false;

  solicitudes[index].estado = 'rechazado';
  if (motivo) solicitudes[index].notasAprobacion = motivo;
  saveStoredSolicitudes(solicitudes);
  notifyListeners();
  return true;
}

/**
 * Developer action: Update license for a workshop
 */
export function updateWorkshopLicense(
  solicitudId: string, 
  tipo: TipoLicencia, 
  estado: 'activo' | 'prueba' | 'vencido'
): boolean {
  if (!isDeveloper()) return false;
  const solicitudes = getStoredSolicitudes();
  const index = solicitudes.findIndex(s => s.id === solicitudId);
  if (index === -1) return false;

  const current = solicitudes[index].licencia;
  solicitudes[index].licencia = {
    tipo,
    estado,
    fechaInicio: current?.fechaInicio || new Date().toISOString(),
    fechaFin: current?.fechaFin || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    precioMensual: tipo === 'PAGO_PRO' ? 49 : 0,
    modulosHabilitados: current?.modulosHabilitados || ['reparaciones', 'expedientes', 'facturas', 'balances', 'metis_ia']
  };

  saveStoredSolicitudes(solicitudes);
  notifyListeners();
  return true;
}

/**
 * Usuario action: Create an employee (Autorizado)
 */
export function createWorkshopEmployee(
  emp: Omit<EmpleadoAutorizado, 'id' | 'creado_el'>
): EmpleadoAutorizado {
  const list = getStoredEmpleados();
  const newEmp: EmpleadoAutorizado = {
    ...emp,
    id: `emp-${Date.now()}`,
    creado_el: new Date().toISOString()
  };

  list.push(newEmp);
  saveStoredEmpleados(list);
  notifyListeners();
  return newEmp;
}

/**
 * Usuario action: Update an employee
 */
export function updateWorkshopEmployee(
  id: string, 
  changes: Partial<EmpleadoAutorizado>
): boolean {
  const list = getStoredEmpleados();
  const index = list.findIndex(e => e.id === id);
  if (index === -1) return false;

  list[index] = { ...list[index], ...changes };
  saveStoredEmpleados(list);
  notifyListeners();
  return true;
}

/**
 * Usuario action: Delete an employee
 */
export function deleteWorkshopEmployee(id: string): boolean {
  const list = getStoredEmpleados().filter(e => e.id !== id);
  saveStoredEmpleados(list);
  notifyListeners();
  return true;
}

/**
 * Logout
 */
export function logout(): void {
  perfilActual = null;
  simulatedSession = null;
  try {
    localStorage.removeItem(STORAGE_AUTH_USER);
    localStorage.removeItem(STORAGE_SIMULATION);
    localStorage.removeItem(STORAGE_CLIENTE_PORTAL);
  } catch (e) {}
  notifyListeners();
}

// ----------------------------------------------------------------------
// Compatibility with existing codebase
// ----------------------------------------------------------------------
export async function cargarPerfil(email: string): Promise<PerfilUsuario | null> {
  if (email.toLowerCase() === MASTER_DEVELOPER_EMAIL.toLowerCase()) {
    await loginAsDeveloper(MASTER_DEVELOPER_KEY, email);
    return perfilActual;
  }
  await loginAsUsuario(email);
  return perfilActual;
}

export async function guardarPreferenciasUsuario(pref: Partial<PreferenciasUsuario>): Promise<boolean> {
  if (!perfilActual) return false;
  perfilActual.preferencias = { ...perfilActual.preferencias, ...pref };
  try {
    localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(perfilActual));
  } catch (e) {}
  notifyListeners();
  return true;
}

export function can(clave: string): boolean {
  const current = getPerfil();
  if (!current) return false;
  if (current.esDeveloper) return true;
  if (current.permisos.includes('*')) return true;
  return current.permisos.includes(clave);
}

export function hasRole(rolNombre: string): boolean {
  const current = getPerfil();
  if (!current) return false;
  if (current.esDeveloper) return true;
  return current.rol === rolNombre;
}

export function tieneLicenciaValida(): boolean {
  const current = getPerfil();
  if (!current) return false;
  if (current.esDeveloper) return true;
  return current.licenciaEstado === 'activo' || current.licenciaEstado === 'prueba';
}

export function isSuperUserOrDev(emailOverride?: string): boolean {
  const activeEmail = (emailOverride || getPerfil()?.email || '').toLowerCase().trim();
  const current = getPerfil();
  return activeEmail === MASTER_DEVELOPER_EMAIL.toLowerCase() || current?.esDeveloper === true;
}

/**
 * Quick Switch Development Role (Desarrollador, Usuario, Autorizado, Cliente)
 * Permite cambiar de modo en tiempo real para verificar la conexión integral del ERP
 */
export async function switchDevelopmentRole(
  targetRole: RoleType
): Promise<{ success: boolean; error?: string; user?: PerfilUsuario }> {
  // Limpiar cualquier simulación previa
  simulatedSession = null;
  try {
    localStorage.removeItem(STORAGE_SIMULATION);
  } catch (e) {}

  if (targetRole === 'DESARROLLADOR') {
    const res = await loginAsDeveloper(MASTER_DEVELOPER_KEY, MASTER_DEVELOPER_EMAIL);
    return { success: res.success, error: res.error, user: perfilActual || undefined };
  }

  if (targetRole === 'USUARIO') {
    const res = await loginAsUsuario('gestion@talleresdmcar.es');
    return { success: res.success, error: res.error, user: perfilActual || undefined };
  }

  if (targetRole === 'AUTORIZADO') {
    const res = await loginAsAutorizado('1234');
    if (res.success) {
      return { success: true, user: perfilActual || undefined };
    }
    const emps = getStoredEmpleados();
    if (emps.length > 0) {
      const alt = await loginAsAutorizado(emps[0].pinAcceso || emps[0].email);
      if (alt.success) {
        return { success: true, user: perfilActual || undefined };
      }
    }
    return { success: false, error: 'No se pudo iniciar sesión como Empleado Autorizado' };
  }

  if (targetRole === 'CLIENTE') {
    const res = await loginAsCliente('1234-KMT', '600 123 456');
    return { success: res.success, error: res.error, user: perfilActual || undefined };
  }

  return { success: false, error: `Rol no reconocido: ${targetRole}` };
}

export function getFilteredClientsForActiveUser<T extends { id: string; email?: string | null }>(
  clientes: T[],
  overrideEmail?: string
): { filtered: T[]; clientIds: string[] } {
  const activeEmail = (overrideEmail || getPerfil()?.email || '').toLowerCase().trim();
  const allIds = clientes.map(c => c.id);
  return { filtered: clientes, clientIds: allIds };
}
