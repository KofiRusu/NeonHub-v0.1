import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NeonHub - Marketing Hub',
  description: 'AI-powered marketing tools and campaign management',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  );
} 