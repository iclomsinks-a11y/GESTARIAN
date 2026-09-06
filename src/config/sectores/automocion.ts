export interface SectorConfig {
  id: 'automocion' | 'salud' | 'construccion' | 'comercio';
  nombre: string;
  descripcion: string;
  flujo: string[];
  terminologia: {
    cliente: string;
    itemPrincipal: string;
    expediente: string;
    servicio: string;
    documento: string;
    responsable: string;
  };
  modulos: string[];
}

export const automocionSector: SectorConfig = {
  id: 'automocion',
  nombre: 'Automoción y Talleres Mecánicos',
  descripcion: 'Gestión integral de talleres mecánicos, chapa, pintura y electromovilidad.',
  flujo: ['RECEPCIÓN', 'DIAGNÓSTICO', 'PRESUPUESTO', 'REPARACIÓN', 'FACTURACIÓN'],
  terminologia: {
    cliente: 'Cliente / Propietario',
    itemPrincipal: 'Vehículo / Matrícula',
    expediente: 'Expediente de Taller',
    servicio: 'Reparación / Mantenimiento',
    documento: 'Presupuesto / Factura',
    responsable: 'Jefe de Taller / Mecánico'
  },
  modulos: ['clientes', 'vehiculos', 'expedientes', 'presupuestos', 'citas', 'reparaciones', 'facturas', 'balances']
};
