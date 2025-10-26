// Types
interface DataItem {
  id: number;
  key: string;
  value: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  isPinned: boolean;
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

      if (mode === 'url') {
        setTimeout(() => initializeURLTab(), 100);
      }
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
    createdAt: new Date().toISOString(),
    isPinned: false
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
      // Ensure backward compatibility for existing data without isPinned
      currentData.forEach(item => {
        if (item.isPinned === undefined) {
          item.isPinned = false;
        }
        if (!item.status) {
          item.status = 'active';
        }
      });
      renderData();
    });
  } else {
    // Fallback for development/testing
    const stored = localStorage.getItem('extensionData');
    currentData = stored ? JSON.parse(stored) : [];
    // Ensure backward compatibility
    currentData.forEach(item => {
      if (item.isPinned === undefined) {
        item.isPinned = false;
      }
      if (!item.status) {
        item.status = 'active';
      }
    });
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

  // Sort pinned items first, then by creation date
  const sortedData = filteredData.sort((a, b) => {
    // Pinned items first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  dataContainer.innerHTML = sortedData.map((item: DataItem) => `
    <div class="data-item ${item.isPinned ? 'pinned' : ''} ${item.status === 'archived' ? 'archived' : ''}" data-id="${item.id}">
      <div class="data-content">
        <div class="data-key">
          ${item.isPinned ? '📌 ' : ''}${escapeHtml(item.key)}
          ${item.status === 'archived' ? ' (Archived)' : ''}
        </div>
        <div class="data-value">${escapeHtml(item.value)}</div>
      </div>
      <div class="data-actions">
        <button class="action-btn copy" data-value="${escapeHtml(item.value)}" data-key="${escapeHtml(item.key)}">Copy</button>
        <div class="dropdown">
          <button class="dropdown-btn" data-id="${item.id}">⋯</button>
          <div class="dropdown-content">
            <div class="dropdown-item" data-action="pin" data-id="${item.id}">
              ${item.isPinned ? '📌 Unpin' : '📌 Pin'}
            </div>
            <div class="dropdown-item" data-action="edit" data-id="${item.id}">✏️ Edit</div>
            <div class="dropdown-item" data-action="duplicate" data-id="${item.id}">📋 Duplicate</div>
            <div class="dropdown-item" data-action="archive" data-id="${item.id}">
              ${item.status === 'archived' ? '📤 Unarchive' : '📦 Archive'}
            </div>
            <div class="dropdown-item danger" data-action="delete" data-id="${item.id}">🗑️ Delete</div>
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
        case 'pin':
          togglePin(id);
          break;
        case 'edit':
          editItem(id);
          break;
        case 'duplicate':
          duplicateItem(id);
          break;
        case 'archive':
          toggleArchive(id);
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

function togglePin(id: number): void {
  const item = currentData.find((i: DataItem) => i.id === id);
  if (!item) return;

  item.isPinned = !item.isPinned;
  saveToStorage();
  renderData();
  showSuccessMessage(item.isPinned ? 'Item pinned!' : 'Item unpinned!');
}

function toggleArchive(id: number): void {
  const item = currentData.find((i: DataItem) => i.id === id);
  if (!item) return;

  item.status = item.status === 'archived' ? 'active' : 'archived';
  saveToStorage();
  renderData();
  showSuccessMessage(item.status === 'archived' ? 'Item archived!' : 'Item unarchived!');
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
    createdAt: new Date().toISOString(),
    isPinned: false // Duplicated items are not pinned by default
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

// URL Working

interface BookmarkItem {
  id: number;
  title: string;
  url: string;
  description: string;
  createdAt: string;
  isPinned: boolean;
}

interface ExtendedStorageData extends StorageData {
  savedUrls?: BookmarkItem[];
}

// Global state for bookmarks
let currentBookmarks: BookmarkItem[] = [];

let isEditMode = false;
let editingBookmarkId: number | null = null;

// DOM Elements for URL tab
const urlContainer = document.getElementById('url-container') as HTMLDivElement | null;
const bookmarkTitleInput = document.getElementById('bookmarkTitle') as HTMLInputElement | null;
const bookmarkDescriptionInput = document.getElementById('bookmarkDescription') as HTMLTextAreaElement | null;
// const bookmarkUrlInput = document.getElementById('bookmarkUrl') as HTMLInputElement | null;
const cancelBtnURL = document.getElementById('cancelBtnURL') as HTMLButtonElement | null;
const saveBtnURL = document.getElementById('saveBtnURL') as HTMLButtonElement | null;

function getCurrentTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(tabs[0]);
        }
      });
    } else {
      // Fallback for development
      resolve({
        id: 1,
        title: "Sample Page",
        url: "https://example.com",
        active: true,
        windowId: 1,
        index: 0,
        highlighted: false,
        incognito: false,
        pinned: false
      } as chrome.tabs.Tab);
    }
  });
}

async function initializeURLTab(): Promise<void> {
  try {
    const tab = await getCurrentTab();
    
    // Pre-fill the form with current tab info
    if (bookmarkTitleInput && tab.title) {
      bookmarkTitleInput.value = tab.title;
    }
    // if (bookmarkUrlInput && tab.url) {
    //   bookmarkUrlInput.value = tab.url;
    // }
    
    // Add save button event listener
    saveBtnURL?.addEventListener('click', saveBookmark);
    cancelBtnURL?.addEventListener('click', cancelBookmark);
    
    loadBookmarks();
  } catch (error) {
    console.error('Error initializing URL tab:', error);
    loadBookmarks();
  }
}


async function saveBookmark(): Promise<void> {
  const title = bookmarkTitleInput?.value.trim() || '';
  const description = bookmarkDescriptionInput?.value.trim() || '';

  if (!title) {
    bookmarkTitleInput?.focus();
    showSuccessMessage('Title is required');
    return;
  }

  if (!description) {
    bookmarkDescriptionInput?.focus();
    showSuccessMessage('Description is required');
    return;
  }

  try {
    if (isEditMode && editingBookmarkId) {
      // Update existing bookmark
      const bookmarkIndex = currentBookmarks.findIndex(b => b.id === editingBookmarkId);
      if (bookmarkIndex !== -1) {
        currentBookmarks[bookmarkIndex].title = title;
        currentBookmarks[bookmarkIndex].description = description;
        
        saveBookmarksToStorage();
        renderBookmarks();
        showSuccessMessage('Bookmark updated successfully!');
        resetBookmarkForm();
      }
    } else {
      // Create new bookmark
      const tab = await getCurrentTab();
      const url = tab.url || '';

      if (!url) {
        showSuccessMessage('Could not get current page URL');
        return;
      }

      const newBookmark: BookmarkItem = {
        id: Date.now(),
        title,
        description,
        url,
        createdAt: new Date().toISOString(),
        isPinned: false
      };

      currentBookmarks.push(newBookmark);
      saveBookmarksToStorage();
      
      // Clear the form
      clearForm();
      
      // Re-initialize with current tab info for next bookmark
      const newTab = await getCurrentTab();
      if (bookmarkTitleInput && newTab.title) {
        bookmarkTitleInput.value = newTab.title;
      }
      
      renderBookmarks();
      showSuccessMessage('Bookmark saved successfully!');
    }
  } catch (error) {
    console.error('Error saving bookmark:', error);
    showSuccessMessage('Error saving bookmark');
  }
}

function cancelBookmark(): void {
   if (isEditMode) {
    // If in edit mode, just reset to normal mode
    resetBookmarkForm();
  } else {
    // If in normal mode, clear everything
    clearForm();
  }
  // clearForm();
  
  // getCurrentTab().then(tab => {
  //   if (bookmarkTitleInput && tab.title) {
  //     bookmarkTitleInput.value = tab.title;
  //   }
  // });
}

function clearForm(): void {
  if (bookmarkTitleInput) bookmarkTitleInput.value = '';
  if (bookmarkDescriptionInput) bookmarkDescriptionInput.value = '';
}

function loadBookmarks(): void {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['savedUrls'], (result: ExtendedStorageData): void => {
      currentBookmarks = result.savedUrls || [];
      // Ensure backward compatibility
      currentBookmarks.forEach(bookmark => {
        if (bookmark.isPinned === undefined) {
          bookmark.isPinned = false;
        }
        if (!bookmark.description) {
          bookmark.description = '';
        }
      });
      renderBookmarks();
    });
  } else {
    // Fallback for development/testing
    const stored = localStorage.getItem('extensionBookmarks');
    currentBookmarks = stored ? JSON.parse(stored) : [];
    // Ensure backward compatibility
    currentBookmarks.forEach(bookmark => {
      if (bookmark.isPinned === undefined) {
        bookmark.isPinned = false;
      }
      if (!bookmark.description) {
        bookmark.description = '';
      }
    });
    renderBookmarks();
  }
}

function renderBookmarks(filteredBookmarks: BookmarkItem[] = currentBookmarks): void {
  if (!urlContainer) return;

  if (filteredBookmarks.length === 0) {
    urlContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔗</div>
        <p>No bookmarks yet. Save the current page to create your first bookmark.</p>
      </div>
    `;
    return;
  }

  // Sort pinned items first, then by creation date
  const sortedBookmarks = filteredBookmarks.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  urlContainer.innerHTML = sortedBookmarks.map((bookmark: BookmarkItem) => `
    <div class="data-item bookmark-item ${bookmark.isPinned ? 'pinned' : ''}" data-id="${bookmark.id}">
      <div class="data-content">
        <div class="data-key">
          ${bookmark.isPinned ? '📌 ' : ''}${escapeHtml(bookmark.title)}
        </div>
        <div class="data-value">${escapeHtml(bookmark.description || 'No description')}</div>
      </div>
      <div class="data-actions">
        <button class="action-btn visit" data-url="${escapeHtml(bookmark.url)}">Visit</button>
        <div class="dropdown">
          <button class="dropdown-btn" data-id="${bookmark.id}">⋯</button>
          <div class="dropdown-content">
            <div class="dropdown-item" data-action="pin-bookmark" data-id="${bookmark.id}">
              ${bookmark.isPinned ? '📌 Unpin' : '📌 Pin'}
            </div>
            <div class="dropdown-item" data-action="edit-bookmark" data-id="${bookmark.id}">✏️ Edit</div>
            <div class="dropdown-item" data-action="duplicate-bookmark" data-id="${bookmark.id}">📋 Duplicate</div>
            <div class="dropdown-item danger" data-action="delete-bookmark" data-id="${bookmark.id}">🗑️ Delete</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  addBookmarkEventListeners();
}

function addBookmarkEventListeners(): void {

  const dropdownBtns = document.querySelectorAll<HTMLButtonElement>('.dropdown-btn');
  dropdownBtns.forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', (e: Event): void => {
      e.stopPropagation();
      const dropdown = button.parentElement as HTMLDivElement;
      
      // Close other dropdowns
      document.querySelectorAll('.dropdown.active').forEach(d => {
        if (d !== dropdown) d.classList.remove('active');
      });
      
      // Toggle current dropdown
      dropdown.classList.toggle('active');
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.active').forEach(d => {
      d.classList.remove('active');
    });
  });
  // Visit button listeners
  const visitButtons = document.querySelectorAll<HTMLButtonElement>('.action-btn.visit');
  visitButtons.forEach((button: HTMLButtonElement) => {
    button.addEventListener('click', (e: Event): void => {
      const target = e.target as HTMLButtonElement;
      const url = target.dataset.url || '';
      if (url) {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url });
        } else {
          window.open(url, '_blank');
        }
      }
    });
  });

  // Bookmark dropdown item listeners
  const bookmarkDropdownItems = document.querySelectorAll<HTMLDivElement>('.dropdown-item[data-action*="bookmark"]');
  bookmarkDropdownItems.forEach((item: HTMLDivElement) => {
    item.addEventListener('click', (e: Event): void => {
      const target = e.target as HTMLDivElement;
      const action = target.dataset.action;
      const id = parseInt(target.dataset.id || '0', 10);

      if (!action || !id) return;

      switch (action) {
        case 'pin-bookmark':
          toggleBookmarkPin(id);
          break;
        case 'edit-bookmark':
          editBookmark(id);
          break;
        case 'duplicate-bookmark':
          duplicateBookmark(id);
          break;
        case 'delete-bookmark':
          deleteBookmark(id);
          break;
      }

      const dropdown = target.closest('.dropdown') as HTMLDivElement;
      dropdown?.classList.remove('active');
    });
  });
}

function toggleBookmarkPin(id: number): void {
  const bookmark = currentBookmarks.find((b: BookmarkItem) => b.id === id);
  if (!bookmark) return;

  bookmark.isPinned = !bookmark.isPinned;
  saveBookmarksToStorage();
  renderBookmarks();
  showSuccessMessage(bookmark.isPinned ? 'Bookmark pinned!' : 'Bookmark unpinned!');
}



function editBookmark(id: number): void {
  const bookmark = currentBookmarks.find((b: BookmarkItem) => b.id === id);
  if (!bookmark) return;

  // Set edit mode
  isEditMode = true;
  editingBookmarkId = id;

  // Fill the form with bookmark data for editing
  if (bookmarkTitleInput) bookmarkTitleInput.value = bookmark.title;
  if (bookmarkDescriptionInput) bookmarkDescriptionInput.value = bookmark.description;

  // Change button text
  if (saveBtnURL) {
    saveBtnURL.textContent = 'Update Bookmark';
  }

  bookmarkTitleInput?.focus();
}

function resetBookmarkForm(): void {
  // Reset edit mode
  isEditMode = false;
  editingBookmarkId = null;

  // Reset button text and functionality
  if (saveBtnURL) {
    saveBtnURL.textContent = 'Save Bookmark';
  }

  // Clear form and reload current tab info
  clearForm();
  getCurrentTab().then(tab => {
    if (bookmarkTitleInput && tab.title) {
      bookmarkTitleInput.value = tab.title;
    }
  });
}

function duplicateBookmark(id: number): void {
  const bookmark = currentBookmarks.find((b: BookmarkItem) => b.id === id);
  if (!bookmark) return;

  const newBookmark: BookmarkItem = {
    ...bookmark,
    id: Date.now(),
    title: bookmark.title + ' (copy)',
    createdAt: new Date().toISOString(),
    isPinned: false
  };

  currentBookmarks.push(newBookmark);
  saveBookmarksToStorage();
  renderBookmarks();
  showSuccessMessage('Bookmark duplicated successfully!');
}

function deleteBookmark(id: number): void {
  currentBookmarks = currentBookmarks.filter((bookmark: BookmarkItem) => bookmark.id !== id);
  saveBookmarksToStorage();
  renderBookmarks();
  showSuccessMessage('Bookmark deleted successfully!');
}

function saveBookmarksToStorage(): void {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ savedUrls: currentBookmarks }, (): void => {
      console.log('Bookmarks updated in chrome storage');
    });
  } else {
    localStorage.setItem('extensionBookmarks', JSON.stringify(currentBookmarks));
  }
}

document.addEventListener("DOMContentLoaded", (): void => {
  tabButtons.forEach((button: HTMLButtonElement) => {
    if (button.dataset.mode === 'url') {
      button.addEventListener("click", (): void => {
        setTimeout(() => initializeURLTab(), 100);
      });
    }
  });
});






// Export types for use in other files if needed
export type { DataItem, StorageData };