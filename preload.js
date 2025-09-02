const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  spellCheck: (word) => ipcRenderer.invoke('spell-check', word),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  setClipboard: (text) => ipcRenderer.invoke('set-clipboard', text),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  onFocusInput: (callback) => ipcRenderer.on('focus-input', callback),
  onPlayAudio: (callback) => ipcRenderer.on('play-audio', callback),
  onPlayHoverAudio: (callback) => ipcRenderer.on('play-hover-audio', callback),
  onPlayCorrectAudio: (callback) => ipcRenderer.on('play-correct-audio', callback),
  onPlayIncorrectAudio: (callback) => ipcRenderer.on('play-incorrect-audio', callback),
  onPlayCopyAudio: (callback) => ipcRenderer.on('play-copy-audio', callback),
  playHoverSound: () => ipcRenderer.invoke('play-hover-sound'),
  playCorrectSound: () => ipcRenderer.invoke('play-correct-sound'),
  playIncorrectSound: () => ipcRenderer.invoke('play-incorrect-sound'),
  playCopySound: () => ipcRenderer.invoke('play-copy-sound'),
  
  // Settings APIs
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateHotkey: (hotkey) => ipcRenderer.invoke('update-hotkey', hotkey),
  updateSoundSetting: (enabled) => ipcRenderer.invoke('update-sound-setting', enabled),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  
  // Asset path API
  getAssetPath: (assetName) => ipcRenderer.invoke('get-asset-path', assetName),
  getAssetDataUrl: (assetName) => ipcRenderer.invoke('get-asset-data-url', assetName),
  getAssetProtocolUrl: (assetName) => ipcRenderer.invoke('get-asset-protocol-url', assetName),
  isPackaged: () => ipcRenderer.invoke('is-packaged')
});
