# GB Wheels

Car marketplace and brokerage platform for Gilgit-Baltistan. Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion + Supabase (Postgres, Auth, Storage).

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000
```

Without Supabase credentials the site still runs: public pages render with clear "Database not connected" empty states, and sign-in, forms and dashboards are disabled. Nothing pretends to work.

## 1. Supabase setup

1. Create a project at supabase.com.
2. **SQL editor**: run, in order, `supabase/migrations/0001_schema.sql`, `0002_rls_storage.sql`, `0003_fix_view_counter.sql`.
3. Copy **Project URL** and **anon key** (Settings > API) into `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` is not used by the app today; never expose it to the browser.
4. **Authentication > URL configuration**: set Site URL to your site, and add `<site>/auth/callback` to Redirect URLs (needed for email confirmation and password reset).
5. **Authentication > Providers > Email**: leave enabled. Keep "Confirm email" on for production. Phone/OTP sign-up is intentionally not built (needs an SMS provider such as Twilio configured in Supabase).
6. **Storage**: the `vehicle-images` bucket (public, 5 MB, JPG/PNG/WebP) is created by migration 0002.

## 2. Create the first admin

Users cannot promote themselves (database trigger). Register normally at `/register`, then in the SQL editor:

```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

Sign in at `/admin/login`. From **Admin > Users** you can then assign `listing_manager`, `sales_agent` or `photographer`.

| Role | Can do |
|---|---|
| super_admin | everything, incl. users, brokerage rules, activity log |
| listing_manager | approve/reject/feature/delete listings, reports, inquiries (read/update), managed sales |
| sales_agent | inquiries, managed sales, transactions |
| photographer | view listings, manage photos |

## 3. Contact details, logo, photos

- Contact details: `NEXT_PUBLIC_BUSINESS_*` in `.env.local`. WhatsApp/Call buttons stay disabled until set.
- Logo: place at `public/logo.png` and swap the body of `src/components/layout/Logo.tsx` for `next/image` (also add `src/app/favicon.ico` and an `opengraph-image`).
- Hero photos: add licensed images to `public/hero/` and set `image` per car in `src/config/catalog.ts`.
- Testimonials: add real, permitted ones to `testimonials` in `src/config/catalog.ts`; the section is hidden while empty.
- Privacy/Terms pages are **templates**; have a lawyer review them.

## 4. Deploy (Vercel)

Import the repo, add the same environment variables (with `NEXT_PUBLIC_SITE_URL` = your domain), deploy, then add the production URL to Supabase redirect URLs.

## 5. How to test

1. Register at `/register` (confirm email if enabled) and sign in.
2. `/dashboard/listings/new`: complete the 5 steps, upload photos, submit. Status becomes **Pending**.
3. Promote yourself to `super_admin` (above), open `/admin/cars`, **Approve**. The car appears on `/`, `/buy`, `/cars/<slug>`.
4. Use filters, sorting and pagination on `/buy`. Save a car with the heart. Send an inquiry from the car page, then manage it at `/admin/inquiries`.
5. Managed sale: submit `/managed-sale`, open `/admin/managed`, pick a brokerage rule and **Calculate & propose**; as the seller open `/dashboard/managed` and **agree**; then **list**, and finally **Mark completed** with the final price. Revenue appears on the admin dashboard only after that.

## Feature checklist

Done and wired to the database: auth (register, login, logout, reset, protected routes, server-side role checks), homepage, Buy Cars with all filters, car detail pages (gallery, honest verification panel, inquiry, report, WhatsApp/call, JSON-LD), 5-step Sell form with drafts and uploads, seller dashboard (listings, edit, delete, mark reserved/sold, saved, inquiries, managed sales, profile), admin (dashboard stats, cars, featured, users, inquiries pipeline, managed sales, brokerage rules, transactions, reports, activity log), server-side brokerage calculation, seller agreement gate, sitemap, robots.

Needs your configuration: Supabase project and migrations, redirect URLs, first admin, business contact details, logo/favicon, real hero photos, legal review of Privacy/Terms.

Not built / limitations: Urdu translation (structure only), phone OTP login, email/SMS notifications (`notifications` table exists, nothing sends yet), admin editing of brands/districts (defined in `src/config/site.ts`), demo-data seeding script, automated browser tests for authenticated flows (need a live Supabase project).
