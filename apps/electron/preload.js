// @ts-nocheck
const { contextBridge, ipcRenderer } = require('electron');

// --- Expose protected APIs to renderer ---
contextBridge.exposeInMainWorld('electronAPI', {
  // Database
  dbQuery: (query, params) => ipcRenderer.invoke('db:query', query, params),
  dbExecute: (query, params) => ipcRenderer.invoke('db:execute', query, params),
  
  // Printer
  printReceipt: (orderData) => ipcRenderer.invoke('printer:print', orderData),
  
  // Settings
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  
  // System
  setAutoStart: (enabled) => ipcRenderer.invoke('settings:set', 'auto_start', String(enabled)),
  isAutoStart: () => ipcRenderer.invoke('settings:get', 'auto_start'),
  
  // Dialog
  showOpenDialog: (options) => ipcRenderer.invoke('showOpenDialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('showSaveDialog', options),
  
  // Sync
  syncOnline: () => ipcRenderer.invoke('sync:online'),
  
  // Events
  onPrinterStatus: (callback) => ipcRenderer.on('printer:status', (_, data) => callback(data)),
  onSyncStatus: (callback) => ipcRenderer.on('sync:status', (_, data) => callback(data)),
});

// --- Error handling ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
