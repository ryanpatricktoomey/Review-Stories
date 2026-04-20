document.addEventListener('DOMContentLoaded', () => {
    // Inject CSS for the Word Bank button
    const style = document.createElement('style');
    style.textContent = `
        .wordbank-save-btn {
            background: rgba(20, 184, 166, 0.2);
            border: 1px solid rgba(20, 184, 166, 0.4);
            border-radius: 8px;
            padding: 4px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1rem;
        }
        .wordbank-save-btn:hover {
            background: rgba(20, 184, 166, 0.4);
            transform: scale(1.05);
        }
        .wordbank-save-btn.saved {
            background: rgba(16, 185, 129, 0.2);
            border-color: rgba(16, 185, 129, 0.4);
        }
    `;
    document.head.appendChild(style);

    // Find all mystery cells which denote expression rows
    const cells = document.querySelectorAll('.mystery-cell');
    
    // Get existing word bank from localStorage
    const wordBank = JSON.parse(localStorage.getItem('wordBank') || '[]');
    const savedWords = new Set(wordBank.map(item => item.en.toLowerCase()));

    cells.forEach(koreanCell => {
        const row = koreanCell.parentElement;
        // The English word is usually in the first cell of the row
        const englishCell = row.cells[0];
        
        if (englishCell && koreanCell) {
            const english = englishCell.innerText.trim();
            const korean = koreanCell.innerText.trim();

            const isSaved = savedWords.has(english.toLowerCase());

            // Create the button cell
            const btnCell = document.createElement('td');
            btnCell.className = "p-4 text-right";
            
            const btn = document.createElement('button');
            btn.className = `wordbank-save-btn ${isSaved ? 'saved' : ''}`;
            btn.innerHTML = isSaved ? "✅" : "💾";
            btn.title = isSaved ? "Saved to Word Bank" : "Save to Word Bank";
            
            btn.onclick = (e) => {
                // Prevent row click events if any
                e.stopPropagation();
                saveToWordBank(english, korean, btn);
            };
            
            btnCell.appendChild(btn);
            row.appendChild(btnCell);
        }
    });
});

function saveToWordBank(en, ko, btn) {
    let bank = JSON.parse(localStorage.getItem('wordBank') || '[]');
    
    // Check if already exists
    const exists = bank.find(w => w.en.toLowerCase() === en.toLowerCase());
    
    if (!exists) {
        bank.push({ en, ko, dateAdded: new Date().toISOString() });
        localStorage.setItem('wordBank', JSON.stringify(bank));
        btn.innerHTML = "✅";
        btn.classList.add('saved');
        btn.title = "Saved to Word Bank";
        
        // Optional: show a little confetti or toast notification
        if (window.confetti) {
            const rect = btn.getBoundingClientRect();
            confetti({
                particleCount: 30,
                spread: 40,
                origin: { 
                    x: (rect.left + rect.width / 2) / window.innerWidth,
                    y: (rect.top + rect.height / 2) / window.innerHeight
                },
                colors: ['#14b8a6', '#f59e0b', '#38bdf8']
            });
        }
    } else {
        // If it exists, maybe allow removing it? Or just do nothing.
        // For now, let's allow removing it if they click again.
        bank = bank.filter(w => w.en.toLowerCase() !== en.toLowerCase());
        localStorage.setItem('wordBank', JSON.stringify(bank));
        btn.innerHTML = "💾";
        btn.classList.remove('saved');
        btn.title = "Save to Word Bank";
    }
}
