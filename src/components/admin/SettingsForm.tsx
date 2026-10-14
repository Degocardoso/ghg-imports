'use client';

import { LoaderCircle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveSettings } from '@/app/admin/_actions/catalog';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import type { ActionResult } from '@/lib/admin/action';
import { formatPhone } from '@/lib/format';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { StoreSettings } from '@/types';
import { FieldError, FormFeedback } from './FormFeedback';
import { ImageUploader } from './ImageUploader';

type Form = Record<Exclude<keyof StoreSettings, 'id' | 'updated_at'>, string>;

const toForm = (s: StoreSettings): Form => {
  const out = {} as Form;
  for (const [k, v] of Object.entries(s)) {
    if (k === 'id' || k === 'updated_at') continue;
    out[k as keyof Form] = (v as string | null) ?? '';
  }
  return out;
};

const TEXT_FIELDS: Array<{ key: keyof Form; label: string; placeholder?: string; multiline?: boolean }> = [
  { key: 'store_name', label: 'Nome da loja *' },
  { key: 'tagline', label: 'Slogan', placeholder: 'Importados premium. Atendimento VIP.' },
  { key: 'announcement', label: 'Barra de anúncio (topo)', placeholder: 'Frete grátis acima de R$ 499 • Parcele em até 12x' },
  { key: 'contact_email', label: 'E-mail de contato' },
  { key: 'contact_phone', label: 'Telefone fixo / alternativo' },
  { key: 'business_hours', label: 'Horário de atendimento' },
  { key: 'address', label: 'Endereço / ponto de retirada' },
  { key: 'instagram_url', label: 'Instagram (URL)', placeholder: 'https://instagram.com/ghdimports' },
  { key: 'tiktok_url', label: 'TikTok (URL)' },
  { key: 'facebook_url', label: 'Facebook (URL)' },
];

const POLICY_FIELDS: Array<{ key: keyof Form; label: string }> = [
  { key: 'about_text', label: 'Sobre a loja' },
  { key: 'shipping_policy', label: 'Política de envio e entrega' },
  { key: 'returns_policy', label: 'Política de trocas e devoluções' },
  { key: 'privacy_policy', label: 'Política de privacidade (LGPD)' },
  { key: 'terms_of_service', label: 'Termos de uso' },
];

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => toForm(settings));
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? result.fields ?? {} : {};
  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveSettings(form);
      setResult(res);
      if (res.ok) router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="card space-y-4 border-success/30 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-success uppercase">
          <WhatsAppIcon className="size-4" /> WhatsApp de vendas
        </h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="s-wa">Número (com código do país) *</label>
            <input id="s-wa" className="input" inputMode="numeric" value={form.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value.replace(/\D/g, ''))} placeholder="5511988887777" aria-invalid={Boolean(errors.whatsapp_number)} />
            <FieldError message={errors.whatsapp_number} />
            <p className="mt-1.5 text-xs text-muted">Todos os pedidos e botões de contato da loja usam este número. Formato: 55 + DDD + número.</p>
          </div>
          <a href={buildWhatsAppUrl(form.whatsapp_number, 'Teste do painel GHD Imports ✅')} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            Testar {formatPhone(form.whatsapp_number)}
          </a>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold tracking-wide text-gold-light uppercase">Identidade e contatos</h2>
        <ImageUploader bucket="banners" folder="branding" label="Logotipo (quadrado)" max={1} value={form.logo_url ? [form.logo_url] : []} onChange={(u) => set('logo_url', u[0] ?? '')} />
        <div className="grid gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label" htmlFor={`s-${key}`}>{label}</label>
              <input id={`s-${key}`} className="input" value={form[key]} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} aria-invalid={Boolean(errors[key])} />
              <FieldError message={errors[key]} />
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold tracking-wide text-gold-light uppercase">Políticas institucionais</h2>
        <p className="text-xs text-muted">Se ficarem vazias, a loja mostra um texto padrão. Quebras de linha são respeitadas.</p>
        {POLICY_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="label" htmlFor={`s-${key}`}>{label}</label>
            <textarea id={`s-${key}`} className="input min-h-28" value={form[key]} onChange={(e) => set(key, e.target.value)} />
            <FieldError message={errors[key]} />
          </div>
        ))}
      </section>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-line bg-ink/90 p-3 backdrop-blur sm:flex-row sm:items-center">
        <FormFeedback result={result} className="flex-1" />
        <button type="submit" disabled={pending} className="btn-gold ml-auto">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configurações
        </button>
      </div>
    </form>
  );
}
