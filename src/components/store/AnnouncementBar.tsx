import { Crown } from 'lucide-react';

export function AnnouncementBar({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="border-b border-gold/15 bg-gold/[0.06] text-center text-[11px] font-medium tracking-wide text-gold-light sm:text-xs">
      <p className="container-store flex items-center justify-center gap-2 py-2">
        <Crown className="size-3.5 shrink-0 text-gold" aria-hidden />
        <span className="truncate">{text}</span>
      </p>
    </div>
  );
}
