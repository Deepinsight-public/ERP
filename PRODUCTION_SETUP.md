# 🚀 Production Setup Guide

## Files That Need Manual Modification

### 1. **Backend Environment Configuration**

**File**: `backend/.env`

Replace the development values with your production credentials:

```bash
# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# For Local PostgreSQL:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_system
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# For AWS RDS PostgreSQL:
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=erp_system
DB_USER=your_rds_username
DB_PASSWORD=your_rds_password

# ==========================================
# FIREBASE CONFIGURATION
# ==========================================
# Get these from Firebase Console > Project Settings > Service Accounts

FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com

# ==========================================
# APPLICATION CONFIGURATION
# ==========================================
PORT=3001
NODE_ENV=production  # CHANGE THIS TO production
FRONTEND_URL=https://your-frontend-domain.com  # Your actual frontend URL
```

### 2. **Frontend Environment Configuration**

**File**: `frontend/.env.local`

Replace with your Firebase web app configuration:

```bash
# ==========================================
# API CONFIGURATION
# ==========================================
NEXT_PUBLIC_API_URL=https://your-backend-domain.com  # Your actual backend URL

# ==========================================
# FIREBASE WEB APP CONFIGURATION
# ==========================================
# Get these from Firebase Console > Project Settings > General > Your apps > Web app

NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id
```

### 3. **Database Configuration Code**

**File**: `backend/src/config/database.ts`

Modify the `initializeDatabase()` function:

```typescript
export async function initializeDatabase() {
  // Remove this block or change condition for production:
  /*
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode - skipping database initialization');
    console.log('Using mock data for demo purposes');
    return;
  }
  */
  
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    await createTables();
    await seedInitialData();
    
    client.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}
```

## 🛠 Setup Steps

### Step 1: AWS RDS PostgreSQL Setup

1. **Create RDS Instance**:
   ```bash
   # Via AWS Console or CLI
   aws rds create-db-instance \
     --db-instance-identifier erp-production \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username your_username \
     --master-user-password your_password \
     --allocated-storage 20
   ```

2. **Get Connection Details**:
   - Endpoint: `your-rds-endpoint.region.rds.amazonaws.com`
   - Port: `5432`
   - Database name: Create `erp_system` database

3. **Configure Security Groups**:
   - Allow inbound PostgreSQL traffic (port 5432)
   - From your application servers' IP ranges

### Step 2: Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Authentication with Email/Password

2. **Get Service Account Key**:
   ```bash
   # Firebase Console > Project Settings > Service Accounts
   # Click "Generate new private key"
   # Download the JSON file
   ```

3. **Get Web App Config**:
   ```bash
   # Firebase Console > Project Settings > General
   # Scroll to "Your apps" section
   # Click on web app icon to get config
   ```

4. **Set Up Custom Claims** (for roles):
   ```javascript
   // Firebase Console > Authentication > Users
   // Or use Firebase CLI/Admin SDK to set custom claims
   admin.auth().setCustomUserClaims(uid, { 
     role: 'headquarter', 
     companyId: 1 
   });
   ```

### Step 3: Environment Setup

1. **Backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Frontend**:
   ```bash
   cd frontend
   # Edit .env.local with your production values
   ```

### Step 4: Database Migration

```bash
# The app will auto-create tables on first run, or manually:
cd backend
npm run build
NODE_ENV=production npm start
```

## 🔒 Security Considerations

### Environment Variables Security
- **Never commit** `.env` files to git
- Use **environment variable injection** in production (Docker, Kubernetes secrets)
- **Rotate credentials** regularly

### Database Security
- Use **strong passwords**
- Enable **SSL connections**
- Configure **VPC security groups**
- Regular **backups**

### Firebase Security
- Configure **Firebase Rules**
- Enable **App Check** for production
- Set up **CORS** properly

## 📦 Deployment Configuration

### Docker Environment

**File**: `backend/Dockerfile` (if using Docker)
```dockerfile
# Environment variables passed at runtime
ENV NODE_ENV=production
ENV DB_HOST=${DB_HOST}
ENV DB_PASSWORD=${DB_PASSWORD}
# ... other env vars
```

### Kubernetes/Helm

**File**: `k8s/configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: erp-config
data:
  NODE_ENV: "production"
  DB_HOST: "your-rds-endpoint.region.rds.amazonaws.com"
  # Non-sensitive config only
```

**File**: `k8s/secret.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: erp-secrets
data:
  DB_PASSWORD: <base64-encoded-password>
  FIREBASE_PRIVATE_KEY: <base64-encoded-key>
```

## ✅ Verification Steps

1. **Test Database Connection**:
   ```bash
   psql -h your-rds-endpoint.region.rds.amazonaws.com -U your_username -d erp_system
   ```

2. **Test Firebase Connection**:
   ```bash
   # Check Firebase Admin SDK initialization
   # Check user authentication flow
   ```

3. **Test Application**:
   ```bash
   # Backend health check
   curl https://your-backend-domain.com/health
   
   # Frontend accessibility
   curl https://your-frontend-domain.com
   ```

## 🚨 Common Issues

### Database Issues
- **Connection timeout**: Check security groups and VPC settings
- **Authentication failed**: Verify username/password
- **SSL required**: Add `?ssl=true` to connection string if needed

### Firebase Issues
- **Invalid private key**: Ensure proper JSON formatting and escaping
- **Permission denied**: Check Firebase project permissions
- **CORS errors**: Configure allowed origins in Firebase

---

**After following this guide, your ERP system will be ready for production deployment!** 🎉 