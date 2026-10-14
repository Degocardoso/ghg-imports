import { CircleCheck, TriangleAlert } from 'lucide-react';
import type { ActionResult } from '@/lib/admin/action';
import { cn } from '@/lib/cn';

export function FormFeedback({ result, className }: { result: ActionResult<unknown> | null; className?: string }) {
  if (!result) return null;
  const ok = result.ok;
  const text = ok ? result.message : result.error;
  if (!text) return null;
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm',
        ok ? 'border-success/30 bg-success/10 text-green-300' : 'border-danger/30 bg-danger/10 text-red-300',
        className,
      )}
    >
      {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
      {text}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs text-red-300">{message}</p> : null;
}
