# Firebase Setup Guide for ERP System

## Overview
This guide explains how to configure Firebase authentication for the ERP system. The Firebase integration is already implemented in the codebase but requires proper environment variables to function.

## Required Firebase Credentials

### Backend Credentials (Service Account Key)
These credentials go in `/backend/.env` and come from a Firebase service account JSON file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

### Frontend Credentials (Web App Config)
These credentials go in `/frontend/.env.local` and come from your Firebase web app configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id
```

## How to Get These Credentials

### 1. Service Account Key (Backend)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values from the JSON file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the \n characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `client_id` → `FIREBASE_CLIENT_ID`
   - `client_x509_cert_url` → `FIREBASE_CLIENT_CERT_URL`

### 2. Web App Config (Frontend)
1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Click on your web app or create one if it doesn't exist
4. Copy the config object values:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firebase Project Requirements

### Authentication Setup
1. Enable Authentication in Firebase Console
2. Enable Email/Password sign-in method
3. Optionally enable other sign-in methods as needed

### Security Rules
The current implementation uses Firebase Admin SDK for user management, so default security rules should work.

## Testing the Setup

### 1. Start the Servers
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### 2. Check Console Logs
- Backend should show: "Firebase Admin SDK initialized successfully"
- Frontend should not show Firebase initialization errors

### 3. Test Authentication
1. Go to http://localhost:3000
2. Try logging in with test credentials
3. Check browser console for any Firebase errors

## Current Implementation Details

### Backend Firebase Integration
- **File**: `backend/src/config/firebase.ts`
- **Purpose**: Initializes Firebase Admin SDK for token verification
- **Fallback**: Gracefully falls back to demo mode if credentials are missing

### Frontend Firebase Integration
- **File**: `frontend/src/lib/firebase.ts`
- **Purpose**: Initializes Firebase client SDK for authentication
- **Context**: `frontend/src/contexts/AuthContext.tsx` handles auth state

### Authentication Middleware
- **File**: `backend/src/middleware/auth.ts`
- **Purpose**: Validates Firebase tokens on API requests
- **Integration**: Uses `verifyIdToken` from Firebase config

## Troubleshooting

### Common Issues
1. **Invalid PEM formatted message**: Check FIREBASE_PRIVATE_KEY formatting
2. **API key not valid**: Verify NEXT_PUBLIC_FIREBASE_API_KEY is correct
3. **Project not found**: Ensure FIREBASE_PROJECT_ID matches your Firebase project

### Debug Steps
1. Check environment variables are loaded correctly
2. Verify Firebase project settings match your credentials
3. Check browser console for detailed error messages
4. Verify backend logs for Firebase initialization status
