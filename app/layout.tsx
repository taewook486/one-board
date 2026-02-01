import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { SkinProvider } from '@/components/SkinProvider';
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'One Board - Community Platform',
  description: 'Modern community board platform with skin customization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <SkinProvider>
          <Header />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </SkinProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
