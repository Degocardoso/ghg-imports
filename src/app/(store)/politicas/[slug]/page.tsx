import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreSettings } from '@/lib/data/store';
import type { StoreSettings } from '@/types';

export const revalidate = 3600;

const PAGES: Record<string, { title: string; field: keyof StoreSettings; fallback: string }> = {
  sobre: {
    title: 'Sobre a GHD Imports',
    field: 'about_text',
    fallback: 'A GHD Imports seleciona camisas, tênis, perfumes e acessórios premium com atendimento personalizado.',
  },
  entrega: {
    title: 'Envio e entrega',
    field: 'shipping_policy',
    fallback: 'Enviamos para todo o Brasil. O valor do frete e o prazo são informados no WhatsApp após o pedido.',
  },
  trocas: {
    title: 'Trocas e devoluções',
    field: 'returns_policy',
    fallback: 'Você pode solicitar troca ou devolução em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor.',
  },
  privacidade: {
    title: 'Política de privacidade',
    field: 'privacy_policy',
    fallback:
      'Os seus dados (nome, contato e endereço) são usados exclusivamente para processar o pedido e o atendimento, em conformidade com a LGPD. Não vendemos nem partilhamos dados com terceiros. Para solicitar acesso ou exclusão, fale conosco pelo WhatsApp.',
  },
  termos: {
    title: 'Termos de uso',
    field: 'terms_of_service',
    fallback: 'Os preços e a disponibilidade podem mudar sem aviso prévio. O pedido só é confirmado após contato da nossa equipe.',
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = PAGES[(await params).slug];
  return { title: page?.title ?? 'Página não encontrada' };
}

export default async function PolicyPage({ params }: { params: Params }) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  const settings = await getStoreSettings();
  const content = (settings[page.field] as string | null) || page.fallback;

  return (
    <article className="container-store max-w-3xl py-14">
      <p className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase">Institucional</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{page.title}</h1>
      <div className="mt-8 space-y-4 leading-relaxed whitespace-pre-line text-zinc-300">{content}</div>
    </article>
  );
}
