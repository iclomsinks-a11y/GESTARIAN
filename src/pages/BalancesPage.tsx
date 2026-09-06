import React, { useState } from 'react'
import { TrendingUp, Download, FileSpreadsheet, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, ShieldCheck, FileCheck } from 'lucide-react'
import { useToast } from '../lib/ToastContext'
import { gestoriaExportService } from '../services/gestoriaExportService'

export const BalancesPage: React.FC = () => {
  const [selectedTrimestre, setSelectedTrimestre] = useState('1T')
  const [selectedYear, setSelectedYear] = useState('2026')
  const { addToast } = useToast()

  const fiscalData = {
    ingresos: 24500.00,
    gastos: 14200.00,
    ivaRepercutido: 5145.00,
    ivaSoportado: 2982.00,
    ivaLiquidar: 2163.00,
    beneficioNeto: 10300.00
  }

  const handleExportFiscal = () => {
    try {
      gestoriaExportService.exportTrimestre(selectedTrimestre, selectedYear)
      addToast(`Paquete contable ${selectedTrimestre}-${selectedYear} exportado para la gestoría`, 'success')
    } catch {
      addToast('Error generando archivo contable', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-teal-400" />
            Balances y Cierre Fiscal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Resumen contable de IVA, bases imponibles y exportaciones estructuradas para la gestoría (Modelos AEAT).
          </p>
        </div>

        <button
          onClick={handleExportFiscal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Exportar a Gestoría (Excel/CSV)
        </button>
      </div>

      {/* Quarter selector */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 w-fit">
        {['1T', '2T', '3T', '4T'].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTrimestre(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTrimestre === t
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t} Trimestre
          </button>
        ))}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Facturación Bruta ({selectedTrimestre})</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{fiscalData.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
          <div className="text-xs text-emerald-400 mt-1">+14.2% respecto al trimestre anterior</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Gastos y Recambios ({selectedTrimestre})</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{fiscalData.gastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
          <div className="text-xs text-slate-400 mt-1">Compras proveedores y suministros</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rendimiento Neto de Taller</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">{fiscalData.beneficioNeto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
          <div className="text-xs text-slate-400 mt-1">Beneficio antes de IRPF / IS</div>
        </div>
      </div>

      {/* Fiscal Breakdown / Modelo 303 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-teal-400" />
          Previsión Liquidación Modelo 303 (IVA Trimestral)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">IVA Repercutido (21% sobre ventas):</span>
            <div className="text-lg font-bold text-white">+{fiscalData.ivaRepercutido.toFixed(2)} €</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400">IVA Soportado Deducible (compras):</span>
            <div className="text-lg font-bold text-slate-300">-{fiscalData.ivaSoportado.toFixed(2)} €</div>
          </div>

          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-1">
            <span className="text-teal-400 font-semibold">Resultado a Ingresar AEAT:</span>
            <div className="text-lg font-black text-teal-300">={fiscalData.ivaLiquidar.toFixed(2)} €</div>
          </div>
        </div>
      </div>
    </div>
  )
}
