# Electron Spell Checker

A simple and elegant Electron application for checking the spelling of individual words.

## Features

- ✅ **Single Word Checking**: Enter one word at a time for accurate spell checking
- 📋 **Clipboard Integration**: Paste words directly from your clipboard
- 🔍 **Smart Suggestions**: Get intelligent suggestions for misspelled words
- 🎨 **Beautiful Interface**: Clean, modern design with smooth animations
- ⚡ **Fast Performance**: Quick spell checking with instant feedback

## How to Use

1. **Type a word**: Enter any word in the input field
2. **Check spelling**: Click the "Check" button or press Enter
3. **Paste from clipboard**: Use the clipboard button to paste a word
4. **View results**: Get instant feedback on spelling accuracy
5. **Use suggestions**: Click on suggested words to check them automatically

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Development

- **Start in development mode**: `npm run dev`
- **Main process**: `main.js` - Handles the Electron app and spell checking logic
- **Renderer process**: `renderer.js` - Handles the user interface
- **Styling**: `style.css` - Modern CSS with gradients and animations

## Technical Details

- **Framework**: Electron
- **Spell Checking**: Custom JavaScript implementation with a built-in dictionary
- **Security**: Context isolation enabled, no node integration in renderer
- **Cross-platform**: Works on Windows, macOS, and Linux

## Dictionary

The app includes a basic English dictionary with common words. For production use, you might want to:
- Load a more comprehensive dictionary file
- Support multiple languages
- Add custom word lists
- Integrate with online spell checking services

## Screenshots

The app features:
- Clean input interface with type-ahead support
- Color-coded results (green for correct, red for incorrect)
- Clickable suggestions for easy word replacement
- Responsive design that works on different screen sizes

## License

MIT License - feel free to use and modify as needed.
