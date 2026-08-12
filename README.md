# WEARO Frontend

Expo React Native frontend for the WEARO consumer AI personal stylist app. The current foundation includes authentication, resumable style onboarding, and wardrobe item management across native and web.

## Setup

```sh
npm install
cp .env.example .env
npm start
```

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

Successful register/login/refresh responses must include the JWT in the `Authorization` response header as `Bearer ...`.

Camera/gallery uploads accept JPEG, PNG, or WebP files up to 10 MB. Uploaded items display the backend `processing` state immediately. Automatic AI analysis is intentionally not presented as complete because that begins in backend Milestone 4.

## Scripts

```sh
npm start
npm run web
npm run typecheck
```
