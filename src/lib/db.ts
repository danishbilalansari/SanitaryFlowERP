import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isPostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PGHOST);

const db = knex({
  client: isPostgres ? 'pg' : 'better-sqlite3',
  connection: isPostgres 
    ? {
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: Number(process.env.PGPORT) || 5432,
        ssl: { rejectUnauthorized: false },
      }
    : {
        filename: path.join(process.cwd(), 'database.sqlite'),
      },
  useNullAsDefault: !isPostgres,
});

export async function initDb() {
  // Roles Table
  if (!(await db.schema.hasTable('roles'))) {
    await db.schema.createTable('roles', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('desc');
      table.integer('count').defaultTo(0);
      table.boolean('active').defaultTo(false);
      table.text('permissions'); // JSON stringified permissions
      table.timestamps(true, true);
    });

    // Seed initial roles
    await db('roles').insert([
      { id: 'admin', name: 'Admin', desc: 'Full access to all modules and settings', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Production', 'Sales', 'Purchases', 'Reports', 'Customers', 'Settings', 'Dashboard', 'Suppliers']) },
      { id: 'factory_manager', name: 'Factory Manager', desc: 'Production, raw material, factory inventory', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Production', 'Dashboard']) },
      { id: 'shop_manager', name: 'Shop Manager', desc: 'Shop sales, shop inventory, customers', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Sales', 'Customers', 'Dashboard']) },
      { id: 'accountant', name: 'Accountant', desc: 'Customer accounts, payments, reports', count: 1, active: true, permissions: JSON.stringify(['Reports', 'Customers', 'Sales', 'Dashboard']) },
      { id: 'sales_staff', name: 'Sales Staff', desc: 'Sales entry, customer records – limited access', count: 1, active: true, permissions: JSON.stringify(['Sales', 'Customers', 'Dashboard']) },
    ]);
  } else {
    // Migration: Update admin role permissions if needed or ensure all roles have Dashboard
    const roles = await db('roles').select('*');
    for (const role of roles) {
      const perms = JSON.parse(role.permissions || '[]');
      let updated = false;
      if (!perms.includes('Dashboard')) {
        perms.push('Dashboard');
        updated = true;
      }
      if (role.id === 'admin' && !perms.includes('Suppliers')) {
        perms.push('Suppliers');
        updated = true;
      }
      if (updated) {
        await db('roles').where({ id: role.id }).update({ permissions: JSON.stringify(perms) });
      }
    }
  }

  // Users Table
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('username').unique().notNullable();
      table.string('password').notNullable().defaultTo('password123'); // Added password field
      table.string('role_id').references('id').inTable('roles');
      table.string('status').defaultTo('Active');
      table.timestamp('last_login');
      table.string('initials');
      table.string('color');
      table.timestamps(true, true);
    });

    // Seed initial users
    await db('users').insert([
      { name: 'System Admin', email: 'admin@sanitaryflow.com', username: 'admin', password: 'admin', role_id: 'admin', status: 'Active', initials: 'SA', color: 'bg-blue-100' },
      { name: 'Factory Manager', email: 'factory@sanitaryflow.com', username: 'factory', password: 'factory123', role_id: 'factory_manager', status: 'Active', initials: 'FM', color: 'bg-[#b5c8df]' },
      { name: 'Shop Manager', email: 'shop@sanitaryflow.com', username: 'shop', password: 'shop123', role_id: 'shop_manager', status: 'Active', initials: 'SM', color: 'bg-[#92ccff]' },
      { name: 'Senior Accountant', email: 'accountant@sanitaryflow.com', username: 'accountant', password: 'accountant123', role_id: 'accountant', status: 'Active', initials: 'AC', color: 'bg-emerald-100' },
      { name: 'Sales Representative', email: 'sales@sanitaryflow.com', username: 'sales', password: 'sales123', role_id: 'sales_staff', status: 'Active', initials: 'SR', color: 'bg-amber-100' },
    ]);
  } else {
    // Migration: Ensure the 5 requested users exist with correct credentials
    const usersToEnsure = [
      { name: 'System Admin', email: 'admin@sanitaryflow.com', username: 'admin', password: 'admin', role_id: 'admin', status: 'Active', initials: 'SA', color: 'bg-blue-100' },
      { name: 'Factory Manager', email: 'factory@sanitaryflow.com', username: 'factory', password: 'factory123', role_id: 'factory_manager', status: 'Active', initials: 'FM', color: 'bg-[#b5c8df]' },
      { name: 'Shop Manager', email: 'shop@sanitaryflow.com', username: 'shop', password: 'shop123', role_id: 'shop_manager', status: 'Active', initials: 'SM', color: 'bg-[#92ccff]' },
      { name: 'Senior Accountant', email: 'accountant@sanitaryflow.com', username: 'accountant', password: 'accountant123', role_id: 'accountant', status: 'Active', initials: 'AC', color: 'bg-emerald-100' },
      { name: 'Sales Representative', email: 'sales@sanitaryflow.com', username: 'sales', password: 'sales123', role_id: 'sales_staff', status: 'Active', initials: 'SR', color: 'bg-amber-100' },
    ];

    if (!(await db.schema.hasColumn('users', 'password'))) {
      await db.schema.alterTable('users', (table) => {
        table.string('password').notNullable().defaultTo('password123');
      });
    }

    for (const u of usersToEnsure) {
      const exists = await db('users').where({ username: u.username }).first();
      if (!exists) {
        await db('users').insert(u);
      } else {
        // Update password just in case it was changed/incorrect
        await db('users').where({ username: u.username }).update({ password: u.password });
      }
    }
  }

  // Inventory Table
  if (!(await db.schema.hasTable('inventory'))) {
    await db.schema.createTable('inventory', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('sku').unique().notNullable();
      table.string('category');
      table.integer('stock').defaultTo(0);
      table.integer('display_stock').defaultTo(0);
      table.integer('warehouse_stock').defaultTo(0);
      table.integer('minStock').defaultTo(10);
      table.float('price').defaultTo(0);
      table.string('status');
      table.text('description');
      table.timestamps(true, true);
    });

    // Seed initial inventory
    await db('inventory').insert([
      { name: 'Ceramic Pedestal Sink', sku: 'CPS-001', category: 'Shop', stock: 120, display_stock: 20, warehouse_stock: 100, minStock: 25, price: 150.00, status: 'Active', description: 'Premium grade ceramic sink with pedestal base.' },
      { name: 'Chrome Mixer Tap', sku: 'CMT-042', category: 'Shop', stock: 85, display_stock: 15, warehouse_stock: 70, minStock: 20, price: 45.00, status: 'Active', description: 'Single lever chrome mixer tap for bathroom.' },
      { name: 'Dual Flush Toilet', sku: 'DFT-099', category: 'Shop', stock: 45, display_stock: 5, warehouse_stock: 40, minStock: 10, price: 280.00, status: 'Active', description: 'Water-saving dual flush system with soft-close seat.' },
      { name: 'Kaolin Powder (K-4)', sku: 'RAW-K4', category: 'Raw Material', stock: 1250, minStock: 500, status: 'Critical', description: 'Primary raw material for ceramic body.' },
      { name: 'Glaze Compound G-82', sku: 'RAW-G82', category: 'Raw Material', stock: 840, minStock: 300, status: 'Stable', description: 'High-gloss white glaze compound.' },
      { name: 'Brass Fittings 1/2"', sku: 'RAW-BF12', category: 'Raw Material', stock: 4120, minStock: 1000, status: 'Stable', description: 'Internal fittings for taps.' },
      { name: 'Standard Fixing Kit', sku: 'FK-001', category: 'Fixing Kits', stock: 1500, display_stock: 0, warehouse_stock: 1500, minStock: 200, price: 15.00, status: 'Active', description: 'Standard bolt and screw kit for basin installation.' },
      { name: 'Wall Mounted Basin', sku: 'WMB-202', category: 'Shop', stock: 30, display_stock: 5, warehouse_stock: 25, minStock: 10, price: 110.00, status: 'Active', description: 'Space-saving wall mounted ceramic basin.' },
    ]);
  }

  // Migration for inventory table
  if (!(await db.schema.hasColumn('inventory', 'display_stock'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.integer('display_stock').defaultTo(0);
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'warehouse_stock'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.integer('warehouse_stock').defaultTo(0);
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'description'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.text('description');
    });
  }

  // Warehouse Stocks Table
  if (!(await db.schema.hasTable('warehouse_stocks'))) {
    await db.schema.createTable('warehouse_stocks', (table) => {
      table.increments('id').primary();
      table.integer('inventory_id').references('id').inTable('inventory').onDelete('CASCADE');
      table.string('warehouse_name').notNullable();
      table.integer('stock').defaultTo(0);
      table.timestamps(true, true);
    });

    // Seed initial distribution for the first item
    await db('warehouse_stocks').insert([
      { inventory_id: 1, warehouse_name: 'Main Factory (A-1)', stock: 80 },
      { inventory_id: 1, warehouse_name: 'Secondary Storage (B-4)', stock: 15 },
      { inventory_id: 1, warehouse_name: 'Regional Hub (North)', stock: 5 },
      { inventory_id: 1, warehouse_name: 'Shop Display', stock: 20 },
    ]);
  }

  // Security Logs Table
  if (!(await db.schema.hasTable('audit_logs'))) {
    await db.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.string('user').notNullable();
      table.string('action').notNullable();
      table.string('module').notNullable();
      table.string('ip');
      table.text('details'); // JSON metadata for before/after states
      table.timestamp('timestamp').defaultTo(db.fn.now());
    });
  }

  // System Backups Table
  if (!(await db.schema.hasTable('backups'))) {
    await db.schema.createTable('backups', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('size').notNullable();
      table.string('status').notNullable();
      table.timestamp('date').defaultTo(db.fn.now());
    });
    
    // Seed initial backups
    await db('backups').insert([
      { name: 'SF_AUTO_20231024_0400.sql.gz', size: '1.42 GB', status: 'Successful', date: new Date('2023-10-24T04:00:00Z') },
      { name: 'SF_AUTO_20231023_0400.sql.gz', size: '1.39 GB', status: 'Successful', date: new Date('2023-10-23T04:00:00Z') },
      { name: 'SF_AUTO_20231022_0400.sql.gz', size: '--', status: 'Failed', date: new Date('2023-10-22T04:00:00Z') },
      { name: 'SF_MANUAL_DB_UPGRADE_v2.sql.gz', size: '1.38 GB', status: 'Successful', date: new Date('2023-10-21T23:20:00Z') }
    ]);
  }

  // Production Batches
  if (!(await db.schema.hasTable('production_batches'))) {
    await db.schema.createTable('production_batches', (table) => {
      table.increments('id').primary();
      table.string('batch_number').unique().notNullable();
      table.string('product_id').references('id').inTable('inventory');
      table.integer('target_qty').notNullable();
      table.integer('actual_qty').defaultTo(0);
      table.string('line').notNullable();
      table.string('status').defaultTo('Scheduled');
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // Seed production batches
    const now = new Date();
    await db('production_batches').insert([
      { batch_number: 'BTC-2311', product_id: 1, target_qty: 500, actual_qty: 0, line: 'Line A-04', status: 'In Progress', started_at: now.toISOString() },
      { batch_number: 'BTC-2310', product_id: 1, target_qty: 100, actual_qty: 100, line: 'Line A-02', status: 'Completed', completed_at: now.toISOString() },
      { batch_number: 'BTC-2309', product_id: 3, target_qty: 4000, actual_qty: 4012, line: 'Line A-01', status: 'Completed', completed_at: now.toISOString() },
      { batch_number: 'BTC-FK-01', product_id: 7, target_qty: 1205, actual_qty: 1205, line: 'Line B-02', status: 'Completed', completed_at: now.toISOString() },
    ]);
  }

  // Damage Reports Table
  if (!(await db.schema.hasTable('damage_reports'))) {
    await db.schema.createTable('damage_reports', (table) => {
      table.increments('id').primary();
      table.string('type').notNullable();
      table.integer('quantity').notNullable();
      table.text('notes');
      table.timestamp('report_date').defaultTo(db.fn.now());
    });

    await db('damage_reports').insert([
      { type: 'Thermal Cracks', quantity: 142, notes: 'Initial seed' },
      { type: 'Glaze Defects', quantity: 58, notes: 'Initial seed' }
    ]);
  }

  // Machine Maintenance Table
  if (!(await db.schema.hasTable('machine_maintenance'))) {
    await db.schema.createTable('machine_maintenance', (table) => {
      table.increments('id').primary();
      table.string('machine_id').notNullable();
      table.string('machine_name').notNullable();
      table.date('last_service').notNullable();
      table.date('next_service').notNullable();
      table.float('uptime_percentage').defaultTo(100);
      table.string('status').notNullable();
      table.string('operator').notNullable();
      table.string('avatar_url');
    });

    await db('machine_maintenance').insert([
      { machine_id: 'EXT-901-A', machine_name: 'Extruder', last_service: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], uptime_percentage: 99.2, status: 'OPTIMAL', operator: 'K. Robinson', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces' },
      { machine_id: 'GLZ-402-B', machine_name: 'Glazing', last_service: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], uptime_percentage: 94.8, status: 'RUNNING', operator: 'M. Chen', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=32&h=32&fit=crop&crop=faces' },
      { machine_id: 'KLN-104-X', machine_name: 'Kiln', last_service: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], uptime_percentage: 0.0, status: 'CRITICAL', operator: 'Maintenance Team', avatar_url: null },
      { machine_id: 'M-04', machine_name: 'Packing', last_service: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0], uptime_percentage: 88.5, status: 'IDLE', operator: 'S. Miller', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces' },
    ]);
  }

  // Suppliers
  if (!(await db.schema.hasTable('suppliers'))) {
    await db.schema.createTable('suppliers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('company');
      table.string('contact_person');
      table.string('email');
      table.string('phone');
      table.string('category');
      table.text('address');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('suppliers').insert([
      { name: 'Clay Tech', company: 'Clay Tech Ceramics', contact_person: 'Robert Brown', email: 'sales@claytech.com', phone: '+1 555 123 4567', category: 'Raw Material', address: '123 Clay Rd, Stroke-on-Trent' },
      { name: 'Metal Works', company: 'Precision Metals', contact_person: 'Alice Green', email: 'alice@metalworks.biz', phone: '+1 555 987 6543', category: 'Hardware', address: '45 Industrial Pkwy, Manchester' },
    ]);
  }

  // Migration for suppliers table
  const supplierCols = [
    { name: 'company', type: 'string' },
    { name: 'address', type: 'text' }
  ];

  for (const col of supplierCols) {
    if (!(await db.schema.hasColumn('suppliers', col.name))) {
      await db.schema.alterTable('suppliers', (table) => {
        if (col.type === 'string') table.string(col.name);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Customers
  if (!(await db.schema.hasTable('customers'))) {
    await db.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('company');
      table.string('business_type');
      table.string('tax_id');
      table.float('credit_limit').defaultTo(0);
      table.string('payment_terms');
      table.string('contact_person');
      table.string('email');
      table.string('phone');
      table.string('city');
      table.float('opening_balance').defaultTo(0);
      table.text('billing_address');
      table.text('shipping_address');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('customers').insert([
      { name: 'John Doe', company: 'Apex Construction', email: 'john@apex.com', city: 'London', phone: '+44 20 7946 0958' },
      { name: 'Jane Smith', company: 'Global Marine', email: 'jane@global.com', city: 'Birmingham', phone: '+44 12 1496 0345' },
      { name: 'Ahmed Khan', company: 'Modern Build Ltd', email: 'ahmed@modernbuild.co.uk', city: 'Manchester', phone: '+44 16 1496 0123' },
      { name: 'Sarah Wilson', company: 'Interiors UK', email: 'sarah@interiorsuk.com', city: 'Liverpool', phone: '+44 15 1496 0789' },
    ]);
  }

  // Migration for customers table
  const columnsToCheck = [
    { name: 'business_type', type: 'string' },
    { name: 'tax_id', type: 'string' },
    { name: 'credit_limit', type: 'float', default: 0 },
    { name: 'payment_terms', type: 'string' },
    { name: 'contact_person', type: 'string' },
    { name: 'billing_address', type: 'text' },
    { name: 'shipping_address', type: 'text' },
    { name: 'city', type: 'string' },
    { name: 'opening_balance', type: 'float', default: 0 }
  ];

  for (const col of columnsToCheck) {
    if (!(await db.schema.hasColumn('customers', col.name))) {
      await db.schema.alterTable('customers', (table) => {
        if (col.type === 'string') table.string(col.name);
        else if (col.type === 'float') table.float(col.name).defaultTo(col.default ?? 0);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Sales Orders
  if (!(await db.schema.hasTable('sales_orders'))) {
    await db.schema.createTable('sales_orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.integer('customer_id').references('id').inTable('customers');
      table.float('total_amount').defaultTo(0);
      table.string('status').defaultTo('Draft');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Sales Order Items
  if (!(await db.schema.hasTable('sales_order_items'))) {
    await db.schema.createTable('sales_order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').references('id').inTable('sales_orders');
      table.integer('product_id').references('id').inTable('inventory');
      table.integer('qty').notNullable();
      table.float('price').notNullable();
    });
  }

  // Seed initial orders if both tables were just created, or we can just check if orders exist
  const orderCount = await db('sales_orders').count({ count: '*' }).first();
  if (orderCount && Number(orderCount.count) === 0) {
    const initialOrders = [
      { order_number: 'SO-1001', customer_id: 1, total_amount: 1200.00, status: 'Completed' },
      { order_number: 'SO-1002', customer_id: 2, total_amount: 830.00, status: 'Processing' },
    ];
    
    for (const order of initialOrders) {
      const insertedObj = await db('sales_orders').insert(order).returning('id');
      const orderId = typeof insertedObj[0] === 'object' ? insertedObj[0].id : insertedObj[0];
      // Items for SO-1001
      if (order.order_number === 'SO-1001') {
        await db('sales_order_items').insert([
          { order_id: orderId, product_id: 1, qty: 5, price: 150.00 },
          { order_id: orderId, product_id: 2, qty: 10, price: 45.00 }
        ]);
      }
    }
  }

  // Update existing production_batches with new columns
  const productionCols = [
    { name: 'wastage_qty', type: 'integer', default: 0 },
    { name: 'damaged_qty', type: 'integer', default: 0 },
    { name: 'notes', type: 'text' },
    { name: 'category', type: 'string' }
  ];

  for (const col of productionCols) {
    if (!(await db.schema.hasColumn('production_batches', col.name))) {
      await db.schema.alterTable('production_batches', (table) => {
        if (col.type === 'integer') table.integer(col.name).defaultTo(col.default ?? 0);
        else if (col.type === 'string') table.string(col.name);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Production Material Consumption
  if (!(await db.schema.hasTable('production_material_consumption'))) {
    await db.schema.createTable('production_material_consumption', (table) => {
      table.increments('id').primary();
      table.integer('batch_id').references('id').inTable('production_batches').onDelete('CASCADE');
      table.integer('inventory_id').references('id').inTable('inventory'); // raw material
      table.integer('qty_consumed').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Purely financial ledger
  if (!(await db.schema.hasTable('ledger'))) {
    await db.schema.createTable('ledger', (table) => {
      table.increments('id').primary();
      table.string('account_type').notNullable(); 
      table.integer('customer_id').references('id').inTable('customers').nullable();
      table.integer('supplier_id').references('id').inTable('suppliers').nullable();
      table.string('reference_id').notNullable(); 
      table.float('debit').defaultTo(0);
      table.float('credit').defaultTo(0);
      table.string('description');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('ledger').insert([
      { account_type: 'Sales', customer_id: 1, reference_id: 'SO-1001', debit: 0, credit: 12500.00, description: 'Payment for SO-1001' },
      { account_type: 'Operations', reference_id: 'OP-001', debit: 3500.00, credit: 0, description: 'Utilities bill' },
    ]);
  }

  // Migration for ledger table
  if (!(await db.schema.hasColumn('ledger', 'customer_id'))) {
    await db.schema.alterTable('ledger', (table) => {
      table.integer('customer_id').references('id').inTable('customers').nullable();
    });
  }
  if (!(await db.schema.hasColumn('ledger', 'supplier_id'))) {
    await db.schema.alterTable('ledger', (table) => {
      table.integer('supplier_id').references('id').inTable('suppliers').nullable();
    });
  }

  // Purchase Orders
  if (!(await db.schema.hasTable('purchase_orders'))) {
    await db.schema.createTable('purchase_orders', (table) => {
      table.increments('id').primary();
      table.string('po_number').unique().notNullable();
      table.integer('supplier_id').references('id').inTable('suppliers');
      table.float('total_cost').defaultTo(0);
      table.string('status').defaultTo('Pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Purchase Items
  if (!(await db.schema.hasTable('purchase_items'))) {
    await db.schema.createTable('purchase_items', (table) => {
      table.increments('id').primary();
      table.integer('po_id').references('id').inTable('purchase_orders');
      table.integer('product_id').references('id').inTable('inventory');
      table.integer('qty').notNullable();
      table.float('cost').notNullable();
    });
  }
  // Stock Transfers Table
  if (!(await db.schema.hasTable('stock_transfers'))) {
    await db.schema.createTable('stock_transfers', (table) => {
      table.increments('id').primary();
      table.string('transfer_number').unique().notNullable();
      table.string('source').notNullable();
      table.string('destination').notNullable();
      table.string('priority').defaultTo('NORMAL');
      table.string('transport_type').defaultTo('in-house');
      table.string('expected_arrival');
      table.text('notes');
      table.string('status').defaultTo('DRAFT');
      table.text('items_preview'); // JSON string for quick view in list
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Ensure there's a seed record if empty
  const transferCount = await db('stock_transfers').count({ count: '*' }).first();
  if (transferCount && Number(transferCount.count) === 0) {
    await db('stock_transfers').insert({
      transfer_number: 'TRF-INIT-01',
      source: 'Main Factory (A-1)',
      destination: 'Shop Display',
      priority: 'NORMAL',
      status: 'RECEIVED',
      items_preview: JSON.stringify([{id: 1, qty: 10}]),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  }

  // Stock Transfer Items Table
  if (!(await db.schema.hasTable('stock_transfer_items'))) {
    await db.schema.createTable('stock_transfer_items', (table) => {
      table.increments('id').primary();
      table.integer('transfer_id').references('id').inTable('stock_transfers').onDelete('CASCADE');
      table.integer('inventory_id').references('id').inTable('inventory');
      table.integer('qty').notNullable();
      table.timestamps(true, true);
    });
  }
}

export default db;
