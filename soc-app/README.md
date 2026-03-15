This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
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

## Running with MITRE ATT&CK Analyzer

To enable the MITRE analysis feature, you must run the Python backend server alongside the Next.js app.

You can do this in two ways:

1. **Integrated Startup (now cross-platform):**
   ```bash
   npm run dev:mitre
   ```
   This uses `concurrently` to launch the Python MITRE analyzer and `next dev` in the same terminal on every platform.

2. **Manual Startup:**
   Open a separate terminal and run:
   ```bash
   npm run mitre
   ```
   Then in your main terminal, start the app as usual:
   ```bash
   npm run dev
   ```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

> Configure `MITRE_ANALYZER_URL` and `INGEST_API_KEY` in `.env.local` (see the root README) so the MITRE proxy and `/api/ingest` are wired to your environment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
