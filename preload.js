const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  spellCheck: (word) => ipcRenderer.invoke('spell-check', word),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  setClipboard: (text) => ipcRenderer.invoke('set-clipboard', text),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onFocusInput: (callback) => ipcRenderer.on('focus-input', callback)
});
