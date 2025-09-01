const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  spellCheck: (word) => ipcRenderer.invoke('spell-check', word),
  getClipboard: () => ipcRenderer.invoke('get-clipboard')
});
