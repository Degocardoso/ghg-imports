import { BADGE_LABEL } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Badge } from '@/types';

const STYLES: Record<Badge | 'desconto' | 'esgotado', string> = {
  lancamento: 'bg-gold-gradient text-ink',
  destaque: 'bg-ink/80 text-gold-light ring-1 ring-gold/50 backdrop-blur',
  oferta: 'bg-red-600 text-white',
  desconto: 'bg-success text-white',
  esgotado: 'bg-zinc-800/90 text-zinc-300 ring-1 ring-white/10',
};

export function ProductBadge({
  kind,
  label,
  className,
}: {
  kind: Badge | 'desconto' | 'esgotado';
  label?: string;
  className?: string;
}) {
  const text = label ?? (kind === 'esgotado' ? 'Esgotado' : kind === 'desconto' ? '' : BADGE_LABEL[kind]);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase',
        STYLES[kind],
        className,
      )}
    >
      {text}
    </span>
  );
}
