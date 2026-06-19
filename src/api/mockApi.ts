import { getDatabase, generateId, generateOrderNumber, ensureDatabase } from "@/db/database";
import type {
  User,
  MenuItem,
  Order,
  OrderItem,
  CreateOrderPayload,
  ApiResponse,
  PaginatedResponse,
  AnalyticsStats,
  DailySales,
  BestSeller,
} from "@/types";

// Simulate network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ AUTH API ============

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; accessToken: string }>> {
    // Ensure database is ready first
    await ensureDatabase();
    await delay(500); // Give a bit more time
    
    const db = getDatabase();
    
    // Sanitize and normalize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();
    
    console.log("Login attempt:", { email: sanitizedEmail, passwordLength: sanitizedPassword.length });
    
    // First, let's see all users for debugging
    const allUsersResult = db.exec("SELECT id, email, password, role FROM users");
    console.log("All users in database:", allUsersResult[0]?.values);
    
    // Try to find user by email first
    const userResult = db.exec(
      `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE LOWER(TRIM(email)) = '${sanitizedEmail}'`
    );
    
    console.log("User lookup result:", userResult);
    
    if (!userResult[0] || userResult[0].values.length === 0) {
      console.error("No user found with email:", sanitizedEmail);
      throw new Error("Invalid credentials - user not found");
    }
    
    const userRow = userResult[0].values[0];
    const storedPassword = userRow[3] as string;
    
    console.log("Password check:", { provided: sanitizedPassword, stored: storedPassword, match: storedPassword === sanitizedPassword });
    
    if (storedPassword !== sanitizedPassword) {
      console.error("Password mismatch");
      throw new Error("Invalid credentials - wrong password");
    }

    return {
      success: true,
      data: {
        user: {
          _id: userRow[0] as string,
          name: userRow[1] as string,
          email: userRow[2] as string,
          role: userRow[4] as User["role"],
          createdAt: userRow[5] as string,
          updatedAt: userRow[6] as string,
        },
        accessToken: "mock-jwt-token-" + Date.now(),
      },
    };
  },

  async register(data: { name: string; email: string; password: string; role: string }): Promise<ApiResponse<User>> {
    await delay();
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    try {
      db.run(
        "INSERT INTO users (id, name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, data.name, data.email, data.password, data.role, now, now]
      );

      return {
        success: true,
        data: {
          _id: id,
          name: data.name,
          email: data.email,
          role: data.role as User["role"],
          createdAt: now,
          updatedAt: now,
        },
      };
    } catch (error) {
      throw new Error("Email already exists");
    }
  },

  async getMe(userId: string): Promise<ApiResponse<User>> {
    await delay(100);
    const db = getDatabase();
    const result = db.exec(`SELECT * FROM users WHERE id = '${userId}'`);

    if (!result[0] || result[0].values.length === 0) {
      throw new Error("User not found");
    }

    const row = result[0].values[0];
    return {
      success: true,
      data: {
        _id: row[0] as string,
        name: row[1] as string,
        email: row[2] as string,
        role: row[4] as User["role"],
        createdAt: row[5] as string,
        updatedAt: row[6] as string,
      },
    };
  },
};

// ============ USERS API ============

export const usersApi = {
  async getAll(): Promise<ApiResponse<User[]>> {
    await delay();
    const db = getDatabase();
    const result = db.exec("SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC");

    if (!result[0]) {
      return { success: true, data: [] };
    }

    const users = result[0].values.map((row) => ({
      _id: row[0] as string,
      name: row[1] as string,
      email: row[2] as string,
      role: row[3] as User["role"],
      createdAt: row[4] as string,
      updatedAt: row[5] as string,
    }));

    return { success: true, data: users };
  },

  async update(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    await delay();
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.email) {
      updates.push("email = ?");
      values.push(data.email);
    }
    if (data.role) {
      updates.push("role = ?");
      values.push(data.role);
    }
    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const result = db.exec(`SELECT * FROM users WHERE id = '${id}'`);
    const row = result[0].values[0];

    return {
      success: true,
      data: {
        _id: row[0] as string,
        name: row[1] as string,
        email: row[2] as string,
        role: row[4] as User["role"],
        createdAt: row[5] as string,
        updatedAt: row[6] as string,
      },
    };
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay();
    const db = getDatabase();
    db.run("DELETE FROM users WHERE id = ?", [id]);
    return { success: true, data: null };
  },
};

// ============ MENU API ============

export const menuApi = {
  async getAll(params?: { page?: number; limit?: number; category?: string }): Promise<PaginatedResponse<MenuItem>> {
    await delay();
    const db = getDatabase();
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = "";
    if (params?.category && params.category !== "All") {
      whereClause = `WHERE category = '${params.category}'`;
    }

    const countResult = db.exec(`SELECT COUNT(*) FROM menu_items ${whereClause}`);
    const total = countResult[0]?.values[0][0] as number;

    const result = db.exec(
      `SELECT * FROM menu_items ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );

    if (!result[0]) {
      return { success: true, data: [], total: 0, page, limit, totalPages: 0 };
    }

    const items = result[0].values.map((row) => ({
      _id: row[0] as string,
      name: row[1] as string,
      description: row[2] as string,
      price: row[3] as number,
      category: row[4] as string,
      imageUrl: row[5] as string,
      isAvailable: Boolean(row[6]),
      createdAt: row[7] as string,
      updatedAt: row[8] as string,
    }));

    return {
      success: true,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<ApiResponse<MenuItem>> {
    await delay();
    const db = getDatabase();
    const result = db.exec(`SELECT * FROM menu_items WHERE id = '${id}'`);

    if (!result[0] || result[0].values.length === 0) {
      throw new Error("Menu item not found");
    }

    const row = result[0].values[0];
    return {
      success: true,
      data: {
        _id: row[0] as string,
        name: row[1] as string,
        description: row[2] as string,
        price: row[3] as number,
        category: row[4] as string,
        imageUrl: row[5] as string,
        isAvailable: Boolean(row[6]),
        createdAt: row[7] as string,
        updatedAt: row[8] as string,
      },
    };
  },

  async getCategories(): Promise<ApiResponse<string[]>> {
    await delay(100);
    const db = getDatabase();
    const result = db.exec("SELECT DISTINCT category FROM menu_items ORDER BY category");

    if (!result[0]) {
      return { success: true, data: [] };
    }

    const categories = result[0].values.map((row) => row[0] as string);
    return { success: true, data: categories };
  },

  async create(data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    await delay();
    const db = getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    db.run(
      "INSERT INTO menu_items (id, name, description, price, category, image_url, is_available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, data.name, data.description, data.price, data.category, data.imageUrl || "", 1, now, now]
    );

    return {
      success: true,
      data: {
        _id: id,
        name: data.name!,
        description: data.description!,
        price: data.price!,
        category: data.category!,
        imageUrl: data.imageUrl,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      },
    };
  },

  async update(id: string, data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    await delay();
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push("name = ?"); values.push(data.name); }
    if (data.description !== undefined) { updates.push("description = ?"); values.push(data.description); }
    if (data.price !== undefined) { updates.push("price = ?"); values.push(data.price); }
    if (data.category !== undefined) { updates.push("category = ?"); values.push(data.category); }
    if (data.imageUrl !== undefined) { updates.push("image_url = ?"); values.push(data.imageUrl); }
    if (data.isAvailable !== undefined) { updates.push("is_available = ?"); values.push(data.isAvailable ? 1 : 0); }
    
    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.run(`UPDATE menu_items SET ${updates.join(", ")} WHERE id = ?`, values);

    return this.getById(id);
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay();
    const db = getDatabase();
    db.run("DELETE FROM menu_items WHERE id = ?", [id]);
    return { success: true, data: null };
  },
};

// ============ ORDERS API ============

export const ordersApi = {
  async getAll(params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Order>> {
    await delay();
    const db = getDatabase();
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = "";
    if (params?.status && params.status !== "all") {
      whereClause = `WHERE status = '${params.status}'`;
    }

    const countResult = db.exec(`SELECT COUNT(*) FROM orders ${whereClause}`);
    const total = countResult[0]?.values[0][0] as number;

    const result = db.exec(
      `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    );

    if (!result[0]) {
      return { success: true, data: [], total: 0, page, limit, totalPages: 0 };
    }

    const orders: Order[] = [];
    for (const row of result[0].values) {
      const orderId = row[0] as string;
      const itemsResult = db.exec(`SELECT * FROM order_items WHERE order_id = '${orderId}'`);
      
      const items: OrderItem[] = itemsResult[0]?.values.map((itemRow) => ({
        menuItem: itemRow[2] as string,
        name: itemRow[3] as string,
        price: itemRow[4] as number,
        quantity: itemRow[5] as number,
      })) || [];

      orders.push({
        _id: row[0] as string,
        orderNumber: row[1] as string,
        status: row[2] as Order["status"],
        paymentMethod: row[3] as Order["paymentMethod"],
        paymentStatus: row[4] as Order["paymentStatus"],
        subtotal: row[5] as number,
        tax: row[6] as number,
        total: row[7] as number,
        notes: row[8] as string,
        createdBy: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
        items,
      });
    }

    return {
      success: true,
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<ApiResponse<Order>> {
    await delay();
    const db = getDatabase();
    const result = db.exec(`SELECT * FROM orders WHERE id = '${id}'`);

    if (!result[0] || result[0].values.length === 0) {
      throw new Error("Order not found");
    }

    const row = result[0].values[0];
    const itemsResult = db.exec(`SELECT * FROM order_items WHERE order_id = '${id}'`);
    
    const items: OrderItem[] = itemsResult[0]?.values.map((itemRow) => ({
      menuItem: itemRow[2] as string,
      name: itemRow[3] as string,
      price: itemRow[4] as number,
      quantity: itemRow[5] as number,
    })) || [];

    return {
      success: true,
      data: {
        _id: row[0] as string,
        orderNumber: row[1] as string,
        status: row[2] as Order["status"],
        paymentMethod: row[3] as Order["paymentMethod"],
        paymentStatus: row[4] as Order["paymentStatus"],
        subtotal: row[5] as number,
        tax: row[6] as number,
        total: row[7] as number,
        notes: row[8] as string,
        createdBy: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
        items,
      },
    };
  },

  async create(data: CreateOrderPayload, userId?: string): Promise<ApiResponse<Order>> {
    await delay();
    const db = getDatabase();
    const id = generateId();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    // Calculate totals
    let subtotal = 0;
    const orderItems: { menuItemId: string; name: string; price: number; quantity: number }[] = [];

    for (const item of data.items) {
      const menuResult = db.exec(`SELECT name, price FROM menu_items WHERE id = '${item.menuItem}'`);
      if (menuResult[0] && menuResult[0].values.length > 0) {
        const name = menuResult[0].values[0][0] as string;
        const price = menuResult[0].values[0][1] as number;
        subtotal += price * item.quantity;
        orderItems.push({ menuItemId: item.menuItem, name, price, quantity: item.quantity });
      }
    }

    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const paymentStatus = data.paymentMethod === "unpaid" ? "unpaid" : "paid";

    db.run(
      "INSERT INTO orders (id, order_number, status, payment_method, payment_status, subtotal, tax, total, notes, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, orderNumber, "pending", data.paymentMethod, paymentStatus, subtotal, tax, total, data.notes || "", userId || null, now, now]
    );

    // Insert order items
    for (const item of orderItems) {
      const itemId = generateId();
      db.run(
        "INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [itemId, id, item.menuItemId, item.name, item.price, item.quantity, now]
      );
    }

    return this.getById(id);
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    await delay();
    const db = getDatabase();
    const now = new Date().toISOString();

    db.run("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);

    return this.getById(id);
  },

  async recordPayment(id: string, paymentMethod: string): Promise<ApiResponse<Order>> {
    await delay();
    const db = getDatabase();
    const now = new Date().toISOString();

    db.run(
      "UPDATE orders SET payment_method = ?, payment_status = 'paid', updated_at = ? WHERE id = ?",
      [paymentMethod, now, id]
    );

    return this.getById(id);
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay();
    const db = getDatabase();
    db.run("DELETE FROM order_items WHERE order_id = ?", [id]);
    db.run("DELETE FROM orders WHERE id = ?", [id]);
    return { success: true, data: null };
  },
};

// ============ KITCHEN API ============

export const kitchenApi = {
  async getOrders(): Promise<ApiResponse<Order[]>> {
    await delay(200);
    const db = getDatabase();
    const result = db.exec(
      "SELECT * FROM orders WHERE status IN ('pending', 'preparing', 'ready') ORDER BY created_at ASC"
    );

    if (!result[0]) {
      return { success: true, data: [] };
    }

    const orders: Order[] = [];
    for (const row of result[0].values) {
      const orderId = row[0] as string;
      const itemsResult = db.exec(`SELECT * FROM order_items WHERE order_id = '${orderId}'`);
      
      const items: OrderItem[] = itemsResult[0]?.values.map((itemRow) => ({
        menuItem: itemRow[2] as string,
        name: itemRow[3] as string,
        price: itemRow[4] as number,
        quantity: itemRow[5] as number,
      })) || [];

      orders.push({
        _id: row[0] as string,
        orderNumber: row[1] as string,
        status: row[2] as Order["status"],
        paymentMethod: row[3] as Order["paymentMethod"],
        paymentStatus: row[4] as Order["paymentStatus"],
        subtotal: row[5] as number,
        tax: row[6] as number,
        total: row[7] as number,
        notes: row[8] as string,
        createdBy: row[9] as string,
        createdAt: row[10] as string,
        updatedAt: row[11] as string,
        items,
      });
    }

    return { success: true, data: orders };
  },

  async updateStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    return ordersApi.updateStatus(id, status);
  },
};

// ============ ANALYTICS API ============

export const analyticsApi = {
  async getStats(): Promise<ApiResponse<AnalyticsStats>> {
    await delay();
    const db = getDatabase();
    const today = new Date().toISOString().split("T")[0];

    const todayOrders = db.exec(
      `SELECT COUNT(*), COALESCE(SUM(total), 0), COALESCE(AVG(total), 0) FROM orders WHERE date(created_at) = '${today}'`
    );
    const activeOrders = db.exec(
      "SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing', 'ready')"
    );
    const menuCount = db.exec("SELECT COUNT(*) FROM menu_items");

    const todayData = todayOrders[0]?.values[0] || [0, 0, 0];

    return {
      success: true,
      data: {
        totalOrdersToday: todayData[0] as number,
        revenueToday: todayData[1] as number,
        avgOrderValue: todayData[2] as number,
        activeOrders: (activeOrders[0]?.values[0][0] as number) || 0,
        menuItemCount: (menuCount[0]?.values[0][0] as number) || 0,
      },
    };
  },

  async getDailySales(_date?: string): Promise<ApiResponse<DailySales[]>> {
    await delay();
    const db = getDatabase();

    // Get sales for the last 7 days
    const result = db.exec(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(total), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `);

    if (!result[0]) {
      // Return mock data if no real data
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return {
        success: true,
        data: days.map((day) => ({
          date: day,
          totalSales: Math.floor(Math.random() * 3000) + 1500,
          totalOrders: Math.floor(Math.random() * 40) + 20,
          avgOrderValue: Math.floor(Math.random() * 30) + 50,
        })),
      };
    }

    const sales = result[0].values.map((row) => ({
      date: new Date(row[0] as string).toLocaleDateString("en-US", { weekday: "short" }),
      totalSales: row[1] as number,
      totalOrders: row[2] as number,
      avgOrderValue: row[3] as number,
    }));

    // Fill in missing days with mock data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const filledSales = days.map((day) => {
      const existing = sales.find((s) => s.date === day);
      return existing || {
        date: day,
        totalSales: Math.floor(Math.random() * 3000) + 1500,
        totalOrders: Math.floor(Math.random() * 40) + 20,
        avgOrderValue: Math.floor(Math.random() * 30) + 50,
      };
    });

    return { success: true, data: filledSales };
  },

  async getBestSellers(params?: { limit?: number }): Promise<ApiResponse<BestSeller[]>> {
    await delay();
    const db = getDatabase();
    const limit = params?.limit || 10;

    const result = db.exec(`
      SELECT 
        name,
        SUM(quantity) as total_quantity,
        SUM(price * quantity) as total_revenue
      FROM order_items
      GROUP BY name
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `);

    if (!result[0] || result[0].values.length === 0) {
      // Return mock data
      return {
        success: true,
        data: [
          { name: "Butter Chicken", totalQuantity: 156, totalRevenue: 2496 },
          { name: "Margherita Pizza", totalQuantity: 132, totalRevenue: 1716 },
          { name: "Caesar Salad", totalQuantity: 98, totalRevenue: 980 },
          { name: "Grilled Salmon", totalQuantity: 87, totalRevenue: 2000 },
          { name: "Tiramisu", totalQuantity: 76, totalRevenue: 684 },
        ].slice(0, limit),
      };
    }

    const sellers = result[0].values.map((row) => ({
      name: row[0] as string,
      totalQuantity: row[1] as number,
      totalRevenue: row[2] as number,
    }));

    return { success: true, data: sellers };
  },
};
