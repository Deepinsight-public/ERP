import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      firebaseInitialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    console.log('Running in development mode without Firebase');
  }
} else {
  console.log('Firebase credentials not found - running in development mode');
}

export { admin };

export async function setCustomClaims(uid: string, claims: { role: string; companyId: number; storeId?: number; warehouseId?: number }) {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized - skipping custom claims setting');
    return true; // Return success for development mode
  }
  
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

export async function verifyIdToken(idToken: string) {
  if (!firebaseInitialized) {
    console.log('Firebase not initialized - using mock token verification');
    if (idToken.includes('admin')) {
      return { uid: 'test-hq-001', email: 'admin@demo.com' };
    } else if (idToken.includes('store')) {
      return { uid: 'test-store-001', email: 'store@demo.com' };
    } else if (idToken.includes('warehouse')) {
      return { uid: 'test-warehouse-001', email: 'warehouse@demo.com' };
    }
    return { uid: 'test-hq-001', email: 'admin@demo.com' };
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}
