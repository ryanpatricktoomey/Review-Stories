function renderWordBankButton(btn, saved) {
    const color = saved ? '#a8dcca' : '#a7cdf8';
    const shape = saved ? '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7" fill="none"/>' : '<path d="M12 6C8 3 4 4 2.5 5v14c3-1 6-1 9.5 1.5C15.5 18 19 18 21.5 19V5C18 4 15 4 12 6Z"/><path d="M12 6v14M5.5 8.5l3.5 1M15 9.5l3.5-1"/>';
    btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" style="display:block;pointer-events:none;color:'+color+'" fill="currentColor" fill-opacity=".13" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg>';
    btn.classList.toggle('saved', saved);
    btn.setAttribute('aria-pressed', String(saved));
    btn.title = saved ? 'Remove from Word Bank' : 'Save to Word Bank';
    btn.setAttribute('aria-label', btn.title);
}
// Review pages share this script, including reviews uploaded before Reps was installable.
if (/^(?:\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2})%20Review%20\d{3,4}\.html$/i.test(location.pathname.split('/').pop())) {
    const backScript = document.createElement('script');
    backScript.src = new URL('reps-back.js', document.currentScript.src);
    document.head.appendChild(backScript);
    const chalk = document.createElement('script');
    chalk.src = new URL('reps-chalk.js?v=4', document.currentScript.src);
    document.head.appendChild(chalk);
}

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

    // Find expression rows by looking at tables
    const rows = document.querySelectorAll('table tr');
    
    // Get existing word bank from localStorage
    const wordBank = JSON.parse(localStorage.getItem('wordBank') || '[]');
    const savedWords = new Set(wordBank.map(item => item.en.toLowerCase()));

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        // Expression rows should have exactly 2 cells (English and Korean) before our button is added
        if (cells.length === 2) {
            const englishCell = cells[0];
            const koreanCell = cells[1];
            
            const english = englishCell.innerText.trim();
            const korean = koreanCell.innerText.trim();

            const isSaved = savedWords.has(english.toLowerCase());

            // Create the button cell
            const btnCell = document.createElement('td');
            btnCell.className = "p-4 text-right";
            
            const btn = document.createElement('button');
            btn.className = `wordbank-save-btn ${isSaved ? 'saved' : ''}`;
            btn.type = "button";
            renderWordBankButton(btn, isSaved);
            btn.title = isSaved ? "Saved to Word Bank" : "Save to Word Bank"; btn.setAttribute('aria-label', btn.title);
            
            btn.onclick = (e) => {
                // Prevent row click events if any
                e.stopPropagation();
                e.preventDefault();
                try { saveToWordBank(english, korean, btn); } catch (err) { console.error(err); alert("Could not update Word Bank: " + err.message); }
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
        renderWordBankButton(btn, true);
        btn.classList.add('saved');
        btn.title = "Saved to Word Bank"; btn.setAttribute('aria-label', btn.title);
        
    } else {
        // If it exists, maybe allow removing it? Or just do nothing.
        // For now, let's allow removing it if they click again.
        bank = bank.filter(w => w.en.toLowerCase() !== en.toLowerCase());
        localStorage.setItem('wordBank', JSON.stringify(bank));
        renderWordBankButton(btn, false);
        btn.classList.remove('saved');
        btn.title = "Save to Word Bank"; btn.setAttribute('aria-label', btn.title);
    }
}
