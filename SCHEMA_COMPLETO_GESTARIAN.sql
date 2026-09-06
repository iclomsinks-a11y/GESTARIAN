/*
# GESTARIAN â€” Tablas principales del flujo de trabajo

1. Tablas nuevas
- `clientes`: datos del cliente (nombre, DNI, telÃ©fono, email, direcciÃ³n)
- `vehiculos`: vehÃ­culos asociados a un cliente (matrÃ­cula, marca, modelo, aÃ±o, VIN)
- `presupuestos`: presupuestos emitidos a un cliente+vehÃ­culo, con estado (pendiente/aceptado/rechazado) y conceptos en JSONB
- `citas`: citas del taller, vinculadas a un presupuesto aceptado, con estado (pendiente/confirmada/completada/cancelada)
- `reparaciones`: reparaciones en curso o finalizadas, vinculadas a una cita confirmada, con estado (en_proceso/finalizado)
- `facturas`: facturas emitidas, vinculadas a una reparaciÃ³n finalizada, con estado de cobro (pendiente/parcial/pagada)
- `cobros`: registro de abonos parciales sobre una factura

2. Seguridad
- Single-tenant sin auth: RLS habilitada en todas las tablas.
- PolÃ­ticas TO anon, authenticated con USING (true) â€” los datos son intencionalmente pÃºblicos para la app sin login.
*/

-- â”€â”€ CLIENTES â”€â”€
CREATE TABLE IF NOT EXISTS clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  dni         text,
  telefono    text,
  email       text,
  direccion   text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_clientes" ON clientes;
CREATE POLICY "anon_select_clientes" ON clientes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_clientes" ON clientes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_clientes" ON clientes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_clientes" ON clientes FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ VEHICULOS â”€â”€
CREATE TABLE IF NOT EXISTS vehiculos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  matricula   text NOT NULL,
  marca       text,
  modelo      text,
  anio        int,
  vin         text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_vehiculos" ON vehiculos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_vehiculos" ON vehiculos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_vehiculos" ON vehiculos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_vehiculos" ON vehiculos FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ PRESUPUESTOS â”€â”€
CREATE TABLE IF NOT EXISTS presupuestos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero        text NOT NULL DEFAULT '',
  cliente_id    uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id   uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  estado        text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptado','rechazado')),
  conceptos     jsonb NOT NULL DEFAULT '[]'::jsonb,
  total         numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_presupuestos" ON presupuestos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_presupuestos" ON presupuestos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_presupuestos" ON presupuestos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_presupuestos" ON presupuestos FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ CITAS â”€â”€
CREATE TABLE IF NOT EXISTS citas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id  uuid REFERENCES presupuestos(id) ON DELETE SET NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id     uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  fecha           date NOT NULL,
  hora            time,
  estado          text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','completada','cancelada')),
  observaciones   text,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_citas" ON citas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_citas" ON citas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_citas" ON citas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_citas" ON citas FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ REPARACIONES â”€â”€
CREATE TABLE IF NOT EXISTS reparaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id     uuid REFERENCES citas(id) ON DELETE SET NULL,
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  estado      text NOT NULL DEFAULT 'en_proceso' CHECK (estado IN ('en_proceso','finalizado')),
  descripcion text,
  fotos       jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE reparaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_reparaciones" ON reparaciones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_reparaciones" ON reparaciones FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_reparaciones" ON reparaciones FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_reparaciones" ON reparaciones FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ FACTURAS â”€â”€
CREATE TABLE IF NOT EXISTS facturas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          text NOT NULL DEFAULT '',
  reparacion_id   uuid REFERENCES reparaciones(id) ON DELETE SET NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id     uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  conceptos       jsonb NOT NULL DEFAULT '[]'::jsonb,
  total           numeric(10,2) NOT NULL DEFAULT 0,
  total_abonado   numeric(10,2) NOT NULL DEFAULT 0,
  estado_cobro    text NOT NULL DEFAULT 'pendiente' CHECK (estado_cobro IN ('pendiente','parcial','pagada')),
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_facturas" ON facturas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_facturas" ON facturas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_facturas" ON facturas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_facturas" ON facturas FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ COBROS (abonos parciales) â”€â”€
CREATE TABLE IF NOT EXISTS cobros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id  uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  importe     numeric(10,2) NOT NULL,
  fecha       date NOT NULL DEFAULT CURRENT_DATE,
  metodo      text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_cobros" ON cobros FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_cobros" ON cobros FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_cobros" ON cobros FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_cobros" ON cobros FOR DELETE TO anon, authenticated USING (true);

-- â”€â”€ ÃNDICES â”€â”€
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente ON vehiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_cliente ON citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_reparaciones_cliente ON reparaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobros_factura ON cobros(factura_id);
/*
# GESTARIAN â€” ConfiguraciÃ³n, Usuarios y Roles

1. Tablas nuevas
- `configuracion`: fila Ãºnica con datos de la empresa (nombre, CIF, direcciÃ³n, telÃ©fono, email, email_gestoria, logos, fondos de pantalla)
- `usuarios`: usuarios del sistema con rol (admin/jefe/operario) y permisos (puede_editar_precios, puede_enviar_gestoria)

2. Seguridad
- Single-tenant sin auth: RLS habilitada, polÃ­ticas TO anon, authenticated.
*/

-- â”€â”€ CONFIGURACION (fila Ãºnica) â”€â”€
CREATE TABLE IF NOT EXISTS configuracion (
  id                  int PRIMARY KEY DEFAULT 1,
  nombre_empresa      text NOT NULL DEFAULT 'DM CAR',
  cif                 text NOT NULL DEFAULT 'B-12345678',
  direccion           text NOT NULL DEFAULT 'PolÃ­gono Industrial, Nave 7',
  telefono            text,
  email               text,
  email_gestoria      text,
  logo_color          text,
  logo_bn             text,
  fondo_landscape     text,
  fondo_portrait      text,
  CONSTRAINT solo_una_fila CHECK (id = 1)
);
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_configuracion" ON configuracion FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_configuracion" ON configuracion FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_configuracion" ON configuracion FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_configuracion" ON configuracion FOR DELETE TO anon, authenticated USING (true);

-- Insertar fila por defecto si no existe
INSERT INTO configuracion (id) VALUES (1) ON CONFLICT DO NOTHING;

-- â”€â”€ USUARIOS â”€â”€
CREATE TABLE IF NOT EXISTS usuarios (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              text NOT NULL,
  email               text UNIQUE NOT NULL,
  rol                 text NOT NULL DEFAULT 'operario' CHECK (rol IN ('admin','jefe','operario')),
  puede_editar_precios boolean NOT NULL DEFAULT false,
  puede_enviar_gestoria boolean NOT NULL DEFAULT false,
  activo              boolean NOT NULL DEFAULT true,
  created_at          timestamptz DEFAULT now()
);
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_usuarios" ON usuarios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_usuarios" ON usuarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_usuarios" ON usuarios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_usuarios" ON usuarios FOR DELETE TO anon, authenticated USING (true);
/*
# GESTARIAN â€” Apariencia visual y preferencias (animaciones / sonido)

1. Tabla modificada
- `configuracion`: se aÃ±aden columnas para personalizaciÃ³n visual y preferencias de experiencia.
  - `color_fondo` (text): color de fondo de la aplicaciÃ³n. Default '#0a0e14'.
  - `color_texto` (text): color del texto principal. Default '#e2e8f0'.
  - `color_glow_botones` (text): color del efecto glow de los botones. Default '#06b6d4'.
  - `color_linea_botones` (text): color del borde/lÃ­nea de los botones. Default '#0e7490'.
  - `color_relleno_campo` (text): color de relleno de los campos de formulario. Default '#0f1620'.
  - `animaciones_activadas` (boolean): activa/desactiva animaciones de la interfaz. Default true.
  - `sonido_activado` (boolean): activa/desactiva los efectos de sonido. Default true.

2. Seguridad
- No se modifican polÃ­ticas. Las polÃ­ticas existentes de `configuracion` siguen vigentes (anon, authenticated CRUD).
*/

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS color_fondo text DEFAULT '#0a0e14',
  ADD COLUMN IF NOT EXISTS color_texto text DEFAULT '#e2e8f0',
  ADD COLUMN IF NOT EXISTS color_glow_botones text DEFAULT '#06b6d4',
  ADD COLUMN IF NOT EXISTS color_linea_botones text DEFAULT '#0e7490',
  ADD COLUMN IF NOT EXISTS color_relleno_campo text DEFAULT '#0f1620',
  ADD COLUMN IF NOT EXISTS animaciones_activadas boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sonido_activado boolean DEFAULT true;
/*
# GESTARIAN â€” Actualizar defaults de apariencia (estilo Apple)

1. Tabla modificada
- `configuracion`: se actualizan los valores por defecto de las columnas de apariencia
  para reflejar el nuevo diseÃ±o visual corporativo.
  - `color_fondo`: '#1c1c1e' (gris oscuro Apple)
  - `color_texto`: '#f5f5f7' (blanco casi puro)
  - `color_glow_botones`: '#40e0d0' (turquesa claro)
  - `color_linea_botones`: '#8e8e93' (gris sistema)
  - `color_relleno_campo`: '#2c2c2e' (gris oscuro para campos)

2. Seguridad
- No se modifican polÃ­ticas existentes.
*/

UPDATE configuracion
SET
  color_fondo = COALESCE(color_fondo, '#1c1c1e'),
  color_texto = COALESCE(color_texto, '#f5f5f7'),
  color_glow_botones = COALESCE(color_glow_botones, '#40e0d0'),
  color_linea_botones = COALESCE(color_linea_botones, '#8e8e93'),
  color_relleno_campo = COALESCE(color_relleno_campo, '#2c2c2e')
WHERE id = 1;

ALTER TABLE configuracion
  ALTER COLUMN color_fondo SET DEFAULT '#1c1c1e',
  ALTER COLUMN color_texto SET DEFAULT '#f5f5f7',
  ALTER COLUMN color_glow_botones SET DEFAULT '#40e0d0',
  ALTER COLUMN color_linea_botones SET DEFAULT '#8e8e93',
  ALTER COLUMN color_relleno_campo SET DEFAULT '#2c2c2e';
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS color_relleno_botones text DEFAULT 'transparent';
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS color_relleno_paneles TEXT DEFAULT '#2c2c2e';
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS tipo_empresa TEXT DEFAULT 'autonomo';
ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS modo_diurno BOOLEAN DEFAULT false;
/*
# Add proveedores, facturas_recibidas, notas_vehiculo, and cliente_invitaciones tables

1. New Tables
- `proveedores`: suppliers/providers management
  - id (uuid PK), nombre, cif, direccion, telefono, email, contacto, created_at
- `facturas_recibidas`: invoices received from suppliers (RFP)
  - id (uuid PK), numero, proveedor_id (FK), fecha, base_imponible, iva, total, estado, archivo_url, conceptos (jsonb), created_at
- `notas_vehiculo`: notes attached to a vehicle (for client mode tracking)
  - id (uuid PK), vehiculo_id (FK), cliente_id (FK), autor, texto, created_at
- `cliente_invitaciones`: invitations sent to clients so they can download the app and track their vehicle
  - id (uuid PK), cliente_id (FK), vehiculo_id (FK), email, token, enviado (bool), created_at

2. Security
- Enable RLS on all new tables.
- Single-tenant app (no sign-in): allow anon + authenticated CRUD on all tables.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cif text,
  direccion text,
  telefono text,
  email text,
  contacto text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_proveedores" ON proveedores;
CREATE POLICY "anon_select_proveedores" ON proveedores FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_proveedores" ON proveedores;
CREATE POLICY "anon_insert_proveedores" ON proveedores FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_proveedores" ON proveedores;
CREATE POLICY "anon_update_proveedores" ON proveedores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_proveedores" ON proveedores;
CREATE POLICY "anon_delete_proveedores" ON proveedores FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS facturas_recibidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  proveedor_id uuid REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha date DEFAULT now(),
  base_imponible numeric DEFAULT 0,
  iva numeric DEFAULT 0,
  total numeric DEFAULT 0,
  estado text DEFAULT 'pendiente',
  archivo_url text,
  conceptos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE facturas_recibidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_facturas_recibidas" ON facturas_recibidas;
CREATE POLICY "anon_select_facturas_recibidas" ON facturas_recibidas FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_facturas_recibidas" ON facturas_recibidas;
CREATE POLICY "anon_insert_facturas_recibidas" ON facturas_recibidas FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_facturas_recibidas" ON facturas_recibidas;
CREATE POLICY "anon_update_facturas_recibidas" ON facturas_recibidas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_facturas_recibidas" ON facturas_recibidas;
CREATE POLICY "anon_delete_facturas_recibidas" ON facturas_recibidas FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS notas_vehiculo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  autor text DEFAULT 'Taller',
  texto text NOT NULL,
  visible_cliente boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notas_vehiculo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notas_vehiculo" ON notas_vehiculo;
CREATE POLICY "anon_select_notas_vehiculo" ON notas_vehiculo FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notas_vehiculo" ON notas_vehiculo;
CREATE POLICY "anon_insert_notas_vehiculo" ON notas_vehiculo FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notas_vehiculo" ON notas_vehiculo;
CREATE POLICY "anon_update_notas_vehiculo" ON notas_vehiculo FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notas_vehiculo" ON notas_vehiculo;
CREATE POLICY "anon_delete_notas_vehiculo" ON notas_vehiculo FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS cliente_invitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT md5(random()::text),
  enviado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cliente_invitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cliente_invitaciones" ON cliente_invitaciones;
CREATE POLICY "anon_select_cliente_invitaciones" ON cliente_invitaciones FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cliente_invitaciones" ON cliente_invitaciones;
CREATE POLICY "anon_insert_cliente_invitaciones" ON cliente_invitaciones FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cliente_invitaciones" ON cliente_invitaciones;
CREATE POLICY "anon_update_cliente_invitaciones" ON cliente_invitaciones FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cliente_invitaciones" ON cliente_invitaciones;
CREATE POLICY "anon_delete_cliente_invitaciones" ON cliente_invitaciones FOR DELETE
  TO anon, authenticated USING (true);
/*
# Create app_secrets table for storing API tokens server-side

1. New Tables
- `app_secrets`: stores third-party API tokens keyed by name.
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) â€” e.g. "PLATE_RECOGNIZER_TOKEN"
  - `value` (text, not null) â€” the secret value
  - `created_at` (timestamptz)
2. Security
- RLS enabled. No policies added â€” only the service role (used by edge functions)
  can read/write this table. The anon key and authenticated users have zero access.
3. Notes
- This table is intentionally inaccessible from the frontend.
  Edge functions read it using the service role key, which bypasses RLS.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO app_secrets (name, value) VALUES ('PLATE_RECOGNIZER_TOKEN', '928ead1c82c78af71e76ad7ccb53563b7230d5c6')
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;
/*
# Create vehicle_images table for storing photos linked to a license plate

1. New Tables
- `vehicle_images`: stores photos of vehicles, keyed by matricula (license plate).
  - `id` (uuid, primary key)
  - `matricula` (text, not null) â€” the license plate, used as the grouping key
  - `image_data` (text, not null) â€” base64 data URL of the image
  - `created_at` (timestamptz)
2. Security
- RLS enabled. Single-tenant app (no sign-in), so policies allow anon + authenticated CRUD.
3. Notes
- Images are stored as data URLs (base64) in the text column for simplicity.
- All photos for a given matricula can be retrieved with a single query.
*/

CREATE TABLE IF NOT EXISTS vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula text NOT NULL,
  image_data text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicle_images" ON vehicle_images;
CREATE POLICY "anon_select_vehicle_images" ON vehicle_images FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vehicle_images" ON vehicle_images;
CREATE POLICY "anon_insert_vehicle_images" ON vehicle_images FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vehicle_images" ON vehicle_images;
CREATE POLICY "anon_delete_vehicle_images" ON vehicle_images FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_matricula ON vehicle_images(matricula);
CREATE TABLE IF NOT EXISTS theme_settings (
  id integer PRIMARY KEY DEFAULT 1,
  theme_preset text DEFAULT 'classic',
  primary_color text DEFAULT '#0f172a',
  secondary_color text DEFAULT '#334155',
  button_color text DEFAULT '#3b82f6',
  icon_color text DEFAULT '#64748b',
  warning_color text DEFAULT '#f59e0b',
  success_color text DEFAULT '#10b981',
  error_color text DEFAULT '#ef4444',
  is_dark_mode boolean DEFAULT true,
  card_color text DEFAULT '#1e293b',
  dashboard_color text DEFAULT '#0f172a',
  table_color text DEFAULT '#1e293b',
  header_color text DEFAULT '#0f172a',
  typography text DEFAULT 'Inter',
  font_size text DEFAULT '14px',
  border_radius text DEFAULT '0.5rem',
  shadows text DEFAULT 'md',
  spacing text DEFAULT 'normal',
  visual_density text DEFAULT 'normal',
  
  logo_url text,
  logo_inicio_url text,
  dashboard_image_url text,
  background_image_url text,
  favicon_url text,
  commercial_name text,
  splash_screen_url text,
  pwa_icon_url text,
  notification_color text DEFAULT '#3b82f6',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO theme_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}'; ALTER TABLE presupuestos ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}'; ALTER TABLE citas ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}';
-- Agrega columna expediente_id a presupuestos
ALTER TABLE presupuestos ADD COLUMN expediente_id TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero INTEGER;

-- Popula la columna numero de forma correlativa para los clientes existentes
WITH RankedClientes AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
    FROM clientes
)
UPDATE clientes
SET numero = RankedClientes.row_num
FROM RankedClientes
WHERE clientes.id = RankedClientes.id AND clientes.numero IS NULL;
-- =============================================================================
-- MIGRACIÃ“N: Tabla preferencias_usuario
-- Separa la configuraciÃ³n global de la empresa de las preferencias personales
-- =============================================================================

CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tema VARCHAR(20) DEFAULT 'claro',
    capa_visual VARCHAR(50) DEFAULT 'default',
    idioma VARCHAR(10) DEFAULT 'es',
    notificaciones JSONB DEFAULT '{"email": true, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id)
);

ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_preferencias_usuario" ON preferencias_usuario;
CREATE POLICY "anon_select_preferencias_usuario" ON preferencias_usuario FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_preferencias_usuario" ON preferencias_usuario;
CREATE POLICY "anon_insert_preferencias_usuario" ON preferencias_usuario FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_preferencias_usuario" ON preferencias_usuario;
CREATE POLICY "anon_update_preferencias_usuario" ON preferencias_usuario FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_preferencias_usuario" ON preferencias_usuario;
CREATE POLICY "anon_delete_preferencias_usuario" ON preferencias_usuario FOR DELETE TO anon, authenticated USING (true);
-- =============================================================================
-- MIGRACIÃ“N: Datos de prueba para roles, licencias y portal de cliente
-- =============================================================================

-- 1. Insertar o actualizar roles si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles') THEN
    CREATE TABLE roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(50) UNIQUE NOT NULL,
      descripcion TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO roles (nombre, descripcion) VALUES
      ('WORKSHOP_FREE', 'Taller Plan Free'),
      ('WORKSHOP_PRO', 'Taller Plan Pro'),
      ('CUSTOMER', 'Cliente Final'),
      ('DEVELOPER', 'Desarrollador'),
      ('ADMIN', 'Administrador')
    ON CONFLICT (nombre) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planes') THEN
    CREATE TABLE planes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(50) UNIQUE NOT NULL,
      precio NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO planes (nombre, precio) VALUES
      ('FREE', 0),
      ('PRO', 49.99),
      ('ENTERPRISE', 199.99),
      ('DEVELOPER_PLAN', 0)
    ON CONFLICT (nombre) DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'licencias') THEN
    CREATE TABLE licencias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
      plan_id UUID REFERENCES planes(id),
      estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'prueba', 'bloqueado', 'inactivo')),
      fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
      fecha_fin TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- 2. Asegurar columnas en usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol_id UUID REFERENCES roles(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES planes(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS licencia_id UUID REFERENCES licencias(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_developer BOOLEAN DEFAULT false;

-- 3. Insertar o actualizar usuarios de prueba
INSERT INTO usuarios (email, nombre, rol, activo, rol_id, plan_id, es_developer)
VALUES
  ('free@test.com', 'Taller Free', 'operario', true, 
   (SELECT id FROM roles WHERE nombre = 'WORKSHOP_FREE'), 
   (SELECT id FROM planes WHERE nombre = 'FREE'), false),

  ('pro@test.com', 'Taller Pro', 'jefe', true,
   (SELECT id FROM roles WHERE nombre = 'WORKSHOP_PRO'),
   (SELECT id FROM planes WHERE nombre = 'PRO'), false),

  ('cliente@test.com', 'Cliente Prueba', 'operario', true,
   (SELECT id FROM roles WHERE nombre = 'CUSTOMER'), 
   NULL, false)
ON CONFLICT (email) DO UPDATE 
SET rol_id = EXCLUDED.rol_id, plan_id = EXCLUDED.plan_id, es_developer = EXCLUDED.es_developer;

-- 4. Crear licencias para los talleres
INSERT INTO licencias (usuario_id, plan_id, estado, fecha_inicio, fecha_fin)
SELECT id, (SELECT id FROM planes WHERE nombre = 'FREE'), 'activo', NOW(), NOW() + INTERVAL '1 year'
FROM usuarios WHERE email = 'free@test.com'
AND NOT EXISTS (SELECT 1 FROM licencias WHERE usuario_id = usuarios.id);

INSERT INTO licencias (usuario_id, plan_id, estado, fecha_inicio, fecha_fin)
SELECT id, (SELECT id FROM planes WHERE nombre = 'PRO'), 'activo', NOW(), NOW() + INTERVAL '1 year'
FROM usuarios WHERE email = 'pro@test.com'
AND NOT EXISTS (SELECT 1 FROM licencias WHERE usuario_id = usuarios.id);

-- 5. Asignar licencia_id a los usuarios
UPDATE usuarios u
SET licencia_id = l.id
FROM licencias l
WHERE u.email IN ('free@test.com', 'pro@test.com') AND l.usuario_id = u.id;

-- 6. Crear cliente, vehÃ­culo y expediente para el portal de cliente
INSERT INTO clientes (id, nombre, email, telefono)
VALUES ('c1111111-1111-1111-1111-111111111111', 'Cliente Demo', 'cliente@demo.com', '600000000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehiculos (id, matricula, marca, modelo, cliente_id)
VALUES ('v1111111-1111-1111-1111-111111111111', '1234ABC', 'Seat', 'Leon', 'c1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reparaciones (id, cliente_id, vehiculo_id, estado, descripcion)
VALUES ('r1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', 'en_proceso', 'RevisiÃ³n general y cambio de aceite')
ON CONFLICT (id) DO NOTHING;

-- 7. Crear tabla e invitaciÃ³n para el cliente
CREATE TABLE IF NOT EXISTS cliente_invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT md5(random()::text),
  enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cliente_invitaciones (cliente_id, vehiculo_id, email, token, enviado)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'v1111111-1111-1111-1111-111111111111',
  'cliente@demo.com',
  'demo-token-1234',
  true
)
ON CONFLICT (token) DO NOTHING;
-- =============================================================================
-- MIGRACIÃ“N: Columnas de Notificaciones & WhatsApp en tabla configuracion
-- =============================================================================

ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS email_api_key TEXT,
ADD COLUMN IF NOT EXISTS email_from TEXT,
ADD COLUMN IF NOT EXISTS notificaciones_activas BOOLEAN DEFAULT false;
-- =============================================================================
-- MIGRACIÃ“N: Tabla para Likes / Favoritos de ImÃ¡genes de Clientes
-- =============================================================================

CREATE TABLE IF NOT EXISTS imagenes_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id UUID REFERENCES vehiculos(id) ON DELETE CASCADE,
  liked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_cliente_imagen UNIQUE (cliente_id, imagen_url)
);

-- Habilitar RLS
ALTER TABLE imagenes_likes ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas para acceso pÃºblico / cliente
CREATE POLICY "Permitir lectura publica imagenes_likes" ON imagenes_likes
  FOR SELECT USING (true);

CREATE POLICY "Permitir insertar/modificar imagenes_likes" ON imagenes_likes
  FOR ALL USING (true) WITH CHECK (true);
-- MigraciÃ³n: Sistema completo de gestiÃ³n de usuarios, roles, jerarquÃ­as, especialidades, epÃ­grafes IAE y configuraciÃ³n de planes

-- 1. Tabla de especialidades
CREATE TABLE IF NOT EXISTS especialidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de epÃ­grafes IAE
CREATE TABLE IF NOT EXISTS epigrafes_iae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de permisos y permisos especÃ­ficos por usuario
CREATE TABLE IF NOT EXISTS permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_permisos (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, permiso_id)
);

-- 4. Modificar roles para jerarquÃ­a
ALTER TABLE roles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES roles(id);

-- 5. Modificar usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS especialidad_id UUID REFERENCES especialidades(id),
ADD COLUMN IF NOT EXISTS epigrafe_iae_id UUID REFERENCES epigrafes_iae(id),
ADD COLUMN IF NOT EXISTS jefe_id UUID REFERENCES usuarios(id),  -- Jefe directo
ADD COLUMN IF NOT EXISTS es_practicas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_contratacion DATE,
ADD COLUMN IF NOT EXISTS salario_base DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS es_pro BOOLEAN DEFAULT false,  -- Si tiene acceso PRO (lo gestiona el jefe mientras no haya pago)
ADD COLUMN IF NOT EXISTS taller_id UUID,  -- Para agrupar usuarios por taller
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 6. Modificar configuracion para planes y lÃ­mites
ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS precio_pro_mensual DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS precio_pro_anual DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_prueba_pro INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pro_activo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS limite_usuarios_free INTEGER DEFAULT 3;

-- 7. Insertar especialidades iniciales
INSERT INTO especialidades (nombre, descripcion) VALUES
('MECANICA_GENERAL', 'MecÃ¡nica general de vehÃ­culos'),
('ELECTROMECANICA', 'Sistemas elÃ©ctricos y electrÃ³nicos'),
('CHAPA_Y_PINTURA', 'CarrocerÃ­a y pintura'),
('ADMINISTRACION', 'Tareas administrativas y de oficina'),
('ALMACEN', 'GestiÃ³n de inventario y piezas'),
('PRACTICAS', 'Personal en formaciÃ³n')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 8. Insertar epÃ­grafes IAE iniciales
INSERT INTO epigrafes_iae (codigo, descripcion) VALUES
('691.1', 'ReparaciÃ³n de automÃ³viles, bicicletas y otros vehÃ­culos'),
('691.2', 'ReparaciÃ³n de vehÃ­culos automÃ³viles, bicicletas y otros vehÃ­culos (detallado)'),
('843.6', 'Talleres de chapa y pintura de vehÃ­culos')
ON CONFLICT (codigo) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 9. Insertar permisos iniciales si no existen
INSERT INTO permisos (clave, descripcion) VALUES
('crear_presupuestos', 'Crear y editar presupuestos'),
('editar_precios', 'Modificar precios y tarifas'),
('aprobar_presupuestos', 'Aprobar presupuestos de clientes'),
('gestionar_citas', 'Crear, modificar y asignar citas'),
('crear_facturas', 'Emitir facturas a clientes'),
('enviar_gestoria', 'Exportar y enviar informes a gestorÃ­a'),
('gestionar_reparaciones', 'Actualizar estados y avances de reparaciÃ³n'),
('ver_balances', 'Ver balances, estadÃ­sticas y mÃ¡rgenes'),
('gestionar_proveedores', 'Gestionar proveedores y facturas recibidas'),
('gestionar_usuarios', 'Administrar empleados, roles y permisos'),
('configuracion_taller', 'Acceder y modificar configuraciÃ³n del taller')
ON CONFLICT (clave) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- 10. Insertar roles con jerarquÃ­a (ADMIN -> JEFE_TALLER -> ENCARGADOS -> OPERARIOS)
-- Nivel 0: ADMIN
INSERT INTO roles (nombre, descripcion, parent_id) VALUES
('ADMIN', 'Administrador del sistema', NULL)
ON CONFLICT (nombre) DO NOTHING;

-- Nivel 1: JEFE_TALLER
INSERT INTO roles (nombre, descripcion, parent_id) VALUES
('JEFE_TALLER', 'Jefe de taller', (SELECT id FROM roles WHERE nombre = 'ADMIN'))
ON CONFLICT (nombre) DO UPDATE SET parent_id = (SELECT id FROM roles WHERE nombre = 'ADMIN');

-- Nivel 2: ENCARGADOS & ÃREAS
INSERT INTO roles (nombre, descripcion, parent_id) VALUES
('ENCARGADO_MECANICA', 'Encargado de mecÃ¡nica', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('ENCARGADO_ELECTROMECANICA', 'Encargado de electromecÃ¡nica', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('ENCARGADO_CHAPA', 'Encargado de chapa', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('ENCARGADO_PINTURA', 'Encargado de pintura', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('ADMINISTRATIVO', 'Personal de administraciÃ³n', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('ALMACEN', 'Encargado de almacÃ©n', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER')),
('OPERARIO_PRACTICAS', 'Operario en prÃ¡cticas', (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER'))
ON CONFLICT (nombre) DO UPDATE SET parent_id = (SELECT id FROM roles WHERE nombre = 'JEFE_TALLER');

-- Nivel 3: OPERARIOS
INSERT INTO roles (nombre, descripcion, parent_id) VALUES
('OPERARIO_MECANICA', 'Operario de mecÃ¡nica', (SELECT id FROM roles WHERE nombre = 'ENCARGADO_MECANICA')),
('OPERARIO_ELECTROMECANICA', 'Operario de electromecÃ¡nica', (SELECT id FROM roles WHERE nombre = 'ENCARGADO_ELECTROMECANICA')),
('OPERARIO_CHAPA', 'Operario de chapa', (SELECT id FROM roles WHERE nombre = 'ENCARGADO_CHAPA')),
('OPERARIO_PINTURA', 'Operario de pintura', (SELECT id FROM roles WHERE nombre = 'ENCARGADO_PINTURA'))
ON CONFLICT (nombre) DO UPDATE SET parent_id = (
  CASE 
    WHEN nombre = 'OPERARIO_MECANICA' THEN (SELECT id FROM roles WHERE nombre = 'ENCARGADO_MECANICA')
    WHEN nombre = 'OPERARIO_ELECTROMECANICA' THEN (SELECT id FROM roles WHERE nombre = 'ENCARGADO_ELECTROMECANICA')
    WHEN nombre = 'OPERARIO_CHAPA' THEN (SELECT id FROM roles WHERE nombre = 'ENCARGADO_CHAPA')
    WHEN nombre = 'OPERARIO_PINTURA' THEN (SELECT id FROM roles WHERE nombre = 'ENCARGADO_PINTURA')
  END
);
-- MigraciÃ³n: PreparaciÃ³n de arquitectura para pagos y suscripciones (Stripe/Bizum)
-- Tablas de suscripciones, pagos de suscripciÃ³n, cupones y cupones de usuario

-- 1. Tabla de suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    taller_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan TEXT CHECK (plan IN ('mensual', 'anual')),
    estado TEXT CHECK (estado IN ('activo', 'cancelado', 'vencido', 'pendiente')),
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de pagos de suscripciones
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    importe DECIMAL(10,2) NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'EUR',
    estado TEXT CHECK (estado IN ('exitoso', 'fallido', 'pendiente')),
    fecha TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT UNIQUE NOT NULL,
    descuento_porcentaje INTEGER CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    valido_hasta TIMESTAMPTZ,
    usos_maximos INTEGER,
    usos_actuales INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de cupones asignados a usuarios
CREATE TABLE IF NOT EXISTS cupones_usuario (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    cupon_id UUID REFERENCES cupones(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (usuario_id, cupon_id)
);

-- 5. AÃ±adir columnas a usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_pro BOOLEAN DEFAULT false;

-- 6. AÃ±adir campos de configuraciÃ³n si no existen
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS limite_usuarios_free INTEGER DEFAULT 3;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS precio_pro_mensual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS precio_pro_anual DECIMAL(10,2) DEFAULT 0;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS dias_prueba_pro INTEGER DEFAULT 0;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS pro_activo BOOLEAN DEFAULT false;
