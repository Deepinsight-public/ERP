# ERP System - Multi-tenant Retail Management

A full-stack ERP system with role-based access control and multi-tenant architecture built with Next.js 14, Node.js/Express, PostgreSQL, and Firebase authentication.

## 🚀 Features

### Phase 1 Deliverables (Completed)
- ✅ Complete authentication system with Firebase integration
- ✅ Role-based access control (Headquarter, Warehouse, Store)
- ✅ Database setup with normalized Retailer schema
- ✅ Multi-tenant architecture
- ✅ Basic dashboard for each role with key metrics
- ✅ Core CRUD operations for products, inventory, and orders
- ✅ Responsive design with professional UI
- ✅ Security implementation (input validation, CORS, role verification)

### User Roles
- **Headquarter (Admin)**: Complete system overview, manage all stores/warehouses
- **Warehouse**: Inventory management and distribution operations
- **Store**: Retail operations and customer management

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Firebase Authentication**
- **Lucide React** icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Firebase Admin SDK**
- **JWT** token validation
- **CORS** and security middleware

### Database
- **AWS RDS PostgreSQL**
- Normalized Retailer schema
- Multi-tenant architecture
- Foreign key relationships
- Audit trails with timestamps

## 📁 Project Structure

```
ERP/
├── frontend/                 # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── dashboard/   # Dashboard layout and pages
│   │   │   ├── products/    # Product management
│   │   │   ├── inventory/   # Inventory tracking
│   │   │   ├── orders/      # Order management
│   │   │   ├── login/       # Authentication pages
│   │   │   └── register/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Base UI components
│   │   │   ├── auth/        # Authentication forms
│   │   │   └── layout/      # Layout components
│   │   ├── contexts/        # React contexts
│   │   └── lib/             # Utilities and configurations
│   └── package.json
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/          # Database and Firebase config
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Authentication and error handling
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── database/        # Migrations and seeds
│   │   └── server.ts        # Express server setup
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Firebase project with Authentication enabled

### Environment Setup

#### Backend (.env)
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

#### Frontend (.env.local)
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

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🔐 Authentication & Roles

### Development Mode
For development without full Firebase setup, the system uses mock authentication:
- **admin@demo.com** → Headquarter role
- **store@demo.com** → Store role  
- **warehouse@demo.com** → Warehouse role

### Production Setup
1. Create a Firebase project
2. Enable Authentication with Email/Password
3. Set up custom claims for role management
4. Configure environment variables

## 📊 Database Schema

The system uses a normalized Retailer schema with:
- **Companies**: Multi-tenant company management
- **Users**: User accounts with role assignments
- **Stores/Warehouses**: Location management
- **Products**: Product catalog
- **Inventory**: Stock tracking across locations
- **Orders**: Purchase, sales, and transfer orders
- **Order Items**: Detailed order line items

## 🔒 Security Features

- JWT token validation on all API endpoints
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Environment variable management
- Secure Firebase integration

## 🎨 UI/UX Features

- Responsive design for desktop and tablet
- Professional business interface
- Role-specific navigation and permissions
- Loading states and error handling
- Real-time data updates
- Intuitive dashboard with key metrics
- Clean, modern design following business standards

## 📱 Pages & Features

### Dashboard
- Role-specific overview and metrics
- Key performance indicators
- Recent activity feed
- Low stock alerts
- Quick action buttons

### Products
- Product catalog management
- Search and filtering
- Category organization
- Stock level tracking
- Price management

### Inventory
- Multi-location stock tracking
- Low stock alerts
- Inventory adjustments
- Location-based filtering
- Real-time stock levels

### Orders
- Purchase order management
- Sales order processing
- Transfer order handling
- Order status tracking
- Customer information

## 🚧 Development Status

### ✅ Phase 1 Complete
- Authentication system with role-based access
- Database setup with sample data
- Basic dashboard for each role
- Core CRUD operations for products, inventory, orders
- Responsive UI with professional design

### 🔄 Future Phases
- Customer Management module
- Advanced Reporting and Analytics
- Real-time WebSocket updates
- Advanced inventory features (transfers, adjustments)
- Financial management and reporting
- Mobile application
- Advanced security features

## 🤝 Contributing

This project follows standard development practices:
1. Create feature branches from main
2. Follow TypeScript and ESLint rules
3. Test changes locally before committing
4. Create pull requests for review
5. Ensure CI/CD pipeline passes

## 📄 License

This project is proprietary software developed for retail management purposes.

---

**Built with ❤️ for modern retail operations**
