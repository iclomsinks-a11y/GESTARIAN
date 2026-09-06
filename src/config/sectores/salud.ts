import type { SectorConfig } from './automocion';

export const saludSector: SectorConfig = {
  id: 'salud',
  nombre: 'Salud, Clínicas y Bienestar',
  descripcion: 'Gestión para clínicas, centros médicos, fisioterapia, odontología y estética.',
  flujo: ['CITA', 'TRIAJE / HISTORIAL', 'VALORACIÓN', 'TRATAMIENTO', 'FACTURACIÓN'],
  terminologia: {
    cliente: 'Paciente / Usuario',
    itemPrincipal: 'Historial Clínico / Expediente',
    expediente: 'Historia Médica',
    servicio: 'Consulta / Tratamiento',
    documento: 'Presupuesto Médico / Factura',
    responsable: 'Especialista / Facultativo'
  },
  modulos: ['pacientes', 'citas', 'historiales', 'presupuestos', 'tratamientos', 'facturas', 'balances']
};
