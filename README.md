# Field Officer Mobile App

Expo + React Native app for Field Officer accounts. It uses the existing central backend and does not contain mock site data.

## Run

1. Copy `.env.example` to `.env` in this directory.
2. Set `EXPO_PUBLIC_API_BASE_URL` to the backend machine's LAN address and port. The current dev machine address is `http://192.168.8.101:3000`; change it in `mobile/.env` whenever that address changes. Do not use `localhost` from a physical phone.
3. Start the backend so port `3000` is reachable on the same Wi-Fi network, then run `npm start` here and open the project in Expo Go.

The backend CORS middleware accepts requests without a browser origin, as sent by the native app. The app uses the existing `/api/auth`, `/api/sites`, and `/api/reports/my-sites` endpoints.

## Android Maps

Expo Go supplies its own Android Google Maps configuration for development. A standalone Android build needs a Google Maps Android API key enabled for the Maps SDK for Android. Set `GOOGLE_MAPS_API_KEY` in `mobile/.env`; `app.config.ts` passes it to the native build. Keep the key restricted to the app's package and signing certificate. iOS uses the native Apple Maps provider.

Local HTTP is enabled for development against the LAN backend. Use HTTPS for a production backend before publishing a standalone app.

## Permissions

Location permission is requested for GPS capture and the map's current-location indicator. Camera and photo-library permissions are requested when those actions are used. Denial leaves manual coordinate entry, site markers, and the other photo source available.