'use client';

import { LoaderCircle, Plus, Save, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveProduct } from '@/app/admin/_actions/products';
import type { ActionResult } from '@/lib/admin/action';
import { cn } from '@/lib/cn';
import { BADGE_LABEL, GENDER_LABEL, SIZE_PRESETS, VARIANT_KIND_LABEL } from '@/lib/constants';
import { discountPercent, slugify } from '@/lib/format';
import { BADGES, GENDERS, VARIANT_KINDS, type Category, type Product, type ProductVariant, type VariantKind } from '@/types';
import { FieldError, FormFeedback } from './FormFeedback';
import { ImageUploader } from './ImageUploader';

interface VariantRow {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  compare_at_price: string;
  stock: string;
  is_active: boolean;
}

const toRow = (v?: Partial<ProductVariant>): VariantRow => ({
  key: v?.id ?? crypto.randomUUID(),
  id: v?.id,
  size: v?.size ?? '',
  color: v?.color ?? '',
  sku: v?.sku ?? '',
  price: v?.price != null ? String(v.price) : '',
  compare_at_price: v?.compare_at_price != null ? String(v.compare_at_price) : '',
  stock: v?.stock != null ? String(v.stock) : '0',
  is_active: v?.is_active ?? true,
});

interface Props {
  product?: Product & { product_variants: ProductVariant[] };
  categories: Category[];
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<{ id: string }> | null>(null);
  const [folder] = useState(() => product?.id ?? `novo-${crypto.randomUUID()}`);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [description, setDescription] = useState(product?.description ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '');
  const [gender, setGender] = useState<string>(product?.gender ?? '');
  const [variantKind, setVariantKind] = useState<VariantKind>(product?.variant_kind ?? 'vestuario');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [compareAt, setCompareAt] = useState(product?.compare_at_price != null ? String(product.compare_at_price) : '');
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [badge, setBadge] = useState<string>(product?.badge ?? '');
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [tags, setTags] = useState((product?.tags ?? []).join(', '));
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.product_variants.length
      ? [...product.product_variants].sort((a, b) => a.sort_order - b.sort_order).map(toRow)
      : [toRow()],
  );

  const errors = result && !result.ok ? result.fields ?? {} : {};
  const pct = discountPercent(Number(price), Number(compareAt) || null);
  const totalStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((list) => list.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const applyPreset = () => {
    const existing = new Set(variants.map((v) => v.size.toLowerCase()));
    const missing = SIZE_PRESETS[variantKind].filter((s) => !existing.has(s.toLowerCase()));
    const base = variants.filter((v) => v.size || v.id);
    setVariants([...base, ...missing.map((size) => toRow({ size, stock: 0 }))]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await saveProduct(product?.id ?? null, {
        name,
        slug,
        description,
        brand,
        category_id: categoryId,
        gender,
        variant_kind: variantKind,
        price,
        compare_at_price: compareAt,
        images,
        badge,
        is_featured: isFeatured,
        is_active: isActive,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        variants: variants.map((v) => ({
          id: v.id,
          size: variantKind === 'unico' && variants.length === 1 ? v.size || null : v.size,
          color: v.color,
          sku: v.sku,
          price: v.price,
          compare_at_price: v.compare_at_price,
          stock: v.stock,
          is_active: v.is_active,
        })),
      });
      setResult(res);
      if (res.ok) {
        if (!product && res.data) router.replace(`/admin/produtos/${res.data.id}`);
        else router.refresh();
      }
    });
  };

  const roots = categories.filter((c) => !c.parent_id);

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Informação principal">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-name">Nome *</label>
              <input
                id="p-name"
                className="input"
                value={name}
                aria-invalid={Boolean(errors.name)}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Camisa Brasil I 2026 Torcedor"
              />
              <FieldError message={errors.name} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-slug">URL (slug) *</label>
              <div className="flex items-center rounded-xl border border-line bg-surface-2 pl-3.5 text-sm text-muted focus-within:border-gold/70">
                /produto/
                <input
                  id="p-slug"
                  className="w-full bg-transparent py-2.5 pr-3.5 text-fg outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <FieldError message={errors.slug} />
            </div>
            <div>
              <label className="label" htmlFor="p-brand">Marca</label>
              <input id="p-brand" className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Nike, Adidas, Dior…" />
            </div>
            <div>
              <label className="label" htmlFor="p-category">Categoria</label>
              <select id="p-category" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sem categoria</option>
                {roots.map((root) => (
                  <optgroup key={root.id} label={root.name}>
                    <option value={root.id}>{root.name} (geral)</option>
                    {categories.filter((c) => c.parent_id === root.id).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-desc">Descrição</label>
              <textarea id="p-desc" className="input min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Materiais, modelagem, notas olfativas, dicas de tamanho…" />
              <FieldError message={errors.description} />
            </div>
          </div>
        </Card>

        <Card title="Imagens">
          <ImageUploader bucket="products" folder={folder} value={images} onChange={setImages} />
          <FieldError message={errors.images} />
        </Card>

        <Card title="Preço">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="p-price">Preço de venda (R$) *</label>
              <input id="p-price" className="input" inputMode="decimal" value={price} aria-invalid={Boolean(errors.price)} onChange={(e) => setPrice(e.target.value.replace(',', '.'))} placeholder="299.90" />
              <FieldError message={errors.price} />
            </div>
            <div>
              <label className="label" htmlFor="p-compare">Preço original “de” (R$)</label>
              <input id="p-compare" className="input" inputMode="decimal" value={compareAt} aria-invalid={Boolean(errors.compare_at_price)} onChange={(e) => setCompareAt(e.target.value.replace(',', '.'))} placeholder="399.90" />
              <FieldError message={errors.compare_at_price} />
            </div>
            <div className="flex items-end">
              <p className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm">
                Desconto: <strong className={pct > 0 ? 'text-success' : 'text-muted'}>{pct > 0 ? `${pct}%` : '—'}</strong>
              </p>
            </div>
          </div>
        </Card>

        <Card
          title={`Variantes e estoque (${totalStock} un.)`}
          actions={
            variantKind !== 'unico' && (
              <button type="button" onClick={applyPreset} className="btn-ghost px-3 py-1.5 text-xs">
                Preencher {VARIANT_KIND_LABEL[variantKind].option.toLowerCase()}s padrão
              </button>
            )
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {VARIANT_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setVariantKind(k)}
                className={cn('rounded-full border px-3 py-1.5 text-xs font-medium', variantKind === k ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted')}
              >
                {VARIANT_KIND_LABEL[k].admin}
              </button>
            ))}
          </div>
          {errors.variants && <FieldError message={errors.variants} />}
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                  <th className="pb-2 font-medium">{VARIANT_KIND_LABEL[variantKind].option}</th>
                  <th className="pb-2 font-medium">Cor</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium" title="Deixe vazio para usar o preço do produto">Preço próprio</th>
                  <th className="pb-2 font-medium">Preço “de”</th>
                  <th className="pb-2 font-medium">Estoque</th>
                  <th className="pb-2 font-medium">Ativa</th>
                  <th />
                </tr>
              </thead>
              <tbody className="align-top">
                {variants.map((v, i) => (
                  <tr key={v.key}>
                    <td className="py-1 pr-2">
                      <input className="input py-2" value={v.size} placeholder={variantKind === 'unico' ? 'Único' : SIZE_PRESETS[variantKind][2]} onChange={(e) => updateVariant(v.key, { size: e.target.value })} aria-invalid={Boolean(errors[`variants.${i}.size`])} />
                      <FieldError message={errors[`variants.${i}.size`]} />
                    </td>
                    <td className="py-1 pr-2"><input className="input py-2" value={v.color} placeholder="Preto" onChange={(e) => updateVariant(v.key, { color: e.target.value })} /></td>
                    <td className="py-1 pr-2"><input className="input py-2" value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value })} /></td>
                    <td className="py-1 pr-2"><input className="input py-2" inputMode="decimal" value={v.price} placeholder="—" onChange={(e) => updateVariant(v.key, { price: e.target.value.replace(',', '.') })} /></td>
                    <td className="py-1 pr-2"><input className="input py-2" inputMode="decimal" value={v.compare_at_price} placeholder="—" onChange={(e) => updateVariant(v.key, { compare_at_price: e.target.value.replace(',', '.') })} /></td>
                    <td className="w-24 py-1 pr-2">
                      <input className={cn('input py-2', Number(v.stock) === 0 && 'text-red-300')} inputMode="numeric" value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value.replace(/\D/g, '') })} aria-invalid={Boolean(errors[`variants.${i}.stock`])} />
                    </td>
                    <td className="py-3 pr-2 text-center">
                      <input type="checkbox" checked={v.is_active} onChange={(e) => updateVariant(v.key, { is_active: e.target.checked })} className="size-4 accent-[#d4af37]" aria-label="Variante ativa" />
                    </td>
                    <td className="py-1">
                      <button type="button" onClick={() => setVariants((list) => list.filter((x) => x.key !== v.key))} disabled={variants.length === 1} className="rounded-lg p-2 text-muted hover:text-red-300 disabled:opacity-30" aria-label="Remover variante">
                        <Trash className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setVariants((list) => [...list, toRow()])} className="btn-outline mt-3 px-3 py-2 text-xs">
            <Plus className="size-3.5" /> Adicionar variante
          </button>
          <p className="mt-3 text-xs text-muted">
            O estoque é abatido automaticamente quando um pedido passa a <strong>Confirmado</strong> e reposto se for cancelado.
          </p>
        </Card>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card title="Publicação">
          <div className="space-y-3">
            <Toggle checked={isActive} onChange={setIsActive} label="Visível na loja" hint="Desative para ocultar temporariamente." />
            <Toggle checked={isFeatured} onChange={setIsFeatured} label="Destaque na página inicial" />
          </div>
        </Card>
        <Card title="Organização">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="p-badge">Etiqueta promocional</label>
              <select id="p-badge" className="input" value={badge} onChange={(e) => setBadge(e.target.value)}>
                <option value="">Nenhuma</option>
                {BADGES.map((b) => <option key={b} value={b}>{BADGE_LABEL[b]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-gender">Gênero</label>
              <select id="p-gender" className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Não se aplica</option>
                {GENDERS.map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-tags">Palavras-chave (pesquisa)</label>
              <input id="p-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="copa, seleção, retrô" />
              <FieldError message={errors.tags} />
            </div>
          </div>
        </Card>

        <FormFeedback result={result} />
        <button type="submit" disabled={pending} className="btn-gold w-full py-3">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {product ? 'Salvar alterações' : 'Criar produto'}
        </button>
      </div>
    </form>
  );
}

function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-gold-light uppercase">{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-gold' : 'bg-zinc-700')}
      >
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-5.5' : 'left-0.5')} />
      </button>
    </label>
  );
}
