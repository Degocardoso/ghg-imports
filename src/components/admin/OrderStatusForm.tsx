'use client';

import { LoaderCircle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { updateOrder } from '@/app/admin/_actions/orders';
import type { ActionResult } from '@/lib/admin/action';
import { cn } from '@/lib/cn';
import { ORDER_STATUS_LABEL } from '@/lib/constants';
import { ORDER_STATUSES, type OrderStatus } from '@/types';
import { FormFeedback } from './FormFeedback';

const COMMITTED: OrderStatus[] = ['confirmado', 'pago', 'enviado', 'concluido'];

export function OrderStatusForm({ id, status, adminNotes, stockCommitted }: { id: string; status: OrderStatus; adminNotes: string | null; stockCommitted: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(status);
  const [notes, setNotes] = useState(adminNotes ?? '');
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const willCommit = !stockCommitted && COMMITTED.includes(value);
  const willRestore = stockCommitted && !COMMITTED.includes(value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === 'cancelado' && status !== 'cancelado' && !confirm('Cancelar este pedido?')) return;
    startTransition(async () => {
      const res = await updateOrder({ id, status: value, admin_notes: notes });
      setResult(res);
      if (res.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <h2 className="text-sm font-semibold tracking-wide text-gold-light uppercase">Estado do pedido</h2>
      <div className="grid grid-cols-2 gap-2">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValue(s)}
            aria-pressed={value === s}
            className={cn(
              'rounded-xl border px-3 py-2 text-left text-xs font-medium transition',
              value === s ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted hover:border-zinc-500',
              s === 'cancelado' && value === s && 'border-danger bg-danger/10 text-red-300',
            )}
          >
            {ORDER_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {willCommit && <p className="rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold-light">Ao salvar, o estoque dos itens será abatido.</p>}
      {willRestore && <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Ao salvar, o estoque dos itens será reposto.</p>}
      <div>
        <label className="label" htmlFor="admin-notes">Notas internas</label>
        <textarea id="admin-notes" className="input min-h-24" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Frete combinado, código de rastreio, forma de pagamento…" />
      </div>
      <FormFeedback result={result} />
      <button type="submit" disabled={pending || (value === status && notes === (adminNotes ?? ''))} className="btn-gold w-full">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
      </button>
    </form>
  );
}
