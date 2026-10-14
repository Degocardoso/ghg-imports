'use client';

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Star, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { createClient } from '@/lib/supabase/client';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_MB = 5;

interface Props {
  bucket: 'products' | 'banners';
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  aspect?: string;
}

/**
 * Carregamento múltiplo direto para o Supabase Storage (sessão do admin;
 * as políticas do bucket exigem is_admin()). Permite reordenar e definir capa.
 */
export function ImageUploader({ bucket, folder, value, onChange, max = 12, label = 'Imagens', aspect = 'aspect-square' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`Máximo de ${max} imagens.`);

    const invalid = list.find((f) => !ACCEPTED.includes(f.type) || f.size > MAX_MB * 1024 * 1024);
    if (invalid) {
      setError(`"${invalid.name}": use JPG, PNG, WebP ou AVIF até ${MAX_MB} MB.`);
      return;
    }

    const supabase = createClient();
    setUploading(list.length);
    const results = await Promise.allSettled(
      list.map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '31536000',
          contentType: file.type,
          upsert: false,
        });
        if (upError) throw upError;
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      }),
    );
    setUploading(0);

    const urls = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) setError(`${failed} imagem(ns) falharam no envio. Verifique a sessão e tente novamente.`);
    if (urls.length) onChange([...value, ...urls]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {value.map((url, i) => (
          <div key={url} className={cn('group relative overflow-hidden rounded-xl border bg-surface-2', aspect, i === 0 && max > 1 ? 'border-gold' : 'border-line')}>
            <Image src={url} alt="" fill sizes="160px" className="object-cover" />
            {i === 0 && max > 1 && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold text-ink uppercase">Capa</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {max > 1 ? (
                <span className="flex gap-0.5">
                  <IconBtn label="Mover para a esquerda" onClick={() => move(i, i - 1)}><ArrowLeft className="size-3.5" /></IconBtn>
                  <IconBtn label="Definir como capa" onClick={() => move(i, 0)}><Star className="size-3.5" /></IconBtn>
                  <IconBtn label="Mover para a direita" onClick={() => move(i, i + 1)}><ArrowRight className="size-3.5" /></IconBtn>
                </span>
              ) : <span />}
              <IconBtn label="Remover imagem" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-3.5" /></IconBtn>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading > 0}
            className={cn('flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-xs text-muted transition hover:border-gold/60 hover:text-gold-light', aspect)}
          >
            {uploading ? <LoaderCircle className="size-5 animate-spin text-gold" /> : <ImagePlus className="size-5" />}
            {uploading ? `Enviando ${uploading}…` : 'Adicionar'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} multiple={max > 1} hidden onChange={(e) => upload(e.target.files)} />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-md p-1 text-white hover:bg-white/20">
      {children}
    </button>
  );
}
