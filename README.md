# Titan Fitness (static) + Supabase backend

This site is a static HTML/CSS/JS portfolio with a contact form. Supabase is used as the backend to store contact form submissions.

## Setup (Supabase)

- Create a project in Supabase.
- Open **SQL Editor** and run `supabase/schema.sql`.
- Copy `supabase-config.example.js` to `supabase-config.js` and fill in:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

## What you get

- Contact form inserts rows into `public.contact_messages`.
- Database security uses **RLS** so the public website can **insert** but cannot **read** messages.
- Demo pages:
  - `login.html`: Supabase Auth (email/password) sign up + sign in + sign out.
  - `payment.html`: Example UPI QR generator (random UPI IDs for portfolio display).

