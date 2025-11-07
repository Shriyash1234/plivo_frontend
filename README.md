## Status Page Frontend

Next.js 16 frontend for the status page platform. Features include:

- Public status experience with service health, incidents, and historical timeline
- Auth flows (register with new org or join via invite, login)
- Admin dashboard for managing services and incidents
- Shared auth state + API client hitting the Express/Mongo backend
- Uses shadcn/ui components and Tailwind CSS v4

## Prerequisites

- Node 18+
- Backend running (default `http://localhost:5000/api`)

## Environment

Create `.env.local` in `frontend/`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:5000/api
# optional: pre-fill the public landing page
NEXT_PUBLIC_DEFAULT_ORGANIZATION=<org-id-or-slug>
```

## Development

```bash
npm install        # install once (fix node_modules ownership if needed)
npm run dev        # http://localhost:3000
```

The UI uses the App Router. Authenticated routes live under `/dashboard`, while `/` stays public.

## Key Paths

- `src/providers/auth-provider.jsx` – auth context w/ localStorage persistence
- `src/services/api-client.js` – fetch helper adding JWT header when present
- `src/app/(auth)/*` – login and register flows
- `src/app/(dashboard)/dashboard/*` – admin surface (overview, services, incidents)
- `src/app/page.js` – public status page consuming `/api/public/status`

## Testing the UI

1. Run backend + MongoDB.
2. Register a user at `/register` (creates org) or use invite flow.
3. Login at `/login`, then manage services/incidents in `/dashboard`.
4. Visit `/` with the organization id/slug to see the public snapshot.

## Realtime

The backend broadcasts `status:update` over Socket.io. Install the frontend dependency when connectivity/permissions allow:

```bash
npm install socket.io-client
```

Then wire `socket.io-client` inside the public page and dashboard to subscribe to updates (see TODO in `src/app/page.js`).

## Production

```bash
npm run build
npm start
```

Deploy the frontend alongside the backend (e.g., Vercel for frontend, Render/Railway for API). Ensure `NEXT_PUBLIC_API_URL` points to the deployed backend.
