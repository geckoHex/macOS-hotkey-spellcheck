// DOM elements
const wordInput = document.getElementById('wordInput');
const checkBtn = document.getElementById('checkBtn');
const result = document.getElementById('result');
const resultContent = document.getElementById('resultContent');

// Track selected suggestion for keyboard navigation
let selectedSuggestionIndex = -1;
let suggestions = [];

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
        // Allow only our custom settings shortcut (Cmd+,)
        if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            await window.electronAPI.openSettings();
            return;
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
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? suggestionItems.length - 1 : selectedSuggestionIndex - 1;
        updateSelectedSuggestion(suggestionItems);
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
        if (hoveredIndex !== -1) {
            selectedSuggestionIndex = hoveredIndex;
            updateSelectedSuggestion(suggestionItems);
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
        } else {
            showIncorrectResult(response.word, response.suggestions);
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

window.addEventListener('DOMContentLoaded', () => {
    wordInput.focus();
    
    // Listen for focus events from main process
    window.electronAPI.onFocusInput(() => {
        // Reset UI when window is shown
        wordInput.value = '';
        resetButton();
        result.classList.add('hidden');
        selectedSuggestionIndex = -1;
        // Focus the input
        setTimeout(() => {
            wordInput.focus();
        }, 100);
    });
});
