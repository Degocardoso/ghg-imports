import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getStoreSettings } from '@/lib/data/store';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkoutSchema, fieldErrors } from '@/lib/validation';
import { buildOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import type { CreatedOrder } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 32_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function hashIp(request: NextRequest): string | null {
  const ip =
    request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!ip) return null;
  const salt = process.env.ORDER_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) || 'ghd';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/**
 * POST /api/checkout
 * 1. Valida os dados do cliente e o carrinho (Zod).
 * 2. Regista a encomenda via `create_order` — preços e stock são
 *    recalculados na base de dados; o browser só envia IDs e quantidades.
 * 3. Gera a mensagem e o link do WhatsApp com os valores congelados.
 */
export async function POST(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Formato de pedido inválido.' }, 415);
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return json({ error: 'Pedido inválido.' }, 400);
  }
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'Pedido demasiado grande.' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Verifique os dados do formulário.', fields: fieldErrors(parsed.error) }, 422);
  }

  const { customer, items } = parsed.data;
  // O consentimento é validado aqui; não é persistido como coluna.
  const customerPayload = { ...customer, privacy_accepted: undefined };

  let order: CreatedOrder;
  try {
    const { data, error } = await createAdminClient().rpc('create_order', {
      payload: { customer: customerPayload, items, ip_hash: hashIp(request) },
    });

    if (error) {
      // P0001 = regra de negócio (stock/indisponível); P0002 = rate limit
      if (error.code === 'P0001') return json({ error: error.message }, 409);
      if (error.code === 'P0002') return json({ error: error.message }, 429);
      if (error.code === '23514') return json({ error: 'Alguns dados não são válidos. Verifique o formulário.' }, 422);
      console.error('[checkout] create_order falhou', error);
      return json({ error: 'Não foi possível registar o pedido. Tente novamente em instantes.' }, 500);
    }
    order = data as CreatedOrder;
  } catch (error) {
    console.error('[checkout] erro inesperado', error);
    return json({ error: 'Serviço temporariamente indisponível.' }, 503);
  }

  const settings = await getStoreSettings();
  const message = buildOrderMessage({ storeName: settings.store_name, order, customer });
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp_number, message);

  return json({ order, message, whatsappUrl }, 201);
}
