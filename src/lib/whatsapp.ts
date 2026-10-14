import type { CreatedOrder } from '@/types';
import { LEAD_SOURCE_LABEL, PAYMENT_LABEL } from './constants';
import { formatCep, formatDateTime, formatPhone, formatPrice, onlyDigits } from './format';
import type { CheckoutCustomer } from './validation';

/**
 * Link oficial "click to chat" do WhatsApp.
 * https://faq.whatsapp.com/5913398998672934
 */
export function buildWhatsAppUrl(phone: string, text?: string): string {
  const number = onlyDigits(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${query}`;
}

/** Número do cliente (nacional) → formato internacional para wa.me. */
export function toInternationalBR(phone: string): string {
  const d = onlyDigits(phone);
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`;
}

interface OrderMessageInput {
  storeName: string;
  order: CreatedOrder;
  customer: CheckoutCustomer;
}

/**
 * Mensagem formatada (negrito do WhatsApp com *texto*) enviada pelo cliente
 * para a loja. Usa SEMPRE os valores devolvidos pela base de dados
 * (preços congelados), nunca os do browser.
 * Dados sensíveis (CPF) não são incluídos — ficam apenas no painel.
 */
export function buildOrderMessage({ storeName, order, customer }: OrderMessageInput): string {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  push(`👑 *NOVO PEDIDO — ${storeName.toUpperCase()}*`);
  push(`Pedido: *${order.code}*`);
  push(`Data: ${formatDateTime(order.created_at)}`, '');

  push('*🛍️ Itens*');
  order.items.forEach((item, i) => {
    push(`${i + 1}. ${item.product_name}`);
    const details = [
      item.variant_label ? `Opção: ${item.variant_label}` : null,
      `Qtd: ${item.quantity}`,
      `${formatPrice(item.unit_price)} un.`,
    ].filter(Boolean);
    push(`   ${details.join(' · ')}`);
    if (item.sku) push(`   Ref.: ${item.sku}`);
    if (item.quantity > 1) push(`   Total: ${formatPrice(item.line_total)}`);
  });
  push('');

  push('*💰 Resumo*');
  if (order.discount_total > 0) {
    push(`Subtotal: ${formatPrice(order.subtotal)}`);
    push(`Descontos: -${formatPrice(order.discount_total)}`);
  }
  push(`*Total: ${formatPrice(order.total)}* (${order.items_count} ${order.items_count === 1 ? 'item' : 'itens'})`);
  push(customer.delivery_method === 'entrega' ? 'Frete: a combinar' : 'Retirada: a combinar', '');

  push('*👤 Cliente*');
  push(`Nome: ${customer.name}`);
  push(`WhatsApp: ${formatPhone(customer.phone)}`);
  if (customer.email) push(`E-mail: ${customer.email}`);
  push('');

  if (customer.delivery_method === 'entrega') {
    push('*📦 Entrega*');
    push(`${customer.street}, ${customer.street_number}${customer.complement ? ` — ${customer.complement}` : ''}`);
    push(`${customer.district ? `${customer.district} — ` : ''}${customer.city}/${customer.state}`);
    if (customer.postal_code) push(`CEP ${formatCep(customer.postal_code)}`);
  } else {
    push('*📍 Retirada na loja*');
  }
  push('');

  push(`Pagamento preferido: ${PAYMENT_LABEL[customer.payment_preference]}`);
  if (customer.lead_source) push(`Nos conheceu por: ${LEAD_SOURCE_LABEL[customer.lead_source]}`);
  if (customer.notes) push(`Observações: ${customer.notes}`);
  push('', 'Olá! Acabei de fazer este pedido no site e gostaria de finalizar a compra. 🙌');

  return lines.join('\n');
}
