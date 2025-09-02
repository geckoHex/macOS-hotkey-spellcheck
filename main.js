const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, dialog } = require('electron');
const path = require('path');
const nspell = require('nspell');
const fs = require('fs');

let mainWindow;
let settingsWindow;
let spellChecker;
let tray;
let currentHotkey = 'Shift+Command+O';

// Configuration management
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      currentHotkey = config.hotkey || 'Shift+Control+Option+Command+O';
      console.log('Config loaded:', config);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    currentHotkey = 'Shift+Control+Option+Command+O';
  }
}

function saveConfig() {
  try {
    const config = {
      hotkey: currentHotkey
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('Config saved:', config);
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

class ElectronSpellChecker {
  constructor() {
    this.language = 'en-US';
    this.spellChecker = null;
  }

  async initialize() {
    try {
      const dictionaryPath = path.join(__dirname, 'node_modules', 'dictionary-en');
      const affPath = path.join(dictionaryPath, 'index.aff');
      const dicPath = path.join(dictionaryPath, 'index.dic');
      
      if (fs.existsSync(affPath) && fs.existsSync(dicPath)) {
        const aff = fs.readFileSync(affPath, 'utf8');
        const dic = fs.readFileSync(dicPath, 'utf8');
        this.spellChecker = nspell(aff, dic);
      } else {
        this.spellChecker = nspell();
      }
    } catch (error) {
      this.spellChecker = nspell();
    }
  }

  switchLanguage(language) {
    this.language = language;
  }

  isMisspelled(word) {
    if (!this.spellChecker) {
      throw new Error('Spell checker not initialized');
    }
    return !this.spellChecker.correct(word);
  }

  getCorrectionsForMisspelling(word) {
    if (!this.spellChecker) {
      throw new Error('Spell checker not initialized');
    }
    return this.spellChecker.suggest(word);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false
    },
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    focusable: true,
    title: 'Spell Checker'
  });

  mainWindow.loadFile('index.html');

  spellChecker = new ElectronSpellChecker();
  spellChecker.initialize();
  spellChecker.switchLanguage('en-US');
}

function createTray() {
  // Create a tray icon
  tray = new Tray(path.join(__dirname, 'public', 'iconTemplate.png'));

  // Create context menu for the tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Spell Checker',
      click: () => {
        showWindow();
      }
    },
    {
      label: 'Open Settings',
      click: () => {
        createSettingsWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  // Set the context menu
  tray.setContextMenu(contextMenu);
  
  // Set tooltip
  tray.setToolTip('Spell Checker');
  
  // Handle tray click - show dropdown menu instead of auto-opening window
  tray.on('click', () => {
    tray.popUpContextMenu();
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  // Hide the main window when settings are opened
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false
    },
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    resizable: true,
    skipTaskbar: false,
    show: false,
    focusable: true,
    title: 'Settings',
    titleBarStyle: 'default',
    minimizable: true,
    maximizable: true,
    fullscreenable: false,
    hasShadow: true
  });

  settingsWindow.loadFile('settings.html');

  // Center the settings window
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const windowWidth = 500;
  const windowHeight = 500;
  
  settingsWindow.setBounds({
    x: Math.round((width - windowWidth) / 2),
    y: Math.round((height - windowHeight) / 2),
    width: windowWidth,
    height: windowHeight
  });

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.focus();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function showWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      // Position the window higher on screen
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      const windowWidth = 600;
      const windowHeight = 500;
      
      mainWindow.setBounds({
        x: Math.round((width - windowWidth) / 2),
        y: Math.round((height - windowHeight) / 6), // Changed from /2 to /6 to move higher
        width: windowWidth,
        height: windowHeight
      });
      
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('focus-input');
    }
  }
}

// Function to register global shortcut with current hotkey
function registerGlobalShortcut() {
  // Unregister any existing shortcuts
  globalShortcut.unregisterAll();
  
  // Register the current hotkey
  const ret = globalShortcut.register(currentHotkey, () => {
    showWindow();
  });

  if (!ret) {
    console.log('Registration of global shortcut failed for:', currentHotkey);
    return false;
  }
  
  console.log('Global shortcut registered:', currentHotkey);
  return true;
}

// Function to update hotkey
function updateHotkey(newHotkey) {
  try {
    // Unregister current shortcut
    globalShortcut.unregisterAll();
    
    // Try to register new shortcut
    const ret = globalShortcut.register(newHotkey, () => {
      showWindow();
    });
    
    if (ret) {
      currentHotkey = newHotkey;
      saveConfig(); // Save the new hotkey to config
      console.log('Hotkey updated to:', newHotkey);
      return true;
    } else {
      // If new hotkey failed, restore the old one
      registerGlobalShortcut();
      console.log('Failed to register new hotkey, restored old one');
      return false;
    }
  } catch (error) {
    console.error('Error updating hotkey:', error);
    // Try to restore the old hotkey
    registerGlobalShortcut();
    return false;
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Check if the platform is macOS
  if (process.platform !== 'darwin') {
    // Show platform not supported dialog
    dialog.showMessageBox({
      type: 'warning',
      title: 'Platform Not Supported',
      message: 'Only macOS is supported at the moment',
      detail: 'This application is currently designed to work only on macOS. Support for other platforms may be added in future versions.',
      buttons: ['OK']
    }).then(() => {
      // Quit the app after user clicks OK
      app.quit();
    });
    return;
  }
  
  // Hide dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  
  // Load configuration
  loadConfig();
  
  createWindow();
  createTray();
  
  // Register global shortcut
  registerGlobalShortcut();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  // since we're using a tray icon
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.handle('spell-check', async (event, word) => {
  try {
    const cleanWord = word.trim();
    
    if (cleanWord.includes(' ')) {
      return {
        isCorrect: false,
        error: 'Please enter only one word at a time'
      };
    }
    
    if (cleanWord === '') {
      return {
        isCorrect: false,
        error: 'Please enter a word to check'
      };
    }
    
    if (!spellChecker) {
      return {
        isCorrect: false,
        error: 'Spell checker not initialized'
      };
    }
    
    const isMisspelled = spellChecker.isMisspelled(cleanWord);
    const isCorrect = !isMisspelled;
    
    let suggestions = [];
    if (isMisspelled) {
      suggestions = spellChecker.getCorrectionsForMisspelling(cleanWord);
      suggestions = suggestions.slice(0, 5);
    }
    
    return {
      isCorrect: isCorrect,
      word: cleanWord,
      suggestions: suggestions
    };
    
  } catch (error) {
    return {
      isCorrect: false,
      error: 'Spell checker error: ' + error.message
    };
  }
});

ipcMain.handle('get-clipboard', async () => {
  try {
    const clipboardText = clipboard.readText();
    return clipboardText.trim();
  } catch (error) {
    return '';
  }
});

ipcMain.handle('set-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('hide-window', async () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// Settings IPC handlers
ipcMain.handle('get-settings', async () => {
  return {
    hotkey: currentHotkey
  };
});

ipcMain.handle('update-hotkey', async (event, newHotkey) => {
  return updateHotkey(newHotkey);
});

ipcMain.handle('close-settings', async () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

ipcMain.handle('open-settings', async () => {
  createSettingsWindow();
});