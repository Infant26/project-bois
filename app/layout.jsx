import './styles.css';
import 'react-day-picker/dist/style.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'The Coastal Calm | Private Stay Booking',
  description: 'Book your stay at The Coastal Calm in Pondicherry.',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
