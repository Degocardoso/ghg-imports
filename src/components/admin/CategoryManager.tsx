'use client';

import { CornerDownRight, LoaderCircle, Pencil, Plus, Trash, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteCategory, saveCategory } from '@/app/admin/_actions/catalog';
import type { ActionResult } from '@/lib/admin/action';
import { slugify } from '@/lib/format';
import type { Category } from '@/types';
import { FieldError, FormFeedback } from './FormFeedback';
import { ImageUploader } from './ImageUploader';
import { Toggle } from './ProductForm';

type Draft = {
  id?: string;
  name: string;
  slug: string;
  parent_id: string;
  description: string;
  image_url: string | null;
  sort_order: string;
  is_active: boolean;
};

const empty = (): Draft => ({ name: '', slug: '', parent_id: '', description: '', image_url: null, sort_order: '0', is_active: true });

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? result.fields ?? {} : {};

  const roots = categories.filter((c) => !c.parent_id);
  const ordered = roots.flatMap((r) => [r, ...categories.filter((c) => c.parent_id === r.id)]);
  const orphans = categories.filter((c) => c.parent_id && !categories.some((p) => p.id === c.parent_id));

  const edit = (c: Category) =>
    setDraft({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parent_id: c.parent_id ?? '',
      description: c.description ?? '',
      image_url: c.image_url,
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await saveCategory(draft);
      setResult(res);
      if (res.ok) {
        setDraft(null);
        router.refresh();
      }
    });
  };

  const remove = (c: Category) => {
    if (!confirm(`Eliminar a categoria "${c.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(c.id);
      setResult(res);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="text-sm text-muted">{categories.length} categorias</span>
          <button type="button" onClick={() => { setResult(null); setDraft(empty()); }} className="btn-gold px-4 py-2 text-xs">
            <Plus className="size-3.5" /> Nova categoria
          </button>
        </div>
        <ul className="divide-y divide-line">
          {[...ordered, ...orphans].map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              {c.parent_id && <CornerDownRight className="ml-2 size-4 text-zinc-600" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.name} {!c.is_active && <span className="ml-1 text-xs text-amber-300">(oculta)</span>}
                </p>
                <p className="text-xs text-muted">/{c.slug} · {counts[c.id] ?? 0} produto(s) · ordem {c.sort_order}</p>
              </div>
              <button type="button" onClick={() => { setResult(null); edit(c); }} className="rounded-lg p-2 text-muted hover:text-fg" aria-label={`Editar ${c.name}`}>
                <Pencil className="size-4" />
              </button>
              <button type="button" onClick={() => remove(c)} disabled={pending} className="rounded-lg p-2 text-muted hover:text-red-300" aria-label={`Eliminar ${c.name}`}>
                <Trash className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        {!draft && <FormFeedback result={result} />}
        {draft ? (
          <form onSubmit={submit} className="card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{draft.id ? 'Editar categoria' : 'Nova categoria'}</h2>
              <button type="button" onClick={() => setDraft(null)} className="rounded-full p-1.5 text-muted" aria-label="Fechar"><X className="size-4" /></button>
            </div>
            <div>
              <label className="label" htmlFor="c-name">Nome *</label>
              <input id="c-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label className="label" htmlFor="c-slug">Slug *</label>
              <input id="c-slug" className="input" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
              <FieldError message={errors.slug} />
            </div>
            <div>
              <label className="label" htmlFor="c-parent">Categoria-mãe</label>
              <select id="c-parent" className="input" value={draft.parent_id} onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}>
                <option value="">— Nenhuma (categoria principal)</option>
                {roots.filter((r) => r.id !== draft.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c-desc">Descrição (SEO)</label>
              <textarea id="c-desc" className="input min-h-20" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <ImageUploader bucket="banners" folder="categorias" label="Imagem (opcional)" max={1} value={draft.image_url ? [draft.image_url] : []} onChange={(urls) => setDraft({ ...draft, image_url: urls[0] ?? null })} />
            <div>
              <label className="label" htmlFor="c-order">Ordem</label>
              <input id="c-order" className="input" inputMode="numeric" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value.replace(/\D/g, '') })} />
            </div>
            <Toggle checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} label="Visível na loja" />
            <FormFeedback result={result} />
            <button type="submit" disabled={pending} className="btn-gold w-full">
              {pending && <LoaderCircle className="size-4 animate-spin" />} Salvar
            </button>
          </form>
        ) : (
          <p className="card p-5 text-sm text-muted">Selecione uma categoria para editar ou crie uma nova. As alterações aparecem na loja imediatamente.</p>
        )}
      </div>
    </div>
  );
}
