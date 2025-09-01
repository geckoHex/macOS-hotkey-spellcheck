const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');

let mainWindow;

// Simple spell checker implementation
class SimpleSpellChecker {
  constructor() {
    // Basic common English words for demonstration
    // In a real app, you'd load a comprehensive dictionary
    this.dictionary = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
      'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
      'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
      'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'water', 'long', 'find', 'here', 'thing', 'great', 'right', 'move', 'try',
      'little', 'number', 'public', 'same', 'few', 'may', 'small', 'write', 'every', 'large', 'own', 'home', 'men', 'still',
      'should', 'american', 'around', 'house', 'world', 'high', 'country', 'school', 'never', 'last', 'another', 'while', 'where', 'much', 'before',
      'line', 'too', 'means', 'old', 'tell', 'boy', 'follow', 'came', 'show', 'form', 'three',
      'set', 'put', 'end', 'why', 'again', 'turn', 'here', 'off', 'went', 'number', 'great', 'men',
      'found', 'still', 'between', 'name', 'big', 'give', 'air', 'set', 'own', 'under', 'read', 'never', 'us', 'left',
      'end', 'along', 'might', 'next', 'sound', 'below', 'saw', 'something', 'thought', 'both', 'few', 'those', 'always', 'looked',
      'large', 'often', 'together', 'asked', 'going', 'important', 'until', 'food', 'keep', 'children',
      'feet', 'land', 'side', 'without', 'once', 'animal', 'life', 'enough', 'took', 'sometimes', 'four', 'head', 'above', 'kind', 'began',
      'almost', 'live', 'page', 'got', 'earth', 'need', 'far', 'hand', 'mother', 'light', 'father', 'let', 'night', 'picture',
      'being', 'study', 'second', 'soon', 'story', 'since', 'white', 'ever', 'paper', 'hard', 'near', 'sentence', 'better', 'best', 'across', 'during',
      'today', 'however', 'sure', 'knew', 'it\'s', 'told', 'young', 'sun', 'whole', 'hear', 'example', 'heard', 'several', 'change',
      'answer', 'room', 'sea', 'against', 'top', 'turned', 'learn', 'point', 'city', 'play', 'toward', 'five', 'himself', 'usually', 'money', 'seen',
      'didn\'t', 'car', 'morning', 'i\'m', 'body', 'upon', 'family', 'later', 'move', 'face', 'door', 'cut', 'done', 'group', 'true', 'leave',
      'color', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown', 'pink', 'gray', 'grey',
      'hello', 'goodbye', 'please', 'thank', 'thanks', 'sorry', 'excuse', 'welcome', 'yes', 'yeah', 'ok', 'okay', 'sure',
      'computer', 'technology', 'internet', 'website', 'email', 'phone', 'mobile', 'application', 'software', 'program',
      'happy', 'sad', 'angry', 'excited', 'tired', 'hungry', 'thirsty', 'cold', 'hot', 'warm', 'cool',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
      'spell', 'spelling', 'correct', 'wrong', 'check', 'word', 'dictionary', 'language', 'english'
    ]);
  }

  isMisspelled(word) {
    return !this.dictionary.has(word.toLowerCase());
  }

  getSuggestions(word) {
    const suggestions = [];
    const wordLower = word.toLowerCase();
    
    // Find words with similar length and characters
    for (const dictWord of this.dictionary) {
      if (this.calculateSimilarity(wordLower, dictWord) > 0.6) {
        suggestions.push(dictWord);
        if (suggestions.length >= 5) break;
      }
    }
    
    return suggestions;
  }

  calculateSimilarity(word1, word2) {
    if (word1 === word2) return 1.0;
    
    const len1 = word1.length;
    const len2 = word2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    // Simple similarity based on common characters
    let commonChars = 0;
    const chars1 = word1.split('');
    const chars2 = word2.split('');
    
    for (const char of chars1) {
      if (chars2.includes(char)) {
        commonChars++;
      }
    }
    
    return commonChars / maxLen;
  }
}

const spellChecker = new SimpleSpellChecker();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false,
    titleBarStyle: 'default',
    title: 'Spell Checker'
  });

  // Load the HTML file
  mainWindow.loadFile('index.html');

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
    // Clean the word (remove extra spaces, convert to lowercase)
    const cleanWord = word.trim().toLowerCase();
    
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
    
    // Check if the word is spelled correctly
    const isMisspelled = spellChecker.isMisspelled(cleanWord);
    
    if (!isMisspelled) {
      return {
        isCorrect: true,
        word: cleanWord
      };
    } else {
      // Get spelling suggestions
      const suggestions = spellChecker.getSuggestions(cleanWord);
      return {
        isCorrect: false,
        word: cleanWord,
        suggestions: suggestions
      };
    }
  } catch (error) {
    return {
      isCorrect: false,
      error: 'Error checking spelling: ' + error.message
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
