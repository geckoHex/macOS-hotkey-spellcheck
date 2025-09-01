// DOM elements
const wordInput = document.getElementById('wordInput');
const checkBtn = document.getElementById('checkBtn');
const result = document.getElementById('result');
const resultContent = document.getElementById('resultContent');

// Event listeners
checkBtn.addEventListener('click', checkSpelling);
wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkSpelling();
    }
});

// Reset button when user starts typing
wordInput.addEventListener('input', () => {
    resetButton();
    result.classList.add('hidden');
});

// Handle suggestion clicks
result.addEventListener('click', async (e) => {
    if (e.target.classList.contains('suggestion-item')) {
        wordInput.value = e.target.textContent;
        checkSpelling();
    }
});

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

function showIncorrectResult(word, suggestions) {
    checkBtn.textContent = '✕';
    checkBtn.className = 'btn-arrow result-incorrect';
    
    result.className = 'result-section result-incorrect';
    
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
});
