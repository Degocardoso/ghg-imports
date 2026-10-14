import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from '@/components/ui/SocialIcons';
import { formatPhone } from '@/lib/format';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import type { CategoryNode, StoreSettings } from '@/types';

export function Footer({ settings, categories }: { settings: StoreSettings; categories: CategoryNode[] }) {
  const socials = [
    { href: settings.instagram_url, label: 'Instagram', Icon: InstagramIcon },
    { href: settings.tiktok_url, label: 'TikTok', Icon: TikTokIcon },
    { href: settings.facebook_url, label: 'Facebook', Icon: FacebookIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className="mt-24 border-t border-line bg-brushed">
      <div className="container-store grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo src={settings.logo_url} size={52} />
          {settings.tagline && <p className="max-w-xs text-sm text-muted">{settings.tagline}</p>}
          <div className="flex gap-2">
            <a
              href={buildWhatsAppUrl(settings.whatsapp_number, 'Olá! Vim pelo site da GHD Imports.')}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-10 place-items-center rounded-full bg-success/15 text-success hover:bg-success/25"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="size-5" />
            </a>
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-10 place-items-center rounded-full border border-line text-muted hover:border-gold/50 hover:text-gold-light"
                aria-label={label}
              >
                <Icon className="size-4.5" />
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Categorias">
          {categories.slice(0, 6).map((c) => (
            <FooterLink key={c.id} href={`/catalogo?categoria=${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Institucional">
          <FooterLink href="/politicas/sobre">Sobre a GHD Imports</FooterLink>
          <FooterLink href="/politicas/entrega">Envio e entrega</FooterLink>
          <FooterLink href="/politicas/trocas">Trocas e devoluções</FooterLink>
          <FooterLink href="/politicas/privacidade">Política de privacidade</FooterLink>
          <FooterLink href="/politicas/termos">Termos de uso</FooterLink>
        </FooterColumn>

        <FooterColumn title="Atendimento">
          <li className="flex gap-2.5 text-sm text-muted">
            <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-success" />
            {formatPhone(settings.whatsapp_number)}
          </li>
          {settings.contact_phone && (
            <li className="flex gap-2.5 text-sm text-muted">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" /> {settings.contact_phone}
            </li>
          )}
          {settings.contact_email && (
            <li className="flex gap-2.5 text-sm text-muted">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
              <a href={`mailto:${settings.contact_email}`} className="hover:text-fg">
                {settings.contact_email}
              </a>
            </li>
          )}
          {settings.business_hours && (
            <li className="flex gap-2.5 text-sm text-muted">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" /> {settings.business_hours}
            </li>
          )}
          {settings.address && (
            <li className="flex gap-2.5 text-sm text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" /> {settings.address}
            </li>
          )}
        </FooterColumn>
      </div>
      <div className="border-t border-line">
        <p className="container-store py-5 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold tracking-[0.2em] text-gold uppercase">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted transition hover:text-gold-light">
        {children}
      </Link>
    </li>
  );
}
