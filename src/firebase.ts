/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const appConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey
};

const app = initializeApp(appConfig);
export const db = getFirestore(app, appConfig.firestoreDatabaseId);

