import { Inter, JetBrains_Mono } from 'next/font/google';
import Providers from '@/components/providers/Providers';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  title: 'CodeAuditAI — Review | Detect | Improve',
  description: 'AI-powered code review platform with multi-agent analysis, RAG memory, real-time streaming, and auto-fix generation.',
  keywords: ['code review', 'AI', 'GitHub', 'security', 'code quality'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.92)',
              fontFamily: 'var(--font-inter)',
            },
          }}
        />
      </body>
    </html>
  );
}
