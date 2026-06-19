import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;
let dbReady: Promise<Database> | null = null;
let isInitialized = false;

// Determine the base URL for WASM file
function getWasmUrl(file: string): string {
  // In development/production, try local first, then CDN fallbacks
  const urls = [
    // Local file (copied by postinstall script)
    `/${file}`,
    // CDN fallbacks
    `https://sql.js.org/dist/${file}`,
    `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`,
  ];
  
  // Return the first URL for now, the actual loading will handle fallbacks
  return urls[0];
}

async function tryLoadSqlJs(): Promise<ReturnType<typeof initSqlJs>> {
  // Try local file first
  try {
    console.log("Trying to load sql.js from local /sql-wasm.wasm");
    const SQL = await initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    });
    console.log("Successfully loaded sql.js from local file");
    return SQL;
  } catch (localError) {
    console.warn("Failed to load local WASM, trying CDN fallbacks...", localError);
  }
  
  // CDN fallbacks
  const CDN_URLS = [
    "https://sql.js.org/dist/",
    "https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/",
    "https://unpkg.com/sql.js@1.14.1/dist/",
  ];
  
  let lastError: Error | null = null;
  
  for (const baseUrl of CDN_URLS) {
    try {
      console.log(`Trying to load sql.js from: ${baseUrl}`);
      const SQL = await initSqlJs({
        locateFile: (file: string) => `${baseUrl}${file}`,
      });
      console.log(`Successfully loaded sql.js from: ${baseUrl}`);
      return SQL;
    } catch (error) {
      console.warn(`Failed to load from ${baseUrl}:`, error);
      lastError = error as Error;
    }
  }
  
  throw lastError || new Error("Failed to load sql.js from all sources");
}

// Silence unused function warning
void getWasmUrl;

export async function initDatabase(): Promise<Database> {
  if (db && isInitialized) return db;
  
  if (dbReady) return dbReady;

  dbReady = (async () => {
    console.log("Initializing SQLite database...");
    
    const SQL = await tryLoadSqlJs();
    console.log("SQL.js loaded successfully");

    db = new SQL.Database();

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'kitchen')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
        payment_method TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_method IN ('cash', 'card', 'upi', 'unpaid')),
        payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('paid', 'unpaid')),
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        notes TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      )
    `);

    // Seed data
    await seedDatabase(db);
    isInitialized = true;
    console.log("Database initialized and seeded!");

    return db;
  })();

  return dbReady;
}

export async function ensureDatabase(): Promise<Database> {
  if (!db || !isInitialized) {
    return initDatabase();
  }
  return db;
}

async function seedDatabase(db: Database) {
  // Check if data exists
  const userCount = db.exec("SELECT COUNT(*) FROM users")[0]?.values[0][0] as number;
  if (userCount > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database...");

  // Seed users
  const users = [
    { id: "user-1", name: "John Admin", email: "admin@restrohub.com", password: "password", role: "admin" },
    { id: "user-2", name: "Sarah Cashier", email: "cashier@restrohub.com", password: "password", role: "cashier" },
    { id: "user-3", name: "Mike Kitchen", email: "kitchen@restrohub.com", password: "password", role: "kitchen" },
    { id: "user-4", name: "Emma Wilson", email: "emma@restrohub.com", password: "password", role: "cashier" },
    { id: "user-5", name: "Chef Roberto", email: "roberto@restrohub.com", password: "password", role: "kitchen" },
  ];

  for (const user of users) {
    db.run(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.name, user.email, user.password, user.role]
    );
  }
  console.log("Users seeded:", users.length);

  // Seed categories
  const categories = ["Appetizers", "Main Course", "Desserts", "Beverages", "Sides", "Salads"];
  for (const cat of categories) {
    db.run("INSERT INTO categories (id, name) VALUES (?, ?)", [`cat-${cat.toLowerCase().replace(/\s+/g, "-")}`, cat]);
  }

  // Seed menu items
  const menuItems = [
    { id: "menu-1", name: "Butter Chicken", description: "Creamy tomato-based curry with tender chicken pieces, served with basmati rice", price: 15.99, category: "Main Course", is_available: 1 },
    { id: "menu-2", name: "Margherita Pizza", description: "Classic Italian pizza with fresh mozzarella, tomatoes, and basil on a crispy crust", price: 12.99, category: "Main Course", is_available: 1 },
    { id: "menu-3", name: "Caesar Salad", description: "Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing", price: 9.99, category: "Salads", is_available: 1 },
    { id: "menu-4", name: "Grilled Salmon", description: "Fresh Atlantic salmon fillet with herbs, lemon butter sauce, and seasonal vegetables", price: 22.99, category: "Main Course", is_available: 1 },
    { id: "menu-5", name: "Tiramisu", description: "Classic Italian coffee-flavored dessert with layers of mascarpone and ladyfingers", price: 8.99, category: "Desserts", is_available: 1 },
    { id: "menu-6", name: "Mango Lassi", description: "Refreshing yogurt-based drink blended with ripe mangoes and a hint of cardamom", price: 4.99, category: "Beverages", is_available: 1 },
    { id: "menu-7", name: "Spring Rolls", description: "Crispy vegetable spring rolls served with sweet chili dipping sauce", price: 7.99, category: "Appetizers", is_available: 1 },
    { id: "menu-8", name: "Pasta Alfredo", description: "Fettuccine in a rich and creamy parmesan cheese sauce with garlic bread", price: 13.99, category: "Main Course", is_available: 1 },
    { id: "menu-9", name: "Tom Yum Soup", description: "Spicy and sour Thai soup with shrimp, mushrooms, and aromatic herbs", price: 11.99, category: "Appetizers", is_available: 1 },
    { id: "menu-10", name: "Cheesecake", description: "New York style cheesecake with graham cracker crust and berry compote", price: 8.99, category: "Desserts", is_available: 1 },
    { id: "menu-11", name: "French Fries", description: "Golden crispy fries seasoned with sea salt, served with ketchup", price: 4.99, category: "Sides", is_available: 1 },
    { id: "menu-12", name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs, topped with melted cheese", price: 5.99, category: "Sides", is_available: 1 },
    { id: "menu-13", name: "Chicken Wings", description: "Crispy fried chicken wings tossed in your choice of buffalo or BBQ sauce", price: 12.99, category: "Appetizers", is_available: 1 },
    { id: "menu-14", name: "Iced Coffee", description: "Cold brewed coffee served over ice with your choice of milk", price: 3.99, category: "Beverages", is_available: 1 },
    { id: "menu-15", name: "Chocolate Brownie", description: "Warm fudgy brownie topped with vanilla ice cream and chocolate sauce", price: 7.99, category: "Desserts", is_available: 1 },
    { id: "menu-16", name: "Greek Salad", description: "Fresh cucumbers, tomatoes, olives, and feta cheese with olive oil dressing", price: 10.99, category: "Salads", is_available: 1 },
  ];

  for (const item of menuItems) {
    db.run(
      "INSERT INTO menu_items (id, name, description, price, category, is_available) VALUES (?, ?, ?, ?, ?, ?)",
      [item.id, item.name, item.description, item.price, item.category, item.is_available]
    );
  }
  console.log("Menu items seeded:", menuItems.length);

  // Seed some orders
  const now = new Date();
  const orders = [
    { id: "order-1", order_number: "ORD-001", status: "preparing", payment_method: "card", payment_status: "paid", subtotal: 41.97, tax: 2.10, total: 44.07, created_at: new Date(now.getTime() - 5 * 60000).toISOString() },
    { id: "order-2", order_number: "ORD-002", status: "pending", payment_method: "cash", payment_status: "paid", subtotal: 30.97, tax: 1.55, total: 32.52, created_at: new Date(now.getTime() - 8 * 60000).toISOString() },
    { id: "order-3", order_number: "ORD-003", status: "ready", payment_method: "upi", payment_status: "paid", subtotal: 22.99, tax: 1.15, total: 24.14, created_at: new Date(now.getTime() - 15 * 60000).toISOString() },
    { id: "order-4", order_number: "ORD-004", status: "completed", payment_method: "card", payment_status: "paid", subtotal: 35.97, tax: 1.80, total: 37.77, created_at: new Date(now.getTime() - 60 * 60000).toISOString() },
    { id: "order-5", order_number: "ORD-005", status: "completed", payment_method: "cash", payment_status: "paid", subtotal: 26.97, tax: 1.35, total: 28.32, created_at: new Date(now.getTime() - 120 * 60000).toISOString() },
    { id: "order-6", order_number: "ORD-006", status: "pending", payment_method: "unpaid", payment_status: "unpaid", subtotal: 18.98, tax: 0.95, total: 19.93, created_at: new Date(now.getTime() - 2 * 60000).toISOString() },
  ];

  for (const order of orders) {
    db.run(
      "INSERT INTO orders (id, order_number, status, payment_method, payment_status, subtotal, tax, total, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [order.id, order.order_number, order.status, order.payment_method, order.payment_status, order.subtotal, order.tax, order.total, order.created_at, "user-2"]
    );
  }
  console.log("Orders seeded:", orders.length);

  // Seed order items
  const orderItems = [
    { id: "oi-1", order_id: "order-1", menu_item_id: "menu-1", name: "Butter Chicken", price: 15.99, quantity: 2 },
    { id: "oi-2", order_id: "order-1", menu_item_id: "menu-3", name: "Caesar Salad", price: 9.99, quantity: 1 },
    { id: "oi-3", order_id: "order-2", menu_item_id: "menu-2", name: "Margherita Pizza", price: 12.99, quantity: 1 },
    { id: "oi-4", order_id: "order-2", menu_item_id: "menu-5", name: "Tiramisu", price: 8.99, quantity: 2 },
    { id: "oi-5", order_id: "order-3", menu_item_id: "menu-4", name: "Grilled Salmon", price: 22.99, quantity: 1 },
    { id: "oi-6", order_id: "order-4", menu_item_id: "menu-2", name: "Margherita Pizza", price: 12.99, quantity: 2 },
    { id: "oi-7", order_id: "order-4", menu_item_id: "menu-3", name: "Caesar Salad", price: 9.99, quantity: 1 },
    { id: "oi-8", order_id: "order-5", menu_item_id: "menu-5", name: "Tiramisu", price: 8.99, quantity: 3 },
    { id: "oi-9", order_id: "order-6", menu_item_id: "menu-7", name: "Spring Rolls", price: 7.99, quantity: 1 },
    { id: "oi-10", order_id: "order-6", menu_item_id: "menu-3", name: "Caesar Salad", price: 9.99, quantity: 1 },
  ];

  for (const item of orderItems) {
    db.run(
      "INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)",
      [item.id, item.order_id, item.menu_item_id, item.name, item.price, item.quantity]
    );
  }

  console.log("Database seeded successfully!");
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function generateId(): string {
  return "id-" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function generateOrderNumber(): string {
  const result = getDatabase().exec("SELECT COUNT(*) FROM orders");
  const count = (result[0]?.values[0][0] as number) || 0;
  return `ORD-${String(count + 1).padStart(3, "0")}`;
}
