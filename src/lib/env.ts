export const isTauri = () => {
  return process.env.NEXT_PUBLIC_TAURI_BUILD === 'true' || (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
};

export const isTauriMobile = () => {
  if (!isTauri()) return false;
  // Tauri v2 injects navigator.userAgent containing "Android" or "iPhone" in mobile webviews
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};
