# Tech Stack

## Mobile (Client)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Expo SDK 51** (React Native) | Cross-platform iOS/Android from one codebase |
| Routing | **Expo Router** (file-based) | Convention over configuration, deep-link friendly |
| Styling | **NativeWind** (Tailwind CSS) | Rapid UI iteration with design tokens |
| Data fetching | **TanStack Query v5** | Caching, background sync, loading/error states |
| Offline cache | **TanStack Query Persist Client** + **AsyncStorage** | 24h query cache persisted to device storage |
| Global state | **Zustand** | Lightweight; used for auth session and selected project |
| Forms | **React Hook Form** + **Zod** | Validated forms with minimal boilerplate |
| Charts | **react-native-gifted-charts** | Income/expense visualizations |
| Dates | **date-fns** | Date formatting and arithmetic |
| PDF | **expo-print** + **expo-sharing** | HTML-to-PDF generation and native share sheet |
| Language | **TypeScript** | Type safety across DB types and UI |

## Backend

| Layer | Choice | Reason |
|---|---|---|
| Auth | **Supabase Auth** | Email/password auth, JWT, zero infra |
| Session storage | **expo-secure-store** (native) / `localStorage` (web) | Secure keychain on device |
| Database | **Supabase PostgreSQL** | Relational, RLS for per-user security |
| RLS strategy | Open (any authenticated user) | Small team, no role separation needed |
| Migrations | Sequential SQL files (`supabase/migrations/`) | Version-controlled schema evolution |

## Key architectural decisions

- **Single Supabase project** shared across all team members — no data isolation by user
- **Project switcher** in-app (`projectStore`) — users select the active project from a list
- **Offline-capable read**: TanStack Query cache persisted to AsyncStorage (24h); writes still require connectivity
- **No push notifications** (yet)
- **PDF reports** already functional: `expo-print` renders HTML → PDF, `expo-sharing` opens native share sheet

## Current tech debt / known limits

- Expo SDK 51 (not the latest) — upgrade needed before major feature work
- RLS policies are fully open (`auth.uid() is not null`) — acceptable for personal use, not for SaaS
- Report screen only covers payroll PDF; expense and income PDF reports not yet built
