-- ── 1. CREACIÓN DE TABLAS PRINCIPALES ──
CREATE TABLE IF NOT EXISTS clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  dni         text,
  telefono    text,
  email       text,
  direccion   text,
  cp          text,
  localidad   text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_clientes" ON clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS vehiculos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  matricula   text NOT NULL,
  marca       text,
  modelo      text,
  anio        int,
  vin         text,
  fotos       jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_vehiculos" ON vehiculos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS presupuestos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero        text NOT NULL DEFAULT '',
  cliente_id    uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id   uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  estado        text NOT NULL DEFAULT 'pendiente',
  conceptos     jsonb NOT NULL DEFAULT '[]'::jsonb,
  total         numeric(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  fecha         date DEFAULT CURRENT_DATE,
  fecha_entrega date,
  fotos         jsonb DEFAULT '[]'::jsonb,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_presupuestos" ON presupuestos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS citas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id  uuid REFERENCES presupuestos(id) ON DELETE SET NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id     uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  fecha           date NOT NULL,
  hora            text,
  estado          text NOT NULL DEFAULT 'pendiente',
  observaciones   text,
  fotos           jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_citas" ON citas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reparaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id     uuid REFERENCES citas(id) ON DELETE SET NULL,
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  estado      text NOT NULL DEFAULT 'en_proceso',
  descripcion text,
  fotos       jsonb DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE reparaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_reparaciones" ON reparaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS facturas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          text NOT NULL DEFAULT '',
  reparacion_id   uuid REFERENCES reparaciones(id) ON DELETE SET NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id     uuid REFERENCES vehiculos(id) ON DELETE SET NULL,
  conceptos       jsonb NOT NULL DEFAULT '[]'::jsonb,
  total           numeric(10,2) NOT NULL DEFAULT 0,
  total_abonado   numeric(10,2) NOT NULL DEFAULT 0,
  estado_cobro    text NOT NULL DEFAULT 'pendiente',
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  fotos           jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_facturas" ON facturas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS cobros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id  uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  importe     numeric(10,2) NOT NULL,
  fecha       date NOT NULL DEFAULT CURRENT_DATE,
  metodo      text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_cobros" ON cobros FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS configuracion (
  id                     int PRIMARY KEY DEFAULT 1,
  nombre_empresa         text DEFAULT 'GESTARIAN TALLER',
  cif                    text,
  direccion              text,
  telefono               text,
  email                  text,
  iva_defecto            numeric(5,2) DEFAULT 21.00,
  horario_taller         jsonb DEFAULT '{"apertura":"08:00","cierre":"20:00"}'::jsonb,
  ai_provider            text DEFAULT 'gemini',
  ai_model               text DEFAULT 'gemini-3.7-flash',
  ai_api_key             text,
  doc_ocr_provider       text DEFAULT 'gemini',
  doc_ocr_model          text DEFAULT 'gemini-3.7-flash',
  doc_ocr_api_key        text,
  plate_recognizer_api_key text,
  created_at             timestamptz DEFAULT now()
);
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_configuracion" ON configuracion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO configuracion (id, nombre_empresa) VALUES (1, 'GESTARIAN TALLER') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS expediente_imagenes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  uuid REFERENCES clientes(id) ON DELETE CASCADE,
  vehiculo_id uuid REFERENCES vehiculos(id) ON DELETE CASCADE,
  url         text NOT NULL,
  categoria   text DEFAULT 'fotos',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE expediente_imagenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_crud_expediente_imagenes" ON expediente_imagenes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── 2. POLÍTICA DE STORAGE BUCKET ──
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gestarian-files', 'gestarian-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Access" ON storage.objects
FOR ALL TO anon, authenticated
USING (bucket_id = 'gestarian-files')
WITH CHECK (bucket_id = 'gestarian-files');
