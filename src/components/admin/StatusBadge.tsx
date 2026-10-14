import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/types';

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', ORDER_STATUS_STYLE[status], className)}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
