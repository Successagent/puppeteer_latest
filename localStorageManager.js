import { fileURLToPath } from "url";
import path from "path";
import { promises as fs } from "fs";

// File to persist localStorage data
const STORAGE_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "localStorage.json"
);

// Load existing localStorage data
async function loadLocalStorage() {
  try {
    const data = await fs.readFile(STORAGE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {}; // Return empty object if file doesn't exist
  }
}

// Save updated localStorage data
async function saveLocalStorage(data) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
}

export { saveLocalStorage, loadLocalStorage };
