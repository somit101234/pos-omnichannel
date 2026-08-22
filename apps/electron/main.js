// @ts-nocheck
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// --- Database Setup ---
const DB_PATH = path.join(app.getPath('userData'), 'pos_omnichannel.db');

function initDatabase() {
  const db = new Database(DB_PATH);

  // Create core tables for offline mode
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT UNIQUE,
      cost_price INTEGER NOT NULL,
      sale_price INTEGER NOT NULL,
      min_stock INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS stock (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      last_updated INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      total INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price INTEGER NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Insert default settings if not exist
    INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_type', 'raw');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_width', '58');
  `);

  return db;
}

const db = initDatabase();

// --- Thermal Printer Support ---
function printReceipt(orderData) {
  try {
    // Raw thermal printer support via node-thermal-printer
    const printer = require('node-thermal-printer');
    
    printer.init({
      type: 'epson', // or 'star'
      interface: 'printer:Default',
      height: 80, // 58 or 80 mm
      width: 48,  // chars per line
      color: 'black',
      speed: 3,
      density: 8
    });

    printer.align('center');
    printer.bold(true);
    printer.println('POS Ominichannel');
    printer.println('Demo Store');
    printer.println('Address: 123 Test Street');
    printer.println('Tax Code: 0123456789');
    printer.println('====================');
    printer.bold(false);
    
    orderData.items.forEach(item => {
      printer.println(`${item.name} x${item.quantity}`);
      printer.println(`  ${item.price.toLocaleString()} VND`);
    });
    
    printer.println('--------------------');
    printer.bold(true);
    printer.println(`Total: ${orderData.total.toLocaleString()} VND`);
    printer.println(`Payment: ${orderData.paymentMethod}`);
    printer.println(`Change: ${orderData.change.toLocaleString()} VND`);
    printer.bold(false);
    printer.println('====================');
    printer.println('Thank you!');
    printer.println('====================');
    
    printer.cut();
    printer.execute();
    
    return { success: true };
  } catch (error) {
    console.error('Print error:', error);
    return { success: false, error: error.message };
  }
}

// --- Auto-start at login ---
function setAutoStart(enabled) {
  if (process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux') {
    app.setLoginItemSettings({ openAtLogin: enabled });
  }
}

// --- IPC Handlers ---
ipcMain.handle('db:query', (event, query, params = []) => {
  try {
    const result = db.prepare(query).all(...params);
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('db:execute', (event, query, params = []) => {
  try {
    const result = db.prepare(query).run(...params);
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('printer:print', (event, orderData) => {
  return printReceipt(orderData);
});

ipcMain.handle('settings:set', (event, key, value) => {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('settings:get', (event, key) => {
  try {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
  } catch (error) {
    return { error: error.message };
  }
});

// --- Create Window ---
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#f5f5f5',
    show: false
  });

  // Load renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

  // Show when ready
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
  });

  // Auto-start setting
  const autoStart = db.prepare('SELECT value FROM settings WHERE key = ?').get('auto_start') ?? 'true';
  setAutoStart(autoStart === 'true');

  // DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  db.close();
});
