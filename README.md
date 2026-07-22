This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment setup

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your own API keys:

- **ARCJET_KEY** — from [app.arcjet.com](https://app.arcjet.com)
- **GOOGLE_SPREADSHEET_ID / GOOGLE_CALENDAR_ID** — from your Google Sheet/Calendar URLs
- **GOOGLE_SERVICE_ACCOUNT_JSON** — paste the full JSON from your Google Cloud service account as a single line
- **RESEND_API_KEY** — from [resend.com](https://resend.com)
- **NEXTAUTH_SECRET** — run: `openssl rand -base64 32`
- **STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** — from [Stripe dashboard](https://dashboard.stripe.com)
- **STRIPE_WEBHOOK_SECRET** — run: `stripe listen --print-secret`

### 2. Install & run

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
