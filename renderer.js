// DOM elements
const wordInput = document.getElementById('wordInput');
const checkBtn = document.getElementById('checkBtn');
const result = document.getElementById('result');
const resultContent = document.getElementById('resultContent');

// Track selected suggestion for keyboard navigation
let selectedSuggestionIndex = -1;
let suggestions = [];
let lastHoverTime = 0; // For debouncing hover sounds
let lastWindowOpenTime = 0; // For debouncing window open sounds
let soundEnabled = true; // Re-enable sound with fixed asset loading

// Preload audio for instant playback
let windowOpenAudio = null;
let itemHoverAudio = null;
let correctAudio = null;
let incorrectAudio = null;
let copyAudio = null;

// Preload the window open sound
async function preloadAudio() {
    try {
        // Check if we're in a packaged (production) app
        const isPackaged = await window.electronAPI.isPackaged();
        
        if (isPackaged) {
            // In production, use data URLs from main process
            const windowOpenDataUrl = await window.electronAPI.getAssetDataUrl('window-open.mp3');
            windowOpenAudio = new Audio(windowOpenDataUrl);
            windowOpenAudio.volume = 0.5;
            windowOpenAudio.preload = 'auto';
            windowOpenAudio.load();
            
            const hoverAudioDataUrl = await window.electronAPI.getAssetDataUrl('item-hover.mp3');
            itemHoverAudio = new Audio(hoverAudioDataUrl);
            itemHoverAudio.volume = 0.3;
            itemHoverAudio.preload = 'auto';
            itemHoverAudio.load();
            
            const correctAudioDataUrl = await window.electronAPI.getAssetDataUrl('right.mp3');
            correctAudio = new Audio(correctAudioDataUrl);
            correctAudio.volume = 0.4;
            correctAudio.preload = 'auto';
            correctAudio.load();
            
            const incorrectAudioDataUrl = await window.electronAPI.getAssetDataUrl('wrong.mp3');
            incorrectAudio = new Audio(incorrectAudioDataUrl);
            incorrectAudio.volume = 0.4;
            incorrectAudio.preload = 'auto';
            incorrectAudio.load();
            
            const copyAudioDataUrl = await window.electronAPI.getAssetDataUrl('copy.mp3');
            copyAudio = new Audio(copyAudioDataUrl);
            copyAudio.volume = 0.4;
            copyAudio.preload = 'auto';
            copyAudio.load();
            
        } else {
            // In development, use relative paths
            const audioPath = './assets/window-open.mp3';
            windowOpenAudio = new Audio(audioPath);
            windowOpenAudio.volume = 0.5;
            windowOpenAudio.preload = 'auto';
            windowOpenAudio.load();
            
            const hoverAudioPath = './assets/item-hover.mp3';
            itemHoverAudio = new Audio(hoverAudioPath);
            itemHoverAudio.volume = 0.3;
            itemHoverAudio.preload = 'auto';
            itemHoverAudio.load();
            
            const correctAudioPath = './assets/right.mp3';
            correctAudio = new Audio(correctAudioPath);
            correctAudio.volume = 0.4;
            correctAudio.preload = 'auto';
            correctAudio.load();
            
            const incorrectAudioPath = './assets/wrong.mp3';
            incorrectAudio = new Audio(incorrectAudioPath);
            incorrectAudio.volume = 0.4;
            incorrectAudio.preload = 'auto';
            incorrectAudio.load();
            
            const copyAudioPath = './assets/copy.mp3';
            copyAudio = new Audio(copyAudioPath);
            copyAudio.volume = 0.4;
            copyAudio.preload = 'auto';
            copyAudio.load();
        }
        
        console.log('Audio preloaded successfully');
    } catch (error) {
        console.error('Error preloading audio:', error);
    }
}

// Function to play hover sound
async function playHoverSound() {
    if (!soundEnabled) return; // Check if sound is enabled
    
    // Simple debounce to prevent excessive sound triggering
    const now = Date.now();
    if (now - lastHoverTime < 100) { // 100ms debounce
        return;
    }
    lastHoverTime = now;
    
    try {
        if (itemHoverAudio) {
            itemHoverAudio.currentTime = 0;
            itemHoverAudio.play().catch(err => {
                console.error('Error playing hover audio:', err);
            });
        }
    } catch (error) {
        console.error('Error in hover sound:', error);
    }
}

// Function to play correct sound
async function playCorrectSound() {
    if (!soundEnabled) return; // Check if sound is enabled
    
    try {
        if (correctAudio) {
            correctAudio.currentTime = 0;
            correctAudio.play().catch(err => {
                console.error('Error playing correct audio:', err);
            });
        }
    } catch (error) {
        console.error('Error in correct sound:', error);
    }
}

// Function to play incorrect sound
async function playIncorrectSound() {
    if (!soundEnabled) return; // Check if sound is enabled
    
    try {
        if (incorrectAudio) {
            incorrectAudio.currentTime = 0;
            incorrectAudio.play().catch(err => {
                console.error('Error playing incorrect audio:', err);
            });
        }
    } catch (error) {
        console.error('Error in incorrect sound:', error);
    }
}

// Function to play window open sound
async function playWindowOpenSound() {
    if (!soundEnabled) return; // Check if sound is enabled
    
    // Debounce to prevent rapid duplicate plays
    const now = Date.now();
    if (now - lastWindowOpenTime < 500) { // 500ms debounce
        return;
    }
    lastWindowOpenTime = now;
    
    try {
        if (windowOpenAudio) {
            windowOpenAudio.currentTime = 0;
            windowOpenAudio.play().catch(err => {
                console.error('Error playing window open audio:', err);
            });
        }
    } catch (error) {
        console.error('Error in window open sound:', error);
    }
}

// Function to play copy sound
async function playCopySound() {
    if (!soundEnabled) return; // Check if sound is enabled
    
    try {
        if (copyAudio) {
            copyAudio.currentTime = 0;
            copyAudio.play().catch(err => {
                console.error('Error playing copy audio:', err);
            });
        }
    } catch (error) {
        console.error('Error in copy sound:', error);
    }
}

// Event listeners
checkBtn.addEventListener('click', checkSpelling);

// Function to trigger shake animation
function shakeInput() {
    const inputGroup = document.querySelector('.input-group');
    inputGroup.classList.add('shake');
    
    // Remove the shake class after animation completes
    setTimeout(() => {
        inputGroup.classList.remove('shake');
    }, 400);
}

// Handle global escape key to close and reset
document.addEventListener('keydown', async (e) => {
    // Block all system and browser shortcuts except allowed ones
    if (e.metaKey || e.ctrlKey) {
        // Allow our custom settings shortcut (Cmd+,)
        if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            await window.electronAPI.openSettings();
            return;
        }
        
        // Allow Cmd+A (select all) when focused on input
        if ((e.key === 'a' || e.key === 'A') && e.target === wordInput) {
            return; // Allow select all in input field
        }
        
        // Allow Cmd+Delete (delete to beginning of line) when focused on input
        if (e.key === 'Backspace' && e.metaKey && e.target === wordInput) {
            return; // Allow Cmd+Delete in input field
        }
        
        // Block all other Cmd/Ctrl combinations
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // Block function keys
    if (e.key.startsWith('F') && e.key.length <= 3) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    
    // Handle escape key normally
    if (e.key === 'Escape') {
        e.preventDefault();
        // Reset the UI
        wordInput.value = '';
        resetButton();
        result.classList.add('hidden');
        selectedSuggestionIndex = -1;
        // Hide the window
        await window.electronAPI.hideWindow();
        return;
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

// Prevent text selection that might interfere
document.addEventListener('selectstart', (e) => {
    // Allow selection only in the input field
    if (e.target !== wordInput) {
        e.preventDefault();
        return false;
    }
});

// Handle keyboard navigation for suggestions
wordInput.addEventListener('keydown', (e) => {
    // Prevent space key and trigger shake animation
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        shakeInput();
        return false;
    }
    
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    
    if (suggestionItems.length === 0) return;
    
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestionItems.length;
        updateSelectedSuggestion(suggestionItems);
        playHoverSound(); // Play hover sound on keyboard navigation
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? suggestionItems.length - 1 : selectedSuggestionIndex - 1;
        updateSelectedSuggestion(suggestionItems);
        playHoverSound(); // Play hover sound on keyboard navigation
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestionItems[selectedSuggestionIndex]);
    }
});

// Handle character input validation
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkSpelling();
        return;
    }
    
    // Allow letters, numbers, apostrophes, and hyphens only
    const allowedPattern = /^[a-zA-Z0-9'\-]$/;
    
    if (!allowedPattern.test(e.key)) {
        e.preventDefault();
        shakeInput();
        return false;
    }
});

// Reset button when user starts typing
wordInput.addEventListener('input', () => {
    resetButton();
    result.classList.add('hidden');
    selectedSuggestionIndex = -1; // Reset selection when typing
});

// Handle suggestion clicks and mouse hover
result.addEventListener('click', async (e) => {
    if (e.target.classList.contains('suggestion-item')) {
        selectSuggestion(e.target);
    }
});

// Handle mouse hover to sync with keyboard navigation
result.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('suggestion-item')) {
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        const hoveredIndex = Array.from(suggestionItems).indexOf(e.target);
        if (hoveredIndex !== -1 && hoveredIndex !== selectedSuggestionIndex) {
            selectedSuggestionIndex = hoveredIndex;
            updateSelectedSuggestion(suggestionItems);
            playHoverSound(); // Play hover sound on mouse hover
        }
    }
});

// Reset selection when mouse leaves the suggestions area
result.addEventListener('mouseleave', () => {
    const suggestionItems = document.querySelectorAll('.suggestion-item');
    if (suggestionItems.length > 0) {
        selectedSuggestionIndex = -1;
        updateSelectedSuggestion(suggestionItems);
    }
});

// Function to handle suggestion selection (both click and keyboard)
async function selectSuggestion(suggestionElement) {
    const suggestionText = suggestionElement.textContent;
    
    // Copy suggestion to clipboard
    try {
        await window.electronAPI.setClipboard(suggestionText);
        
        // Play copy sound when successfully copied
        playCopySound();
        
        // Show visual feedback that it was copied
        const originalText = suggestionElement.textContent;
        suggestionElement.textContent = '✓ Copied!';
        suggestionElement.style.backgroundColor = '#d4edda';
        suggestionElement.style.color = '#155724';
        
        // Auto-dismiss window after a short delay to show the feedback
        setTimeout(async () => {
            // Reset the UI
            wordInput.value = '';
            resetButton();
            result.classList.add('hidden');
            selectedSuggestionIndex = -1;
            // Hide the window
            await window.electronAPI.hideWindow();
        }, 0);
        
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Even if clipboard fails, still auto-dismiss
        setTimeout(async () => {
            wordInput.value = '';
            resetButton();
            result.classList.add('hidden');
            selectedSuggestionIndex = -1;
            await window.electronAPI.hideWindow();
        }, 750);
    }
}

// Function to update visual selection of suggestions
function updateSelectedSuggestion(suggestionItems) {
    // Remove selection from all items
    suggestionItems.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

async function checkSpelling() {
    const word = wordInput.value.trim();
    
    if (!word) {
        showResult('error', 'Please enter a word to check');
        return;
    }

    checkBtn.classList.add('loading');
    
    try {
        const response = await window.electronAPI.spellCheck(word);
        
        if (response.error) {
            showResult('error', response.error);
        } else if (response.isCorrect) {
            showCorrectResult(response.word);
            playCorrectSound(); // Play correct sound
        } else {
            showIncorrectResult(response.word, response.suggestions);
            playIncorrectSound(); // Play incorrect sound
        }
    } catch (error) {
        showResult('error', 'An error occurred while checking spelling');
    } finally {
        checkBtn.classList.remove('loading');
    }
}

function resetButton() {
    checkBtn.textContent = '→';
    checkBtn.className = 'btn-arrow';
}

function showResult(type, message) {
    checkBtn.textContent = '⚠️';
    checkBtn.className = `btn-arrow result-${type}`;
    
    result.className = `result-section result-${type}`;
    
    resultContent.innerHTML = `
        <div class="result-word-display">${message}</div>
    `;
    
    result.classList.remove('hidden');
}

function showCorrectResult(word) {
    checkBtn.textContent = '✓';
    checkBtn.className = 'btn-arrow result-correct';
    
    // Hide the result section for correct words - only show the green checkmark in button
    result.classList.add('hidden');
}

function showIncorrectResult(word, suggestionsList) {
    checkBtn.textContent = '✕';
    checkBtn.className = 'btn-arrow result-incorrect';
    
    result.className = 'result-section result-incorrect';
    
    // Store suggestions for keyboard navigation
    suggestions = suggestionsList || [];
    selectedSuggestionIndex = -1; // Reset selection
    
    let suggestionsHtml = '';
    if (suggestions && suggestions.length > 0) {
        const suggestionItems = suggestions.map(suggestion => 
            `<div class="suggestion-item">${suggestion}</div>`
        ).join('');
        
        suggestionsHtml = `
            <div class="suggestions">
                ${suggestionItems}
            </div>
        `;
    }
    
    resultContent.innerHTML = suggestionsHtml;
    
    result.classList.remove('hidden');
}

window.addEventListener('DOMContentLoaded', async () => {
    // Preload audio for instant playback
    await preloadAudio();
    
    // Load sound setting
    try {
        const settings = await window.electronAPI.getSettings();
        soundEnabled = settings.soundEnabled ?? true; // Default to true with fixed assets
    } catch (error) {
        console.error('Failed to load sound setting:', error);
        soundEnabled = true; // Default to enabled
    }
    
    wordInput.focus();
    
    // Listen for focus events from main process
    window.electronAPI.onFocusInput(() => {
        // Reset UI when window is shown
        wordInput.value = '';
        resetButton();
        result.classList.add('hidden');
        selectedSuggestionIndex = -1;
        
        // Focus the input (sound will be played by onPlayAudio event)
        setTimeout(() => {
            wordInput.focus();
        }, 100);
    });
    
    // Listen for audio play events from main process (fallback for non-macOS)
    window.electronAPI.onPlayAudio((event, audioPath) => {
        // Use our optimized audio player instead
        playWindowOpenSound();
    });
    
    // Listen for hover audio play events from main process (fallback for non-macOS)
    window.electronAPI.onPlayHoverAudio((event, audioPath) => {
        // Use our optimized hover sound function
        playHoverSound();
    });
    
    // Listen for correct audio play events from main process (fallback for non-macOS)
    window.electronAPI.onPlayCorrectAudio((event, audioPath) => {
        // Use our optimized correct sound function
        playCorrectSound();
    });
    
    // Listen for incorrect audio play events from main process (fallback for non-macOS)
    window.electronAPI.onPlayIncorrectAudio((event, audioPath) => {
        // Use our optimized incorrect sound function
        playIncorrectSound();
    });
    
    // Listen for copy audio play events from main process (fallback for non-macOS)
    window.electronAPI.onPlayCopyAudio((event, audioPath) => {
        // Use our optimized copy sound function
        playCopySound();
    });
    
    // Add click listener to detect clicks outside the content area
    document.addEventListener('click', async (e) => {
        const container = document.querySelector('.container');
        
        // Check if the click is outside the container
        if (container && !container.contains(e.target)) {
            // Hide the window when clicking outside the content
            await window.electronAPI.hideWindow();
        }
    });
});
