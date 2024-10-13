document.addEventListener('DOMContentLoaded', function() {
    const addKeyValueButton = document.getElementById('add-key-value-btn');
    const keyValueForm = document.getElementById('key-value-form');
    const keyInput = document.getElementById('key-input');
    const valueInput = document.getElementById('value-input');
    const keyValueList = document.getElementById('key-value-list');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const popup = document.getElementById('form-popup');
    const popupCloseButton = document.querySelector('.popup .close');

    let savedPairs = JSON.parse(localStorage.getItem('keyValuePairs')) || [];
    renderKeyValuePairs(savedPairs);


    // Show modal for adding key-value
    addKeyValueButton.addEventListener('click', function() {
        popup.style.display = 'block';
    });

    // Close modal when clicking X
    popupCloseButton.addEventListener('click', function() {
        popup.style.display = 'none';
    });

    // Close modal when clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });

    // Close popup content and form reset
    function closePopup() {
        popup.style.display = 'none';
        keyInput.value = '';
        valueInput.value = '';
    }

    // Handle form submission
    keyValueForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const key = keyInput.value.trim();
        const value = valueInput.value.trim();

        if (key && value) {
            const newPair = { key, value };
            savedPairs.push(newPair);
            localStorage.setItem('keyValuePairs', JSON.stringify(savedPairs));
            addKeyValueToList(newPair, savedPairs.length - 1);
            closePopup();
        }
    });

    function renderKeyValuePairs(pairs) {
        keyValueList.innerHTML = '';
        pairs.forEach((pair, index) => addKeyValueToList(pair, index));
    }

    function addKeyValueToList(pair, index) {
        const li = document.createElement('li');
        li.innerHTML = `
            ${pair.key}: ${pair.value}
            <div class="actions">
                <button class="copy-btn">Copy</button>
                <button class="modify-btn">Modify</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        keyValueList.appendChild(li);

        li.querySelector('.copy-btn').addEventListener('click', function() {
            navigator.clipboard.writeText(pair.value).then(() => {
                showMessage(`Copied: ${pair.value}`);
            });
        });

        li.querySelector('.modify-btn').addEventListener('click', function() {
            const newValue = prompt('Modify value:', pair.value);
            if (newValue !== null) {
                savedPairs[index].value = newValue;
                localStorage.setItem('keyValuePairs', JSON.stringify(savedPairs));
                renderKeyValuePairs(savedPairs);
            }
        });

        li.querySelector('.delete-btn').addEventListener('click', function() {
            savedPairs.splice(index, 1);
            localStorage.setItem('keyValuePairs', JSON.stringify(savedPairs));
            renderKeyValuePairs(savedPairs);
        });
    }

    // Export to JSON
    exportBtn.addEventListener('click', function() {
        const json = JSON.stringify(savedPairs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapid-copy-key-value-Data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import from JSON
    importBtn.addEventListener('click', function() {
        importFile.click();
    });

    importFile.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = function() {
            savedPairs = JSON.parse(reader.result);
            localStorage.setItem('keyValuePairs', JSON.stringify(savedPairs));
            renderKeyValuePairs(savedPairs);
        };
        reader.readAsText(file);
    });

    function showMessage(msg) {
        alert(msg); // You can replace this with a better UI element like a toast or banner
    }

    function renderKeyValuePairs(pairs) {
        const container = document.getElementById('key-value-container');
        container.innerHTML = ''; // Clear the container first
    
        if (pairs.length === 0) {
            container.innerHTML = '<p>No data pairs saved.</p>';
            return;
        }
    
        pairs.forEach(pair => {
            const pairElement = document.createElement('div');
            pairElement.className = 'key-value-pair';
    
            const keyElement = document.createElement('span');
            keyElement.textContent = `${pair.key} : `;
    
            const valueElement = document.createElement('span');
            valueElement.textContent = ` ${pair.value}`;
    
            // Create buttons for Copy, Modify, and Delete
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(pair.value);
                showMessage('Value copied to clipboard!');
            };
    
            const modifyBtn = document.createElement('button');
            modifyBtn.textContent = 'Modify';
            modifyBtn.onclick = () => {
                const newValue = prompt('Enter new value:', pair.value);
                if (newValue) {
                    pair.value = newValue;
                    localStorage.setItem('keyValuePairs', JSON.stringify(pairs));
                    renderKeyValuePairs(pairs); // Re-render the updated pairs
                }
            };
    
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => {
                const index = pairs.indexOf(pair);
                pairs.splice(index, 1); // Remove the pair
                localStorage.setItem('keyValuePairs', JSON.stringify(pairs));
                renderKeyValuePairs(pairs); // Re-render
            };
    
            pairElement.appendChild(keyElement);
            pairElement.appendChild(valueElement);
            pairElement.appendChild(copyBtn);
            pairElement.appendChild(modifyBtn);
            pairElement.appendChild(deleteBtn);
            container.appendChild(pairElement);
        });
    }
    
});
