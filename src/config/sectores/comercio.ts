import type { SectorConfig } from './automocion';

export const comercioSector: SectorConfig = {
  id: 'comercio',
  nombre: 'Comercio, Venta y Servicios Generales',
  descripcion: 'Gestión comercial, tiendas, distribución, suministros y servicios profesionales.',
  flujo: ['CONTACTO / LEAD', 'PEDIDO / VENTA', 'PRESUPUESTO', 'ENTREGA / SERVICIO', 'COBRO / TICKET'],
  terminologia: {
    cliente: 'Comprador / Cliente',
    itemPrincipal: 'Pedido / Catálogo de Artículos',
    expediente: 'Registro de Venta',
    servicio: 'Venta / Suministro',
    documento: 'Ticket / Factura Comercial',
    responsable: 'Gestor Comercial / Agente'
  },
  modulos: ['clientes', 'pedidos', 'catalogo', 'presupuestos', 'facturas', 'proveedores', 'balances']
};
