// Types
interface DataItem {
  id: number;
  key: string;
  value: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface StorageData {
  data?: DataItem[];
}

// DOM Elements
const tabButtons = document.querySelectorAll<HTMLButtonElement>(".tablinks");
const tabContents = document.querySelectorAll<HTMLElement>(".tabcontent");
const addBtnData = document.getElementById('addBtnData') as HTMLButtonElement | null;
const inputContainer = document.getElementById('input-container') as HTMLDivElement | null;
const dataContainer = document.getElementById('data-container') as HTMLDivElement | null;
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const successMessage = document.getElementById('successMessage') as HTMLDivElement | null;

// Global state
let currentData: DataItem[] = [];

// Tab functionality
document.addEventListener("DOMContentLoaded", (): void => {
  initializeTabs();
  loadData();
});

function initializeTabs(): void {
  tabButtons.forEach((button: HTMLButtonElement) => {
    button.addEventListener("click", (event: Event): void => {
      const mode = button.dataset.mode;
      if (!mode) return;

      // Hide all tab contents and remove active classes
      tabContents.forEach((content: HTMLElement) => content.classList.remove("active"));
      tabButtons.forEach((btn: HTMLButtonElement) => btn.classList.remove("active"));

      // Show selected tab and activate button
      const activeTab = document.getElementById(mode) as HTMLElement | null;
      if (activeTab) {
        activeTab.classList.add("active");
      }
      button.classList.add("active");
    });
  });

  // Open first tab by default
  if (tabButtons.length > 0) {
    (tabButtons[0] as HTMLButtonElement).click();
  }
}

// Data management
addBtnData?.addEventListener('click', (): void => {
  showInputForm();
});

// Search functionality
searchInput?.addEventListener('input', (e: Event): void => {
  const target = e.target as HTMLInputElement;
  const searchTerm = target.value.toLowerCase();
  filterData(searchTerm);
});

function showInputForm(): void {
  if (!inputContainer) return;
  
  inputContainer.innerHTML = `
    <div class="input-form">
      <input type="text" placeholder="Enter key..." id="keyInput" />
      <input type="text" placeholder="Enter value..." id="valueInput" />
      <div class="form-actions">
        <button class="btn secondary" id="cancelBtn">Cancel</button>
        <button class="btn" id="saveBtn">Save</button>
      </div>
    </div>
  `;

  const keyInput = document.getElementById('keyInput') as HTMLInputElement | null;
  const valueInput = document.getElementById('valueInput') as HTMLInputElement | null;
  const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement | null;
  const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement | null;

  // Focus on key input
  keyInput?.focus();

  // Handle form submission
  saveBtn?.addEventListener('click', (): void => saveData());
  cancelBtn?.addEventListener('click', (): void => hideInputForm());

  // Handle Enter key
  [keyInput, valueInput].forEach((input: HTMLInputElement | null) => {
    input?.addEventListener('keypress', (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        saveData();
      }
    });
  });
}

function hideInputForm(): void {
  if (inputContainer) {
    inputContainer.innerHTML = '';
  }
}

function saveData(): void {
  const keyInput = document.getElementById('keyInput') as HTMLInputElement | null;
  const valueInput = document.getElementById('valueInput') as HTMLInputElement | null;
  
  const key = keyInput?.value.trim() || '';
  const value = valueInput?.value.trim() || '';
  
  if (!key || !value) {
    keyInput?.focus();
    return;
  }

  const newItem: DataItem = { 
    id: Date.now(), 
    key, 
    value, 
    status: "active",
    createdAt: new Date().toISOString()
  };

  currentData.push(newItem);
  
  // Use chrome.storage.local in real extension
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ data: currentData }, (): void => {
      console.log('Data saved to chrome storage');
    });
  } else {
    // Fallback for development/testing
    localStorage.setItem('extensionData', JSON.stringify(currentData));
  }
  
  hideInputForm();
  renderData();
  showSuccessMessage('Data saved successfully!');
}

function loadData(): void {
  // Use chrome.storage.local in real extension
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['data'], (result: StorageData): void => {
      currentData = result.data || [];
      renderData();
    });
  } else {
    // Fallback for development/testing
    const stored = localStorage.getItem('extensionData');
    currentData = stored ? JSON.parse(stored) : [];
    renderData();
  }
}

function renderData(filteredData: DataItem[] = currentData): void {
  if (!dataContainer) return;

  if (filteredData.length === 0) {
    dataContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>No data items yet. Click "Add" to create your first entry.</p>
      </div>
    `;
    return;
  }

  dataContainer.innerHTML = filteredData.map((item: DataItem) => `
    <div class="data-item" data-id="${item.id}">
      <div class="data-content">
        <div class="data-key">${escapeHtml(item.key)}</div>
        <div class="data-value">${escapeHtml(item.value)}</div>
      </div>
      <div class="data-actions">
        <button class="action-btn copy" data-value="${escapeHtml(item.value)}" data-key="${escapeHtml(item.key)}">Copy</button>
        <div class="dropdown">
          <button class="dropdown-btn" data-id="${item.id}">⋯</button>
          <div class="dropdown-content">
            <div class="dropdown-item" data-action="edit" data-id="${item.id}">Edit</div>
            <div class="dropdown-item" data-action="duplicate" data-id="${item.id}">Duplicate</div>
            <div class="dropdown-item danger" data-action="delete" data-id="${item.id}">Delete</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners after rendering
  addDataItemEventListeners();
}

function addDataItemEventListeners(): void {
  // Copy button listeners
  const copyButtons = document.querySelectorAll<HTMLButtonElement>('.action-btn.copy');
  copyButtons.forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', (e: Event): void => {
      const target = e.target as HTMLButtonElement;
      const value = target.dataset.value || '';
      const key = target.dataset.key || '';
      copyToClipboard(value, key);
    });
  });

  // Dropdown button listeners
  const dropdownButtons = document.querySelectorAll<HTMLButtonElement>('.dropdown-btn');
  dropdownButtons.forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', (e: Event): void => {
      e.stopPropagation();
      toggleDropdown(button);
    });
  });

  // Dropdown item listeners
  const dropdownItems = document.querySelectorAll<HTMLDivElement>('.dropdown-item');
  dropdownItems.forEach((item: HTMLDivElement) => {
    item.addEventListener('click', (e: Event): void => {
      const target = e.target as HTMLDivElement;
      const action = target.dataset.action;
      const id = parseInt(target.dataset.id || '0', 10);
      
      if (!action || !id) return;

      switch (action) {
        case 'edit':
          editItem(id);
          break;
        case 'duplicate':
          duplicateItem(id);
          break;
        case 'delete':
          deleteItem(id);
          break;
      }

      // Close dropdown after action
      const dropdown = target.closest('.dropdown') as HTMLDivElement;
      dropdown?.classList.remove('active');
    });
  });
}

function filterData(searchTerm: string): void {
  const filtered = currentData.filter((item: DataItem) => 
    item.key.toLowerCase().includes(searchTerm) || 
    item.value.toLowerCase().includes(searchTerm)
  );
  renderData(filtered);
}

async function copyToClipboard(value: string, key: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    showSuccessMessage(`Copied "${key}" to clipboard!`);
  } catch (err) {
    console.error('Failed to copy: ', err);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = value;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showSuccessMessage(`Copied "${key}" to clipboard!`);
  }
}

function showSuccessMessage(message: string): void {
  if (successMessage) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    setTimeout((): void => {
      successMessage.classList.remove('show');
    }, 2000);
  }
}

function toggleDropdown(button: HTMLButtonElement): void {
  const dropdown = button.closest('.dropdown') as HTMLDivElement;
  const allDropdowns = document.querySelectorAll<HTMLDivElement>('.dropdown');
  
  // Close all other dropdowns
  allDropdowns.forEach((d: HTMLDivElement) => {
    if (d !== dropdown) {
      d.classList.remove('active');
    }
  });
  
  // Toggle current dropdown
  dropdown?.classList.toggle('active');
}

function editItem(id: number): void {
  const item = currentData.find((i: DataItem) => i.id === id);
  if (!item) return;

  showInputForm();
  
  // Pre-fill the form
  setTimeout((): void => {
    const keyInput = document.getElementById('keyInput') as HTMLInputElement | null;
    const valueInput = document.getElementById('valueInput') as HTMLInputElement | null;
    if (keyInput && valueInput) {
      keyInput.value = item.key;
      valueInput.value = item.value;
    }
  }, 100);

  // Remove the old item
  deleteItem(id, false);
}

function duplicateItem(id: number): void {
  const item = currentData.find((i: DataItem) => i.id === id);
  if (!item) return;

  const newItem: DataItem = {
    ...item,
    id: Date.now(),
    key: item.key + ' (copy)',
    createdAt: new Date().toISOString()
  };

  currentData.push(newItem);
  saveToStorage();
  renderData();
  showSuccessMessage('Item duplicated successfully!');
}

function deleteItem(id: number, showMessage: boolean = true): void {
  currentData = currentData.filter((item: DataItem) => item.id !== id);
  saveToStorage();
  renderData();
  if (showMessage) {
    showSuccessMessage('Item deleted successfully!');
  }
}

function saveToStorage(): void {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ data: currentData }, (): void => {
      console.log('Data updated in chrome storage');
    });
  } else {
    localStorage.setItem('extensionData', JSON.stringify(currentData));
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e: Event): void => {
  const target = e.target as HTMLElement;
  if (!target.closest('.dropdown')) {
    document.querySelectorAll<HTMLDivElement>('.dropdown.active').forEach((dropdown: HTMLDivElement) => {
      dropdown.classList.remove('active');
    });
  }
});

// Export types for use in other files if needed
export type { DataItem, StorageData };