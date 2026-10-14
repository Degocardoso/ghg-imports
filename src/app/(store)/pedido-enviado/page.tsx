import type { Metadata } from 'next';
import { OrderSuccess } from '@/components/store/OrderSuccess';

export const metadata: Metadata = { title: 'Pedido registrado', robots: { index: false } };

export default async function OrderSentPage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  const code = codigo && /^GHD-\d{1,12}$/.test(codigo) ? codigo : null;
  return (
    <div className="container-store">
      <OrderSuccess code={code} />
    </div>
  );
}
