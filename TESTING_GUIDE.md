# 🧪 ERP System Testing Guide

## Quick Start Testing

### 1. **Automated Test Script**
```bash
./test-system.sh
```

### 2. **Manual Testing Steps**

#### Start Backend:
```bash
cd backend
npm run dev
```

#### Start Frontend (in new terminal):
```bash
cd frontend  
npm run dev
```

#### Access System:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🔑 Demo Authentication

The system runs in **development mode** with mock authentication:

| Role | Email | Description |
|------|-------|-------------|
| **Headquarter** | admin@demo.com | Full system access, all locations |
| **Store** | store@demo.com | Retail operations, customer management |
| **Warehouse** | warehouse@demo.com | Inventory, distribution operations |

## 🧪 Test Scenarios

### 1. **Authentication Flow**
- [ ] Visit http://localhost:3000
- [ ] Should redirect to login page
- [ ] Use demo credentials above
- [ ] Should redirect to role-specific dashboard

### 2. **Dashboard Testing**
- [ ] **HQ Dashboard**: Overview metrics, all locations
- [ ] **Store Dashboard**: Sales metrics, customer data
- [ ] **Warehouse Dashboard**: Inventory levels, transfers

### 3. **Core Features**
- [ ] **Products**: Add/edit products, view catalog
- [ ] **Inventory**: Check stock levels, location-based filtering  
- [ ] **Orders**: Create orders, view order history
- [ ] **Navigation**: Role-based menu visibility

### 4. **API Testing**
```bash
# Health check
curl http://localhost:3001/health

# Get products (with auth)
curl -H "Authorization: Bearer demo-token" http://localhost:3001/api/products

# Dashboard stats
curl -H "Authorization: Bearer admin-token" http://localhost:3001/api/dashboard/stats
```

## 🛠 System Status

### ✅ Working Features
- [x] Authentication system (mock mode)
- [x] Role-based access control
- [x] Responsive UI design
- [x] API endpoints structure
- [x] Development environment

### ⚠️ Setup Required
- [ ] PostgreSQL database (for production)
- [ ] Firebase credentials (for production auth)
- [ ] Environment configuration

### 🔧 Known Issues
1. **Database**: Currently runs with mock data (development mode)
2. **Firebase**: Using placeholder credentials
3. **Real Data**: Sample CSV data not yet imported

## 📊 System Architecture

```
Frontend (Next.js)  ←→  Backend (Express)  ←→  Database (PostgreSQL)
    ↓                       ↓                       ↓
- Role-based UI         - REST API              - Normalized schema
- Modern design         - Authentication        - Multi-tenant  
- Responsive            - Security              - Audit trails
```

## 🎯 Production Readiness

To deploy for production:

1. **Database Setup**:
   ```bash
   # Create PostgreSQL database
   createdb erp_system
   
   # Update .env with real credentials
   DB_HOST=your_host
   DB_USER=your_user
   DB_PASSWORD=your_password
   ```

2. **Firebase Setup**:
   - Create Firebase project
   - Enable Authentication
   - Update .env with real Firebase credentials

3. **Data Import**:
   - Import CSV sample data
   - Set up initial users and companies

## 📈 Next Steps

1. **Complete Database Integration**: Connect to real PostgreSQL
2. **Import Sample Data**: Load the provided CSV files
3. **Set up Firebase**: Configure real authentication
4. **Add Advanced Features**: Reporting, analytics, mobile support

---

**Built with modern tech stack for scalable retail management** 🚀 