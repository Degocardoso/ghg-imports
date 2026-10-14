'use client';

import { ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';

/** Galeria com troca rápida de miniaturas e zoom que segue o cursor. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  if (!current) {
    return <div className="grid aspect-square place-items-center rounded-card border border-line bg-surface text-muted">Sem imagem</div>;
  }

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto lg:max-h-[600px] lg:flex-col lg:overflow-y-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2 transition sm:size-20',
                i === active ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100',
              )}
              aria-label={`Ver imagem ${i + 1}`}
              aria-current={i === active}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-card border border-line bg-surface-2"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-200"
          style={
            zoom
              ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />
        {!zoom && (
          <span className="pointer-events-none absolute right-3 bottom-3 hidden items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs text-muted backdrop-blur lg:flex">
            <ZoomIn className="size-3.5" /> Passe o mouse para ampliar
          </span>
        )}
      </div>
    </div>
  );
}
