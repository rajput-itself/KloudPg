import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'KloudPG — Find Your Perfect PG in India',
  description: 'India\'s trusted platform for finding PG (Paying Guest) accommodation for students and working professionals. Browse verified PGs in Bangalore, Mumbai, Pune, Delhi, Hyderabad & Chennai.',
  keywords: 'PG, paying guest, accommodation, student housing, India, Bangalore, Mumbai, Pune, Delhi, Hyderabad, Chennai',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page-wrapper">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
