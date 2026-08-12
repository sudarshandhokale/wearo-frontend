# WEARO Frontend

Expo React Native frontend for the WEARO consumer AI personal stylist app. The current foundation includes authentication, resumable style onboarding, and wardrobe item management across native and web.

## Setup

```sh
corepack enable
corepack prepare pnpm@10.17.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start
```

The project pins pnpm in `package.json`. Do not use npm or generate a
`package-lock.json`.

Set `EXPO_PUBLIC_API_BASE_URL` to the Rails API origin:

- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Physical device: `http://<your-lan-ip>:3000`
- Web: `http://localhost:3000`

For web auth, Rails CORS must allow the Expo web origin and expose the auth header so browser JavaScript can read it:

```rb
expose: ["Authorization"]
```

The app expects the Rails backend under `/api/v1`, including auth, `/metadata`, `/style_profile`, and `/clothing_items`.

Successful login, confirmation verification, and refresh responses include the
JWT in the `Authorization` response header as `Bearer ...`. Registration does
not return a JWT; the user must confirm their email before signing in.

Camera/gallery uploads accept JPEG, PNG, or WebP files up to 10 MB. Uploaded items display the backend `processing` state immediately. Automatic AI analysis is intentionally not presented as complete because that begins in backend Milestone 4.

## Scripts

```sh
# Start Expo and choose a target interactively
pnpm start

# Start a specific platform
pnpm web
pnpm ios
pnpm android

# Run the same validation used by CI
pnpm check:expo
pnpm typecheck
pnpm build:web
```

The production web export is written to `dist/`.

## Continuous Integration

GitHub Actions runs on pull requests and pushes to `main`. The workflow uses
pnpm 10.17 with a frozen lockfile, validates Expo dependency versions, runs the
strict TypeScript check, and exports the production web bundle.
