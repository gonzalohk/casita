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
