import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface LogoProps {
  src?: string | null;
  href?: string;
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

/** Logótipo oficial (coroa + GHD IMPORTS) com wordmark em ouro metálico. */
export function Logo({ src, href = '/', className, size = 44, showWordmark = true }: LogoProps) {
  return (
    <Link href={href} className={cn('group flex items-center gap-3', className)} aria-label="GHD Imports — página inicial">
      <span
        className="relative overflow-hidden rounded-xl ring-1 ring-gold/30 transition group-hover:ring-gold/60"
        style={{ width: size, height: size }}
      >
        <Image src={src || '/brand/logo.jpg'} alt="" fill sizes={`${size}px`} className="object-cover" priority />
      </span>
      {showWordmark && (
        <span className="leading-none">
          <span className="block text-lg font-extrabold tracking-[0.18em] text-gold-gradient">GHD</span>
          <span className="block text-[10px] font-semibold tracking-[0.42em] text-gold-light/80">IMPORTS</span>
        </span>
      )}
    </Link>
  );
}
