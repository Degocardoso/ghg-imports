'use client';

import { LoaderCircle, Pencil, Plus, Trash, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteBanner, saveBanner } from '@/app/admin/_actions/catalog';
import type { ActionResult } from '@/lib/admin/action';
import type { Banner } from '@/types';
import { FieldError, FormFeedback } from './FormFeedback';
import { ImageUploader } from './ImageUploader';
import { Toggle } from './ProductForm';

type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
  mobile_image_url: string | null;
  sort_order: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
};

/** ISO → valor para <input type="datetime-local"> (hora local do browser). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const empty = (): Draft => ({
  title: '', subtitle: '', eyebrow: '', cta_label: 'Comprar agora', cta_href: '/catalogo',
  image_url: '', mobile_image_url: null, sort_order: '0', is_active: true, starts_at: '', ends_at: '',
});

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? result.fields ?? {} : {};

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await saveBanner({
        ...draft,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      });
      setResult(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const [now] = useState(() => Date.now());
  const isLive = (b: Banner) =>
    b.is_active && (!b.starts_at || new Date(b.starts_at).getTime() <= now) && (!b.ends_at || new Date(b.ends_at).getTime() > now);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={() => { setResult(null); setDraft(empty()); }} className="btn-gold">
          <Plus className="size-4" /> Novo banner
        </button>
      </div>
      {!draft && <FormFeedback result={result} />}

      {draft && (
        <form onSubmit={submit} className="card space-y-5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{draft.id ? 'Editar banner' : 'Novo banner'}</h2>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full p-1.5 text-muted" aria-label="Fechar"><X className="size-4" /></button>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <ImageUploader bucket="banners" folder="hero" label="Imagem desktop * (1920×800)" max={1} aspect="aspect-[12/5]" value={draft.image_url ? [draft.image_url] : []} onChange={(u) => setDraft({ ...draft, image_url: u[0] ?? '' })} />
              <FieldError message={errors.image_url} />
            </div>
            <ImageUploader bucket="banners" folder="hero" label="Imagem mobile (opcional, 800×1000)" max={1} aspect="aspect-[4/5]" value={draft.mobile_image_url ? [draft.mobile_image_url] : []} onChange={(u) => setDraft({ ...draft, mobile_image_url: u[0] ?? null })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Etiqueta (acima do título)" value={draft.eyebrow} onChange={(v) => setDraft({ ...draft, eyebrow: v })} placeholder="Lançamento" error={errors.eyebrow} />
            <Input label="Título *" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Vista o manto. Viva a glória." error={errors.title} />
            <div className="sm:col-span-2">
              <Input label="Subtítulo" value={draft.subtitle} onChange={(v) => setDraft({ ...draft, subtitle: v })} error={errors.subtitle} />
            </div>
            <Input label="Texto do botão" value={draft.cta_label} onChange={(v) => setDraft({ ...draft, cta_label: v })} error={errors.cta_label} />
            <Input label="Link do botão" value={draft.cta_href} onChange={(v) => setDraft({ ...draft, cta_href: v })} placeholder="/catalogo?categoria=perfumes" error={errors.cta_href} />
            <Input label="Início (opcional)" type="datetime-local" value={draft.starts_at} onChange={(v) => setDraft({ ...draft, starts_at: v })} error={errors.starts_at} />
            <Input label="Fim (opcional)" type="datetime-local" value={draft.ends_at} onChange={(v) => setDraft({ ...draft, ends_at: v })} error={errors.ends_at} />
            <Input label="Ordem" value={draft.sort_order} onChange={(v) => setDraft({ ...draft, sort_order: v.replace(/\D/g, '') })} />
            <div className="flex items-end pb-2">
              <Toggle checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} label="Ativo" />
            </div>
          </div>
          <FormFeedback result={result} />
          <button type="submit" disabled={pending} className="btn-gold">
            {pending && <LoaderCircle className="size-4 animate-spin" />} Salvar banner
          </button>
        </form>
      )}

      {banners.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">
          Sem banners — a loja mostra os destaques padrão da marca. Crie o primeiro para personalizar a página inicial.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {banners.map((b) => (
            <li key={b.id} className="card overflow-hidden">
              <div className="relative aspect-[12/5] bg-surface-2">
                <Image src={b.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isLive(b) ? 'bg-success text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                  {isLive(b) ? 'No ar' : b.is_active ? 'Agendado/expirado' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.title}</p>
                  <p className="truncate text-xs text-muted">{b.cta_href ?? 'Sem link'} · ordem {b.sort_order}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setDraft({
                      id: b.id, title: b.title, subtitle: b.subtitle ?? '', eyebrow: b.eyebrow ?? '', cta_label: b.cta_label ?? '',
                      cta_href: b.cta_href ?? '', image_url: b.image_url, mobile_image_url: b.mobile_image_url,
                      sort_order: String(b.sort_order), is_active: b.is_active, starts_at: toLocalInput(b.starts_at), ends_at: toLocalInput(b.ends_at),
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-lg p-2 text-muted hover:text-fg"
                  aria-label="Editar banner"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('Eliminar este banner?')) return;
                    startTransition(async () => {
                      setResult(await deleteBanner(b.id));
                      router.refresh();
                    });
                  }}
                  className="rounded-lg p-2 text-muted hover:text-red-300"
                  aria-label="Eliminar banner"
                >
                  <Trash className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, error, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; type?: string }) {
  return (
    <div>
      <label className="label">
        {label}
        <input type={type} className="input mt-1.5 normal-case" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />
      </label>
      <FieldError message={error} />
    </div>
  );
}
