import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface Props {
  value?: string;
  onChange: (base64: string | undefined) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Foto' }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {value ? (
        <div className="relative w-32 h-32">
          <img src={value} alt="preview" className="w-32 h-32 object-cover rounded-lg border" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
        >
          <Camera size={24} />
          <span className="text-xs mt-1">Adicionar foto</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
