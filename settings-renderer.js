// DOM elements
const currentHotkeyDisplay = document.getElementById('currentHotkey');
const changeHotkeyBtn = document.getElementById('changeHotkeyBtn');
const hotkeyModal = document.getElementById('hotkeyModal');
const hotkeyInput = document.getElementById('hotkeyInput');
const cancelBtn = document.getElementById('cancelBtn');
const saveHotkeyBtn = document.getElementById('saveHotkeyBtn');
const soundToggle = document.getElementById('soundToggle');

// State
let isRecording = false;
let recordedKeys = [];
let currentHotkey = '';

// Initialize settings
async function initializeSettings() {
    try {
        const settings = await window.electronAPI.getSettings();
        currentHotkey = settings.hotkey || 'Shift+Control+Option+Command+O';
        
        // Set sound toggle state
        soundToggle.checked = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
        
        updateCurrentHotkeyDisplay();
    } catch (error) {
        console.error('Failed to load settings:', error);
        currentHotkey = 'Shift+Control+Option+Command+O';
        soundToggle.checked = true;
        updateCurrentHotkeyDisplay();
    }
}

// Update the current hotkey display
function updateCurrentHotkeyDisplay() {
    currentHotkeyDisplay.textContent = formatHotkeyForDisplay(currentHotkey);
}

// Format hotkey for display (convert to Mac symbols)
function formatHotkeyForDisplay(hotkey) {
    return hotkey
        .replace(/Command/g, '⌘')
        .replace(/Control/g, '⌃')
        .replace(/Option/g, '⌥')
        .replace(/Shift/g, '⇧')
        .replace(/\+/g, '');
}

// Format hotkey for input (convert back to text)
function formatHotkeyForInput(keys) {
    const modifiers = [];
    let mainKey = '';
    
    keys.forEach(key => {
        switch(key) {
            case 'Meta':
            case 'Cmd':
            case 'Command':
                if (!modifiers.includes('Command')) modifiers.push('Command');
                break;
            case 'Control':
            case 'Ctrl':
                if (!modifiers.includes('Control')) modifiers.push('Control');
                break;
            case 'Alt':
            case 'Option':
                if (!modifiers.includes('Option')) modifiers.push('Option');
                break;
            case 'Shift':
                if (!modifiers.includes('Shift')) modifiers.push('Shift');
                break;
            default:
                // Handle function keys and other special keys
                if (key.match(/^F\d+$/) || 
                    ['Space', 'Enter', 'Tab', 'Backspace', 'Delete', 'Escape', 'Up', 'Down', 'Left', 'Right'].includes(key) ||
                    key.startsWith('Numpad') ||
                    (key.length === 1)) {
                    mainKey = key.toUpperCase();
                }
                break;
        }
    });
    
    // Ensure we have at least one modifier for global shortcuts
    if (modifiers.length === 0) {
        return null;
    }
    
    // Sort modifiers in a consistent order
    const order = ['Shift', 'Control', 'Option', 'Command'];
    modifiers.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    
    if (mainKey) {
        return [...modifiers, mainKey].join('+');
    } else if (modifiers.length >= 2) {
        // Allow modifier-only combinations if there are at least 2 modifiers
        return modifiers.join('+');
    }
    
    return null;
}

// Validate hotkey
function isValidHotkey(hotkey) {
    if (!hotkey) return false;
    
    const parts = hotkey.split('+');
    const modifierCount = parts.filter(part => 
        ['Shift', 'Control', 'Option', 'Command'].includes(part)
    ).length;
    
    // Must have at least one modifier
    return modifierCount >= 1;
}

// Show hotkey recording modal
function showHotkeyModal() {
    hotkeyModal.classList.remove('hidden');
    hotkeyInput.value = '';
    hotkeyInput.placeholder = 'Press and hold your key combination...';
    saveHotkeyBtn.disabled = true;
    recordedKeys = [];
    isRecording = true;
    
    // Clear any previous states
    hotkeyInput.classList.remove('success', 'recording');
    hotkeyInput.dataset.hotkey = '';
    
    // Focus the input to capture key events
    setTimeout(() => {
        hotkeyInput.focus();
    }, 100);
}

// Hide hotkey recording modal
function hideHotkeyModal() {
    hotkeyModal.classList.add('hidden');
    isRecording = false;
    recordedKeys = [];
}

// Handle key recording
function handleKeyDown(e) {
    if (!isRecording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any previous keys and build from the current event
    recordedKeys = [];
    
    // Get modifier states from the event directly
    if (e.shiftKey) recordedKeys.push('Shift');
    if (e.ctrlKey) recordedKeys.push('Control');
    if (e.altKey) recordedKeys.push('Option');
    if (e.metaKey) recordedKeys.push('Command');
    
    // Get the base key using both e.code and e.key
    let baseKey = '';
    
    // Use e.code for better key detection, but fallback to e.key
    if (e.code) {
        // Handle letter keys
        if (e.code.startsWith('Key')) {
            baseKey = e.code.slice(3); // Remove 'Key' prefix, e.g., 'KeyO' -> 'O'
        }
        // Handle digit keys
        else if (e.code.startsWith('Digit')) {
            baseKey = e.code.slice(5); // Remove 'Digit' prefix, e.g., 'Digit1' -> '1'
        }
        // Handle function keys
        else if (e.code.startsWith('F') && /^F\d+$/.test(e.code)) {
            baseKey = e.code; // F1, F2, etc.
        }
        // Handle special keys
        else if (['Space', 'Enter', 'Tab', 'Backspace', 'Delete', 'Escape'].includes(e.code)) {
            baseKey = e.code;
        }
        // Handle arrow keys
        else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            baseKey = e.code.replace('Arrow', ''); // ArrowUp -> Up
        }
        // Handle numpad keys
        else if (e.code.startsWith('Numpad')) {
            baseKey = e.code; // Keep as is for numpad keys
        }
        // Handle other printable keys using the location info
        else if (e.key && e.key.length === 1 && !e.key.match(/[⌘⌃⌥⇧]/)) {
            // For single character keys, use uppercase version
            baseKey = e.key.toUpperCase();
        }
    }
    
    // Fallback to e.key if we couldn't determine from e.code
    if (!baseKey && e.key && e.key.length === 1) {
        // For modifier combinations that produce special characters,
        // try to detect the base key
        if (e.key.match(/[øœåß∂ƒ©˙∆˚¬…æ∑´®†¥¨ˆπ¡™£¢∞§¶•ªº]/)) {
            // Common special characters produced by modifier combinations
            const specialCharMap = {
                'ø': 'O', 'œ': 'Q', 'å': 'A', 'ß': 'S', '∂': 'D',
                'ƒ': 'F', '©': 'G', '˙': 'H', '∆': 'J', '˚': 'K',
                '¬': 'L', '…': ';', 'æ': "'", '∑': 'W', '´': 'E',
                '®': 'R', '†': 'T', '¥': 'Y', '¨': 'U', 'ˆ': 'I',
                'π': 'P', '¡': '1', '™': '2', '£': '3', '¢': '4',
                '∞': '5', '§': '6', '¶': '7', '•': '8', 'ª': '9',
                'º': '0'
            };
            baseKey = specialCharMap[e.key] || e.key.toUpperCase();
        } else {
            baseKey = e.key.toUpperCase();
        }
    }
    
    // Add the base key if we found one and it's not a modifier
    if (baseKey && !['SHIFT', 'CONTROL', 'ALT', 'META', 'COMMAND', 'OPTION'].includes(baseKey.toUpperCase())) {
        recordedKeys.push(baseKey);
    }
    
    // Update input display in real-time
    const tempHotkey = formatHotkeyForInput([...recordedKeys]);
    
    if (tempHotkey) {
        hotkeyInput.value = formatHotkeyForDisplay(tempHotkey);
        hotkeyInput.dataset.hotkey = tempHotkey;
        saveHotkeyBtn.disabled = false;
        hotkeyInput.classList.add('success');
        hotkeyInput.classList.remove('recording');
    } else {
        hotkeyInput.value = 'Keep holding keys...';
        hotkeyInput.dataset.hotkey = '';
        saveHotkeyBtn.disabled = true;
        hotkeyInput.classList.remove('success');
        hotkeyInput.classList.add('recording');
    }
}

// Handle key release
function handleKeyUp(e) {
    if (!isRecording) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Small delay to allow user to see the complete combination
    // before finalizing the recording
    setTimeout(() => {
        if (isRecording && hotkeyInput.dataset.hotkey && hotkeyInput.classList.contains('success')) {
            // Optional: Auto-finalize after a short delay if we have a valid combination
            // This is commented out to require explicit save action
            // saveHotkey();
        }
    }, 500);
}

// Save hotkey settings
async function saveHotkey() {
    const newHotkey = hotkeyInput.dataset.hotkey;
    
    if (!newHotkey || !isValidHotkey(newHotkey)) {
        return;
    }
    
    try {
        const success = await window.electronAPI.updateHotkey(newHotkey);
        
        if (success) {
            currentHotkey = newHotkey;
            updateCurrentHotkeyDisplay();
            hideHotkeyModal();
            
            // Show temporary success state
            const originalText = changeHotkeyBtn.textContent;
            changeHotkeyBtn.textContent = 'Saved!';
            changeHotkeyBtn.style.background = '#30d158';
            
            setTimeout(() => {
                changeHotkeyBtn.textContent = originalText;
                changeHotkeyBtn.style.background = '';
            }, 1500);
        } else {
            throw new Error('Failed to update hotkey');
        }
    } catch (error) {
        console.error('Failed to save hotkey:', error);
        hotkeyInput.classList.add('shake');
        hotkeyInput.placeholder = 'Error saving hotkey. Try again...';
        
        setTimeout(() => {
            hotkeyInput.classList.remove('shake');
            hotkeyInput.placeholder = 'Press your desired key combination...';
        }, 1000);
    }
}

// Handle sound toggle change
async function handleSoundToggle() {
    try {
        const isEnabled = soundToggle.checked;
        const success = await window.electronAPI.updateSoundSetting(isEnabled);
        
        if (!success) {
            // Revert toggle if save failed
            soundToggle.checked = !isEnabled;
            console.error('Failed to save sound setting');
        }
    } catch (error) {
        console.error('Failed to update sound setting:', error);
        // Revert toggle if update failed
        soundToggle.checked = !soundToggle.checked;
    }
}

// Event listeners
changeHotkeyBtn.addEventListener('click', showHotkeyModal);
cancelBtn.addEventListener('click', hideHotkeyModal);
saveHotkeyBtn.addEventListener('click', saveHotkey);
soundToggle.addEventListener('change', handleSoundToggle);

// Key event listeners for recording
hotkeyInput.addEventListener('keydown', handleKeyDown);
hotkeyInput.addEventListener('keyup', handleKeyUp);

// Click outside modal to close
hotkeyModal.addEventListener('click', (e) => {
    if (e.target === hotkeyModal) {
        hideHotkeyModal();
    }
});

// Global escape key to close modal and block other shortcuts
document.addEventListener('keydown', (e) => {
    // Block all system and browser shortcuts except allowed ones
    if (e.metaKey || e.ctrlKey) {
        // Allow Cmd+W to close settings window
        if ((e.key === 'w' || e.key === 'W') && (e.metaKey || e.ctrlKey)) {
            return; // Allow window close
        }
        
        // If we're recording hotkeys, allow them through
        if (isRecording) {
            return; // Let the hotkey recording handle it
        }
        
        // Block all other Cmd/Ctrl combinations
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // Block function keys (except when recording)
    if (e.key.startsWith('F') && e.key.length <= 3 && !isRecording) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // Handle escape key normally
    if (e.key === 'Escape') {
        if (!hotkeyModal.classList.contains('hidden')) {
            hideHotkeyModal();
        }
    }
});

// Add additional protection against context menu and other events
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Prevent drag and drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    return false;
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    return false;
});

// Prevent unwanted text selection
document.addEventListener('selectstart', (e) => {
    // Allow selection only in the hotkey input field when recording
    if (e.target !== hotkeyInput || !isRecording) {
        e.preventDefault();
        return false;
    }
});

// Prevent input from being typed into normally
hotkeyInput.addEventListener('input', (e) => {
    if (!isRecording) {
        e.target.value = '';
    }
});

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', initializeSettings);
