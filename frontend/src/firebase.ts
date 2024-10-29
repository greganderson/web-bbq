import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING,
	appId: import.meta.env.VITE_FIREBASE_APP,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
