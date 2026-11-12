# GB Wheels

Car marketplace and brokerage platform for Gilgit-Baltistan. Next.js (App Router) + TypeScript + Tailwind v4 + Framer Motion + Neon Postgres, built-in email/password auth and Vercel Blob (photos).

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000
```

Without a `DATABASE_URL` the site still runs: public pages render with clear "Database not connected" empty states, and sign-in, forms and dashboards are disabled. Nothing pretends to work.

## 1. Local setup

1. `npm install`
2. Create a Postgres database (a free Neon project works, or local Postgres 16) and copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`. `BLOB_READ_WRITE_TOKEN` is only needed to test photo uploads.
4. `npm run db:migrate` (safe to re-run; also runs automatically before every `npm run build`).
5. `npm run dev`

Accounts are email + password (bcrypt hashes, random server-side session tokens stored hashed in the database, httpOnly cookie). There is no fake OTP and no email verification at sign-up. Role and ownership checks run on the server for every page and action.

## 2. Create the first admin

Set `ADMIN_EMAIL` to your email, then register at `/register` with that email: while no Super Admin exists, that account becomes `super_admin`. Register promptly after the first deploy. Sign in at `/admin/login`, then use **Admin > Users** to assign `listing_manager`, `sales_agent` or `photographer`.

Password reset: if `RESEND_API_KEY` and `EMAIL_FROM` are set, users get an emailed 1-hour link. Otherwise a Super Admin creates a one-time reset link in **Admin > Users** and sends it to the person.

| Role | Can do |
|---|---|
| super_admin | everything, incl. users, brokerage rules, activity log |
| listing_manager | approve/reject/feature/delete listings, reports, inquiries (read/update), managed sales |
| sales_agent | inquiries, managed sales, transactions |
| photographer | view listings |

## 3. Contact details, logo, photos

- Contact details: `NEXT_PUBLIC_BUSINESS_*` in `.env.local`. WhatsApp/Call buttons stay disabled until set.
- Logo: place at `public/logo.png` and swap the body of `src/components/layout/Logo.tsx` for `next/image` (also add `src/app/favicon.ico` and an `opengraph-image`).
- Hero photos: add licensed images to `public/hero/` and set `image` per car in `src/config/catalog.ts`.
- Testimonials: add real, permitted ones to `testimonials` in `src/config/catalog.ts`; the section is hidden while empty.
- Privacy/Terms pages are **templates**; have a lawyer review them.

## 4. Deploy (Vercel)

1. Import the GitHub repo into Vercel.
2. **Storage tab**: connect a **Neon** Postgres database to the project (sets `DATABASE_URL`) and a **Blob** store (sets `BLOB_READ_WRITE_TOKEN`).
3. Add `ADMIN_EMAIL` and `NEXT_PUBLIC_SITE_URL` (your domain), plus the optional business-contact variables.
4. Deploy. The build applies `db/schema.sql` automatically.
5. Register with `ADMIN_EMAIL` to become Super Admin.

## 5. How to test

1. Register at `/register` (confirm email if enabled) and sign in.
2. `/dashboard/listings/new`: complete the 5 steps, upload photos, submit. Status becomes **Pending**.
3. Promote yourself to `super_admin` (above), open `/admin/cars`, **Approve**. The car appears on `/`, `/buy`, `/cars/<slug>`.
4. Use filters, sorting and pagination on `/buy`. Save a car with the heart. Send an inquiry from the car page, then manage it at `/admin/inquiries`.
5. Managed sale: submit `/managed-sale`, open `/admin/managed`, pick a brokerage rule and **Calculate & propose**; as the seller open `/dashboard/managed` and **agree**; then **list**, and finally **Mark completed** with the final price. Revenue appears on the admin dashboard only after that.

## Feature checklist

Done and wired to the database: auth (register, login, logout, reset, protected routes, server-side role checks), homepage, Buy Cars with all filters, car detail pages (gallery, honest verification panel, inquiry, report, WhatsApp/call, JSON-LD), 5-step Sell form with drafts and uploads, seller dashboard (listings, edit, delete, mark reserved/sold, saved, inquiries, managed sales, profile), admin (dashboard stats, cars, featured, users, inquiries pipeline, managed sales, brokerage rules, transactions, reports, activity log), server-side brokerage calculation, seller agreement gate, sitemap, robots.

Needs your configuration: Neon database and Blob store (connect in Vercel), first admin, business contact details, logo/favicon, real hero photos, legal review of Privacy/Terms.

Not built / limitations: email verification at sign-up, photo upload to Vercel Blob (needs a live Blob token, so it was not exercised locally), Urdu translation (structure only), phone OTP login, email/SMS notifications (`notifications` table exists, nothing sends yet), admin editing of brands/districts (defined in `src/config/site.ts`), demo-data seeding script, automated browser tests for authenticated flows (need a live database; the flows were tested manually against Postgres 16).
