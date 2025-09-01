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

// Handle suggestion clicks and correct word clicks
result.addEventListener('click', async (e) => {
    // Check if clicked element or any parent has the correct-word-clickable class
    const correctWordElement = e.target.closest('.correct-word-clickable');
    
    if (e.target.classList.contains('suggestion-item')) {
        wordInput.value = e.target.textContent;
        checkSpelling();
    } else if (correctWordElement) {
        e.preventDefault();
        e.stopPropagation();
        
        const word = correctWordElement.textContent.replace('Copied!', '').trim();
        
        // Don't copy if already showing "Copied!" feedback
        if (correctWordElement.textContent.includes('Copied!')) {
            return;
        }
        
        try {
            const success = await window.electronAPI.setClipboard(word);
            if (success) {
                // Show temporary feedback
                const originalText = correctWordElement.textContent;
                correctWordElement.textContent = 'Copied!';
                correctWordElement.style.backgroundColor = '#68d391';
                correctWordElement.style.color = 'white';
                setTimeout(() => {
                    correctWordElement.textContent = originalText;
                    correctWordElement.style.backgroundColor = '';
                    correctWordElement.style.color = '';
                }, 1500);
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    }
});

async function checkSpelling() {
    const word = wordInput.value.trim();
    
    if (!word) {
        showResult('error', 'Please enter a word to check', '⚠️');
        return;
    }

    checkBtn.classList.add('loading');
    checkBtn.textContent = 'Checking...';
    
    try {
        const response = await window.electronAPI.spellCheck(word);
        
        if (response.error) {
            showResult('error', response.error, '⚠️');
        } else if (response.isCorrect) {
            showCorrectResult(response.word);
        } else {
            showIncorrectResult(response.word, response.suggestions);
        }
    } catch (error) {
        showResult('error', 'An error occurred while checking spelling', '❌');
    } finally {
        checkBtn.classList.remove('loading');
        checkBtn.textContent = 'Check';
    }
}

async function pasteFromClipboard() {
    try {
        const clipboardText = await window.electronAPI.getClipboard();
        
        if (clipboardText) {
            const firstWord = clipboardText.split(/\s+/)[0];
            wordInput.value = firstWord;
            wordInput.focus();
            
            if (!clipboardText.includes(' ')) {
                checkSpelling();
            }
        } else {
            showResult('error', 'Clipboard is empty or contains no text', '📋');
        }
    } catch (error) {
        showResult('error', 'Could not access clipboard', '❌');
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

function showCorrectResult(word) {
    result.className = 'result-section result-correct';
    
    resultContent.innerHTML = `
        <div class="result-title">
            <span>✅</span>
            <span>"<span class="correct-word-clickable" title="Click to copy to clipboard">${word}</span>" is spelled correctly!</span>
        </div>
        <p class="copy-instruction">💡 Click the word above to copy it to your clipboard</p>
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

window.addEventListener('DOMContentLoaded', () => {
    wordInput.focus();
});
