const STORAGE_KEY = "theme";

const isBrowser = typeof window !== "undefined";

const normalize = (value) => (value === "dark" ? "dark" : "light");

const prefersDark = () =>
  isBrowser &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const getStoredTheme = () => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const applyThemeClass = (theme) => {
  if (!isBrowser) return;
  const next = normalize(theme);
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.dataset.theme = next;
};

export const setTheme = (theme) => {
  if (!isBrowser) return;
  const next = normalize(theme);
  applyThemeClass(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore storage errors (e.g., private mode)
  }
};

export const getActiveTheme = () => {
  if (!isBrowser) return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const initTheme = () => {
  const stored = normalize(getStoredTheme() || (prefersDark() ? "dark" : "light"));
  applyThemeClass(stored);
  return stored;
};
