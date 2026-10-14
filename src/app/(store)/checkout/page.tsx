import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/store/CheckoutForm';

export const metadata: Metadata = { title: 'Finalizar pedido', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-store py-10">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Finalizar pedido</h1>
      <p className="mb-8 text-muted">Preencha os dados abaixo — em seguida enviamos o seu pedido completo para o nosso WhatsApp.</p>
      <CheckoutForm />
    </div>
  );
}
