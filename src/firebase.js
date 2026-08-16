import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config is read from environment variables (.env file at project root).
// Get these values from Firebase Console → Project settings → Your apps → Web app,
// or by running:  firebase apps:sdkconfig web --project 423715564608
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Guard against missing config. If keys are absent, we export stubs so the
// rest of the app (tools, wallpapers, meme finder, etc.) still renders —
// only auth/firestore features are disabled. This is much friendlier than
// letting getAuth() throw and taking the whole page down.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} else {
  console.error(
    "[Firebase] Missing configuration. Auth and sync features are disabled. " +
    "Create a .env file at the project root with your VITE_FIREBASE_* values, " +
    "then restart the dev server (npm run dev). See .env.example for the required keys."
  );
}

export { auth, db, googleProvider };
