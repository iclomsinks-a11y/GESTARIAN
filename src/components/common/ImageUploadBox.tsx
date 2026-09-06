import React, { useRef } from 'react'
import { Upload, Trash2, Image as ImageIcon, Check } from 'lucide-react'

interface ImageUploadBoxProps {
  id: string
  title: string
  description: string
  recommendedSize: string
  aspectRatio: 'portrait' | 'landscape' | 'square'
  value?: string | null
  onChange: (dataUrl: string) => void
  onRemove: () => void
}

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  id,
  title,
  description,
  recommendedSize,
  aspectRatio,
  value,
  onChange,
  onRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleBoxClick = () => {
    fileInputRef.current?.click()
  }

  // Aspect ratio visual sizing
  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[9/16] max-h-48'
      : aspectRatio === 'landscape'
      ? 'aspect-[16/9] max-h-36'
      : 'aspect-square max-h-32'

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-xs font-bold text-white leading-tight">{title}</h3>
          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-mono shrink-0">
            {recommendedSize}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">{description}</p>
      </div>

      {/* Hidden file input supporting touch and click on mobile/tablet */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        id={id}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop / Preview Area */}
      <div
        onClick={handleBoxClick}
        className={`w-full ${aspectClass} mx-auto rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center relative ${
          value
            ? 'border-emerald-500/40 bg-slate-900/90'
            : 'border-slate-700 hover:border-sky-500/60 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
        title="Tocar o hacer clic para seleccionar imagen"
      >
        {value ? (
          <div className="relative w-full h-full flex items-center justify-center p-2 group/preview">
            <img
              src={value}
              alt={title}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
              <span className="text-[11px] text-white font-medium bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                <Upload className="w-3 h-3" /> Cambiar
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto group-hover:text-sky-400 group-hover:bg-slate-700 transition-colors">
              <ImageIcon className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-slate-300">Pulsar para subir</p>
            <p className="text-[9px] text-slate-500">JPG, PNG, WebP</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
        {value ? (
          <>
            <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-medium">
              <Check className="w-3 h-3" /> Imagen cargada
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center gap-1"
              title="Eliminar imagen personalizada"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleBoxClick}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 text-[11px] font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Seleccionar imagen</span>
          </button>
        )}
      </div>
    </div>
  )
}
