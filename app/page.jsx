import BookingForm from '@/components/BookingForm';

const PROPERTY_NAME = 'The Coastal Calm';

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Private Stay Booking</p>
          <h1>{PROPERTY_NAME}</h1>
          <p>{process.env.NEXT_PUBLIC_PROPERTY_LOCATION || 'Update your property location in .env.local'}</p>
          <p className="hero-copy">Reserve your dates online. Payment can be collected at the property or enabled through Razorpay.</p>
        </div>
      </section>
      <section className="content">
        <BookingForm />
      </section>
    </main>
  );
}
