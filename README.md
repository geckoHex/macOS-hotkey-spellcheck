# Spellcheck
Spellcheck is an Electron app for macOS to help user who struggle with spelling to quickly correct words using hotkeys.

## Why Spellcheck
I'm inspired by [Raycast's](https://www.raycast.com/) keyboard based workflows, but I wanted a product that worked in a more specific way and used a more specific UI than what Raycast offered.

## Features
- Open the checker with a hotkey (⌘ + ⇧ + O by default)
- Type a word and press enter to check it
- Get instant suggestions if a word is wrong
- Quickly a correct spelling to the clipboard
- Appears over other apps and can return focus back
- Menu bar icon
- Settings menu
- Stylish floating UI
- Bad input rejection (disallows invalid input and shakes to indicate an invalid input has been entered)
- Standard keyboard shortcuts are disabled so the user doesn't accidentally open dev tools, minimize the UI, etc.

## Gallery
### Word Entry
The bar auto-focuses the text field and appears over other windows (even fullscreen ones) to make it easy to check a word's spelling quickly. The UI can be quickly closed by pressing ESC.
![Word entry UI](readme/word-entry.png)

### Correctly Spelled Word
When a user correctly spells a word, it shows a green checkmark.
![Correctly spelled entry UI](readme/correct-word.png)

### Incorrectly Spelled Word
When the user incorrectly spells a word, they see this red "x" along with suggestions that can be picked using they mouse or left/right arrow keys. Selecting an option copies it to the clipboard and closes the UI for seamless writing.
![Incorrectly spelled entry UI](readme/wrong-word.png)

### Settings UI
The settings menu exposes helpful parameters so the user can tweak the app how they would like. Unlike the main UI, it is a standard macOS window which can be dragged.
![Settings UI](readme/settings.png)
