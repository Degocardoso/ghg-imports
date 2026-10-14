import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Footer } from '@/components/store/Footer';
import { Header } from '@/components/store/Header';
import { WhatsAppFloat } from '@/components/store/WhatsAppFloat';
import { getCategoryTree, getStoreSettings } from '@/lib/data/store';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getStoreSettings(), getCategoryTree()]);

  return (
    <>
      <AnnouncementBar text={settings.announcement} />
      <Header categories={categories} logoUrl={settings.logo_url} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <WhatsAppFloat phone={settings.whatsapp_number} />
    </>
  );
}
