// DOM elements
const wordInput = document.getElementById('wordInput');
const checkBtn = document.getElementById('checkBtn');
const pasteBtn = document.getElementById('pasteBtn');
const result = document.getElementById('result');
const resultContent = document.getElementById('resultContent');

// Event listeners
checkBtn.addEventListener('click', checkSpelling);
pasteBtn.addEventListener('click', pasteFromClipboard);
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkSpelling();
    }
});

// Handle suggestion clicks
result.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-item')) {
        wordInput.value = e.target.textContent;
        checkSpelling();
    }
});

async function checkSpelling() {
    const word = wordInput.value.trim();
    
    if (!word) {
        showResult('error', 'Please enter a word to check', '⚠️');
        return;
    }

    // Show loading state
    checkBtn.classList.add('loading');
    checkBtn.textContent = 'Checking...';
    
    try {
        const response = await window.electronAPI.spellCheck(word);
        
        if (response.error) {
            showResult('error', response.error, '⚠️');
        } else if (response.isCorrect) {
            showResult('correct', `"${response.word}" is spelled correctly!`, '✅');
        } else {
            showIncorrectResult(response.word, response.suggestions);
        }
    } catch (error) {
        showResult('error', 'An error occurred while checking spelling', '❌');
        console.error('Spell check error:', error);
    } finally {
        // Reset button state
        checkBtn.classList.remove('loading');
        checkBtn.textContent = 'Check';
    }
}

async function pasteFromClipboard() {
    try {
        const clipboardText = await window.electronAPI.getClipboard();
        
        if (clipboardText) {
            // Get the first word if multiple words are pasted
            const firstWord = clipboardText.split(/\s+/)[0];
            wordInput.value = firstWord;
            wordInput.focus();
            
            // Auto-check if it's a single word
            if (!clipboardText.includes(' ')) {
                checkSpelling();
            }
        } else {
            showResult('error', 'Clipboard is empty or contains no text', '📋');
        }
    } catch (error) {
        showResult('error', 'Could not access clipboard', '❌');
        console.error('Clipboard error:', error);
    }
}

function showResult(type, message, icon) {
    result.className = `result-section result-${type}`;
    
    resultContent.innerHTML = `
        <div class="result-title">
            <span>${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showIncorrectResult(word, suggestions) {
    result.className = 'result-section result-incorrect';
    
    let suggestionsHtml = '';
    if (suggestions && suggestions.length > 0) {
        const suggestionItems = suggestions.map(suggestion => 
            `<span class="suggestion-item" title="Click to use this word">${suggestion}</span>`
        ).join('');
        
        suggestionsHtml = `
            <div class="suggestions">
                <h4>Did you mean:</h4>
                <div class="suggestion-list">
                    ${suggestionItems}
                </div>
            </div>
        `;
    } else {
        suggestionsHtml = `
            <div class="suggestions">
                <p>No suggestions available</p>
            </div>
        `;
    }
    
    resultContent.innerHTML = `
        <div class="result-title">
            <span>❌</span>
            <span>"<span class="result-word">${word}</span>" is not spelled correctly</span>
        </div>
        ${suggestionsHtml}
    `;
    
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Focus the input when the app loads
window.addEventListener('DOMContentLoaded', () => {
    wordInput.focus();
});
