# WEARO Frontend

Expo React Native auth foundation for the WEARO consumer AI personal stylist app.

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

The app expects the Rails backend auth contract under `/api/v1`, including `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `DELETE /auth/logout`, and `GET/PATCH /me`.

Successful register/login/refresh responses must include the JWT in the `Authorization` response header as `Bearer ...`.

## Scripts

```sh
npm start
npm run web
npm run typecheck
```
