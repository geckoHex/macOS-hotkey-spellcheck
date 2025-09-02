// DOM elements
const currentHotkeyDisplay = document.getElementById('currentHotkey');
const changeHotkeyBtn = document.getElementById('changeHotkeyBtn');
const hotkeyModal = document.getElementById('hotkeyModal');
const hotkeyInput = document.getElementById('hotkeyInput');
const cancelBtn = document.getElementById('cancelBtn');
const saveHotkeyBtn = document.getElementById('saveHotkeyBtn');

// State
let isRecording = false;
let recordedKeys = [];
let currentHotkey = '';

// Initialize settings
async function initializeSettings() {
    try {
        const settings = await window.electronAPI.getSettings();
        currentHotkey = settings.hotkey || 'Shift+Control+Option+Command+O';
        updateCurrentHotkeyDisplay();
    } catch (error) {
        console.error('Failed to load settings:', error);
        currentHotkey = 'Shift+Control+Option+Command+O';
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
                if (key.length === 1 || ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key)) {
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
    hotkeyInput.placeholder = 'Press your desired key combination...';
    saveHotkeyBtn.disabled = true;
    recordedKeys = [];
    isRecording = true;
    
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
    
    const key = e.key;
    
    // Add key to recorded keys if not already present
    if (!recordedKeys.includes(key)) {
        recordedKeys.push(key);
    }
    
    // Update input display in real-time
    const tempHotkey = formatHotkeyForInput([...recordedKeys]);
    if (tempHotkey) {
        hotkeyInput.value = formatHotkeyForDisplay(tempHotkey);
        hotkeyInput.dataset.hotkey = tempHotkey;
        saveHotkeyBtn.disabled = false;
        hotkeyInput.classList.add('success');
    } else {
        hotkeyInput.value = '';
        hotkeyInput.dataset.hotkey = '';
        saveHotkeyBtn.disabled = true;
        hotkeyInput.classList.remove('success');
    }
}

// Handle key release
function handleKeyUp(e) {
    if (!isRecording) return;
    
    e.preventDefault();
    e.stopPropagation();
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

// Event listeners
changeHotkeyBtn.addEventListener('click', showHotkeyModal);
cancelBtn.addEventListener('click', hideHotkeyModal);
saveHotkeyBtn.addEventListener('click', saveHotkey);

// Key event listeners for recording
hotkeyInput.addEventListener('keydown', handleKeyDown);
hotkeyInput.addEventListener('keyup', handleKeyUp);

// Click outside modal to close
hotkeyModal.addEventListener('click', (e) => {
    if (e.target === hotkeyModal) {
        hideHotkeyModal();
    }
});

// Global escape key to close modal or settings
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!hotkeyModal.classList.contains('hidden')) {
            hideHotkeyModal();
        }
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
