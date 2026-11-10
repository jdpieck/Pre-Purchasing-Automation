/**
 * Pre-Purchasing Assistant for UC Davis
 * Constants & Settings Storage
 */

// Generic default settings (clean of personal info so any lab member can use it)
const DEFAULT_SETTINGS = {
  deliverTo: "",
  phone: "",
  email: "",
  addressKeyword: "Ghausi Hall",
  addressText: "",
  requestType: "Purchasing",
  approver: "",
  approverKeyword: "",
  accountManager: "anymanager",
  dateOffsetDays: 7,
  shippingType: "ST",
  allowBackorder: false,
  unit: "EA", // Each
  defaultJustification: ""
};

const STORAGE_KEY = "ucd_prepurchasing_settings_v1";

function getSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored));
    }
  } catch (e) {
    console.warn("Could not read from localStorage, using defaults", e);
  }
  return Object.assign({}, DEFAULT_SETTINGS);
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
  }
}

if (typeof window !== 'undefined') {
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.STORAGE_KEY = STORAGE_KEY;
  window.getSettings = getSettings;
  window.saveSettings = saveSettings;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    STORAGE_KEY,
    getSettings,
    saveSettings
  };
}
