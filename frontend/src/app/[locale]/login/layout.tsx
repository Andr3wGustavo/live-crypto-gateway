import { Web3Provider } from '@/components/Web3Provider';
export const metadata = { robots: { index: false, follow: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
