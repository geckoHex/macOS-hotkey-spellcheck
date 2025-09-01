const { app, BrowserWindow, ipcMain, clipboard, globalShortcut } = require('electron');
const path = require('path');
const nspell = require('nspell');
const fs = require('fs');

let mainWindow;
let spellChecker;

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

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Register global shortcut
  const ret = globalShortcut.register('Shift+Control+Option+Command+O', () => {
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
  });

  if (!ret) {
    console.log('Registration of global shortcut failed');
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
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
