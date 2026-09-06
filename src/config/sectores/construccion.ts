import type { SectorConfig } from './automocion';

export const construccionSector: SectorConfig = {
  id: 'construccion',
  nombre: 'Construcción, Reformas e Instalaciones',
  descripcion: 'Gestión de proyectos, obras, reformas integrales, fontanería, electricidad y mantenimiento.',
  flujo: ['ESTUDIO / MEDICIÓN', 'PROYECTO', 'PRESUPUESTO', 'EJECUCIÓN OBRA', 'CERTIFICACIÓN / FACTURA'],
  terminologia: {
    cliente: 'Promotor / Cliente',
    itemPrincipal: 'Obra / Emplazamiento',
    expediente: 'Expediente de Obra',
    servicio: 'Partida / Unidad de Obra',
    documento: 'Presupuesto / Certificación',
    responsable: 'Jefe de Obra / Encargado'
  },
  modulos: ['clientes', 'obras', 'expedientes', 'presupuestos', 'partidas', 'facturas', 'proveedores', 'balances']
};
