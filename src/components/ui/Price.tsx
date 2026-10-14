import { cn } from '@/lib/cn';
import { discountPercent, formatPrice } from '@/lib/format';

interface PriceProps {
  price: number;
  compareAt?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  fromLabel?: boolean;
  className?: string;
}

/** Preço com "de/por" e percentagem de desconto calculada automaticamente. */
export function Price({ price, compareAt, size = 'md', showPercent = true, fromLabel, className }: PriceProps) {
  const pct = discountPercent(price, compareAt);
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      {fromLabel && <span className="w-full text-[11px] font-medium text-muted">a partir de</span>}
      {pct > 0 && (
        <span className={cn('text-muted line-through', size === 'lg' ? 'text-base' : 'text-xs')}>
          {formatPrice(compareAt)}
        </span>
      )}
      <span
        className={cn(
          'font-bold text-fg',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-3xl tracking-tight',
        )}
      >
        {formatPrice(price)}
      </span>
      {showPercent && pct > 0 && (
        <span className={cn('font-semibold text-success', size === 'lg' ? 'text-sm' : 'text-xs')}>-{pct}%</span>
      )}
    </div>
  );
}
