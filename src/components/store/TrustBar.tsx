import { BadgeCheck, CreditCard, ShieldCheck, Truck } from 'lucide-react';

const ITEMS = [
  { Icon: BadgeCheck, title: 'Qualidade premium', text: 'Peças selecionadas e conferidas' },
  { Icon: Truck, title: 'Enviamos para todo o Brasil', text: 'Frete combinado no atendimento' },
  { Icon: CreditCard, title: 'Pix, cartão ou boleto', text: 'Você escolhe como pagar' },
  { Icon: ShieldCheck, title: 'Compra segura', text: 'Atendimento humano no WhatsApp' },
];

export function TrustBar() {
  return (
    <section className="container-store mt-14">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, text }) => (
          <li key={title} className="card flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
