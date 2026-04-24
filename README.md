# Casita Construcción

A React Native / Expo app to manage a personal construction project — track income, expenses, inventory, and payroll.

## Tech Stack

- **Expo** (SDK 51) with Expo Router
- **React Native** + **NativeWind** (Tailwind CSS)
- **Supabase** (auth + database)
- **TanStack Query** for data fetching
- **Zustand** for global state
- **React Hook Form** + **Zod** for forms

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account and project

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd casita-construccion
npm install
```

---

## 2. Set Up Supabase

### Create the database schema

1. Open your Supabase project dashboard.
2. Go to **SQL Editor → New query**.
3. Paste and run the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).

### Get your credentials

In your Supabase project go to **Project Settings → API** and copy:
- **Project URL** (`https://xxxx.supabase.co`)
- **anon / public** key

---

## 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 4. Run the App

### Web

```bash
npm run web
# or
npx expo start --web
```

Opens at **http://localhost:8081**.

### iOS Simulator

```bash
npm run ios
```

### Android Emulator

```bash
npm run android
```

### Expo Go (physical device)

```bash
npm start
```

Scan the QR code with the **Expo Go** app.

---

## Project Structure

```
app/                  # Expo Router screens
  (app)/              # Authenticated routes
    index.tsx         # Dashboard
    onboarding.tsx    # Project setup
    expenses/         # Expense management
    income/           # Income management
    inventory/        # Materials inventory
    payroll/          # Workers & payroll
  (auth)/             # Login / Register screens
src/
  hooks/              # Data hooks (TanStack Query)
  lib/                # Supabase & query client setup
  stores/             # Zustand stores
  types/              # TypeScript types
  utils/              # Formatters
supabase/
  migrations/         # SQL migrations
```

---

## 5. Deploy to Vercel

### Prerequisites

- A [Vercel](https://vercel.com/) account
- The repo pushed to GitHub / GitLab / Bitbucket

### Option A — Vercel Dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. Vercel will detect the `vercel.json` config automatically:
   - **Build command**: `npx expo export --platform web`
   - **Output directory**: `dist`
3. Before deploying, add the environment variables under **Settings → Environment Variables**:

   | Variable | Value |
   |---|---|
   | `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |

4. Click **Deploy**.

### Option B — Vercel CLI

```bash
# Install Vercel CLI (once)
npm i -g vercel

# Login
vercel login

# Deploy (follow the prompts)
vercel

# After adding env vars in the dashboard, promote to production
vercel --prod
```

### Environment variables in the CLI

```bash
vercel env add EXPO_PUBLIC_SUPABASE_URL
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Notes

- Every `git push` to the main branch will trigger an automatic redeploy if the repo is linked to Vercel.
- The `vercel.json` includes a rewrite rule (`/* → /index.html`) so Expo Router's client-side navigation works correctly.
- The Supabase **anon key** is safe to expose publicly — RLS policies protect the data.

---

## 6. Build Android APK

Uses **EAS Build** (Expo's cloud build service). No Android Studio or local SDK required.

### Prerequisites

- An [Expo account](https://expo.dev/signup) (free)
- EAS CLI installed

```bash
npm install -g eas-cli
eas login

```

### Step 1 — Configure EAS in the project (once)

```bash
eas build:configure
```

This creates an `eas.json` file. Confirm the prompts with the defaults.

### Step 2 — Add environment variables to EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://mjlvolbboodgtulcmmbw.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your-anon-key>"
```

### Step 3 — Build the APK

```bash
# APK instalable directo (para compartir / probar)
eas build --platform android --profile preview
```

EAS te dará un link de descarga cuando termine (~15 min). Instalalo en cualquier Android habilitando "Instalar desde fuentes desconocidas".

### Step 4 — Build para Google Play Store (AAB)

```bash
eas build --platform android --profile production
```

### Build profiles summary

| Profile | Output | Use case |
|---|---|---|
| `preview` | APK | Share / install directly |
| `production` | AAB | Google Play Store |

> **iOS**: Requires an Apple Developer account ($99/year). Run `eas build --platform ios --profile production` once you have the account set up.
