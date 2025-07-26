# 📝 Files to Manually Modify for Production

## Quick Checklist

### ✅ **Required File Modifications**

| File | Purpose | What to Change |
|------|---------|----------------|
| **`backend/.env`** | Database & Firebase config | Replace all placeholder values |
| **`frontend/.env.local`** | Firebase web app config | Replace demo values with real Firebase config |
| **`backend/src/config/database.ts`** | Database initialization | Comment out development mode check |

### 🔧 **Optional Modifications**

| File | Purpose | When Needed |
|------|---------|-------------|
| **`backend/src/config/firebase.ts`** | Firebase setup | Usually works as-is |
| **`frontend/next.config.mjs`** | Next.js config | For custom domains/CDN |
| **`backend/package.json`** | Build scripts | For Docker/deployment |

## 📋 Step-by-Step Modification Guide

### 1. **`backend/.env`** (REQUIRED)

```bash
# Current (development):
DB_HOST=localhost
DB_USER=hong
DB_PASSWORD=
NODE_ENV=development
FIREBASE_PROJECT_ID=demo-erp-project

# Change to (production):
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your_rds_username  
DB_PASSWORD=your_secure_password
NODE_ENV=production
FIREBASE_PROJECT_ID=your-real-project-id
```

### 2. **`frontend/.env.local`** (REQUIRED)

```bash
# Current (development):
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-erp-project

# Change to (production):
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_FIREBASE_API_KEY=your-real-api-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-real-project-id
```

### 3. **`backend/src/config/database.ts`** (REQUIRED)

Find this code block:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode - skipping database initialization');
  console.log('Using mock data for demo purposes');
  return;
}
```

**Comment it out or remove it** to enable real database initialization:
```typescript
/*
if (process.env.NODE_ENV === 'development') {
  console.log('Running in development mode - skipping database initialization');
  console.log('Using mock data for demo purposes');
  return;
}
*/
```

## 🎯 That's It!

**Just these 3 files need manual modification** to go from development to production setup with PostgreSQL/AWS RDS and Firebase.

The system is well-architected to minimize configuration changes needed for deployment.

## 📚 For Complete Setup Details
See `PRODUCTION_SETUP.md` for:
- How to get Firebase credentials
- AWS RDS setup instructions  
- Security configurations
- Deployment options 