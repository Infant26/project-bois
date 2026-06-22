create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  max_guests int not null default 2 check (max_guests > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  check_in_date date not null,
  check_out_date date not null,
  guest_count int not null check (guest_count > 0),
  special_requests text,
  total_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pay_at_property' check (payment_status in ('not_required','pending','paid','pay_at_property','failed')),
  booking_status text not null default 'confirmed' check (booking_status in ('pending','confirmed','cancelled','checked_in','checked_out')),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  constraint valid_booking_dates check (check_out_date > check_in_date)
);

create index if not exists idx_bookings_room_dates on public.bookings(room_id, check_in_date, check_out_date);

alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

create policy "Public can view active rooms" on public.rooms
for select using (is_active = true);

create policy "Authenticated admin can manage rooms" on public.rooms
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated admin can view bookings" on public.bookings
for select using (auth.role() = 'authenticated');

create policy "Authenticated admin can update bookings" on public.bookings
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into public.rooms (name, description, price_per_night, max_guests, image_url, is_active)
values
('Ground Floor - 1 BHK', 'Spacious 1 Bedroom, 1 Kitchen living area with modern amenities. Perfect for couples and small families.', 4000, 2, null, true),
('1st Floor - 2 BHK', 'Comfortable 2 Bedroom, 1 Kitchen living area with city views. Ideal for families and groups.', 5000, 4, null, true),
('2nd Floor - 2 BHK Premium', 'Luxury 2 Bedroom, 1 Kitchen living area with premium furnishings and rooftop access. Best amenities available.', 6000, 4, null, true)
on conflict do nothing;
