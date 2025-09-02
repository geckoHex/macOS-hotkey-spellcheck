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

## Installation
This app is currently under development. Currently the only way to run it is to build it from source. In the future, pre-built binaries may be provided under "Releases". *Please note this app is currently only available for macOS.*

### Building from Source
1. Clone the repository
```bash
git clone https://github.com/geckoHex/macOS-hotkey-spellcheck.git
cd macOS-hotkey-spellcheck
```
2. Install dependencies
```bash
npm i
```
3. Build the app
```bash
npm run build
```

4. Use Finder to open the `dist/` directory, double-click the disk image, and drag the app to your Applications folder.

### First Run
Because this app is not signed, macOS will prevent it from being opened the first time. When you first try to open it, macOS will block the app from running. To fix this, follow these steps:
1. Close the warning popup (do not click "Move to Trash")
2. Open System Settings
3. Navigate to "Privacy & Security"
4. Scroll to the bottom
5. Click "Allow Anyway" next to the message about the blocked app

Please also note that the first time you install the app as while as after subsequent updates the app may take some time to launch as macOS performs its own checks. This is normal behavior. Quitting and relaunching in day-to-day use should not encounter this slowdown.

When you first launch the app, you may want to adjust the settings to your preference. You can access the settings menu from the menu bar icon. If you'd like, you can rearrange the menu bar icon's position by command and dragging the icon.

## Roadmap
| Feature               | Description                                                         | Status       | Priority   |
|-----------------------|---------------------------------------------------------------------|--------------|------------|
| Pasting               | Allow users to paste text into the spellcheck UI                    | Next Up      | High       |
| Deploy App            | Package and deploy the app as a `.dmg` on GitHub                    | Complete     | High       |
| Auto paste            | Automatically paste suggestion into the user's current app          | Planned      | Medium     |
| TTS                   | Implement text-to-speech functionality                              | Planned      | Medium     |
| STT                   | Implement speech-to-text functionality                              | Planned      | Medium     |
| Definitions           | Allow the user to see a word's definition                           | Planned      | Low        |
| Background checker    | Check the user's spelling in the background and provide suggestions | Future       | Low        |
| UI Redesign           | Redesign the user interface for improved aesthetic                  | Future       | Low        |

**NOTE:** A list of historical feature completions are available in repo history under `TODO.md`

## Credits
This app wouldn't be possible without the following assets. All assets used are used under their appropriate licenses.

| Asset Type | Asset Description                               | Filepath                                | Source                                                                   |
|------------|-------------------------------------------------|-----------------------------------------|--------------------------------------------------------------------------|
| Sound      | Spellcheck UI open sound (trimmed)              | `assets/window-open.mp3`                | [Pixabay](https://pixabay.com/sound-effects/ui-sounds-pack-3-15-359713/) |
| Sound      | Item hover sound (trimmed)                      | `assets/item-hover.mp3`                 | [Pixabay](https://pixabay.com/sound-effects/ui-sounds-pack-4-9-359736/)  |
| Sound      | Wrong sound                                     | `assets/wrong.mp3`                      | [Pixabay](https://pixabay.com/sound-effects/ui-sounds-pack-5-4-359761/)  |
| Sound      | Right sound                                     | `assets/right.mp3`                      | [Pixabay](https://pixabay.com/sound-effects/ui-sound-374228/)            |
| Sound      | Copy sound                                      | `assets/copy.mp3`                       | [Pixabay](https://pixabay.com/sound-effects/ui-sounds-pack-3-8-359730/)  |
| Icon       | Textbox icon (menu bar and app icon)            | `assets/icons/textbox.svg`              | [Phosphor Icons](https://phosphoricons.com/)                             |
| Icon       | Install arrow icon (arrow-fat-line-right)       | `assets/icons/arrow-fat-line-right.svg` | [Phosphor Icons](https://phosphoricons.com/)                             |
| Icon       | Pencil icon (used in DMG background pattern)    | `assets/icons/pencil.svg`               | [Phosphor Icons](https://phosphoricons.com/)                             |
| Icon       | Paperclip icon (used in DMG background pattern) | `assets/icons/paperclip.svg`            | [Phosphor Icons](https://phosphoricons.com/)                             |
| Icon       | Pen icon (used in DMG background pattern)       | `assets/icons/pen.svg`                  | [Phosphor Icons](https://phosphoricons.com/)                             |