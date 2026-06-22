import './styles.css';

export const metadata = {
  title: 'Room Booking',
  description: 'Single-property room booking website'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
