import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { SITE_URL } from '@/lib/constants';
import './globals.css';

// Plus Jakarta Sans (variável, OFL) auto-alojada: o build não depende do Google Fonts.
const jakarta = localFont({
  src: './fonts/PlusJakartaSans-Variable.woff2',
  variable: '--font-jakarta',
  weight: '200 800',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GHD Imports — Importados premium',
    template: '%s | GHD Imports',
  },
  description:
    'Camisas de futebol, tênis, perfumes importados, vestuário e acessórios premium. Atendimento VIP e finalização pelo WhatsApp.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'GHD Imports',
    images: [{ url: '/brand/logo.jpg', width: 500, height: 500, alt: 'GHD Imports' }],
  },
  icons: { icon: '/brand/logo.jpg', apple: '/brand/logo.jpg' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
