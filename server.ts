import 'dotenv/config';
import express from 'express';
console.log('--- Server: Starting entry point ---');
import path from 'path';
import { Parser } from 'json2csv';
import cookieParser from 'cookie-parser';
import db, { initDb, isPostgres } from './src/lib/db.js';

const app = express();

let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (error) {
      console.error('DB init failed', error);
    }
  }
  next();
});

const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1);

app.get('/api/test-direct', (req, res) => res.json({ message: 'Express is handling /api requests successfully' }));

// Debug logging for all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Phase 4: RBAC Enforcement ---
  // Simple middleware to inject user context. In production, this would be from a JWT/session.
  const userContext = async (req: any, res: any, next: any) => {
    try {
      // Use cookie or header
      const userId = req.cookies.userId || req.headers['x-user-id']; 
      
      if (!userId) {
        return next();
      }

      const user = await db('users')
        .join('roles', 'users.role_id', '=', 'roles.id')
        .where('users.id', userId)
        .select(
          'users.id', 
          'users.name', 
          'users.email', 
          'users.username', 
          'users.role_id',
          'users.status',
          'users.initials',
          'users.color',
          'roles.name as role_name',
          'roles.permissions as permissions_json'
        )
        .first();

      if (user) {
        user.permissions = JSON.parse(user.permissions_json || '[]');
        req.user = user;
      } else {
        console.warn(`User context: User ID ${userId} from session/cookie not found in DB`);
      }
      next();
    } catch (error) {
      console.error('User context error:', error);
      next();
    }
  };

  const checkPermission = (permission: string) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      
      // Admin bypass
      if (req.user.role_id === 'admin') return next();

      if (req.user.permissions.includes(permission)) {
        return next();
      }
      res.status(403).json({ error: `Forbidden: Missing permission ${permission}` });
    };
  };

  app.use(userContext);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      // Also allow login via username for convenience based on form
      const user = await db('users')
        .where(function() {
          this.where('email', email).orWhere('username', email);
        })
        .where('password', password)
        .first();

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Set cookie
      res.cookie('userId', String(user.id), { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      });

      // Fetch full user with permissions for response
      const fullUser = await db('users')
        .join('roles', 'users.role_id', '=', 'roles.id')
        .where('users.id', user.id)
        .select(
          'users.id', 
          'users.name', 
          'users.email', 
          'users.username', 
          'users.role_id',
          'users.status',
          'users.initials',
          'users.color',
          'roles.name as role_name',
          'roles.permissions as permissions_json'
        )
        .first();
      
      fullUser.permissions = JSON.parse(fullUser.permissions_json || '[]');

      res.json(fullUser);
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/logout', (req, res) => {
    res.clearCookie('userId', { path: '/', secure: true, sameSite: 'none' });
    res.json({ success: true });
  });

  app.get('/api/me', (req: any, res) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(req.user);
  });

  // --- Phase 5: Action Hooking & Audit Log Helper ---
  const auditLog = async (req: any, action: string, module: string, details: any = null, trx: any = null) => {
    try {
      const dbInstance = trx || db;
      await dbInstance('audit_logs').insert({
        user: req.user?.name || 'System Admin',
        action,
        module,
        ip: req.ip,
        details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Audit Log Error:', error);
    }
  };

  // API Routes
  
  // Users
  app.get('/api/users', checkPermission('Settings'), async (req, res) => {
    try {
      const users = await db('users')
        .join('roles', 'users.role_id', '=', 'roles.id')
        .select('users.*', 'roles.name as role_name');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', checkPermission('Settings'), async (req, res) => {
    try {
      const insertResult = await db('users').insert(req.body).returning('id');
      const idObj = insertResult[0];
      const id = typeof idObj === 'object' ? idObj.id : idObj;
      const user = await db('users').where({ id }).first();
      await auditLog(req, 'CREATE_USER', 'Settings', { user });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Roles
  app.get('/api/roles', async (req, res) => {
    try {
      const roles = await db('roles').select('*');
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', checkPermission('Settings'), async (req, res) => {
    try {
      const dbInstance = db;
      await dbInstance('roles').insert(req.body);
      await auditLog(req, 'CREATE_ROLE', 'Settings', { ...req.body });
      res.status(201).json({ message: 'Role created' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create role' });
    }
  });

  app.put('/api/roles/:id', checkPermission('Settings'), async (req, res) => {
    try {
      const { permissions } = req.body;
      let updateData: any = {};
      
      if (permissions) {
          updateData.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
      }
      
      await db('roles').where({ id: req.params.id }).update(updateData);
      await auditLog(req, 'UPDATE_ROLE', 'Settings', { id: req.params.id, ...updateData });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  // Inventory
  app.get('/api/inventory', async (req, res) => {
    try {
      const { warehouse } = req.query;
      if (warehouse && typeof warehouse === 'string') {
        const items = await db('inventory')
          .leftJoin('warehouse_stocks', function() {
            this.on('inventory.id', '=', 'warehouse_stocks.inventory_id')
                .andOn('warehouse_stocks.warehouse_name', '=', db.raw('?', [warehouse]))
          })
          .select('inventory.*', db.raw('COALESCE(warehouse_stocks.stock, 0) as warehouse_specific_stock'));
        
        const mapped = items.map((item: any) => ({
          ...item,
          total_stock: item.stock,
          stock: parseInt(item.warehouse_specific_stock)
        }));
        return res.json(mapped);
      }

      const items = await db('inventory').select('*');
      res.json(items);
    } catch (error) {
      console.error('Inventory Fetch Error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  app.get('/api/inventory/transfers', async (req, res) => {
    try {
      const transfers = await db('stock_transfers')
        .select('*')
        .orderBy('created_at', 'desc');
      res.json(transfers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch transfers' });
    }
  });

  app.get('/api/inventory/transfers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const transfer = await db('stock_transfers').where({ id }).first();
      if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

      const items = await db('stock_transfer_items')
        .join('inventory', 'stock_transfer_items.inventory_id', 'inventory.id')
        .where('transfer_id', id)
        .select('stock_transfer_items.*', 'inventory.name', 'inventory.sku');

      res.json({ ...transfer, items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch transfer details' });
    }
  });

  app.get('/api/inventory/:id', async (req, res) => {
    try {
      const item = await db('inventory').where({ id: req.params.id }).first();
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  });

  app.post('/api/inventory', checkPermission('Inventory'), async (req: any, res) => {
    try {
      const { name, sku, category, stock, minStock, price, status, description, display_stock, warehouse_stock } = req.body;
      
      if (stock < 0) return res.status(400).json({ error: 'Initial stock cannot be negative' });
      if (parseFloat(price as any) <= 0) return res.status(400).json({ error: 'Price must be greater than zero' });

      const inventoryData = { 
        name, 
        sku, 
        category, 
        stock: parseInt(stock as any) || 0, 
        minStock: parseInt(minStock as any) || 0, 
        price: parseFloat(price as any) || 0, 
        status: status || 'IN STOCK',
        description,
        display_stock: parseInt(display_stock as any) || 0,
        warehouse_stock: parseInt(warehouse_stock as any) || 0
      };

      const insertResult = await db('inventory').insert(inventoryData).returning('id');
      const idObj = insertResult[0];
      const id = typeof idObj === 'object' ? idObj.id : idObj;
      
      if (!id) throw new Error('ID not returned after insertion');

      // Initialize warehouse stocks
      await db('warehouse_stocks').insert([
        { inventory_id: id, warehouse_name: 'Main Factory (A-1)', stock: inventoryData.warehouse_stock || inventoryData.stock || 0 },
        { inventory_id: id, warehouse_name: 'Secondary Storage (B-4)', stock: 0 },
        { inventory_id: id, warehouse_name: 'Regional Hub (North)', stock: 0 },
        { inventory_id: id, warehouse_name: 'Central WH', stock: 0 },
        { inventory_id: id, warehouse_name: 'Shop Display', stock: inventoryData.display_stock || 0 },
      ]);

      const item = await db('inventory').where({ id }).first();
      
      // Log Action
      await auditLog(req, 'CREATE_ITEM', 'Inventory', { newState: item });

      res.status(201).json(item);
    } catch (error: any) {
      console.error('Inventory Create Error:', error);
      res.status(500).json({ error: error.message || 'Failed to create item' });
    }
  });

  app.put('/api/inventory/:id', checkPermission('Inventory'), async (req: any, res) => {
    try {
      const { name, sku, category, stock, minStock, price, status, description, display_stock, warehouse_stock } = req.body;
      const itemId = req.params.id;
      
      const oldState = await db('inventory').where({ id: itemId }).first();
      if (!oldState) return res.status(404).json({ error: 'Item not found' });

      if (stock !== undefined && stock < 0) {
        return res.status(400).json({ error: 'Stock cannot be negative' });
      }
      if (price !== undefined && parseFloat(price as any) <= 0) {
        return res.status(400).json({ error: 'Price must be greater than zero' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (sku !== undefined) updateData.sku = sku;
      if (category !== undefined) updateData.category = category;
      if (stock !== undefined) updateData.stock = parseInt(stock as any);
      if (minStock !== undefined) updateData.minStock = parseInt(minStock as any);
      if (price !== undefined) updateData.price = parseFloat(price as any);
      if (status !== undefined) updateData.status = status;
      if (description !== undefined) updateData.description = description;
      
      // If stock is being updated directly, we need to balance the warehouse_stocks
      await db.transaction(async (trx) => {
        if (stock !== undefined) {
          const currentTotal = oldState.stock;
          const diff = updateData.stock - currentTotal;
          
          if (diff !== 0) {
            // Adjust the Main Factory stock by the difference
            const mainWh = await trx('warehouse_stocks')
              .where({ inventory_id: itemId, warehouse_name: 'Main Factory (A-1)' })
              .first();
            
            if (mainWh) {
              const newWhStock = mainWh.stock + diff;
              if (newWhStock < 0) {
                throw new Error('Insufficient stock in Main Factory to perform this update');
              }
              await trx('warehouse_stocks').where({ id: mainWh.id }).update({ stock: newWhStock });
            } else if (diff > 0) {
              await trx('warehouse_stocks').insert({
                inventory_id: itemId,
                warehouse_name: 'Main Factory (A-1)',
                stock: diff
              });
            } else {
              throw new Error('Cannot reduce stock: Main Factory record not found');
            }
          }
        }

        if (display_stock !== undefined || warehouse_stock !== undefined) {
           // If they are explicitly providing these, they might want to override.
           // However, for simplicity and to match the 'Sync main inventory table' logic elsewhere, 
           // let's just update the main table for now if they are provided, but prefer the warehouse sync.
           if (display_stock !== undefined) updateData.display_stock = parseInt(display_stock as any);
           if (warehouse_stock !== undefined) updateData.warehouse_stock = parseInt(warehouse_stock as any);
        }

        await trx('inventory').where({ id: itemId }).update(updateData);

        // Always re-sync totals from warehouse_stocks to ensure consistency
        const whStocksUpdate = await trx('warehouse_stocks').where({ inventory_id: itemId });
        let wTotalUpdate = 0;
        let dTotalUpdate = 0;
        whStocksUpdate.forEach((s: any) => {
          if (s.warehouse_name === 'Shop Display') dTotalUpdate += s.stock;
          else wTotalUpdate += s.stock;
        });
        
        await trx('inventory').where({ id: itemId }).update({
          warehouse_stock: wTotalUpdate,
          display_stock: dTotalUpdate,
          stock: wTotalUpdate + dTotalUpdate
        });
      });

      const newState = await db('inventory').where({ id: itemId }).first();
      
      await auditLog(req, 'UPDATE_ITEM', 'Inventory', { 
        id: itemId,
        changes: updateData,
        before: oldState,
        after: newState 
      });

      res.json(newState);
    } catch (error: any) {
      console.error('Inventory Update Error:', error);
      res.status(500).json({ error: error.message || 'Failed to update item' });
    }
  });

  app.delete('/api/inventory/:id', checkPermission('Inventory'), async (req: any, res) => {
    try {
      const item = await db('inventory').where({ id: req.params.id }).first();
      await db('inventory').where({ id: req.params.id }).delete();
      await auditLog(req, 'DELETE_ITEM', 'Inventory', { deletedItem: item });
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  app.get('/api/shop/dashboard', checkPermission('Sales'), async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Daily Revenue & Units Sold
      const orders = await db('sales_orders')
        .where('created_at', '>=', today.toISOString())
        .select('*');

      let dailyRevenue = 0;
      let transactionCount = orders.length;
      let orderIds = orders.map(o => o.id);

      for (const order of orders) {
        dailyRevenue += order.total_amount;
      }

      let unitsSold = 0;
      let topProducts: any[] = [];
      let todayTransactions: any[] = [];
      
      if (orderIds.length > 0) {
        const items = await db('sales_order_items')
          .join('inventory', 'sales_order_items.product_id', 'inventory.id')
          .whereIn('order_id', orderIds)
          .select('inventory.name', 'sales_order_items.qty', 'sales_order_items.price');
        
        for (const item of items) {
          unitsSold += item.qty;
        }

        const productSales = await db('sales_order_items')
          .join('inventory', 'sales_order_items.product_id', 'inventory.id')
          .whereIn('order_id', orderIds)
          .select('inventory.name')
          .sum('sales_order_items.qty as total_qty')
          .groupBy('inventory.name')
          .orderBy('total_qty', 'desc')
          .limit(5);
        
        topProducts = productSales;
      }

      const recentTransactions = await db('sales_orders')
        .join('customers', 'sales_orders.customer_id', 'customers.id')
        .select('sales_orders.*', 'customers.name as customer_name')
        .orderBy('created_at', 'desc')
        .limit(4);
      
      todayTransactions = recentTransactions;

      const itemsLow = await db('inventory')
        .whereRaw(isPostgres ? 'stock <= "minStock"' : 'stock <= minStock')
        .select('*');

      res.json({
        dailyRevenue,
        unitsSold,
        avgTransaction: transactionCount > 0 ? dailyRevenue / transactionCount : 0,
        topProducts,
        todayTransactions,
        stockAlerts: itemsLow
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // Sales Orders (Phase 3: ACID Transactions)
  app.get('/api/sales/stats', checkPermission('Sales'), async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mtd = new Date(today.getFullYear(), today.getMonth(), 1);

      // Total Revenue MTD
      // Use strftime for SQLite compatibility if needed, or stick to simple string compare
      const mtdStr = mtd.toISOString().split('T')[0];
      
      const mtdSales = await db('sales_orders')
        .where('created_at', '>=', mtdStr)
        .sum('total_amount as sum');
      const totalRevenue = Number(mtdSales[0]?.sum || 0);

      // Overall Revenue
      const overallSales = await db('sales_orders').sum('total_amount as sum');
      const totalRevenueOverall = Number(overallSales[0]?.sum || 0);

      // Orders Today
      const todayStr = today.toISOString().split('T')[0];
      const todaySales = await db('sales_orders')
        .where('created_at', '>=', todayStr)
        .count('id as count')
        .sum('total_amount as sum');
      
      const ordersToday = Number(todaySales[0]?.count || 0);
      const todayRevenue = Number(todaySales[0]?.sum || 0);

      // Top Product MTD
      const topProductRows = await db('sales_order_items')
        .join('sales_orders', 'sales_order_items.order_id', 'sales_orders.id')
        .join('inventory', 'sales_order_items.product_id', 'inventory.id')
        .where('sales_orders.created_at', '>=', mtdStr)
        .select('inventory.name')
        .sum('sales_order_items.qty as total_qty')
        .groupBy('inventory.id', 'inventory.name')
        .orderBy('total_qty', 'desc')
        .limit(1);

      res.json({
        totalRevenue,
        totalRevenueOverall,
        ordersToday,
        todayRevenue,
        topProduct: topProductRows[0] ? topProductRows[0].name : 'N/A',
        topProductQty: topProductRows[0] ? topProductRows[0].total_qty : 0,
      });
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/sales', checkPermission('Sales'), async (req, res) => {
    try {
      const orders = await db('sales_orders')
        .join('customers', 'sales_orders.customer_id', 'customers.id')
        .select(
          'sales_orders.id',
          'sales_orders.order_number',
          'sales_orders.customer_id',
          'sales_orders.total_amount',
          'sales_orders.paid_amount',
          'sales_orders.discount',
          'sales_orders.status',
          'sales_orders.created_at',
          'customers.name as customer_name'
        )
        .orderBy('sales_orders.created_at', 'desc');
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/sales', checkPermission('Sales'), async (req: any, res) => {
    const { customer_id, items, status, paid_amount, discount = 0 } = req.body; 
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const trx = await db.transaction();

    try {
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.qty * item.price;
        
        // Check stock
        const invItem = await trx('inventory').where({ id: item.product_id }).first();
        if (!invItem || invItem.stock < item.qty) {
          throw new Error(`Insufficient stock for ${invItem?.name || 'product'}`);
        }
      }

      const total = Math.max(0, subtotal - Number(discount));
      const order_number = `SO-${Date.now()}`;
      const finalStatus = status || (paid_amount < total ? 'Processing' : 'Completed');
      const finalPaid = paid_amount === undefined ? total : Number(paid_amount);

      const insertResult = await trx('sales_orders').insert({
        order_number,
        customer_id,
        total_amount: total,
        paid_amount: finalPaid,
        discount: Number(discount),
        status: finalStatus
      }).returning('id');
      
      const idObj = insertResult[0];
      const orderId = typeof idObj === 'object' ? idObj.id : idObj;

      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        product_id: item.product_id,
        qty: item.qty,
        price: item.price
      }));

      await trx('sales_order_items').insert(orderItems);
      
      // Record in ledger
      // 1. Revenue Entry (Company Side)
      await trx('ledger').insert({
        account_type: 'Sales',
        customer_id: null,
        reference_id: order_number,
        debit: 0,
        credit: total,
        description: `Revenue for Sale ${order_number}`
      });

      // 2. Debit Customer (Accounts Receivable)
      await trx('ledger').insert({
        account_type: 'Sales',
        customer_id: customer_id,
        reference_id: order_number,
        debit: total,
        credit: 0,
        description: `Sale ${order_number}`
      });

      // 3. Credit Customer (Payment - if any)
      if (finalPaid > 0) {
        await trx('ledger').insert({
          account_type: 'Payment',
          customer_id: customer_id,
          reference_id: order_number + '_PAY',
          debit: 0,
          credit: finalPaid,
          description: `Initial payment for ${order_number}`
        });
      }

      // Deduct Stock
      for (const item of items) {
        if (item.qty <= 0) throw new Error('Quantity must be greater than zero');

        const invItem = await trx('inventory').where({ id: item.product_id }).first();
        if (!invItem) throw new Error(`Product not found: ${item.product_id}`);

        let remainingToDeduct = item.qty;

        // 1. Try to deduct from 'Shop Display' first (as it's a sale)
        const shopWh = await trx('warehouse_stocks')
          .where({ inventory_id: item.product_id, warehouse_name: 'Shop Display' })
          .first();

        if (shopWh && shopWh.stock > 0) {
          const deductFromShop = Math.min(shopWh.stock, remainingToDeduct);
          await trx('warehouse_stocks')
            .where({ id: shopWh.id })
            .decrement('stock', deductFromShop);
          
          await trx('inventory')
            .where({ id: item.product_id })
            .decrement('display_stock', deductFromShop);
          
          remainingToDeduct -= deductFromShop;
        }

        // 2. If still need to deduct, take from other warehouses that have stock
        if (remainingToDeduct > 0) {
          const otherWhs = await trx('warehouse_stocks')
            .where({ inventory_id: item.product_id })
            .where('stock', '>', 0)
            .whereNot('warehouse_name', 'Shop Display')
            .orderBy('stock', 'desc');

          for (const wh of otherWhs) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(wh.stock, remainingToDeduct);
            
            await trx('warehouse_stocks')
              .where({ id: wh.id })
              .decrement('stock', deduct);
            
            await trx('inventory')
              .where({ id: item.product_id })
              .decrement('warehouse_stock', deduct);
            
            remainingToDeduct -= deduct;
          }
        }

        // 3. Fallback: If we still have remaining (shouldn't happen due to invItem.stock check), 
        // deduct from Shop Display (it will go negative, but keeps logic total correct)
        if (remainingToDeduct > 0) {
           await trx('warehouse_stocks')
            .where({ inventory_id: item.product_id, warehouse_name: 'Shop Display' })
            .decrement('stock', remainingToDeduct);
          
          await trx('inventory')
            .where({ id: item.product_id })
            .decrement('display_stock', remainingToDeduct);
        }

        // Always decrement total stock
        await trx('inventory')
          .where({ id: item.product_id })
          .decrement('stock', item.qty);
      }

      // Log Audit
      await auditLog(req, 'CREATE_SALE', 'Sales', { 
        order_number, 
        total,
        items_count: items.length 
      }, trx);

      await trx.commit();
      res.status(201).json({ id: orderId, order_number });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: (error as Error).message || 'Failed to create sale' });
    }
  });

  app.get('/api/sales/:id', checkPermission('Sales'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const sale = await db('sales_orders')
        .leftJoin('customers', 'sales_orders.customer_id', 'customers.id')
        .select(
          'sales_orders.*',
          'customers.name as customer_name',
          'customers.company as customer_company',
          'customers.city as customer_city',
          'customers.billing_address as customer_address',
          'customers.phone as customer_phone'
        )
        .where('sales_orders.id', id)
        .first();

      if (!sale) return res.status(404).json({ error: 'Sale not found' });

      const items = await db('sales_order_items')
        .join('inventory', 'sales_order_items.product_id', 'inventory.id')
        .select(
          'sales_order_items.*',
          'inventory.name as product_name',
          'inventory.sku as product_sku'
        )
        .where('order_id', id);

      res.json({ ...sale, items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch sale' });
    }
  });

  app.patch('/api/sales/:id', checkPermission('Sales'), async (req: any, res) => {
    const { id } = req.params;
    const { status, additional_payment } = req.body;
    
    console.log(`PATCH /api/sales/${id} - Body:`, req.body);
    
    const trx = await db.transaction();
    try {
      const order = await trx('sales_orders').where({ id: Number(id) }).first();
      if (!order) {
        await trx.rollback();
        console.error(`Order ${id} not found`);
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const updateData: any = {};
      if (status) updateData.status = status;
      
      const paymentAmount = Number(additional_payment || 0);
      if (paymentAmount !== 0) {
        updateData.paid_amount = Number(order.paid_amount || 0) + paymentAmount;
      }

      if (Object.keys(updateData).length > 0) {
        await trx('sales_orders').where({ id: Number(id) }).update(updateData);
      }

      if (paymentAmount > 0) {
        await trx('ledger').insert({
          account_type: 'Payment',
          customer_id: order.customer_id,
          reference_id: `${order.order_number}_PAY_${Date.now()}`,
          debit: 0,
          credit: paymentAmount,
          description: `Additional payment for ${order.order_number}`
        });
      }

      await trx.commit();
      await auditLog(req, 'UPDATE_SALE', 'Sales', { id, updateData });
      res.json({ success: true });
    } catch (error) {
      if (trx) await trx.rollback();
      console.error('Error updating sale:', error);
      res.status(500).json({ error: 'Failed to update sale' });
    }
  });

  // Purchases API
  app.get('/api/purchases', checkPermission('Purchases'), async (req, res) => {
    try {
      const orders = await db('purchase_orders')
        .join('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
        .select('purchase_orders.*', 'suppliers.name as supplier_name')
        .orderBy('created_at', 'desc');
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchases' });
    }
  });

  app.get('/api/purchases/:id', checkPermission('Purchases'), async (req, res) => {
    try {
      const { id } = req.params;
      const order = await db('purchase_orders')
        .join('suppliers', 'purchase_orders.supplier_id', 'suppliers.id')
        .select('purchase_orders.*', 'suppliers.name as supplier_name')
        .where('purchase_orders.id', Number(id))
        .first();

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const items = await db('purchase_items')
        .join('inventory', 'purchase_items.product_id', 'inventory.id')
        .select('purchase_items.*', 'inventory.name', 'inventory.sku')
        .where('purchase_items.po_id', Number(id));

      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchase order details' });
    }
  });

  app.post('/api/purchases', checkPermission('Purchases'), async (req: any, res) => {
    const { supplier_id, items, status, paid_amount } = req.body; 
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in purchase order' });
    }

    const trx = await db.transaction();

    try {
      let total = 0;
      for (const item of items) {
        total += item.qty * item.cost;
      }

      const po_number = `PO-${Date.now()}`;
      const finalStatus = status || (paid_amount < total ? 'Pending' : 'Received');
      const finalPaid = paid_amount === undefined ? total : paid_amount;

      const insertResult = await trx('purchase_orders').insert({
        po_number,
        supplier_id,
        total_cost: total,
        paid_amount: finalPaid,
        status: finalStatus 
      }).returning('id');

      const idObj = insertResult[0];
      const poId = typeof idObj === 'object' ? idObj.id : idObj;

      const purchaseItems = items.map((item: any) => ({
        po_id: poId,
        product_id: item.product_id,
        qty: item.qty,
        cost: item.cost
      }));

      await trx('purchase_items').insert(purchaseItems);

      // Inventory Increment
      for (const item of items) {
        await trx('inventory')
          .where({ id: item.product_id })
          .increment('stock', item.qty);
      }

      // Ledger Entries
      // 1. Expense Entry (Company Side)
      await trx('ledger').insert({
        account_type: 'Purchases',
        supplier_id: null,
        reference_id: po_number,
        debit: total,
        credit: 0,
        description: `Expense for Purchase ${po_number}`
      });

      // 2. Credit Supplier (Accounts Payable)
      await trx('ledger').insert({
        account_type: 'Purchases',
        supplier_id: supplier_id, 
        reference_id: po_number,
        debit: 0,
        credit: total,
        description: `Purchase from Supplier #${supplier_id}`
      });

      // 3. Debit Supplier (Payment to them)
      if (finalPaid > 0) {
        await trx('ledger').insert({
          account_type: 'Payment',
          supplier_id: supplier_id,
          reference_id: po_number + '_PAY',
          debit: finalPaid,
          credit: 0,
          description: `Initial payment for ${po_number}`
        });
      }

      // Log Audit
      await auditLog(req, 'CREATE_PURCHASE', 'Purchases', { po_number, total }, trx);

      await trx.commit();
      res.status(201).json({ id: poId, po_number });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: (error as Error).message || 'Failed to create purchase' });
    }
  });

  app.patch('/api/purchases/:id', checkPermission('Purchases'), async (req: any, res) => {
    const { id } = req.params;
    const { status, additional_payment, items, supplier_id } = req.body;
    
    console.log(`PATCH /api/purchases/${id} - Body:`, req.body);
    
    const trx = await db.transaction();
    try {
      const order = await trx('purchase_orders').where({ id: Number(id) }).first();
      if (!order) {
        await trx.rollback();
        console.error(`Purchase Order ${id} not found`);
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const updateData: any = {};
      if (status) updateData.status = status;
      if (supplier_id) updateData.supplier_id = supplier_id;
      
      const paymentAmount = Number(additional_payment || 0);
      if (paymentAmount !== 0) {
        updateData.paid_amount = Number(order.paid_amount || 0) + paymentAmount;
      }

      if (items && Array.isArray(items)) {
         let newTotalCost = 0;
         for (const item of items) {
           newTotalCost += (item.qty || 1) * (item.cost || item.price || 0);
         }
         updateData.total_cost = newTotalCost;
         
         const oldItems = await trx('purchase_items').where({ po_id: Number(id) });
         for (const oldItem of oldItems) {
           await trx('inventory').where({ id: oldItem.product_id }).decrement('stock', oldItem.qty);
         }

         await trx('purchase_items').where({ po_id: Number(id) }).delete();
         
         const newItems = items.map((item: any) => ({
           po_id: Number(id),
           product_id: item.product_id,
           qty: item.qty || 1,
           cost: item.cost || item.price || 0
         }));
         
         if (newItems.length > 0) {
           await trx('purchase_items').insert(newItems);
           const finalStatus = status || order.status;
           if (finalStatus !== 'Cancelled') {
             for (const newItem of newItems) {
               await trx('inventory').where({ id: newItem.product_id }).increment('stock', newItem.qty);
             }
           }
         }
      } else if (status === 'Cancelled' && order.status !== 'Cancelled') {
         // Cancelled without items provided, must deduct stock of old items
         const oldItems = await trx('purchase_items').where({ po_id: Number(id) });
         for (const oldItem of oldItems) {
           await trx('inventory').where({ id: oldItem.product_id }).decrement('stock', oldItem.qty);
         }
      } else if (status === 'Received' && order.status === 'Cancelled') {
         // Un-cancelling, must add back stock of old items
         const oldItems = await trx('purchase_items').where({ po_id: Number(id) });
         for (const oldItem of oldItems) {
           await trx('inventory').where({ id: oldItem.product_id }).increment('stock', oldItem.qty);
         }
      }

      if (Object.keys(updateData).length > 0) {
        await trx('purchase_orders').where({ id: Number(id) }).update(updateData);
      }

      if (paymentAmount > 0) {
        await trx('ledger').insert({
          account_type: 'Payment',
          supplier_id: order.supplier_id,
          reference_id: `${order.po_number}_PAY_${Date.now()}`,
          debit: paymentAmount,
          credit: 0,
          description: `Additional payment for ${order.po_number}`
        });
      }

      await trx.commit();
      await auditLog(req, 'UPDATE_PURCHASE', 'Purchases', { id, updateData });
      res.json({ success: true });
    } catch (error) {
      if (trx) await trx.rollback();
      console.error('Error updating purchase:', error);
      res.status(500).json({ error: 'Failed to update purchase' });
    }
  });

  // Ledger API for Accounts
  app.get('/api/ledger', checkPermission('Reports'), async (req, res) => {
    try {
      const { customer_id, supplier_id } = req.query;
      let query = db('ledger').orderBy('created_at', 'desc');
      if (customer_id) query = query.where({ customer_id });
      if (supplier_id) query = query.where({ supplier_id });
      const records = await query;
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ledger' });
    }
  });

  // Customers (Expansion)
  app.get('/api/customers', checkPermission('Customers'), async (req, res) => {
    try {
      const customers = await db('customers').select('*');
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', checkPermission('Customers'), async (req: any, res) => {
    try {
      const { sameAsBilling, ...customerData } = req.body;
      const insertResult = await db('customers').insert(customerData).returning('id');
      const idObj = insertResult[0];
      const id = typeof idObj === 'object' ? idObj.id : idObj;
      const customer = await db('customers').where({ id }).first();
      
      // Handle opening balance in ledger
      if (customer.opening_balance && customer.opening_balance !== 0) {
        await db('ledger').insert({
          account_type: 'Opening Balance',
          customer_id: id,
          reference_id: `OB-${id}`,
          debit: customer.opening_balance > 0 ? customer.opening_balance : 0,
          credit: customer.opening_balance < 0 ? Math.abs(customer.opening_balance) : 0,
          description: 'Opening Balance from profile creation',
          created_at: db.fn.now()
        });
      }

      await auditLog(req, 'CREATE_CUSTOMER', 'Customers', { customer });
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.post('/api/payments', checkPermission('Customers'), async (req: any, res) => {
    const { customer_id, supplier_id, type, amount, description, reference_id, date } = req.body;
    try {
      const ledgerEntry = {
        account_type: type === 'received' ? 'Customer Payment' : 'Supplier Payment',
        customer_id: customer_id || null,
        supplier_id: supplier_id || null,
        reference_id: reference_id || `PAY-${Date.now()}`,
        debit: type === 'given' ? amount : 0,
        credit: type === 'received' ? amount : 0,
        description: description || `Payment ${type}`,
        created_at: date ? new Date(date) : db.fn.now()
      };
      await db('ledger').insert(ledgerEntry);
      
      await auditLog(req, 'RECORD_PAYMENT', 'Customers', ledgerEntry);
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Payment Error:', error);
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  app.get('/api/customers/:id', checkPermission('Customers'), async (req, res) => {
    try {
      const customer = await db('customers').where({ id: req.params.id }).first();
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch customer' });
    }
  });

  app.put('/api/customers/:id', checkPermission('Customers'), async (req: any, res) => {
    try {
      const { id, created_at, sameAsBilling, ...customerData } = req.body;
      await db('customers').where({ id: req.params.id }).update(customerData);
      const customer = await db('customers').where({ id: req.params.id }).first();
      await auditLog(req, 'UPDATE_CUSTOMER', 'Customers', { customer });
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  // Suppliers API
  app.get('/api/suppliers', checkPermission('Inventory'), async (req, res) => {
    try {
      const suppliers = await db('suppliers').select('*');
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  });

  app.post('/api/suppliers', checkPermission('Inventory'), async (req: any, res) => {
    try {
      const { opening_balance, ...supplierData } = req.body;
      const insertResult = await db('suppliers').insert(supplierData).returning('id');
      const idObj = insertResult[0];
      const id = typeof idObj === 'object' ? idObj.id : idObj;
      const supplier = await db('suppliers').where({ id }).first();

      if (opening_balance && opening_balance !== 0) {
        await db('ledger').insert({
          account_type: 'Supplier Opening Balance',
          supplier_id: id,
          reference_id: `SOB-${id}`,
          debit: opening_balance < 0 ? Math.abs(opening_balance) : 0,
          credit: opening_balance > 0 ? opening_balance : 0,
          description: 'Opening Balance for supplier',
          created_at: db.fn.now()
        });
      }

      await auditLog(req, 'CREATE_SUPPLIER', 'Inventory', { supplier });
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create supplier' });
    }
  });

  app.get('/api/suppliers/balances', checkPermission('Inventory'), async (req, res) => {
    try {
      const results = await db('ledger')
        .join('suppliers', 'ledger.supplier_id', 'suppliers.id')
        .select('suppliers.id', 'suppliers.name', 'suppliers.phone', 'suppliers.category')
        .sum('ledger.debit as total_debit')
        .sum('ledger.credit as total_credit')
        .groupBy('suppliers.id', 'suppliers.name', 'suppliers.phone', 'suppliers.category');

      const formatted = results.map((r: any) => ({
        ...r,
        balance: (r.total_credit || 0) - (r.total_debit || 0) // What we owe them
      }));

      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch supplier balances' });
    }
  });

  // Production Batches
  app.get('/api/factory/dashboard', checkPermission('Production'), async (req, res) => {
    try {
      const rawMaterialStats = await db('inventory')
        .where('category', 'Raw Material')
        .sum('stock as totalStock');
      
      const machineMaintenance = await db('machine_maintenance').select('*');
      
      const damageReports = await db('damage_reports').select('*');

      // Aggregate actual output velocity based on production_batches completed today
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentBatches = await db('production_batches')
        .leftJoin('inventory', function() {
          this.on('production_batches.product_id', '=', 'inventory.id');
        })
        .where('production_batches.status', 'Completed')
        .andWhere('production_batches.completed_at', '>', twentyFourHoursAgo)
        .select('production_batches.actual_qty', 'production_batches.completed_at', 'inventory.category as product_category', 'inventory.name as product_name');
      
      // Calculate real categories and targets
      const categoryAggregates: Record<string, { actual: number, target: number }> = {};
      
      // Initialize with common categories or based on what's active
      recentBatches.forEach(b => {
        const cat = b.product_category || 'Uncategorized';
        if (!categoryAggregates[cat]) {
          categoryAggregates[cat] = { actual: 0, target: 0 };
        }
        categoryAggregates[cat].actual += (b.actual_qty || 0);
      });

      // Get all active batches for today to set targets
      const todayBatches = await db('production_batches')
        .leftJoin('inventory', function() {
           this.on('production_batches.product_id', '=', 'inventory.id');
        })
        .where('production_batches.created_at', '>', twentyFourHoursAgo)
        .select('production_batches.target_qty', 'inventory.category as product_category');

      todayBatches.forEach(b => {
        const cat = b.product_category || 'Uncategorized';
        if (!categoryAggregates[cat]) {
          categoryAggregates[cat] = { actual: 0, target: 0 };
        }
        categoryAggregates[cat].target += (b.target_qty || 0);
      });

      // Format output targets for the gauges
      // If we have categories, use them. Otherwise use empty.
      const outputTargets = Object.entries(categoryAggregates).map(([cat, data]) => ({
        category: cat,
        label: cat,
        target: data.target || 1000, // Default target if none set
        actual: data.actual
      })).slice(0, 3); // Limit to top 3 for UI space

      // If no data, provide a clean "0" state instead of hardcoded dummies
      if (outputTargets.length === 0) {
        outputTargets.push({ category: 'Production', label: 'Daily Output', target: 5000, actual: 0 });
      }

      const slots = [
        { time: '06:00', value: 0 },
        { time: '10:00', value: 0 },
        { time: '14:00', value: 0 },
        { time: '18:00', value: 0 },
        { time: '22:00', value: 0 },
        { time: '02:00', value: 0 }
      ];

      for (const batch of recentBatches) {
        if (!batch.completed_at) continue;
        const d = new Date(batch.completed_at);
        const h = d.getHours();
        if (h >= 6 && h < 10) slots[0].value += batch.actual_qty;
        else if (h >= 10 && h < 14) slots[1].value += batch.actual_qty;
        else if (h >= 14 && h < 18) slots[2].value += batch.actual_qty;
        else if (h >= 18 && h < 22) slots[3].value += batch.actual_qty;
        else if (h >= 22 || h < 2) slots[4].value += batch.actual_qty;
        else if (h >= 2 && h < 6) slots[5].value += batch.actual_qty;
      }
      
      let maxVal = 0;
      slots.forEach(s => {
        if (s.value > maxVal) maxVal = s.value;
      });
      if (maxVal > 0) {
        const peakSlot = slots.find(s => s.value === maxVal);
        if (peakSlot) (peakSlot as any).peak = true;
      }

      res.json({
        rawMaterialStock: rawMaterialStats[0]?.totalStock || 0,
        machineMaintenance,
        damageReports,
        velocityData: slots,
        outputTargets
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/factory/damage-reports', checkPermission('Production'), async (req: any, res) => {
    try {
      const { type, quantity, notes } = req.body;
      await db('damage_reports').insert({ type, quantity, notes });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/production', checkPermission('Production'), async (req, res) => {
    try {
      const batches = await db('production_batches')
        .leftJoin('inventory', function() {
          this.on('production_batches.product_id', '=', 'inventory.id');
        })
        .select('production_batches.*', 'inventory.name as product_name');
      
      const sanitizedBatches = batches.map(b => ({
        ...b,
        product_name: b.product_name || `Unknown Product (ID: ${b.product_id})`
      }));
      
      res.json(sanitizedBatches);
    } catch (error) {
      console.error('Error fetching production batches:', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/production', checkPermission('Production'), async (req: any, res) => {
    try {
      const { materials, ...batchData } = req.body;

      if (batchData.target_qty <= 0) {
        return res.status(400).json({ error: 'Target quantity must be greater than zero' });
      }
      
      const result = await db.transaction(async (trx) => {
        const product_id = parseInt(batchData.product_id as any);
        const insertData = { ...batchData, product_id };
        const insertResult = await trx('production_batches').insert(insertData).returning('id');
        const idObj = insertResult[0];
        const id = typeof idObj === 'object' ? idObj.id : idObj;
        
        if (materials && Array.isArray(materials)) {
          for (const m of materials) {
            await trx('production_material_consumption').insert({
              batch_id: id,
              inventory_id: m.inventory_id,
              qty_consumed: m.qty_consumed
            });

            // Reduce raw material stock from Main Factory
            const matWh = await trx('warehouse_stocks')
                .where({ inventory_id: m.inventory_id, warehouse_name: 'Main Factory (A-1)' })
                .first();
            
            if (!matWh || matWh.stock < m.qty_consumed) {
                const inv = await trx('inventory').where({ id: m.inventory_id }).first();
                throw new Error(`Insufficient material: ${inv?.name || m.inventory_id} in Main Factory`);
            }

            await trx('warehouse_stocks').where({ id: matWh.id }).decrement('stock', m.qty_consumed);
            
            // Sync main inventory table for this material
            const allStocksM = await trx('warehouse_stocks').where({ inventory_id: m.inventory_id });
            let warehouseTotalM = 0;
            let displayTotalM = 0;
            allStocksM.forEach((s: any) => {
              if (s.warehouse_name === 'Shop Display') displayTotalM += s.stock;
              else warehouseTotalM += s.stock;
            });
            await trx('inventory').where({ id: m.inventory_id }).update({
              stock: warehouseTotalM + displayTotalM,
              warehouse_stock: warehouseTotalM,
              display_stock: displayTotalM
            });
          }
        }
        
        return await trx('production_batches').where({ id }).first();
      });

      await auditLog(req, 'CREATE_PRODUCTION', 'Production', { batch: result });

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating production batch:', error);
      res.status(500).json({ error: 'Failed to create production batch' });
    }
  });

  app.put('/api/production/:id', checkPermission('Production'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, actual_qty, wastage_qty, damaged_qty, materials, ...batchData } = req.body;

      if (actual_qty !== undefined && actual_qty < 0) return res.status(400).json({ error: 'Actual quantity cannot be negative' });
      if (wastage_qty !== undefined && wastage_qty < 0) return res.status(400).json({ error: 'Wastage quantity cannot be negative' });
      if (damaged_qty !== undefined && damaged_qty < 0) return res.status(400).json({ error: 'Damaged quantity cannot be negative' });

      const oldBatch = await db('production_batches').where({ id }).first();
      
      if (!oldBatch) return res.status(404).json({ error: 'Batch not found' });

      await db.transaction(async (trx) => {
        const updateObj: any = { ...batchData };
        if (status !== undefined) updateObj.status = status;
        if (actual_qty !== undefined) updateObj.actual_qty = Number(actual_qty);
        if (wastage_qty !== undefined) updateObj.wastage_qty = Number(wastage_qty);
        if (damaged_qty !== undefined) updateObj.damaged_qty = Number(damaged_qty);
        
        if (status === 'Completed' && oldBatch.status !== 'Completed') {
          updateObj.completed_at = db.fn.now();
        }

        await trx('production_batches').where({ id }).update(updateObj);

        // If newly moving to 'Completed', update stock
        if (status === 'Completed' && oldBatch.status !== 'Completed') {
          const qtyToIncrease = Number(actual_qty || oldBatch.target_qty || 0);
          
          if (qtyToIncrease > 0) {
            // 1. Update primary inventory stock
            await trx('inventory')
              .where({ id: oldBatch.product_id })
              .increment('stock', qtyToIncrease);

            // 2. Update warehouse stock
            const factoryWh = await trx('warehouse_stocks')
              .where({ inventory_id: oldBatch.product_id, warehouse_name: 'Main Factory (A-1)' })
              .first();

            if (factoryWh) {
              await trx('warehouse_stocks').where({ id: factoryWh.id }).increment('stock', qtyToIncrease);
            } else {
              await trx('warehouse_stocks').insert({
                inventory_id: oldBatch.product_id,
                warehouse_name: 'Main Factory (A-1)',
                stock: qtyToIncrease
              });
            }

            // Sync summary
            const whStocksProd = await trx('warehouse_stocks').where({ inventory_id: oldBatch.product_id });
            let wTotalProd = 0;
            let dTotalProd = 0;
            whStocksProd.forEach((s: any) => {
              if (s.warehouse_name === 'Shop Display') dTotalProd += s.stock;
              else wTotalProd += s.stock;
            });
            
            await trx('inventory').where({ id: oldBatch.product_id }).update({
              warehouse_stock: wTotalProd,
              display_stock: dTotalProd,
              stock: wTotalProd + dTotalProd
            });

            await auditLog(req, 'PRODUCTION_COMPLETE', 'Production', { batch_id: id, qty: qtyToIncrease }, trx);
          }
        }

        // Update materials if provided
        if (materials && Array.isArray(materials) && materials.length > 0) {
          await trx('production_material_consumption').where({ batch_id: id }).delete();
          for (const m of materials) {
            await trx('production_material_consumption').insert({
              batch_id: id,
              inventory_id: m.inventory_id,
              qty_consumed: m.qty_consumed
            });
          }
        }
      });

      const updatedBatch = await db('production_batches').where({ id }).first();
      res.json(updatedBatch);
    } catch (error) {
      console.error('Error updating production batch:', error);
      res.status(500).json({ error: 'Failed to update production batch' });
    }
  });

  // Inventory Adjustments & Transfers
  app.post('/api/inventory/adjust', checkPermission('Inventory'), async (req, res) => {
    const { id, type, quantity, reason } = req.body;
    try {
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be positive' });
      }

      const oldItem = await db('inventory').where({ id }).first();
      if (!oldItem) return res.status(404).json({ error: 'Item not found' });

      const adjustment = type === 'add' ? quantity : -quantity;
      let newStock = oldItem.stock;

      await db.transaction(async (trx) => {
        // 1. Update warehouse (Default to Main Factory)
        const factoryWh = await trx('warehouse_stocks')
          .where({ inventory_id: id, warehouse_name: 'Main Factory (A-1)' })
          .first();

        if (factoryWh) {
          const resStock = factoryWh.stock + adjustment;
          if (resStock < 0) {
            throw new Error(`Insufficient stock in Main Factory. Current: ${factoryWh.stock}`);
          }
          await trx('warehouse_stocks').where({ id: factoryWh.id }).update({ stock: resStock });
        } else if (adjustment > 0) {
          await trx('warehouse_stocks').insert({
            inventory_id: id, warehouse_name: 'Main Factory (A-1)', stock: adjustment
          });
        } else {
          throw new Error('Cannot reduce stock: Main Factory record not found');
        }

        // 2. Sync main table totals
        const whStocksAdj = await trx('warehouse_stocks').where({ inventory_id: id });
        let wTotalAdj = 0;
        let dTotalAdj = 0;
        whStocksAdj.forEach((s: any) => {
          if (s.warehouse_name === 'Shop Display') dTotalAdj += s.stock;
          else wTotalAdj += s.stock;
        });

        newStock = wTotalAdj + dTotalAdj;
        await trx('inventory').where({ id }).update({ 
          stock: newStock, 
          warehouse_stock: wTotalAdj,
          display_stock: dTotalAdj,
          updated_at: db.fn.now() 
        });

        await auditLog(req, 'ADJUST', 'Inventory', { 
          item_id: id,
          before: oldItem.stock, 
          after: newStock,
          type,
          reason 
        }, trx);
      });

      res.json({ success: true, newStock });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Adjustment failed' });
    }
  });

  app.post('/api/inventory/transfer', checkPermission('Inventory'), async (req: any, res) => {
    const { id, toWarehouse, quantity } = req.body;
    try {
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be positive' });
      }

      const item = await db('inventory').where({ id }).first();
      if (!item) return res.status(404).json({ error: 'Item not found' });
      
      await db.transaction(async (trx) => {
        const sourceWh = await trx('warehouse_stocks')
          .where({ inventory_id: id, warehouse_name: 'Main Factory (A-1)' })
          .first();

        const destWh = await trx('warehouse_stocks')
          .where({ inventory_id: id, warehouse_name: toWarehouse })
          .first();

        if (!sourceWh) throw new Error('Source warehouse (Main Factory) not found');
        if (sourceWh.stock < quantity) throw new Error(`Insufficient stock in Main Factory. Current: ${sourceWh.stock}`);

        await trx('warehouse_stocks')
          .where({ id: sourceWh.id })
          .decrement('stock', quantity);

        if (destWh) {
          await trx('warehouse_stocks')
            .where({ id: destWh.id })
            .increment('stock', quantity);
        } else {
          await trx('warehouse_stocks').insert({
            inventory_id: id,
            warehouse_name: toWarehouse,
            stock: quantity
          });
        }

        // Sync main inventory table
        const syncStocks = await trx('warehouse_stocks').where({ inventory_id: id });
        let wTotal = 0;
        let dTotal = 0;
        syncStocks.forEach((s: any) => {
          if (s.warehouse_name === 'Shop Display') dTotal += s.stock;
          else wTotal += s.stock;
        });

        await trx('inventory').where({ id }).update({
          stock: wTotal + dTotal,
          warehouse_stock: wTotal,
          display_stock: dTotal
        });

        // Create Tracking Record
        const insertResult = await trx('stock_transfers').insert({
          transfer_number: `TRF-${Date.now().toString().slice(-6)}`,
          source: 'Main Factory (A-1)',
          destination: toWarehouse,
          priority: 'NORMAL',
          transport_type: 'in-house',
          status: 'RECEIVED',
          items_preview: JSON.stringify([{ id, qty: quantity }]),
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        }).returning('id');

        const idObj = insertResult[0];
        const transferId = typeof idObj === 'object' ? idObj.id : idObj;

        await trx('stock_transfer_items').insert({
          transfer_id: transferId,
          inventory_id: id,
          qty: quantity
        });

        // Recalculate and Sync main inventory table
        const allStocks = await trx('warehouse_stocks').where({ inventory_id: id });
        let warehouseTotal = 0;
        let displayTotal = 0;
        
        allStocks.forEach((s: any) => {
          if (s.warehouse_name === 'Shop Display') displayTotal += s.stock;
          else warehouseTotal += s.stock;
        });
        
        await trx('inventory').where({ id }).update({
          warehouse_stock: warehouseTotal,
          display_stock: displayTotal,
          stock: warehouseTotal + displayTotal,
          updated_at: db.fn.now()
        });

        await auditLog(req, 'STOCK_TRANSFER', 'Inventory', { 
          item_id: id,
          to: toWarehouse,
          quantity 
        }, trx);
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message || 'Transfer failed' });
    }
  });

  app.get('/api/inventory/:id/distribution', async (req, res) => {
    try {
      const dist = await db('warehouse_stocks')
        .where({ inventory_id: req.params.id })
        .select('warehouse_name as name', 'stock as qty');
      
      // Calculate percentages based on total item stock
      const item = await db('inventory').where({ id: req.params.id }).first();
      const total = item.stock || 1;

      const formatted = dist
        .map((d, index) => ({
          ...d,
          total,
          color: d.name === 'Main Factory (A-1)' ? 'bg-[#162839]' : 
                 d.name === 'Secondary Storage (B-4)' ? 'bg-[#006397]' : 
                 d.name === 'Shop Display' ? 'bg-[#5cb8fd]' : 'bg-neutral-500'
        }));

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Backups
  app.get('/api/backups', checkPermission('Dashboard'), async (req, res) => {
    try {
      const backups = await db('backups').orderBy('date', 'desc');
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch backups' });
    }
  });

  app.get('/api/backups/:id/download', checkPermission('Dashboard'), async (req, res) => {
    try {
      const { id } = req.params;
      const backup = await db('backups').where({ id }).first();
      if (!backup) return res.status(404).json({ error: 'Not found' });
      
      const dbPath = path.join(process.cwd(), 'database.sqlite');
      res.download(dbPath, backup.name);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.post('/api/backups/upload', checkPermission('Dashboard'), async (req, res) => {
    try {
      const name = `SF_UPLOADED_${Date.now()}.sql.gz`;
      const size = '1.45 GB';
      const insertResult = await db('backups').insert({
        name,
        size,
        status: 'Successful',
        date: new Date()
      }).returning('id');
      const idObj = insertResult[0];
      const id = typeof idObj === 'object' ? idObj.id : idObj;
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  app.post('/api/backups', checkPermission('Dashboard'), async (req, res) => {
    try {
      const d = new Date();
      const dateString = d.toISOString().replace(/[:\-T]/g, '').slice(0, 14); // 20231024040000
      const name = `SF_MANUAL_${dateString}.sql.gz`;
      const size = (Math.random() * 0.5 + 1).toFixed(2) + ' GB';
      const insertResult = await db('backups').insert({
        name,
        size,
        status: 'Successful',
        date: new Date()
      }).returning('*');
      const newBackup = insertResult[0];
      res.json(newBackup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  app.post('/api/backups/:id/action', checkPermission('Dashboard'), async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      if (action === 'retry') {
        const d = new Date();
        const dateString = d.toISOString().replace(/[:\-T]/g, '').slice(0, 14); // 20231024040000
        const name = `SF_RETRY_${dateString}.sql.gz`;
        const size = (Math.random() * 0.5 + 1).toFixed(2) + ' GB';
        await db('backups').where({ id }).update({
          name,
          size,
          status: 'Successful',
          date: new Date()
        });
      } else if (action === 'restore') {
        // Just simulate a successful restore without changing db records for now.
        // It could sleep for 1 second if needed...
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to perform backup action' });
    }
  });

  // Audit Logs
  app.delete('/api/audit-logs', checkPermission('Dashboard'), async (req, res) => {
    try {
      await db('audit_logs').del();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  });

  app.get('/api/audit-logs', checkPermission('Dashboard'), async (req, res) => {
    try {
      const { page = 1, limit = 10, search, module } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = db('audit_logs');
      
      if (search) {
        query = query.where(builder => 
          builder.where('user', 'like', `%${search}%`)
            .orWhere('action', 'like', `%${search}%`)
            .orWhere('module', 'like', `%${search}%`)
        );
      }
      
      if (module && module !== 'All') {
        query = query.where('module', module);
      }
      
      const totalCount = await db('audit_logs').count('id as count').first();
      const logs = await query.orderBy('timestamp', 'desc').limit(Number(limit)).offset(offset);
      
      res.json({ logs, totalCount: totalCount?.count || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  // Suppliers CRUD Extensions
  app.delete('/api/customers/:id', checkPermission('Customers'), async (req, res) => {
    try {
      await db('customers').where({ id: req.params.id }).delete();
      await auditLog(req, 'DELETE', 'Customers', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  app.put('/api/suppliers/:id', checkPermission('Suppliers'), async (req, res) => {
    try {
      await db('suppliers').where({ id: req.params.id }).update(req.body);
      await auditLog(req, 'UPDATE', 'Suppliers', { id: req.params.id, changes: req.body });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  app.delete('/api/suppliers/:id', checkPermission('Suppliers'), async (req, res) => {
    try {
      await db('suppliers').where({ id: req.params.id }).delete();
      await auditLog(req, 'DELETE', 'Suppliers', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Delete failed' });
    }
  });

  // --- Phase 6: Reporting & Analytics Layer ---
  app.get('/api/analytics/dashboard', checkPermission('Dashboard'), async (req, res) => {
    try {
      // 1. Total Stock Value
      const stockValue = await db('inventory').select(db.raw('SUM(stock * price) as total')) as any[];
      
      // 2. Weekly Production Efficiency (Mocked for current logic)
      const productionStats = await db('production_batches')
        .select('status')
        .count('* as count')
        .groupBy('status');

      // 3. Top Selling Items
      const topSellers = await db('sales_order_items')
        .join('inventory', 'sales_order_items.product_id', 'inventory.id')
        .select('inventory.name')
        .sum('sales_order_items.qty as total_qty')
        .groupBy('inventory.id', 'inventory.name')
        .orderBy('total_qty', 'desc')
        .limit(5);

      // 4. Low Stock Alerts
      const lowStock = await db('inventory')
        .whereRaw(isPostgres ? 'stock < "minStock"' : 'stock < minStock')
        .count('* as count')
        .first();

      res.json({
        stockValue: stockValue[0].total || 0,
        productionStats,
        topSellers,
        lowStock: lowStock?.count || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.get('/api/analytics/export/:module', checkPermission('Reports'), async (req, res) => {
    try {
      let data: any[] = [];
      const module = req.params.module;

      if (module === 'inventory') {
        data = await db('inventory').select('*');
      } else if (module === 'sales') {
        data = await db('sales_orders').join('customers', 'sales_orders.customer_id', 'customers.id').select('sales_orders.*', 'customers.name as customer_name');
      } else if (module === 'audit') {
        data = await db('audit_logs').select('*');
      } else if (module === 'production') {
        data = await db('production_batches').select('*');
      } else if (module === 'customers') {
        data = await db('customers').select('*');
      } else if (module === 'ledger') {
        data = await db('ledger').select('*');
      } else if (module === 'transfers') {
        data = await db('stock_transfers').select('*');
      } else {
        return res.status(400).json({ error: 'Invalid module for export' });
      }

      if (data.length === 0) {
        return res.status(404).json({ error: 'No data to export' });
      }

      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data);

      res.header('Content-Type', 'text/csv');
      res.attachment(`${module}_report_${Date.now()}.csv`);
      res.send(csv);

      await auditLog(req, 'EXPORT_DATA', 'Reports', { module });
    } catch (error) {
      res.status(500).json({ error: 'Export failed' });
    }
  });

  app.put('/api/inventory/transfers/:id/status', checkPermission('Inventory'), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await db('stock_transfers')
        .where({ id })
        .update({ 
          status,
          updated_at: db.fn.now()
        });
      
      await auditLog(req, 'UPDATE_TRANSFER_STATUS', 'Inventory', { id, status });
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update transfer status' });
    }
  });

  app.post('/api/inventory/transfer-bulk', checkPermission('Inventory'), async (req: any, res) => {
    const { source, destination, items, status, notes, priority, transport, expectedArrival } = req.body;
    
    try {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items provided for transfer' });
      }

      for (const item of items) {
        if (item.qty <= 0) {
          return res.status(400).json({ error: `Invalid quantity for item ${item.id}. Must be positive.` });
        }
      }

      await db.transaction(async (trx) => {
        // Create Transfer Record
        const insertResult = await trx('stock_transfers').insert({
          transfer_number: `TRF-${Date.now().toString().slice(-6)}`,
          source,
          destination,
          priority: priority || 'NORMAL',
          transport_type: transport || 'in-house',
          expected_arrival: expectedArrival,
          notes,
          status: status || 'PENDING APPROVAL',
          items_preview: JSON.stringify(items.slice(0, 2)),
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        }).returning('id');

        const idObj = insertResult[0];
        const transferId = typeof idObj === 'object' ? idObj.id : idObj;

        for (const itemPlan of items) {
          const { id, qty } = itemPlan;
          
          // Save Item Record linked to transfer
          await trx('stock_transfer_items').insert({
            transfer_id: transferId,
            inventory_id: id,
            qty
          });

          // Only update stock if NOT a draft
          if (status !== 'DRAFT') {
            // Find Source Record
            let sourceWh = await trx('warehouse_stocks')
              .where({ inventory_id: id, warehouse_name: source })
              .first();

            // FIX: If missing, create it with 0 stock
            if (!sourceWh) {
              const insertResult = await trx('warehouse_stocks').insert({
                inventory_id: id,
                warehouse_name: source,
                stock: 0
              }).returning('id');
              const newWhIdObj = insertResult[0];
              const newWhId = typeof newWhIdObj === 'object' ? newWhIdObj.id : newWhIdObj;
              sourceWh = await trx('warehouse_stocks').where({ id: newWhId }).first();
            }

            if (sourceWh.stock < qty) {
              throw new Error(`Insufficient stock for item ID ${id} in ${source}`);
            }

            // Decrement Source
            await trx('warehouse_stocks')
              .where({ id: sourceWh.id })
              .decrement('stock', qty);

            // Find/Upsert Destination
            const destWh = await trx('warehouse_stocks')
              .where({ inventory_id: id, warehouse_name: destination })
              .first();

            if (destWh) {
              await trx('warehouse_stocks')
                .where({ id: destWh.id })
                .increment('stock', qty);
            } else {
              await trx('warehouse_stocks').insert({
                inventory_id: id,
                warehouse_name: destination,
                stock: qty
              });
            }

            // Recalculate and Sync main inventory table
            const whStocksBulk = await trx('warehouse_stocks').where({ inventory_id: id });
            let wTotalBulk = 0;
            let dTotalBulk = 0;
            
            whStocksBulk.forEach((s: any) => {
              if (s.warehouse_name === 'Shop Display') dTotalBulk += s.stock;
              else wTotalBulk += s.stock;
            });
            
            await trx('inventory').where({ id }).update({
              warehouse_stock: wTotalBulk,
              display_stock: dTotalBulk,
              stock: wTotalBulk + dTotalBulk,
              updated_at: db.fn.now()
            });
          }
        }

        // Global Audit Log
        await auditLog(req, 'BULK_STOCK_TRANSFER', 'Inventory', { 
          source, 
          destination, 
          item_count: items.length,
          status,
          notes
        }, trx);
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Bulk transfer failed:', error);
      res.status(400).json({ error: error.message || 'Transfer failed' });
    }
  });

  app.get('/api/inventory/:id/transactions', async (req, res) => {
    try {
      const { id } = req.params;
      const { type, limit } = req.query; // 'All', 'Production', 'Sales', limit

      let transactions: any[] = [];

      // Fetch Sales
      if (!type || type === 'All' || type === 'Sales') {
        const sales = await db('sales_order_items')
          .join('sales_orders', 'sales_order_items.order_id', 'sales_orders.id')
          .join('customers', 'sales_orders.customer_id', 'customers.id')
          .where('sales_order_items.product_id', id)
          .select(
            'sales_orders.created_at as date',
            'sales_orders.order_number as reference',
            'sales_order_items.qty',
            'customers.name as operator',
            db.raw("'Customer Order' as type"),
            db.raw("'Sales' as category")
          );
        transactions = [...transactions, ...sales.map(s => ({ ...s, qty: -s.qty, status: 'Completed' }))];
      }

      // Fetch Production
      if (!type || type === 'All' || type === 'Production') {
        const production = await db('production_batches')
          .where('product_id', id)
          .select(
            'created_at as date',
            'batch_number as reference',
            'actual_qty as qty',
            db.raw("'Factory Line' as operator"),
            db.raw("'Production Batch' as type"),
            db.raw("'Production' as category"),
            'status'
          );
        transactions = [...transactions, ...production.map(p => ({ ...p, qty: p.qty || 0 }))];
      }

      // Fetch Transfers
      if (!type || type === 'All' || type === 'Transfers') {
        const transfers = await db('stock_transfer_items')
          .join('stock_transfers', 'stock_transfer_items.transfer_id', 'stock_transfers.id')
          .where('stock_transfer_items.inventory_id', id)
          .select(
            'stock_transfers.created_at as date',
            'stock_transfers.transfer_number as reference',
            'stock_transfer_items.qty',
            'stock_transfers.destination as operator',
            db.raw("'Stock Transfer' as type"),
            db.raw("'Logistics' as category"),
            'stock_transfers.status'
          );
        
        // Negative quantity because it's stock moving out of main factory/origin
        transactions = [...transactions, ...transfers.map(t => ({ ...t, qty: -t.qty }))];
      }

      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (limit) {
        transactions = transactions.slice(0, parseInt(limit as string));
      }

      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/inventory/:id/trends', async (req, res) => {
    try {
      const { id } = req.params;
      const startDate = new Date('2026-05-10T00:00:00Z');
      const today = new Date();
      
      const item = await db('inventory').where({ id }).first();
      if (!item) return res.status(404).json({ error: 'Item not found' });

      // Gather stock-changing transactions after May 10
      const sales = await db('sales_order_items')
        .join('sales_orders', 'sales_order_items.order_id', 'sales_orders.id')
        .where('sales_order_items.product_id', id)
        .where('sales_orders.created_at', '>', startDate)
        .where('sales_orders.status', 'Completed')
        .select('sales_orders.created_at as timestamp', 'sales_order_items.qty');
      
      const production = await db('production_batches')
        .where('product_id', id)
        .where('created_at', '>', startDate)
        .where('status', 'Completed')
        .select('created_at as timestamp', 'actual_qty as qty');
      
      const consumption = await db('production_material_consumption')
        .where('inventory_id', id)
        .where('created_at', '>', startDate)
        .select('created_at as timestamp', 'qty_consumed as qty');
        
      const purchases = await db('purchase_items')
        .join('purchase_orders', 'purchase_items.po_id', 'purchase_orders.id')
        .where('purchase_items.product_id', id)
        .where('purchase_orders.created_at', '>', startDate)
        .where('purchase_orders.status', 'Received')
        .select('purchase_orders.created_at as timestamp', 'purchase_items.qty');

      const audits = await db('audit_logs')
        .where('module', 'Inventory')
        .where('timestamp', '>', startDate)
        .whereIn('action', ['ADJUST', 'UPDATE_ITEM'])
        .select('timestamp', 'details', 'action');
      
      const adjustments: any[] = audits.map(a => {
        try {
          const d = JSON.parse(a.details);
          if (d.item_id == id || d.id == id || d.product_id == id) {
             if (a.action === 'ADJUST') {
               return { t: new Date(a.timestamp), q: d.type === 'add' ? d.quantity : -d.quantity };
             } else if (a.action === 'UPDATE_ITEM' && d.before && d.after && d.before.stock !== undefined && d.after.stock !== undefined) {
               return { t: new Date(a.timestamp), q: d.after.stock - d.before.stock };
             }
          }
        } catch(e) {
          console.error('Trend parse error:', e);
        }
        return null;
      }).filter(Boolean);

      const changes = [
        ...sales.map(s => ({ t: new Date(s.timestamp), q: -s.qty })),
        ...production.map(p => ({ t: new Date(p.timestamp), q: p.qty })),
        ...consumption.map(c => ({ t: new Date(c.timestamp), q: -c.qty })),
        ...purchases.map(p => ({ t: new Date(p.timestamp), q: p.qty })),
        ...adjustments
      ];

      // Calculate starting stock at May 10
      const totalChangeSinceStart = changes.reduce((acc, curr) => acc + curr.q, 0);
      let runningStock = item.stock - totalChangeSinceStart;

      const data = [];
      const iter = new Date(startDate);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      while (iter <= endDate) {
        const dayStart = new Date(iter);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(iter);
        dayEnd.setHours(23, 59, 59, 999);

        const dayChanges = changes.filter(c => c.t >= dayStart && c.t <= dayEnd);
        runningStock += dayChanges.reduce((acc, curr) => acc + curr.q, 0);

        data.push({
          name: iter.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase(),
          value: runningStock
        });

        iter.setDate(iter.getDate() + 1);
      }

      res.json(data);
    } catch (error) {
      console.error('Trends error:', error);
      res.status(500).json({ error: 'Failed to fetch trends' });
    }
  });

  // Reports & Analytics API
  app.get('/api/reports/sales', checkPermission('Reports'), async (req, res) => {
    const { period = 'daily' } = req.query;
    try {
      let format = '%Y-%m-%d';
      let pgFormat = 'YYYY-MM-DD';
      if (period === 'monthly') {
        format = '%Y-%m';
        pgFormat = 'YYYY-MM';
      }
      if (period === 'yearly') {
        format = '%Y';
        pgFormat = 'YYYY';
      }

      const results = await db('sales_orders')
        .select(
          db.raw(
            isPostgres 
              ? `TO_CHAR(created_at, '${pgFormat}') as label`
              : `strftime('${format}', created_at) as label`
          )
        )
        .sum('total_amount as value')
        .groupByRaw(
          isPostgres 
            ? `TO_CHAR(created_at, '${pgFormat}')` 
            : `strftime('${format}', created_at)`
        )
        .orderBy('label', 'asc');

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/city-sales', checkPermission('Reports'), async (req, res) => {
    try {
      const results = await db('sales_orders')
        .join('customers', 'sales_orders.customer_id', 'customers.id')
        .select('customers.city as label')
        .sum('sales_orders.total_amount as value')
        .groupBy('customers.city')
        .orderBy('value', 'desc');

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/customer-summary-city-wise', checkPermission('Customers'), async (req, res) => {
    try {
      const results = await db('customers')
        .leftJoin('ledger', 'customers.id', 'ledger.customer_id')
        .select('customers.id', 'customers.name', 'customers.company', 'customers.city', 'customers.phone')
        .sum('ledger.debit as total_sales')
        .sum('ledger.credit as total_purchases_payments')
        .groupBy('customers.id', 'customers.name', 'customers.company', 'customers.city', 'customers.phone')
        .orderBy('customers.city', 'asc');

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/outstanding', checkPermission('Reports'), async (req, res) => {
    try {
      const results = await db('ledger')
        .join('customers', 'ledger.customer_id', 'customers.id')
        .select('customers.id', 'customers.name', 'customers.phone', 'customers.city')
        .sum('ledger.debit as total_debit')
        .sum('ledger.credit as total_credit')
        .groupBy('customers.id', 'customers.name', 'customers.phone', 'customers.city')
        .having(db.raw('SUM(ledger.debit) - SUM(ledger.credit)'), '>', 0);

      const formatted = results.map((r: any) => ({
        ...r,
        balance: r.total_debit - r.total_credit
      }));

      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/inventory-valuation', checkPermission('Reports'), async (req, res) => {
    try {
      const items = await db('inventory').select('name', 'stock', 'price');
      const valuation = items.map((i: any) => ({
        name: i.name,
        stock: i.stock,
        value: i.stock * i.price
      }));
      const totalValuation = valuation.reduce((sum: number, i: any) => sum + i.value, 0);
      res.json({ items: valuation, total: totalValuation });
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/production-summary', checkPermission('Reports'), async (req, res) => {
    try {
      const summary = await db('production_batches')
        .select('status')
        .count('* as count')
        .sum('actual_qty as total_qty')
        .groupBy('status');
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed' });
    }
  });

  app.get('/api/reports/profit-loss', checkPermission('Reports'), async (req, res) => {
    try {
      // Use direct tables for accuracy if ledger is missing entries
      const salesTotal = await db('sales_orders').sum('total_amount as sum').first() as any;
      const purchasesTotal = await db('purchase_orders').sum('total_amount as sum').first() as any;
      
      const rev = Number(salesTotal?.sum || 0);
      const exp = Number(purchasesTotal?.sum || 0);

      res.json({
        revenue: rev,
        expenses: exp,
        netProfit: rev - exp
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  // API 404 Handler - Catch unmatched API routes before SPA fallback
  app.use('/api', (req, res) => {
    console.warn(`404 API Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER ERROR:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

// Vite middleware for development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('vite').then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }).catch(err => console.error('Vite init failed', err));
} else if (!process.env.VERCEL) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If we're on Vercel, Vercel routes non-API traffic to the static assets natively. 
  // Any traffic reaching Express that isn't handled should return a 404 API response.
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
