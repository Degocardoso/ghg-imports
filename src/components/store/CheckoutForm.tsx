'use client';

import { LoaderCircle, Lock, ShoppingBag, TriangleAlert } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { cn } from '@/lib/cn';
import { BRAZIL_STATES, LEAD_SOURCE_LABEL, PAYMENT_LABEL } from '@/lib/constants';
import { formatCep, formatPhone, formatPrice, onlyDigits } from '@/lib/format';
import { checkoutSchema, fieldErrors } from '@/lib/validation';
import { getCartTotals, useCartHydrated, useCartStore, type CartValidation } from '@/store/cart';
import { LEAD_SOURCES, PAYMENT_PREFERENCES, type CreatedOrder } from '@/types';

export const LAST_ORDER_KEY = 'ghd:last-order';
const CUSTOMER_DRAFT_KEY = 'ghd:checkout-customer';

type FormState = {
  name: string;
  phone: string;
  email: string;
  document: string;
  delivery_method: 'entrega' | 'retirada';
  postal_code: string;
  street: string;
  street_number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  payment_preference: string;
  lead_source: string;
  notes: string;
  marketing_opt_in: boolean;
  privacy_accepted: boolean;
};

const INITIAL: FormState = {
  name: '',
  phone: '',
  email: '',
  document: '',
  delivery_method: 'entrega',
  postal_code: '',
  street: '',
  street_number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  payment_preference: 'pix',
  lead_source: '',
  notes: '',
  marketing_opt_in: false,
  privacy_accepted: false,
};

function loadDraft(): FormState {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = localStorage.getItem(CUSTOMER_DRAFT_KEY);
    return raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<FormState>), privacy_accepted: false } : INITIAL;
  } catch {
    return INITIAL;
  }
}

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const { items, applyValidation, removeItem, clear } = useCartStore();
  const totals = getCartTotals(items);

  const [form, setForm] = useState<FormState>(loadDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const validatedOnce = useRef(false);

  // Validação prévia no servidor: preços, stock e disponibilidade atuais.
  const validateCart = async () => {
    const ids = useCartStore.getState().items.map((i) => i.variantId);
    if (ids.length === 0) {
      setValidating(false);
      return true;
    }
    try {
      const res = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantIds: ids }),
      });
      if (!res.ok) return true;
      const { results } = (await res.json()) as { results: CartValidation[] };
      const changed = applyValidation(results);
      if (changed) setBanner('Atualizamos o seu carrinho com os preços e estoques mais recentes. Revise antes de enviar.');
      return !changed;
    } catch {
      return true;
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    if (!hydrated || validatedOnce.current) return;
    validatedOnce.current = true;
    void validateCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const lookupCep = async (cep: string) => {
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) {
        setErrors((e) => ({ ...e, postal_code: 'CEP não encontrado.' }));
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        district: data.bairro || f.district,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      // Sem conexão com o ViaCEP: o cliente preenche manualmente.
    } finally {
      setCepLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const validItems = items.filter((i) => !i.unavailable);
    if (validItems.length !== items.length) {
      setBanner('Remova os itens indisponíveis do carrinho para continuar.');
      return;
    }

    const payload = {
      customer: { ...form, lead_source: form.lead_source || null },
      items: validItems.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    };
    const parsed = checkoutSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(Object.fromEntries(Object.entries(errs).map(([k, v]) => [k.replace(/^customer\./, ''), v])));
      setBanner('Verifique os campos destacados.');
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        fields?: Record<string, string>;
        order?: CreatedOrder;
        whatsappUrl?: string;
      };

      if (!res.ok || !data.order || !data.whatsappUrl) {
        if (data.fields) {
          setErrors(Object.fromEntries(Object.entries(data.fields).map(([k, v]) => [k.replace(/^customer\./, ''), v])));
        }
        if (res.status === 409) await validateCart();
        setBanner(data.error ?? 'Não foi possível enviar o pedido.');
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { document: _cpf, privacy_accepted: _p, ...draft } = form;
        localStorage.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify(draft));
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order: data.order, whatsappUrl: data.whatsappUrl }));
      } catch {
        // Armazenamento indisponível (modo privado): segue sem rascunho.
      }
      clear();
      router.push(`/pedido-enviado?codigo=${encodeURIComponent(data.order.code)}`);
    } catch {
      setBanner('Falha de conexão. Verifique a internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <div className="grid min-h-[50vh] place-items-center"><LoaderCircle className="size-6 animate-spin text-gold" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <ShoppingBag className="size-10 text-gold" />
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted">Adicione produtos para finalizar o pedido pelo WhatsApp.</p>
        <Link href="/catalogo" className="btn-gold">Ir para o catálogo</Link>
      </div>
    );
  }

  const field = (key: keyof FormState) => ({
    id: key,
    name: key,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        {banner && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {banner}
          </div>
        )}

        <Section step={1} title="Seus dados" description="Usamos o seu WhatsApp para confirmar o pedido.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.name} className="sm:col-span-2" required htmlFor="name">
              <input {...field('name')} className="input" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="WhatsApp" error={errors.phone} required htmlFor="phone">
              <input
                {...field('phone')}
                className="input"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 98888-7777"
                value={formatPhone(form.phone)}
                onChange={(e) => set('phone', onlyDigits(e.target.value).slice(0, 11))}
              />
            </Field>
            <Field label="E-mail (opcional)" error={errors.email} htmlFor="email">
              <input {...field('email')} type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="CPF (opcional — para nota/envio)" error={errors.document} htmlFor="document">
              <input {...field('document')} className="input" inputMode="numeric" placeholder="000.000.000-00" value={form.document} onChange={(e) => set('document', e.target.value.replace(/[^\d.-]/g, '').slice(0, 14))} />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Entrega">
          <div className="mb-4 grid grid-cols-2 gap-3">
            {(['entrega', 'retirada'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set('delivery_method', m)}
                aria-pressed={form.delivery_method === m}
                className={cn(
                  'rounded-2xl border p-4 text-left transition',
                  form.delivery_method === m ? 'border-gold bg-gold/10' : 'border-line hover:border-zinc-500',
                )}
              >
                <span className="block text-sm font-semibold">{m === 'entrega' ? 'Receber em casa' : 'Retirar pessoalmente'}</span>
                <span className="block text-xs text-muted">{m === 'entrega' ? 'Frete combinado no WhatsApp' : 'Combinamos local e horário'}</span>
              </button>
            ))}
          </div>

          {form.delivery_method === 'entrega' && (
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="CEP" error={errors.postal_code} className="sm:col-span-2" required htmlFor="postal_code">
                <div className="relative">
                  <input
                    {...field('postal_code')}
                    className="input"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={formatCep(form.postal_code)}
                    onChange={(e) => {
                      const cep = onlyDigits(e.target.value).slice(0, 8);
                      set('postal_code', cep);
                      if (cep.length === 8) void lookupCep(cep);
                    }}
                  />
                  {cepLoading && <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-gold" />}
                </div>
              </Field>
              <Field label="Rua / Avenida" error={errors.street} className="sm:col-span-4" required htmlFor="street">
                <input {...field('street')} className="input" autoComplete="address-line1" value={form.street} onChange={(e) => set('street', e.target.value)} />
              </Field>
              <Field label="Número" error={errors.street_number} className="sm:col-span-2" required htmlFor="street_number">
                <input {...field('street_number')} className="input" value={form.street_number} onChange={(e) => set('street_number', e.target.value)} />
              </Field>
              <Field label="Complemento" error={errors.complement} className="sm:col-span-4" htmlFor="complement">
                <input {...field('complement')} className="input" autoComplete="address-line2" placeholder="Apto, bloco…" value={form.complement} onChange={(e) => set('complement', e.target.value)} />
              </Field>
              <Field label="Bairro" error={errors.district} className="sm:col-span-2" required htmlFor="district">
                <input {...field('district')} className="input" value={form.district} onChange={(e) => set('district', e.target.value)} />
              </Field>
              <Field label="Cidade" error={errors.city} className="sm:col-span-3" required htmlFor="city">
                <input {...field('city')} className="input" autoComplete="address-level2" value={form.city} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="UF" error={errors.state} className="sm:col-span-1" required htmlFor="state">
                <select {...field('state')} className="input px-2" value={form.state} onChange={(e) => set('state', e.target.value)}>
                  <option value="">—</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </Section>

        <Section step={3} title="Pagamento e preferências" description="O pagamento é combinado com segurança no WhatsApp.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Como prefere pagar?" error={errors.payment_preference} required htmlFor="payment_preference">
              <select {...field('payment_preference')} className="input" value={form.payment_preference} onChange={(e) => set('payment_preference', e.target.value)}>
                {PAYMENT_PREFERENCES.map((p) => (
                  <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Como nos conheceu?" error={errors.lead_source} htmlFor="lead_source">
              <select {...field('lead_source')} className="input" value={form.lead_source} onChange={(e) => set('lead_source', e.target.value)}>
                <option value="">Selecione (opcional)</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{LEAD_SOURCE_LABEL[s]}</option>
                ))}
              </select>
            </Field>
            <Field label="Observações (opcional)" error={errors.notes} className="sm:col-span-2" htmlFor="notes">
              <textarea {...field('notes')} className="input min-h-24" maxLength={500} placeholder="Personalização (nome/número), dúvidas de tamanho, melhor horário para contato…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </div>
          <div className="mt-5 space-y-3">
            <Checkbox checked={form.marketing_opt_in} onChange={(v) => set('marketing_opt_in', v)}>
              Quero receber lançamentos e ofertas exclusivas no WhatsApp.
            </Checkbox>
            <Checkbox checked={form.privacy_accepted} onChange={(v) => set('privacy_accepted', v)} error={errors.privacy_accepted}>
              Li e aceito a{' '}
              <Link href="/politicas/privacidade" target="_blank" className="text-gold underline-offset-2 hover:underline">
                política de privacidade
              </Link>
              . <span className="text-gold">*</span>
            </Checkbox>
          </div>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-semibold">Resumo do pedido</h2>
          <ul className="scrollbar-thin max-h-80 divide-y divide-line overflow-y-auto px-5">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {item.image && <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute top-0 right-0 grid min-w-5 place-items-center rounded-bl-lg bg-gold px-1 text-[10px] font-bold text-ink">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm">{item.name}</span>
                  {item.variantLabel && <span className="block text-xs text-muted">{item.variantLabel}</span>}
                  {item.unavailable && (
                    <button type="button" onClick={() => removeItem(item.variantId)} className="text-xs font-semibold text-red-300 underline">
                      Indisponível — remover
                    </button>
                  )}
                </span>
                <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-line bg-surface-2/50 px-5 py-4 text-sm">
            {totals.discount > 0 && (
              <>
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>{formatPrice(totals.subtotal)}</span></div>
                <div className="flex justify-between text-success"><span>Descontos</span><span>-{formatPrice(totals.discount)}</span></div>
              </>
            )}
            <div className="flex justify-between text-muted"><span>Frete</span><span>A combinar</span></div>
            <div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span className="text-gold-light">{formatPrice(totals.total)}</span></div>
          </div>
          <div className="space-y-3 p-5 pt-0">
            <button type="submit" disabled={submitting || validating} className="btn-whatsapp w-full py-4 text-base">
              {submitting ? <LoaderCircle className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
              {submitting ? 'Registrando pedido…' : 'Enviar pedido pelo WhatsApp'}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Lock className="size-3" /> Valores confirmados pelo servidor no envio.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Section({ step, title, description, children }: { step: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-gradient text-sm font-bold text-ink">{step}</span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ label, error, required, className, htmlFor, children }: { label: string; error?: string; required?: boolean; className?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Checkbox({ checked, onChange, error, children }: { checked: boolean; onChange: (v: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-300">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} className="mt-0.5 size-4 shrink-0 accent-[#d4af37]" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 ml-7 text-xs text-red-300">{error}</p>}
    </div>
  );
}
