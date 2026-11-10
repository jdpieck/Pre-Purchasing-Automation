/**
 * Pre-Purchasing Assistant for UC Davis
 * Icons Component - References browser-extension/icons folder directly
 * Icons are referenced from the icons/ folder instead of defining SVG paths in JS.
 */

const ICON_FILES = {
  zap: 'zap.svg',
  settings: 'settings.svg',
  help: 'help.svg',
  x: 'close.svg',
  close: 'close.svg',
  upload: 'upload.svg',
  package: 'package.svg',
  building: 'building.svg',
  dollar: 'dollar.svg',
  save: 'save.svg',
  clear: 'clear.svg',
  mail: 'mail.svg',
  github: 'github.svg',
  info: 'info.svg',
  trash: 'trash.svg',
  fileText: 'file.svg',
  file: 'file.svg',
  clipboard: 'clipboard.svg'
};

const ICON_SIZES = {
  upload: 32,
  package: 14,
  building: 14,
  dollar: 14,
  save: 14,
  clear: 14,
  mail: 14,
  github: 14,
  info: 14,
  trash: 13,
  fileText: 15,
  file: 15,
  clipboard: 15,
  zap: 16,
  settings: 16,
  help: 16,
  x: 16,
  close: 16
};

function getIconUrl(name) {
  const fileName = ICON_FILES[name] || `${name}.svg`;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(`icons/${fileName}`);
  }
  return `/icons/${fileName}`;
}

function getIconHtml(name, options = {}) {
  const size = options.size || ICON_SIZES[name] || 16;
  const cls = options.className ? ` ${options.className}` : '';
  const url = getIconUrl(name);
  return `<span class="ucd-icon ucd-icon-${name}${cls}" style="--icon-url: url('${url}'); width: ${size}px; height: ${size}px;" role="img" aria-label="${name}"></span>`;
}

// Expose dictionary of icon HTML snippets referencing icons/*.svg
const ICONS = {};
for (const key of Object.keys(ICON_FILES)) {
  Object.defineProperty(ICONS, key, {
    get() {
      return getIconHtml(key);
    },
    enumerable: true
  });
}

if (typeof window !== 'undefined') {
  window.ICON_FILES = ICON_FILES;
  window.getIconUrl = getIconUrl;
  window.getIconHtml = getIconHtml;
  window.ICONS = ICONS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ICON_FILES,
    getIconUrl,
    getIconHtml,
    ICONS
  };
}
