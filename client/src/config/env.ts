/**
 * Central place for environment-driven config.
 *
 * IMPORTANT (React Native / Expo):
 * - "localhost" only works when the app runs in a web browser or an iOS
 *   simulator on the SAME machine as the backend.
 * - On a physical device or Android emulator, "localhost" points to the
 *   device itself, NOT your computer. Use your computer's LAN IP instead,
 *   e.g. http://192.168.1.42:5000/api/v1
 * - Android emulator (not a real device) can use http://10.0.2.2:5000/api/v1
 *
 * Change API_BASE_URL below (or better, set EXPO_PUBLIC_API_BASE_URL in a
 * .env file) when you move from local testing to a real device or a
 * deployed backend.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

export const API_TIMEOUT_MS = 15000;
