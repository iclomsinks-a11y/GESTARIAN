import React from 'react'
import { Sparkles } from 'lucide-react'
import { MetisChat } from '../components/MetisChat'

export const MetisIAPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-sky-400" />
            METIS IA · Asistente Técnico y Operativo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Inteligencia artificial con contexto dinámico de taller: diagnosis de averías, presupuestos con IVA, facturación Veri*Factu y modo de conversación continua de tú a tú.
          </p>
        </div>
      </div>

      {/* Main Integrated Metis Chat Component with Voice & Bidirectional Mode */}
      <MetisChat className="h-[680px]" />
    </div>
  )
}

