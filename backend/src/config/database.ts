import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode - skipping database initialization');
    console.log('Using mock data for demo purposes');
    return;
  }
  
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

async function createTables() {
  const createTablesQuery = `
    -- Companies table (multi-tenant support)
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table with role-based access
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firebase_uid VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('headquarter', 'warehouse', 'store')),
      company_id INTEGER REFERENCES companies(id),
      store_id INTEGER,
      warehouse_id INTEGER,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Stores table
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      store_code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      region VARCHAR(100),
      state VARCHAR(100),
      main_contact VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, store_code)
    );

    -- Warehouses table
    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      warehouse_code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      manager_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, warehouse_code)
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      sku VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      unit_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      barcode VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, sku)
    );

    -- Inventory table
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      product_id INTEGER REFERENCES products(id),
      store_id INTEGER REFERENCES stores(id),
      warehouse_id INTEGER REFERENCES warehouses(id),
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved_quantity INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER DEFAULT 0,
      max_stock_level INTEGER,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK ((store_id IS NOT NULL AND warehouse_id IS NULL) OR (store_id IS NULL AND warehouse_id IS NOT NULL))
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      order_number VARCHAR(100) NOT NULL,
      order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('purchase', 'sales', 'transfer')),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      store_id INTEGER REFERENCES stores(id),
      warehouse_id INTEGER REFERENCES warehouses(id),
      customer_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      total_amount DECIMAL(12,2),
      order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, order_number)
    );

    -- Order items table
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2),
      total_price DECIMAL(12,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      customer_code VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      postal_code VARCHAR(20),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, customer_code)
    );

    -- Audit trail table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      user_id INTEGER REFERENCES users(id),
      table_name VARCHAR(100) NOT NULL,
      record_id INTEGER NOT NULL,
      action VARCHAR(50) NOT NULL,
      old_values JSONB,
      new_values JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
    CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id);
    CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_product_store ON inventory(product_id, store_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
    CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
  `;

  await pool.query(createTablesQuery);
  console.log('Database tables created successfully');
}

async function seedInitialData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const companyResult = await client.query(`
      INSERT INTO companies (name, code) 
      VALUES ('Demo Retail Company', 'DEMO') 
      ON CONFLICT (code) DO NOTHING 
      RETURNING id
    `);

    let companyId;
    if (companyResult.rows.length > 0) {
      companyId = companyResult.rows[0].id;
    } else {
      const existingCompany = await client.query('SELECT id FROM companies WHERE code = $1', ['DEMO']);
      companyId = existingCompany.rows[0].id;
    }

    await client.query(`
      INSERT INTO stores (company_id, store_code, name, region, state, main_contact, phone, email) VALUES
      ($1, 'WH1-CA', 'California Store 1', 'West', 'California', 'John Doe', '555-0101', 'ca1@demo.com'),
      ($1, 'WH2-GA', 'Georgia Store 1', 'South', 'Georgia', 'Jane Smith', '555-0102', 'ga1@demo.com'),
      ($1, 'WH3-TX', 'Texas Store 1', 'South', 'Texas', 'Bob Johnson', '555-0103', 'tx1@demo.com'),
      ($1, 'WH4-FL', 'Florida Store 1', 'South', 'Florida', 'Alice Brown', '555-0104', 'fl1@demo.com'),
      ($1, 'WH5-NJ', 'New Jersey Store 1', 'Northeast', 'New Jersey', 'Charlie Wilson', '555-0105', 'nj1@demo.com')
      ON CONFLICT (company_id, store_code) DO NOTHING
    `, [companyId]);

    await client.query(`
      INSERT INTO warehouses (company_id, warehouse_code, name, location, manager_name, phone, email) VALUES
      ($1, 'WH-CENTRAL', 'Central Warehouse', 'Dallas, TX', 'Mike Davis', '555-0201', 'central@demo.com'),
      ($1, 'WH-WEST', 'West Coast Warehouse', 'Los Angeles, CA', 'Sarah Miller', '555-0202', 'west@demo.com'),
      ($1, 'WH-EAST', 'East Coast Warehouse', 'Atlanta, GA', 'Tom Anderson', '555-0203', 'east@demo.com')
      ON CONFLICT (company_id, warehouse_code) DO NOTHING
    `, [companyId]);

    await client.query(`
      INSERT INTO products (company_id, sku, name, description, category, unit_price, cost_price, barcode) VALUES
      ($1, 'PROD-001', 'Wireless Headphones', 'Premium wireless headphones with noise cancellation', 'Electronics', 199.99, 120.00, '1234567890123'),
      ($1, 'PROD-002', 'Smartphone Case', 'Protective case for smartphones', 'Accessories', 29.99, 15.00, '1234567890124'),
      ($1, 'PROD-003', 'Bluetooth Speaker', 'Portable bluetooth speaker', 'Electronics', 89.99, 50.00, '1234567890125'),
      ($1, 'PROD-004', 'USB Cable', 'USB-C charging cable', 'Accessories', 19.99, 8.00, '1234567890126'),
      ($1, 'PROD-005', 'Power Bank', '10000mAh portable power bank', 'Electronics', 49.99, 25.00, '1234567890127')
      ON CONFLICT (company_id, sku) DO NOTHING
    `, [companyId]);

    await client.query('COMMIT');
    console.log('Initial data seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding initial data:', error);
    throw error;
  } finally {
    client.release();
  }
}
