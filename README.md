
---

# Rapid Copy - Chrome Extension

### A simple Chrome extension to manage data pairs. It allows you to add, modify, delete, copy key-value pairs, and import/export data in JSON format.

![Rapid Copy Logo](./Icons/logo.png)

## Features

- **Add data Pairs**: Easily add key-value pairs using a clean UI.
- **Modify/Delete Pairs**: Modify or delete existing pairs.
- **Copy Values**: Quickly copy the value associated with a key to the clipboard.
- **Import/Export JSON**: Import data from a JSON file or export your data to JSON.

## Getting Started

Follow these instructions to install and start using the **Rapid Copy** Chrome extension.

### 1. Prerequisites

You need the following before installing this extension:
- A web browser (Google Chrome is recommended)
- A basic knowledge of Chrome extensions and local storage

### 2. Installation

#### Step 1: Clone the Repository

To get started, clone the repository to your local machine using the following command:

```bash
git clone https://github.com/adityamehta242/rapid-copy-chrome-extension.git
```

#### Step 2: Load the Extension into Chrome

1. Open Google Chrome.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click on **Load unpacked**.
5. Navigate to the directory where you cloned the repository and select it.
6. The extension should now appear in your list of Chrome extensions.

### 3. Using the Extension

#### Add data
1. Open the extension from the Chrome toolbar.
2. Click on the **Add data** button in the top navigation bar.
3. A popup will appear. Enter the key and value, then click **Add**.

#### Modify/Delete data Pairs
1. Each data pair displayed in the list has a **Modify** and **Delete** button.
2. Clicking **Modify** will prompt you to enter a new value for the selected key.
3. Clicking **Delete** will remove the pair from the list.

#### Copy Value
1. Each key-value pair has a **Copy** button. Clicking it will copy the value to your clipboard for easy use.

#### Export to JSON
1. To back up your data, click the **Export to JSON** button.
2. A JSON file containing all your key-value pairs will be downloaded.

#### Import from JSON
1. Click the **Import JSON** button to load key-value pairs from a JSON file.
2. Select a `.json` file from your local machine. The pairs in the file will replace the existing pairs in the extension.

### 4. File Structure

```
.
├── Icons
│   ├── close.png
│   ├── logo.png
├── popup.html
├── popup.js
├── styles.css
├── manifest.json
├── README.md
```

- `Icons`: Directory that contains icons for the extension.
- `popup.html`: The main UI of the extension.
- `popup.js`: Contains the logic for adding, modifying, deleting, and importing/exporting key-value pairs.
- `styles.css`: CSS styles for the extension's user interface.
- `manifest.json`: The configuration file for the extension.

### 5. Manifest File

The `manifest.json` file is the metadata for the extension and is required to load the extension into Chrome. Here's an example of how it looks:

```json
{
  "manifest_version": 3,
  "name": "Rapid Copy",
  "version": "1.0",
  "description": "A Chrome extension to manage data pairs with options to add, modify, delete, and export/import JSON data.",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "Icons/logo.png",
      "48": "Icons/logo.png",
      "128": "Icons/logo.png"
    }
  },
  "icons": {
    "16": "Icons/logo.png",
    "48": "Icons/logo.png",
    "128": "Icons/logo.png"
  },
  "permissions": [
    "storage",
    "clipboardWrite"
  ]
}
```

### 6. Contributing

If you'd like to contribute to this project, feel free to submit a pull request or open an issue to discuss any changes.

### 7. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## How to Use the Extension

### Adding Key-Value Pairs

1. Click the **Rapid Copy** icon on your Chrome toolbar to open the popup.
2. In the navigation bar, click the **Add data** button.
3. A form will appear in a modal popup where you can add a new key and value.
4. Click **Add data** to save your input.

### Modifying or Deleting Pairs

1. Each key-value pair listed has **Modify** and **Delete** buttons.
2. Click **Modify** to edit the value associated with a key, or click **Delete** to remove the pair.

### Exporting and Importing JSON Data

- **Export**: Click **Export to JSON** to download your key-value pairs in JSON format.
- **Import**: Click **Import JSON** to upload and replace the current pairs with a JSON file.

---

### Issues

If you encounter any bugs or issues, please feel free to open an issue on the [GitHub repository](https://github.com/your-username/rapid-copy-chrome-extension/issues).

---

By following these steps, your Chrome extension will be installed and ready for use. Let me know if you need any other adjustments or help!