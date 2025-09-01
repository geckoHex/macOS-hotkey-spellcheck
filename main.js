const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const nspell = require('nspell');
const fs = require('fs');

let mainWindow;
let spellChecker;

// Spell checker wrapper class to match the sample API
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
        console.log('Spell checker initialized with English dictionary');
      } else {
        console.log('Dictionary files not found, using fallback');
        this.spellChecker = nspell();
      }
    } catch (error) {
      console.error('Error initializing spell checker:', error);
      this.spellChecker = nspell();
    }
  }

  switchLanguage(language) {
    this.language = language;
    console.log(`Switched language to ${language}`);
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

  attachToInput() {
    // This would normally attach to input fields in the renderer
    console.log('Spell checker attached to input fields');
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false // Disable native spell checking since we're using custom spell checker
    },
    resizable: false,
    titleBarStyle: 'default',
    title: 'Spell Checker - Custom Implementation'
  });

  // Load the HTML file
  mainWindow.loadFile('index.html');

  // Initialize our custom spell checker (similar to electron-spellchecker API)
  spellChecker = new ElectronSpellChecker();
  spellChecker.initialize();
  spellChecker.attachToInput();
  spellChecker.switchLanguage('en-US');

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

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

// IPC handlers
ipcMain.handle('spell-check', async (event, word) => {
  try {
    // Clean the word (remove extra spaces)
    const cleanWord = word.trim();
    
    // Check if it's a single word (no spaces)
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
    
    // Use our custom spell checker (following the electron-spellchecker API pattern)
    const isMisspelled = spellChecker.isMisspelled(cleanWord);
    const isCorrect = !isMisspelled;
    
    console.log(`'${cleanWord}' misspelled?`, isMisspelled);
    
    let suggestions = [];
    if (isMisspelled) {
      // Get suggestions for misspelled words
      suggestions = spellChecker.getCorrectionsForMisspelling(cleanWord);
      console.log('Suggestions:', suggestions);
      // Limit to first 5 suggestions
      suggestions = suggestions.slice(0, 5);
    }
    
    return {
      isCorrect: isCorrect,
      word: cleanWord,
      suggestions: suggestions
    };
    
  } catch (error) {
    console.error('Spell check error:', error);
    return {
      isCorrect: false,
      error: 'Custom spell checker error: ' + error.message
    };
  }
});

// Additional IPC handler to demonstrate programmatic checking (like in the sample)
ipcMain.handle('programmatic-check', async (event, word) => {
  try {
    if (!spellChecker) {
      return { error: 'Spell checker not initialized' };
    }
    
    // Demonstrate the API similar to the sample code
    const isMisspelled = spellChecker.isMisspelled(word);
    const suggestions = isMisspelled ? spellChecker.getCorrectionsForMisspelling(word) : [];
    
    console.log(`'${word}' misspelled?`, isMisspelled);
    if (suggestions.length > 0) {
      console.log('Suggestions:', suggestions);
    }
    
    return {
      word: word,
      isMisspelled: isMisspelled,
      suggestions: suggestions.slice(0, 5)
    };
  } catch (error) {
    console.error('Programmatic check error:', error);
    return { error: error.message };
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
