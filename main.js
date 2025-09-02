const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const nspell = require('nspell');
const fs = require('fs');

let mainWindow;
let settingsWindow;
let spellChecker;
let tray;
let currentHotkey = 'Shift+Command+O';

// Function to play window open sound directly from main process
function playWindowOpenSound() {
  try {
    const audioPath = path.join(__dirname, 'assets', 'window-open.mp3');
    if (fs.existsSync(audioPath)) {
      // Use shell.openPath or fallback to system sound
      if (process.platform === 'darwin') {
        // On macOS, use afplay for instant audio playback
        const { spawn } = require('child_process');
        const player = spawn('afplay', [audioPath], { 
          stdio: 'ignore',
          detached: true 
        });
        player.unref();
      } else {
        // Fallback: send to renderer for other platforms
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('play-audio', audioPath);
        }
      }
    }
  } catch (error) {
    console.error('Error playing window open sound:', error);
  }
}

// Function to play item hover sound directly from main process
function playItemHoverSound() {
  try {
    const audioPath = path.join(__dirname, 'assets', 'item-hover.mp3');
    if (fs.existsSync(audioPath)) {
      if (process.platform === 'darwin') {
        // On macOS, use afplay for instant audio playback
        const { spawn } = require('child_process');
        const player = spawn('afplay', [audioPath], { 
          stdio: 'ignore',
          detached: true 
        });
        player.unref();
      } else {
        // Fallback: send to renderer for other platforms
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('play-hover-audio', audioPath);
        }
      }
    }
  } catch (error) {
    console.error('Error playing item hover sound:', error);
  }
}

// Function to play correct spelling sound
function playCorrectSound() {
  try {
    const audioPath = path.join(__dirname, 'assets', 'right.mp3');
    if (fs.existsSync(audioPath)) {
      if (process.platform === 'darwin') {
        const { spawn } = require('child_process');
        const player = spawn('afplay', [audioPath], { 
          stdio: 'ignore',
          detached: true 
        });
        player.unref();
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('play-correct-audio', audioPath);
        }
      }
    }
  } catch (error) {
    console.error('Error playing correct sound:', error);
  }
}

// Function to play incorrect spelling sound
function playIncorrectSound() {
  try {
    const audioPath = path.join(__dirname, 'assets', 'wrong.mp3');
    if (fs.existsSync(audioPath)) {
      if (process.platform === 'darwin') {
        const { spawn } = require('child_process');
        const player = spawn('afplay', [audioPath], { 
          stdio: 'ignore',
          detached: true 
        });
        player.unref();
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('play-incorrect-audio', audioPath);
        }
      }
    }
  } catch (error) {
    console.error('Error playing incorrect sound:', error);
  }
}

// Function to play copy sound
function playCopySound() {
  try {
    const audioPath = path.join(__dirname, 'assets', 'copy.mp3');
    if (fs.existsSync(audioPath)) {
      if (process.platform === 'darwin') {
        const { spawn } = require('child_process');
        const player = spawn('afplay', [audioPath], { 
          stdio: 'ignore',
          detached: true 
        });
        player.unref();
      } else {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('play-copy-audio', audioPath);
        }
      }
    }
  } catch (error) {
    console.error('Error playing copy sound:', error);
  }
}

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
    height: 300, // Reduced from 500 to 300
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
      devTools: false // Disable dev tools completely
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

  // Disable all menu shortcuts by setting an empty menu
  mainWindow.setMenu(null);

  // Prevent navigation and block all browser shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Block all shortcuts that use Cmd key (or Ctrl on other platforms)
    if (input.meta || input.control) {
      // Allow only our custom settings shortcut (Cmd+,)
      if (input.key === ',' && input.meta) {
        return; // Allow this one
      }
      // Block everything else
      event.preventDefault();
    }
    
    // Block F keys that could open dev tools or other functions
    if (input.key.startsWith('F') && input.key.length <= 3) {
      event.preventDefault();
    }
    
    // Block other problematic keys
    if (input.key === 'F12' || 
        (input.key === 'I' && input.meta && input.shift) || // Dev tools
        (input.key === 'J' && input.meta && input.alt) ||   // Dev tools
        (input.key === 'C' && input.meta && input.shift) || // Dev tools
        input.key === 'F5' ||   // Refresh
        input.key === 'F11' ||  // Fullscreen
        (input.key === 'R' && input.meta) || // Refresh
        (input.key === 'W' && input.meta) || // Close window
        (input.key === 'M' && input.meta) || // Minimize
        (input.key === 'Q' && input.meta) || // Quit (we handle this differently)
        (input.key === 'H' && input.meta) || // Hide
        (input.key === 'N' && input.meta) || // New window
        (input.key === 'T' && input.meta) || // New tab
        (input.key === 'P' && input.meta) || // Print
        (input.key === 'S' && input.meta) || // Save
        (input.key === 'O' && input.meta) || // Open
        (input.key === 'F' && input.meta) || // Find
        (input.key === 'G' && input.meta) || // Find next
        (input.key === 'Z' && input.meta) || // Undo
        (input.key === 'Y' && input.meta) || // Redo
        (input.key === 'A' && input.meta) || // Select all
        (input.key === 'C' && input.meta) || // Copy (except our clipboard functionality)
        (input.key === 'V' && input.meta) || // Paste
        (input.key === 'X' && input.meta) || // Cut
        (input.key === '+' && input.meta) || // Zoom in
        (input.key === '-' && input.meta) || // Zoom out
        (input.key === '0' && input.meta)    // Reset zoom
       ) {
      event.preventDefault();
    }
  });

  mainWindow.loadFile('index.html');

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Disable zoom
  mainWindow.webContents.setZoomFactor(1.0);
  mainWindow.webContents.on('zoom-changed', (event) => {
    event.preventDefault();
    mainWindow.webContents.setZoomFactor(1.0);
  });

  // Hide window when it loses focus (user clicks outside)
  mainWindow.on('blur', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });

  spellChecker = new ElectronSpellChecker();
  spellChecker.initialize();
  spellChecker.switchLanguage('en-US');
}

function createTray() {
  // Create a tray icon
  tray = new Tray(path.join(__dirname, 'assets', 'iconTemplate.png'));

  // Create context menu for the tray (but don't set it automatically)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Spell Checker',
      click: () => {
        showWindow();
      }
    },
    {
      label: 'Settings',
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
  
  // Don't set the context menu automatically - we'll handle it manually
  
  // Set tooltip
  tray.setToolTip('Spell Checker');
  
  // Handle left-click to show/hide main window
  tray.on('click', (event, bounds) => {
    showWindow();
  });
  
  // Handle right-click to show context menu
  tray.on('right-click', (event, bounds) => {
    tray.popUpContextMenu(contextMenu);
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
      spellcheck: false,
      devTools: false // Disable dev tools for settings window too
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

  // Disable menu for settings window as well
  settingsWindow.setMenu(null);

  // Apply the same input blocking to settings window
  settingsWindow.webContents.on('before-input-event', (event, input) => {
    // Block all shortcuts that use Cmd key (or Ctrl on other platforms)
    if (input.meta || input.control) {
      // Allow window close (Cmd+W) for settings window since it has normal window controls
      if (input.key === 'w' || input.key === 'W') {
        return; // Allow window close for settings
      }
      // Block everything else
      event.preventDefault();
    }
    
    // Block F keys and other problematic keys (same as main window)
    if (input.key.startsWith('F') && input.key.length <= 3) {
      event.preventDefault();
    }
    
    if (input.key === 'F12' || 
        (input.key === 'I' && input.meta && input.shift) ||
        (input.key === 'J' && input.meta && input.alt) ||
        (input.key === 'C' && input.meta && input.shift) ||
        input.key === 'F5' ||
        input.key === 'F11' ||
        (input.key === 'R' && input.meta) ||
        (input.key === 'M' && input.meta) ||
        (input.key === 'Q' && input.meta) ||
        (input.key === 'H' && input.meta) ||
        (input.key === 'N' && input.meta) ||
        (input.key === 'T' && input.meta) ||
        (input.key === 'P' && input.meta) ||
        (input.key === 'S' && input.meta) ||
        (input.key === 'O' && input.meta) ||
        (input.key === 'F' && input.meta) ||
        (input.key === 'G' && input.meta) ||
        (input.key === 'Z' && input.meta) ||
        (input.key === 'Y' && input.meta) ||
        (input.key === '+' && input.meta) ||
        (input.key === '-' && input.meta) ||
        (input.key === '0' && input.meta)
       ) {
      event.preventDefault();
    }
  });

  settingsWindow.loadFile('settings.html');

  // Apply same protections to settings window
  settingsWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
  });

  settingsWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  settingsWindow.webContents.setZoomFactor(1.0);
  settingsWindow.webContents.on('zoom-changed', (event) => {
    event.preventDefault();
    settingsWindow.webContents.setZoomFactor(1.0);
  });

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
      // Play window open sound immediately for best responsiveness
      playWindowOpenSound();
      
      // Position the window higher on screen
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;
      const windowWidth = 600;
      const windowHeight = 300; // Updated to match new window height
      
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

ipcMain.handle('play-hover-sound', async () => {
  playItemHoverSound();
});

ipcMain.handle('play-correct-sound', async () => {
  playCorrectSound();
});

ipcMain.handle('play-incorrect-sound', async () => {
  playIncorrectSound();
});

ipcMain.handle('play-copy-sound', async () => {
  playCopySound();
});