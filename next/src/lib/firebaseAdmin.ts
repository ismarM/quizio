import "server-only";

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const adminEnv = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

const missingEnv = Object.entries(adminEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  throw new Error(`Missing Firebase admin env vars: ${missingEnv.join(", ")}`);
}

const privateKey = adminEnv.privateKey!.replace(/\\n/g, "\n");

const adminApp: App = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: cert({
        projectId: adminEnv.projectId,
        clientEmail: adminEnv.clientEmail,
        privateKey,
      }),
    });

export const adminAuth = getAuth(adminApp);
