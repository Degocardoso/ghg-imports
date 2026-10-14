import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export function WhatsAppFloat({ phone }: { phone: string }) {
  return (
    <a
      href={buildWhatsAppUrl(phone, 'Olá! Vim pelo site da GHD Imports e gostaria de ajuda.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-success text-white shadow-lg shadow-success/30 transition hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
