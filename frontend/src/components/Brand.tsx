import Image from 'next/image';
import Link from 'next/link';

export function Brand({ href, label = 'LiveCrypto' }: { href: string; label?: string }) {
  return <Link href={href} className="lc-brand" aria-label={label}>
    <span className="lc-brand-symbol" aria-hidden="true"><Image src="/brand/logo-png.png" alt="" width={148} height={148} unoptimized /></span>
    <span>LIVE<span>CRYPTO</span><small>RECEIVE ANYWHERE_</small></span>
  </Link>;
}
