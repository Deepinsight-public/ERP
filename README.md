# ERP System - Multi-tenant Retail Management

A full-stack Enterprise Resource Planning (ERP) system designed for multi-tenant retail management. The system serves retail businesses by providing a comprehensive platform for managing products, inventory, orders, and operations across multiple locations (stores and warehouses) with role-based access control.

## What This Project Is About

This ERP system enables retail businesses to:

- **Manage Multiple Locations**: Coordinate operations across stores and warehouses
- **Role-Based Access**: Three user roles with specific permissions:
  - **Headquarter (Admin)**: Complete system oversight and management across all locations
  - **Warehouse Managers**: Inventory management and distribution operations  
  - **Store Managers**: Retail operations and customer management at specific locations
- **Inventory Tracking**: Real-time stock levels across all locations
- **Order Management**: Handle purchase orders, sales orders, and transfer orders
- **Product Catalog**: Centralized product management with category organization
- **Multi-Tenant Architecture**: Support multiple companies with isolated data

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Firebase Authentication
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL, Firebase Admin SDK
- **Database**: AWS RDS PostgreSQL with normalized schema

## How to Run This Web Application Locally

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Firebase project with Authentication enabled

### Environment Setup

#### Backend Environment (.env)
Create a `.env` file in the `backend/` directory:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_system
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Firebase (optional for development)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend Environment (.env.local)
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Installation & Running

#### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
The backend API will be available at: http://localhost:3001

#### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at: http://localhost:3000

### Development Authentication

For development without full Firebase setup, use these mock credentials:
- **admin@demo.com** → Headquarter role (full system access)
- **store@demo.com** → Store role (retail operations)
- **warehouse@demo.com** → Warehouse role (inventory management)

### Production Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password provider
3. Set up custom claims for role management
4. Configure the environment variables with your Firebase credentials
5. Set up your PostgreSQL database with the required schema
