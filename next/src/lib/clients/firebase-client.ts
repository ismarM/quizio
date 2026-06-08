import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

const clientEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingEnv = Object.entries(clientEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  throw new Error(`Missing Firebase client env vars: ${missingEnv.join(", ")}`);
}

const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: clientEnv.apiKey!,
      authDomain: clientEnv.authDomain!,
      projectId: clientEnv.projectId!,
      storageBucket: clientEnv.storageBucket!,
      messagingSenderId: clientEnv.messagingSenderId!,
      appId: clientEnv.appId!,
    });

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

