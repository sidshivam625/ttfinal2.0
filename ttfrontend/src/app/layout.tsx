import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../../context/AuthContext';
import Navbar from '@/utils/Navbar';
import { VT323,Press_Start_2P } from 'next/font/google';
import Background from '@/utils/Background';

export const metadata: Metadata = {
  icons: {
        icon: '/icon.png', 
      },
  title: 'Cryptic Finds 2025',
  description: 'Can you do it? A treasure hunt like no other.',
};


const vt323 = VT323({ subsets: ['latin'], weight: ['400'], variable: '--font-vt323' });
const press_start_2p = Press_Start_2P({ subsets: ['latin'], weight: ['400'], variable: '--font-press-start-2p' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${vt323.variable} ${press_start_2p.variable}`}>
        <AuthProvider>
          <Background/>
        <Navbar/>
          {children}
          </AuthProvider>
      </body>
    </html>
  )
}