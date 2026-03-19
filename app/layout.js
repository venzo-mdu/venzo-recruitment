import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ThemeProvider from '../components/providers/ThemeProvider';
import { AuthProvider } from '../components/providers/AuthProvider';
import BrandHead from '../components/common/BrandHead';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata = {
  title: 'Careers Portal',
  description: 'Apply for open positions',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <BrandHead />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
