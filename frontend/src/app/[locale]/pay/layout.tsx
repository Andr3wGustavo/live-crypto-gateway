import { Web3Provider } from '@/components/Web3Provider';
export const metadata = { robots: { index: false, follow: false } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
